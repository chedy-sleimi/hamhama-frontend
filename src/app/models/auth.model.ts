// src/app/models/auth.model.ts

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
  username: string;
  roles: string[];
  userId: number; // <<< ADD userId field
}