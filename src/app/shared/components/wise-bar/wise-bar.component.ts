import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-wise-bar',
  templateUrl: './wise-bar.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WiseBarComponent {
	pointerEvents = true;

}
