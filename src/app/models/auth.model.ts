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
    roles: string[]; // e.g., ['ROLE_USER', 'ROLE_ADMIN']
  }
  