// src/app/core/core.module.ts
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Import RouterModule for routerLink in header/footer

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
// No need to import services provided in 'root' like AuthService
// No need to import guards/interceptors here, they are provided in AppModule or root

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent
  ],
  imports: [
    CommonModule,
    RouterModule // Add RouterModule here
  ],
  exports: [
    HeaderComponent, // Export components for AppModule to use
    FooterComponent
  ]
})
export class CoreModule {
  // Prevent CoreModule from being imported multiple times
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}