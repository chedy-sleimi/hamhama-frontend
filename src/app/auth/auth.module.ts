// src/app/auth/auth.module.ts
import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SharedModule } from '../shared/shared.module'; // Import SharedModule


@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent
  ],
  imports: [
    SharedModule, // Use shared components like error message, loading spinner
    AuthRoutingModule
  ]
})
export class AuthModule { }