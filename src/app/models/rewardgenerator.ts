import { ConfigService } from '../config.service';

export class RewardData {
    rewardId: number = 0;
    amount: number = 0;
}

export class RewardGenerator {
    public readonly rewards: Array<Array<RewardData>> = [];

    constructor(private configService: ConfigService, public nRow: number, public nCol: number) {
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

        for (let i = 0; i < this.rewards.length; i++) {
            for (let j = 0; j < this.rewards[i].length; j++) {
                this.rewards[i][j].rewardId = this.getRandomReward(totalProbabilty);
                this.rewards[i][j].amount = 2;
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
}

class RandomNumber {
    static within(n: number): number {
      return Math.floor(Math.random() * n);
    }
    
  }
  