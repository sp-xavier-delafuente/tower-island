import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'

import { RewardElement } from './models/rewards';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  rewardList: RewardElement[] = [
    { id: 1, name: 'Food', color: '#FF0000', },
    { id: 2, name: 'Gold', color: '#F1C232' },
    { id: 3, name: 'Event points', color: '#A64D79' },
    { id: 4, name: 'Cash', color:'#D9D2E9' }
  ];
  rewardList$: BehaviorSubject<RewardElement[]> = new BehaviorSubject(this.rewardList);

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

  getRewards(): RewardElement[] {
    return this.rewardList;
  }

  getReward(id: number): RewardElement {
    return this.rewardList.find(i => i.id === id);
  }
}
