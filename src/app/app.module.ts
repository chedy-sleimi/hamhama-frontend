// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'; // Import HttpClientModule

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module'; // Import CoreModule
import { SharedModule } from './shared/shared.module'; // Import SharedModule (optional here if only used in features)

// Core components are usually declared in CoreModule and exported
// import { HeaderComponent } from './core/header/header.component';
// import { FooterComponent } from './core/footer/footer.component';

import { AuthInterceptor } from './core/auth.interceptor'; // Import interceptor

@NgModule({
  declarations: [
    AppComponent,
    // HeaderComponent, // Declare in CoreModule instead
    // FooterComponent  // Declare in CoreModule instead
  ],
  imports: [
    BrowserModule,
    HttpClientModule, // Add HttpClientModule here
    AppRoutingModule,
    CoreModule,     // Import CoreModule (provides Header/Footer, services)
    SharedModule, // Usually imported by feature modules that need it
  ],
  providers: [
      { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // Provide interceptor
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }