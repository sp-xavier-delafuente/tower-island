import { ConfigService } from '../config.service';
import * as PF from '../maze/js/PathFinding.js';

export class RewardData {
    rewardTypeId: number = 0;
    amount: number = 0;
    catapultId: number = 0;
    catapultTo: number[] = [];
}

export class RewardGenerator {
    public readonly rewards: Array<Array<RewardData>> = [];
    private catapults: number = 0;

    constructor(private configService: ConfigService, private grid: PF.Grid) {
        let nRow = (grid.height + 1) / 2;
        let nCol = (grid.width + 1 ) / 2;

        for (let i = 0; i < nRow; i++) {
            this.rewards[i] = [];
            for (let j = 0; j < nCol; j++) {
                this.rewards[i][j] = new RewardData();
            }
        }
        this.generateRewards();
    }

    getReward(x, y): RewardData {
        return this.rewards[x][y];
    }

    generateRewards() {
        let totalProbabilty = this.configService.getTotalProbabilty();
        for (let i = this.rewards.length - 1; i >= 0; i--) { // from bottom to top
            for (let j = 0; j < this.rewards[i].length; j++) {
                if(this.rewards[i][j].rewardTypeId == 0) { // if cell isn't already set 
                    let rewardTypeId = 0;
                    do {
                        rewardTypeId = this.getRandomReward(totalProbabilty);
                    } while(!this.passesRewardRules(i, j, rewardTypeId));

                    this.setReward(i, j, rewardTypeId);
                    this.generateLinkedRewards(i, j, rewardTypeId);
                }
            }
        }
    }

    getRandomReward(totalProbabilty: number) : number {
        let random = RandomNumber.within(totalProbabilty);
        let i = 0; 
        let reward: number = 0;
        let accum = 0;
        while(i < this.configService.rewardList.length)
        {
            if(this.configService.rewardList[i].probability + accum > random)
            {
                return this.configService.rewardList[i].id;
            }
            accum += this.configService.rewardList[i].probability;
            i++;
        }
        return reward;
    }

    setReward(x: number, y: number, rewardTypeId: number) {
        this.rewards[x][y].rewardTypeId = rewardTypeId;
        this.rewards[x][y].amount = 2; //TODO

        if(rewardTypeId == 1) {
            this.catapults++;
            this.rewards[x][y].catapultId = this.catapults;
        }
    }

    passesRewardRules(x: number, y: number, rewardTypeId: number): boolean {
        if(rewardTypeId == 1) { // catapult
            return (this.grid.isInside(y * 2, (x * 2) - 1) && !this.grid.isWalkableAt(y * 2, (x * 2) - 1)) ||
             (this.grid.isInside(y * 2, (x * 2) + 1)  && !this.grid.isWalkableAt(y * 2, (x * 2) + 1));
        }      
        return true;
    }

    generateLinkedRewards(x: number, y: number, rewardTypeId: number) {
        if(rewardTypeId == 1) { // catapult
            if(this.grid.isInside(y * 2, (x * 2) - 1) && !this.grid.isWalkableAt(y * 2, (x * 2) - 1)) { // down
                this.rewards[x - 1][y].rewardTypeId = 2; //catapult landing
                this.rewards[x - 1][y].catapultId = this.rewards[x][y].catapultId;
                this.rewards[x][y].catapultTo.push(y * 2);
                this.rewards[x][y].catapultTo.push((x  * 2) - 1);
            }
            else if(this.grid.isInside(y * 2, (x * 2) + 1) && !this.grid.isWalkableAt(y * 2, (x * 2) + 1)) { // up
                this.rewards[x + 1][y].rewardTypeId = 2; //catapult landing
                this.rewards[x + 1][y].catapultId = this.rewards[x][y].catapultId;
                this.rewards[x][y].catapultTo.push(y * 2);
                this.rewards[x][y].catapultTo.push((x * 2) + 1);
            }
        }
    }

    findCatapult(catapultId: number, isOrigin: boolean) {
        for (let x = this.rewards.length - 1; x >= 0; x--) { // from bottom to top
            for (let y = 0; y < this.rewards[x].length; y++) {
                if(this.rewards[x][y].catapultId == catapultId && isOrigin && this.rewards[x][y].rewardTypeId == 1)
                {
                    return [x,y];
                }
                if(this.rewards[x][y].catapultId == catapultId && !isOrigin && this.rewards[x][y].rewardTypeId == 2)
                {
                    return [x,y];
                }
            }
        }
        return null;
    };
}

class RandomNumber {
    static within(n: number): number {
      return Math.floor(Math.random() * n);
    }
    
  }
  