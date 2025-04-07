import { Recipe } from './recipe.model'; // Assuming Recipe model exists

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[]; // Match AuthenticationResponse role format if possible
  isPrivate: boolean;
  // Add other fields if needed by frontend, but avoid password
}

export interface UserProfile {
  username: string;
  email: string; // Be mindful of exposing email publicly
  followersCount: number;
  followingCount: number;
  likedRecipes: Recipe[]; // Or just Recipe IDs/Names for performance
  profilePictureUrl: string;
  isPrivate: boolean;
}