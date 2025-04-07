// src/app/core/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, catchError, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, RegisterRequest, AuthenticationResponse } from '../models/auth.model';
import { Router } from '@angular/router';
import { ApiError } from '../models/api-error.model';

const JWT_TOKEN_KEY = 'hamhama_auth_token';
const USER_INFO_KEY = 'hamhama_user_info'; // Store username/roles

interface UserInfo {
  username: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root' // Provided in root due to guards/interceptors needing it early
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<UserInfo | null>;
  public currentUser: Observable<UserInfo | null>;

  constructor(private http: HttpClient, private router: Router) {
    // Load initial state from local storage
    const storedUser = localStorage.getItem(USER_INFO_KEY);
    this.currentUserSubject = new BehaviorSubject<UserInfo | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}/login`, loginRequest)
      .pipe(
        tap(response => this.storeAuthentication(response)),
        catchError(this.handleError)
      );
  }

  register(registerRequest: RegisterRequest): Observable<any> { // Backend returns "User registered successfully!" string
    return this.http.post(`${this.apiUrl}/register`, registerRequest, { responseType: 'text' }) // Expect text response
      .pipe(
        catchError(this.handleError)
      );
  }

  logout(): void {
    // Remove user info and token from local storage
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    // Notify subscribers
    this.currentUserSubject.next(null);
    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(JWT_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    // Basic check: does a token exist? Could add token expiration check here.
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return !!user && user.roles.includes('ROLE_ADMIN');
  }

  private storeAuthentication(response: AuthenticationResponse): void {
    if (response?.token && response?.username && response?.roles) {
      localStorage.setItem(JWT_TOKEN_KEY, response.token);
      const userInfo: UserInfo = { username: response.username, roles: response.roles };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      this.currentUserSubject.next(userInfo);
    } else {
        console.error("Invalid authentication response received:", response);
        // Handle this case - maybe logout or show error
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
       // Try to get message from standard Spring Boot error structure or plain text body
       const backendError = error.error as ApiError;
       if (typeof error.error === 'string') {
         errorMessage = error.error; // Plain text error from backend (like register/login failure)
       } else if (backendError && backendError.message) {
           errorMessage = `Error ${error.status}: ${backendError.message}`;
       } else if (error.message) {
           errorMessage = `Error ${error.status}: ${error.message}`;
       } else {
           errorMessage = `Server returned code ${error.status}, error message: ${error.message || 'Unknown error'}`;
       }
    }
    console.error(error);
    return throwError(() => new Error(errorMessage));
  }
}