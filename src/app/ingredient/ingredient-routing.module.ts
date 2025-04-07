// src/app/ingredient/ingredient-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IngredientListComponent } from './ingredient-list/ingredient-list.component';
import { AuthGuard } from '../core/auth.guard';
import { AdminGuard } from '../core/admin.guard';

const routes: Routes = [
    {
        path: '',
        component: IngredientListComponent,
        canActivate: [AuthGuard, AdminGuard] // Secure this route
    }
    // Add routes for add/edit forms if not using modals
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IngredientRoutingModule { }