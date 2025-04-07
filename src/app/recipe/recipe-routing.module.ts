// src/app/recipe/recipe-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecipeListComponent } from './recipe-list/recipe-list.component';
import { RecipeDetailComponent } from './recipe-detail/recipe-detail.component';
import { RecipeFormComponent } from './recipe-form/recipe-form.component';
import { AuthGuard } from '../core/auth.guard'; // Import AuthGuard

const routes: Routes = [
  { path: '', component: RecipeListComponent },
  {
    path: 'new',
    component: RecipeFormComponent,
    canActivate: [AuthGuard] // Only authenticated users can create
  },
  {
    path: 'edit/:id',
    component: RecipeFormComponent,
    canActivate: [AuthGuard] // Only authenticated users can edit
  },
  { path: ':id', component: RecipeDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecipeRoutingModule { }