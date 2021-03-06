import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MccColorPickerModule } from 'material-community-components';

import { MatTabsModule } from '@angular/material';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule  } from '@angular/forms';
import { MatDialogModule } from '@angular/material';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MazeComponent, MazeRewardDialog } from './maze/maze.component';
import { ConfigComponent } from './config/config.component';
import { ViewModeDirective } from './editable/view-mode.directive';
import { EditModeDirective } from './editable/edit-mode.directive';
import { EditableOnEnterDirective } from './editable/editable-on-enter.directive';
import { EditableComponent } from './editable/editable.component';
import { FocusableDirective } from './focusable.directive';

@NgModule({
  declarations: [
    AppComponent,
    MazeComponent,
    MazeRewardDialog,
    ConfigComponent,
    EditableComponent,
    ViewModeDirective,
    EditModeDirective,
    EditableOnEnterDirective,
    FocusableDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatToolbarModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDialogModule, 
    MatTableModule,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    MccColorPickerModule.forRoot({
      used_colors: ['#000000', '#123456', '#777666']
    })
  ],
  entryComponents: [
    MazeRewardDialog
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
