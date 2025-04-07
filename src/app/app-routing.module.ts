import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { AdminGuard } from './core/admin.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'recipes',
    loadChildren: () => import('./recipe/recipe.module').then(m => m.RecipeModule),
    // Apply AuthGuard if most recipe routes need login (e.g., viewing details)
    // Or apply inside recipe-routing.module.ts for specific routes
    // canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
    canActivate: [AuthGuard] // Most user routes need login
  },
  {
    path: 'ingredients', // Example for Admin ingredient management
    loadChildren: () => import('./ingredient/ingredient.module').then(m => m.IngredientModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  // Home route - redirects to recipes or a dashboard
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  // Wildcard route for 404
  { path: '**', redirectTo: '/recipes' } // Or a dedicated NotFoundComponent
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }