export interface Comment {
    id: number;
    content: string;
    timestamp: string; // Comes as string, might need Date conversion
    userId?: number;
    username?: string; // Add this for display convenience
    recipeId: number;
  }