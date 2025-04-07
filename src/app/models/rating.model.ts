export interface Rating {
    id?: number; // Optional ID
    recipeId: number;
    ratingValue: number; // 1-5
    userId?: number; // Usually not needed in frontend post-action
}