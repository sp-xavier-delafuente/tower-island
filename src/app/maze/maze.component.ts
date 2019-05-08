import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MazeView } from '../models/mazeview';
import { MazeGenerator } from '../models/mazegenerator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { RewardConfigElement } from '../models/rewards'
import { ConfigService } from '../config.service';
import { RewardGenerator, RewardData } from '../models/rewardgenerator';
import * as PF from './js/PathFinding';
import * as StateMachine from 'javascript-state-machine';

@Component({
    selector: 'app-maze',
    templateUrl: './maze.component.html',
    styleUrls: ['./maze.component.css']
})
export class MazeComponent implements OnInit, AfterViewInit {

    title = 'Tower maze';
    nodeSize = 20;
    rows: number;
    columns: number;
    private mazeView: MazeView;
    private mazeGenerator: MazeGenerator;
    private rewardGenerator: RewardGenerator;
    options: FormGroup;
    startX: number;
    startY: number;
    endX: number;
    endY: number;

    stateMachine: any;
    grid: PF.Grid;
    finder;
    path: Array<Array<number>>;
    operationsPerSecond: 300;
    drawPath: boolean = false;

    constructor(fb: FormBuilder, public dialog: MatDialog, private configService: ConfigService) {
        this.options = fb.group({
            rows: 20,
            columns: 7
        });

        this.finder = new PF.AStarFinder({
            allowDiagonal: false,
            dontCrossCorners: false,
            weight: 1
        });
    }

