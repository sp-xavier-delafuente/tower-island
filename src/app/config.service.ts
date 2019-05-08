import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'

import { RewardConfigElement } from './models/rewards';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  rewardList: RewardConfigElement[] = [
    { id: 0, name: 'None', color: '#FFFFFF', minAmount: 0, maxAmount: 0, probability: 50},
    { id: 1, name: 'Catapult', color: '#00FF00', minAmount: 0, maxAmount: 0, probability: 4},
    { id: 2, name: 'Catapult Landing', color: '#00FF00', minAmount: 0, maxAmount: 0, probability: 0},
    { id: 3, name: 'Food', color: '#FF0000', minAmount: 200, maxAmount: 1000, probability: 20},
    { id: 4, name: 'Gold', color: '#F1C232', minAmount: 30, maxAmount: 2000, probability: 16},
    { id: 5, name: 'Event points', color: '#A64D79', minAmount: 5, maxAmount: 100, probability: 8},
    { id: 6, name: 'Cash', color:'#D9D2E9', minAmount: 2, maxAmount: 20, probability: 2}
  ];
  rewardList$: BehaviorSubject<RewardConfigElement[]> = new BehaviorSubject(this.rewardList);

  constructor() {
  }

  update(index, field, value) {
    this.rewardList = this.rewardList.map((e, i) => {
      if (index === i) {
        return {
          ...e,
          [field]: value
        }
      }
      return e;
    });
    this.rewardList$.next(this.rewardList);
  }

  getConfigRewards(): RewardConfigElement[] {
    return this.rewardList;
  }

  getConfigReward(id: number): RewardConfigElement {
    return this.rewardList.find(i => i.id === id);
  }

  getTotalProbabilty() {
    return this.rewardList.map(t => t.probability).reduce((acc, value) => acc + value, 0);
  }
}
