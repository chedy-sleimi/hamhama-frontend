// src/app/ingredient/ingredient.module.ts
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module'; // Import SharedModule
import { IngredientRoutingModule } from './ingredient-routing.module';

import { IngredientListComponent } from './ingredient-list/ingredient-list.component';
import { IngredientService } from './ingredient.service';

@NgModule({
  declarations: [
    IngredientListComponent
  ],
  imports: [
    SharedModule, // CommonModule, ReactiveFormsModule, shared components
    IngredientRoutingModule
  ],
  providers: [
      IngredientService
  ]
})
export class IngredientModule { }