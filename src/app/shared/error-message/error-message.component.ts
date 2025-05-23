// src/app/shared/error-message/error-message.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-message',
  standalone: false,
  templateUrl: './error-message.component.html',
})
export class ErrorMessageComponent {
  @Input() message: string | null = null;
}