    ngOnInit() {
        const that = this;
        this.stateMachine = StateMachine.create({
            initial: 'none',
            events: [{
                name: 'init',
                from: 'none',
                to: 'ready'
            },
            {
                name: 'search',
                from: 'starting',
                to: 'searching'
            },
            {
                name: 'pause',
                from: 'searching',
                to: 'paused'
            },
            {
                name: 'finish',
                from: 'searching',
                to: 'finished'
            },
            {
                name: 'resume',
                from: 'paused',
                to: 'searching'
            },
            {
                name: 'cancel',
                from: 'paused',
                to: 'ready'
            },
            {
                name: 'modify',
                from: 'finished',
                to: 'modified'
            },
            {
                name: 'reset',
                from: '*',
                to: 'ready'
            },
            {
                name: 'clear',
                from: ['finished', 'modified'],
                to: 'ready'
            },
            {
                name: 'start',
                from: ['ready', 'modified', 'restarting'],
                to: 'starting'
            },
            {
                name: 'restart',
                from: ['searching', 'finished'],
                to: 'restarting'
            },
            {
                name: 'dragStart',
                from: ['ready', 'finished'],
                to: 'draggingStart'
            },
            {
                name: 'dragEnd',
                from: ['ready', 'finished'],
                to: 'draggingEnd'
            },
            {
                name: 'drawWall',
                from: ['ready', 'finished'],
                to: 'drawingWall'
            },
            {
                name: 'eraseWall',
                from: ['ready', 'finished'],
                to: 'erasingWall'
            },
            {
                name: 'rest',
                from: ['draggingStart', 'draggingEnd', 'drawingWall', 'erasingWall'],
                to: 'ready'
            },
            ],
            callbacks: {
                onleavenone() {
                    that.rows = that.options.get('rows').value * 2 - 1;
                    that.columns = that.options.get('columns').value * 2 - 1;

                    that.mazeView = new MazeView(that.rows, that.columns);
                    this.buildNewGrid();

                    this.setDefaultStartEndPos();
                    this.transition(); // transit to the next state (ready)
                    //  this.hookPathFinding();

                    that.path = that.finder.findPath(
                        that.startX, that.startY, that.endX, that.endY, that.grid
                    );

                    return StateMachine.ASYNC;
                    // => ready
                },
                ondrawWall(event, from, to, gridX, gridY) {
                    this.setWalkableAt(gridX, gridY, false);
                    // => drawingWall
                },
                oneraseWall(event, from, to, gridX, gridY) {
                    this.setWalkableAt(gridX, gridY, true);
                    // => erasingWall
                },
                /* onfinish(event, from, to) {
                     that.mazeView.drawPath(this.path);
                     // => finished
                 },
                 onclear(event, from, to) {
                     this.clearOperations();
                     this.clearFootprints();
                     // => ready
                 },
                 onmodify(event, from, to) {
                     // => modified
                 },*/
                onreset: function (event, from, to) {
                    that.rows = that.options.get('rows').value * 2 - 1;
                    that.columns = that.options.get('columns').value * 2 - 1;
                    this.clearAll();

                    that.mazeView.drawMaze(that.rows, that.columns);
                    this.buildNewGrid();

                    this.setDefaultStartEndPos();

                    that.path = that.finder.findPath(
                        that.startX, that.startY, that.endX, that.endY, that.grid
                    );

                    that.drawPathIfNeeded();
                    // => ready
                },

                /**
                 * The following functions are called on entering states.
                 */

                /* onready() {
                     console.log('=> ready');
                     // => [starting, draggingStart, draggingEnd, drawingStart, drawingEnd]
                 },
                 onstarting(event, from, to) {
                     console.log('=> starting');
                     // Clears any existing search progress
                     this.clearFootprints();
                     this.setButtonStates({
                         id: 2,
                         enabled: true,
                     });
                     this.search();
                     // => searching
                 },
                 onsearching() {
                     console.log('=> searching');
                     this.setButtonStates({
                         id: 1,
                         text: 'Restart Search',
                         enabled: true,
                         callback: this.restart,
                     }, {
                             id: 2,
                             text: 'Pause Search',
                             enabled: true,
                             callback: this.pause,
                         });
                     // => [paused, finished]
                 },
                 onpaused() {
                     console.log('=> paused');
                     this.setButtonStates({
                         id: 1,
                         text: 'Resume Search',
                         enabled: true,
                         callback: this.resume,
                     }, {
                             id: 2,
                             text: 'Cancel Search',
                             enabled: true,
                             callback: this.cancel,
                         });
                     // => [searching, ready]
                 },
                 onfinished() {
                     console.log('=> finished');
                     this.setButtonStates({
                         id: 1,
                         text: 'Restart Search',
                         enabled: true,
                         callback: this.restart,
                     }, {
                             id: 2,
                             text: 'Clear Path',
                             enabled: true,
                             callback: this.clear,
                         });
                 },
                 onmodified() {
                     console.log('=> modified');
                     this.setButtonStates({
                         id: 1,
                         text: 'Start Search',
                         enabled: true,
                         callback: this.start,
                     }, {
                             id: 2,
                             text: 'Clear Path',
                             enabled: true,
                             callback: this.clear,
                         });
                 },*/

                /**
                 * Define setters and getters of PF.Node, then we can get the operations
                 * of the pathfinding.
                 */
                hookPathFinding() {

                    PF.Node.prototype = {
                        get opened() {
                            return this._opened;
                        },
                        set opened(v) {
                            this._opened = v;
                            this.operations.push({
                                x: this.x,
                                y: this.y,
                                attr: 'opened',
                                value: v
                            });
                        },
                        get closed() {
                            return this._closed;
                        },
                        set closed(v) {
                            this._closed = v;
                            this.operations.push({
                                x: this.x,
                                y: this.y,
                                attr: 'closed',
                                value: v
                            });
                        },
                        get tested() {
                            return this._tested;
                        },
                        set tested(v) {
                            this._tested = v;
                            this.operations.push({
                                x: this.x,
                                y: this.y,
                                attr: 'tested',
                                value: v
                            });
                        },
                    };

                    this.operations = [];
                },
                loop() {
                    var interval = 1000 / this.operationsPerSecond;
                    (function loop() {
                        if (!this.is('searching')) {
                            return;
                        }
                        this.step();
                        setTimeout(loop, interval);
                    })();
                },
                step() {
                    var operations = this.operations,
                        op, isSupported;

                    do {
                        if (!operations.length) {
                            this.finish(); // transit to `finished` state
                            return;
                        }
                        op = operations.shift();
                        isSupported = that.mazeView.supportedOperations.indexOf(op.attr) !== -1;
                    } while (!isSupported);

                    that.mazeView.setAttributeAt(op.x, op.y, op.attr, op.value);
                },
                clearOperations() {
                    this.operations = [];
                },
                clearFootprints() {
                    that.mazeView.clearFootprints();
                    that.mazeView.clearPath();
                },
                clearAll() {
                    this.clearFootprints();
                    this.clearOperations();
                    that.mazeView.clearBlockedNodes();
                },
                buildNewGrid() {
                    that.grid = new PF.Grid(that.columns, that.rows);
                    let r: number = (that.rows + 1) / 2;
                    let c: number = (that.columns + 1) / 2;
                    that.mazeGenerator = new MazeGenerator(r, c);

                    for (let i = 0; i < that.mazeGenerator.cells.length; i++) {
                        for (let j = 0; j < that.mazeGenerator.cells[i].length; j++) {
                            if (that.mazeGenerator.cells[i][j].southWall) {
                                this.setWalkableAt((j * 2), (i * 2) + 1, false);
                                this.setWalkableAt((j * 2) + 1, (i * 2) + 1, false);
                                this.setWalkableAt((j * 2) - 1, (i * 2) + 1, false);
                            }

                            if (that.mazeGenerator.cells[i][j].eastWall) {
                                this.setWalkableAt((j * 2) + 1, (i * 2), false);
                                this.setWalkableAt((j * 2) + 1, (i * 2) - 1, false);
                                this.setWalkableAt((j * 2) + 1, (i * 2) + 1, false);
                            }
                        }
                    }

                    that.rewardGenerator = new RewardGenerator(that.configService, that.grid);
                    for (let i = 0; i < that.rewardGenerator.rewards.length; i++) {
                        for (let j = 0; j < that.rewardGenerator.rewards[i].length; j++) {
                            let rewardData = that.rewardGenerator.getReward(i, j);
                            that.mazeView.setColor((j * 2), (i * 2), that.configService.getConfigReward(rewardData.rewardTypeId).color);

                            if (rewardData.rewardTypeId == 1) {
                                //set the catapult and where is going
                                that.setCatapult((j * 2), (i * 2), rewardData.catapultTo[0], rewardData.catapultTo[1]);
                            }
                        }
                    }
                },
                /**
                 * When initializing, this method will be called to set the positions
                 * of start node and end node.
                 * It will detect user's display size, and compute the best positions.
                 */
                setDefaultStartEndPos() {
                    this.setEndPos(that.columns - 1, 0);
                    this.setStartPos(0, that.rows - 1);
                },
                setStartPos(gridX, gridY) {
                    that.startX = Number(gridX);
                    that.startY = Number(gridY);
                    that.mazeView.setStartPos(Number(gridX), Number(gridY));
                },
                setEndPos(gridX, gridY) {
                    that.endX = Number(gridX);
                    that.endY = Number(gridY);
                    that.mazeView.setEndPos(Number(gridX), Number(gridY));
                },
                setWalkableAt(gridX, gridY, walkable) {
                    if (Number(gridX) >= 0 && gridX < that.grid.width && Number(gridY) >= 0 && gridY < that.grid.height) {
                        that.grid.setWalkableAt(gridX, gridY, walkable);
                        that.mazeView.setAttributeAt(Number(gridX), Number(gridY), 'walkable', walkable);
                    }
                },

                isStartPos(gridX, gridY) {
                    return Number(gridX) === that.startX && Number(gridY) === that.startY;
                },
                isEndPos(gridX, gridY) {
                    return Number(gridX) === that.endX && Number(gridY) === that.endY;
                },
                isStartOrEndPos(gridX, gridY) {
                    return this.isStartPos(gridX, gridY) || this.isEndPos(gridX, gridY);
                },
                isValidPosition(gridX, gridY) {
                    let x = Number(gridX);
                    let y = Number(gridY);
                    return x >= 0 && x < that.columns && y >= 0 && y < that.rows;
                }
            }
        });
    }

