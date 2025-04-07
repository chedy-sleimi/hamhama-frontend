// src/app/user/user.module.ts
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { UserRoutingModule } from './user-routing.module';

import { ProfileComponent } from './profile/profile.component';
import { ProfileEditComponent } from './profile-edit/profile-edit.component';
import { UserListComponent } from './user-list/user-list.component';

import { UserService } from './user.service';
import { RecipeModule } from '../recipe/recipe.module'; // <--- IMPORT RecipeModule


@NgModule({
  declarations: [
    ProfileComponent,
    ProfileEditComponent,
    UserListComponent
  ],
  imports: [
    SharedModule,
    UserRoutingModule,
    RecipeModule // <--- ADD RecipeModule HERE
  ],
  providers: [
      UserService
  ]
})
export class UserModule { }