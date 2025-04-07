// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms'; // Often needed in shared components or feature modules importing shared

import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from './error-message/error-message.component';
// Import other shared components, directives, pipes

@NgModule({
  declarations: [
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    // Add other shared components, directives, pipes
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule // Re-export if commonly needed
  ],
  exports: [
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    CommonModule, // Export common Angular modules for convenience
    ReactiveFormsModule // Re-export if commonly needed
    // Add other shared components, directives, pipes
  ]
})
export class SharedModule { }