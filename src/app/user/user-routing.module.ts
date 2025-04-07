// src/app/user/user-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { ProfileEditComponent } from './profile-edit/profile-edit.component';
import { UserListComponent } from './user-list/user-list.component';
import { AuthGuard } from '../core/auth.guard';
import { AdminGuard } from '../core/admin.guard';

const routes: Routes = [
  {
    path: '', // Base path /users
    component: UserListComponent, // Admin view: list all users
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'profile/edit', // Edit OWN profile
    component: ProfileEditComponent,
    canActivate: [AuthGuard]
  },
   // IMPORTANT: Keep specific routes BEFORE dynamic :username route
  {
    path: ':username/profile', // View a specific user's profile
    component: ProfileComponent
    // AuthGuard applied here if profiles are generally not public,
    // but component handles privacy logic based on backend response/403
    // canActivate: [AuthGuard]
  },
   // Add routes for followers/following lists if needed
   // { path: ':username/followers', component: FollowerListComponent, canActivate: [AuthGuard] },
   // { path: ':username/following', component: FollowingListComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }