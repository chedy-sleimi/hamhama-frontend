// src/app/models/comment.model.ts
export interface Comment {
  id: number;
  content: string;
  timestamp: string;
  userId?: number | null;
  username?: string;
  recipeId: number;
  authorProfilePictureUrl?: string | null; // <-- Add this
}