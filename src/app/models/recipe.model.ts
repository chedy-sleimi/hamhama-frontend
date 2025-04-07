export enum RecipeCategory {
    BREAKFAST = 'BREAKFAST',
    LUNCH = 'LUNCH',
    DINNER = 'DINNER',
    APPETIZER = 'APPETIZER',
    SALAD = 'SALAD',
    SOUP = 'SOUP',
    SIDE_DISH = 'SIDE_DISH',
    DESSERT = 'DESSERT',
    SNACK = 'SNACK',
    BEVERAGE = 'BEVERAGE',
    CONDIMENT_SAUCE = 'CONDIMENT_SAUCE'
    // Add others from backend
}

export interface Recipe {
  id: number;
  name: string;
  description: string;
  category: RecipeCategory;
  averageRating: number;
  imageUrl: string; // URL path from backend
  authorUsername: string;
  // Add RecipeIngredient[] if needed
  // Add Comment[] if needed directly on recipe
}

// DTO for creating/updating recipes (matching backend RecipeDTO)
export interface RecipeFormData {
    name: string;
    description: string;
    category: RecipeCategory | null;
    // Add ingredients if handled in form
}