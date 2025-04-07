// src/app/recipe/recipe-list/recipe-list.component.ts
import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../recipe.service';
import { Recipe, RecipeCategory } from '../../models/recipe.model';
import { Observable, catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  standalone: false,
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];
  loading = true;
  error: string | null = null;
  // For filter dropdown
  recipeCategories = Object.values(RecipeCategory);

  constructor(private recipeService: RecipeService) { }

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(params?: { category?: RecipeCategory, name?: string }): void {
    this.loading = true;
    this.error = null;
    this.recipeService.getAllRecipes(params)
      .pipe(
        tap(() => this.loading = false),
        catchError(err => {
          this.error = err.message;
          this.loading = false;
          return of([]); // Return empty array on error
        })
      )
      .subscribe(recipes => {
        this.recipes = recipes;
      });
  }

   // --- Basic Search/Filter Handlers ---
   search(name?: string, category?: string): void {
      const params: { category?: RecipeCategory, name?: string } = {};
      if (name) {
          params.name = name;
      }
      if (category && category !== "") {
           // Ensure the category value is a valid enum key
           const validCategory = RecipeCategory[category as keyof typeof RecipeCategory];
           if (validCategory) {
               params.category = validCategory;
           } else {
               console.warn(`Invalid category selected: ${category}`);
           }
      }
      this.loadRecipes(params);
   }

   filterByCategory(categoryValue: string): void {
       this.search(undefined, categoryValue); // Trigger search with only category
   }

}