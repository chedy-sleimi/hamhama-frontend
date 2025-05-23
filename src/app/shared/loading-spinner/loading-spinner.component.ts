// src/app/shared/loading-spinner/loading-spinner.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  standalone: false,
})
export class LoadingSpinnerComponent {
  @Input() message: string = 'Loading...';
}