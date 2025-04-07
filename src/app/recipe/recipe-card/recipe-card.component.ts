// src/app/recipe/recipe-card/recipe-card.component.ts
import { Component, Input } from '@angular/core';
import { Recipe } from '../../models/recipe.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-recipe-card',
  templateUrl: './recipe-card.component.html',
  standalone: false,
})
export class RecipeCardComponent {
  @Input() recipe: Recipe | null = null;

  // Helper to construct full image URL if backend provides relative path
  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return 'assets/placeholder-recipe.png'; // Provide a placeholder
    }
    // Assuming backend serves images relative to its root
    // and paths start with /recipe-pictures/ or /profile-pictures/
    if (imagePath.startsWith('/')) {
        return `${environment.apiUrl}${imagePath}`;
    }
    return imagePath; // Assume full URL if not starting with /
  }
}