    onMouseDown(event: any) {
        var coord = this.mazeView.toGridCoordinate(event.clientX, event.clientY),
            gridX = coord[0],
            gridY = coord[1];

        if (!this.stateMachine.isValidPosition(gridX, gridY)) {
            return;
        }

        if (this.stateMachine.can('dragStart') && this.stateMachine.isStartPos(gridX, gridY)) {
            this.stateMachine.dragStart();
            return;
        }
        if (this.stateMachine.can('dragEnd') && this.stateMachine.isEndPos(gridX, gridY)) {
            this.stateMachine.dragEnd();
            return;
        }
        if (this.stateMachine.can('drawWall') && this.grid.isWallPosition(gridX, gridY) && this.grid.isWalkableAt(gridX, gridY)) {
            this.stateMachine.drawWall(gridX, gridY);
            return;
        }
        if (this.stateMachine.can('eraseWall') && this.grid.isWallPosition(gridX, gridY) && !this.grid.isWalkableAt(gridX, gridY)) {
            this.stateMachine.eraseWall(gridX, gridY);
            return;
        }
        if (!this.grid.isWallPosition(gridX, gridY)) {
            this.openDialog(gridX, gridY);
        }
    }

    onMouseUp(event: any) {
        if (this.stateMachine.can('rest')) {
            this.stateMachine.rest();
        }
    }

