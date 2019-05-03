import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

import { ConfigService } from '../config.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {

  displayedColumns: string[] = ['name', 'color', 'minAmount', 'maxAmount', 'probability'];
  dataSource = this.core.rewardList$;
  controls: FormArray;

  constructor(private core: ConfigService) { }

  ngOnInit() {
    const toGroups = this.core.rewardList$.value.map(entity => {
      return new FormGroup({
        name: new FormControl(entity.name, Validators.required),
        color: new FormControl(entity.color, Validators.required),
        minAmount: new FormControl(entity.minAmount, Validators.required),
        maxAmount: new FormControl(entity.maxAmount, Validators.required),
        probability: new FormControl(entity.probability, Validators.required),
      }, { updateOn: "blur" });
    });

    this.controls = new FormArray(toGroups);
  }


  updateField(index, field) {
    const control = this.getControl(index, field);
    if (control.valid) {
      this.core.update(index, field, control.value);
    }

  }

  getControl(index, fieldName) {
    const a = this.controls.at(index).get(fieldName) as FormControl;
    return this.controls.at(index).get(fieldName) as FormControl;
  }

  getTotalProbabilty() {
    return this.core.getTotalProbabilty();
  }
}
