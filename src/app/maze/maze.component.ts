import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Maze } from '../models/maze';
import * as PF from './js/PathFinding';
import * as StateMachine from 'javascript-state-machine';
import { throwMatDialogContentAlreadyAttachedError } from '@angular/material';

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
  private mazeView: Maze;
  options: FormGroup;

  stateMachine: StateMachine.StateMachine;
  grid: PF.Grid;
  operationsPerSecond: 300;

  constructor(fb: FormBuilder) { 
    this.options = fb.group({
      rows: 20,
      columns: 7
    });
  }

  ngOnInit() {
    const that = this;
    this.stateMachine = StateMachine.create({initial: 'none',
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
    callbacks:{
        onleavenone() {
            that.rows = that.options.get('rows').value;
            that.columns = that.options.get('columns').value;
            that.grid = new PF.Grid(that.columns, that.rows);
            that.mazeView = new Maze(that.rows, that.columns);
            that.mazeView.drawMaze();

            console.log(that.grid);

            this.setDefaultStartEndPos();
            this.transition(); // transit to the next state (ready)

            this.hookPathFinding();

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
        onfinish(event, from, to) {
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
        },
        onreset: function(event, from, to) {
            setTimeout(function() {
                this.clearOperations();
                this.clearAll();
                this.buildNewGrid();
            }, that.mazeView.nodeColorizeEffect.duration * 1.2);
            // => ready
        },
    
        /**
         * The following functions are called on entering states.
         */
    
        onready() {
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
        },
    
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
            that.mazeView.clearBlockedNodes();
        },
        buildNewGrid() {
            that.grid = new PF.Grid(that.rows, that.columns);
        },
        /**
         * When initializing, this method will be called to set the positions
         * of start node and end node.
         * It will detect user's display size, and compute the best positions.
         */
        setDefaultStartEndPos() {
            this.setEndPos(that.columns-1,0);
            this.setStartPos(0, that.rows-1);
        },
        setStartPos(gridX, gridY) {
            this.startX = gridX;
            this.startY = gridY;
            that.mazeView.setStartPos(Number(gridX), Number(gridY));
        },
        setEndPos(gridX, gridY) {
            this.endX = gridX;
            this.endY = gridY;
            that.mazeView.setEndPos(Number(gridX), Number(gridY));
        },
        setWalkableAt(gridX, gridY, walkable) {
           // console.log(that.grid);
            that.grid.setWalkableAt(gridX, gridY, walkable);
            that.mazeView.setAttributeAt(Number(gridX), Number(gridY), 'walkable', walkable);
        },
        isStartPos(gridX, gridY) {
            return gridX === this.startX && gridY === this.startY;
        },
        isEndPos(gridX, gridY) {
            return gridX === this.endX && gridY === this.endY;
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

    onMouseDown(event: any)
    {
        var coord = this.mazeView.toGridCoordinate(event.pageX, event.pageY),
            gridX = coord[0],
            gridY = coord[1];

            console.log(this.grid);

        if(!((gridX >= 0 && gridX < this.grid.width) && (gridY >= 0 && gridY < this.grid.height)))
        {
            console.log("invalid pos:", gridX, gridY);
            return;
        }

        console.log("valid pos:", gridX, gridY);
        

        if (this.stateMachine.can('dragStart') && this.stateMachine.isStartPos(gridX, gridY)) {
            this.stateMachine.dragStart();
            return;
        }
        if (this.stateMachine.can('dragEnd') && this.stateMachine.isEndPos(gridX, gridY)) {
            this.stateMachine.dragEnd();
            return;
        }
        if (this.stateMachine.can('drawWall') && this.grid.isWalkableAt(gridX, gridY)) {
            console.log("draw wall");
            this.stateMachine.drawWall(gridX, gridY);
            return;
        }
        if (this.stateMachine.can('eraseWall') && !this.grid.isWalkableAt(gridX, gridY)) {
            console.log("erase wall");
            this.stateMachine.eraseWall(gridX, gridY);
        }
    }

    onMouseUp(event: any) {
        if (this.stateMachine.can('rest')) {
            this.stateMachine.rest();
        }
    }

    onMouseMove(event: any) {
        var coord = this.mazeView.toGridCoordinate(event.pageX, event.pageY),
            gridX = coord[0],
            gridY = coord[1];

        if(!this.stateMachine.isValidPosition(gridX, gridY))
        {
            return;
        }

        if (this.stateMachine.isStartOrEndPos(gridX, gridY)) {
            return;
        }

        switch (this.stateMachine.current) {
            case 'draggingStart':
                if (this.grid.isWalkableAt(gridX, gridY)) {
                    this.stateMachine.setStartPos(gridX, gridY);
                }
                break;
            case 'draggingEnd':
                if (this.grid.isWalkableAt(gridX, gridY)) {
                    this.stateMachine.setEndPos(gridX, gridY);
                }
                break;
            case 'drawingWall':
                this.stateMachine.setWalkableAt(gridX, gridY, false);
                break;
            case 'erasingWall':
                this.stateMachine.setWalkableAt(gridX, gridY, true);
                break;
        }
    }

  ngAfterViewInit() {
    this.stateMachine.init();
  }

  drawMaze()
  {
    this.mazeView.drawMaze();
  }
}
