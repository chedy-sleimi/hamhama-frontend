// src/app/recipe/recipe.module.ts
import { NgModule } from '@angular/core';
import { RecipeRoutingModule } from './recipe-routing.module';
import { SharedModule } from '../shared/shared.module'; // Import SharedModule

import { RecipeListComponent } from './recipe-list/recipe-list.component';
import { RecipeDetailComponent } from './recipe-detail/recipe-detail.component';
import { RecipeFormComponent } from './recipe-form/recipe-form.component';
import { RecipeCardComponent } from './recipe-card/recipe-card.component'; // Ensure this line exists
import { CommentSectionComponent } from './comment-section/comment-section.component';
import { RatingComponent } from './rating/rating.component';

import { RecipeService } from './recipe.service'; // Provide service here
import { FormsModule } from '@angular/forms'; // Needed for ngModel in comment form


@NgModule({
  declarations: [
    RecipeListComponent,
    RecipeDetailComponent,
    RecipeFormComponent,
    RecipeCardComponent, // Component is declared here
    CommentSectionComponent,
    RatingComponent
  ],
  imports: [
    SharedModule,
    RecipeRoutingModule,
    FormsModule
  ],
  providers: [
      RecipeService
  ],
  exports: [
      RecipeCardComponent // <--- ADD THIS LINE TO EXPORT
  ]
})
export class RecipeModule { }