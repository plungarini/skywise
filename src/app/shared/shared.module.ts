import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WiseBarComponent } from './components/wise-bar/wise-bar.component';



@NgModule({
  declarations: [
    WiseBarComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    WiseBarComponent
  ]
})
export class SharedModule { }