    onMouseMove(event: any) {
        var coord = this.mazeView.toGridCoordinate(event.clientX, event.clientY),
            gridX = coord[0],
            gridY = coord[1];

        if (!this.stateMachine.isValidPosition(gridX, gridY)) {
            return;
        }

        if (this.stateMachine.isStartOrEndPos(gridX, gridY)) {
            return;
        }

        switch (this.stateMachine.current) {
            case 'draggingStart':
                if (this.grid.isWalkableAt(gridX, gridY) && !this.grid.isWallPosition(gridX, gridY)) {
                    this.stateMachine.setStartPos(gridX, gridY);
                }
                break;
            case 'draggingEnd':
                if (this.grid.isWalkableAt(gridX, gridY) && !this.grid.isWallPosition(gridX, gridY)) {
                    this.stateMachine.setEndPos(gridX, gridY);
                }
                break;
            case 'drawingWall':
                if (this.grid.isWallPosition(gridX, gridY)) {
                    this.stateMachine.setWalkableAt(gridX, gridY, false);
                }
                break;
            case 'erasingWall':
                if (this.grid.isWallPosition(gridX, gridY)) {
                    this.stateMachine.setWalkableAt(gridX, gridY, true);
                }
                break;
        }
    }

    openDialog(gridX, gridY): void {
        const dialogRef = this.dialog.open(MazeRewardDialog, {
            width: '250px',
            data: this.rewardGenerator.getReward(gridY / 2, gridX / 2)
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.rewardGenerator.getReward(gridY / 2, gridX / 2).rewardTypeId = result.reward;
                this.rewardGenerator.getReward(gridY / 2, gridX / 2).amount = result.amount;
                this.mazeView.setColor(gridX, gridY, this.configService.getConfigReward(result.reward).color);

                if (result.reward == 1 || result.reward == 2) { // catapult or catapult landing
                    //set the catapult and where is going
                    this.rewardGenerator.getReward(gridY / 2, gridX / 2).catapultId = result.catapultId;

                    let isOriginCatapult = result.reward == 1;
                    let catapultLinkPosition = this.rewardGenerator.findCatapult(result.catapultId, !isOriginCatapult);
                    if (isOriginCatapult && catapultLinkPosition != null) {
                        this.setCatapult(gridX, gridY, catapultLinkPosition[1] * 2, catapultLinkPosition[0] * 2);
                    } else if(catapultLinkPosition != null){
                        this.setCatapult(catapultLinkPosition[1] * 2, catapultLinkPosition[0] * 2, gridX, gridY);
                    }
                }
            }
        });
    }

    ngAfterViewInit() {
        this.stateMachine.init();
    }

    drawMaze() {
        this.stateMachine.reset();
    }

    recalculatePath() {
        let grid = this.grid.clone();
        this.path = this.finder.findPath(
            this.startX, this.startY, this.endX, this.endY, grid
        );
        this.drawPathIfNeeded();
    }

    onDrawPathChanged(event: any) {
        this.drawPath = event.checked;
        this.drawPathIfNeeded();
    }

    drawPathIfNeeded() {
        if (this.drawPath) {
            this.mazeView.drawPath(this.path);
        }
        else {
            this.mazeView.clearPath();
        }
    }

    setCatapult(gridX, gridY, toX, toY) {
        this.grid.setCatapultAt(gridX, gridY, [toX, toY]);
    }

}

@Component({
    selector: 'maze-reward-dialog',
    templateUrl: 'maze-reward-dialog.html',
})
export class MazeRewardDialog {

    form: FormGroup;
    rewards: RewardConfigElement[];
    rewardValue: RewardData;

    constructor(private configService: ConfigService,
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<MazeRewardDialog>,
        @Inject(MAT_DIALOG_DATA) public data: RewardData) {
        this.form = fb.group({
            reward: data.rewardTypeId,
            amount: data.amount,
            catapultId: data.catapultId
        });
        this.rewardValue = data;
        this.rewards = this.configService.getConfigRewards();
    }

    onChanged(event) {
        this.rewardValue.rewardTypeId = event.value;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onSave() {
        this.dialogRef.close(this.form.value);
    }

}