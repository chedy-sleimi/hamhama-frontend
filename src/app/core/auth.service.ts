import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, catchError, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, RegisterRequest, AuthenticationResponse } from '../models/auth.model'; // Ensure model is imported
import { Router } from '@angular/router';
import { ApiError } from '../models/api-error.model';

const JWT_TOKEN_KEY = 'hamhama_auth_token';
const USER_INFO_KEY = 'hamhama_user_info';

// Add 'id' to the UserInfo interface
interface UserInfo {
  id: number; // Added id
  username: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<UserInfo | null>;
  public currentUser: Observable<UserInfo | null>;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem(USER_INFO_KEY);
    // Parse the full UserInfo including id
    this.currentUserSubject = new BehaviorSubject<UserInfo | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}/login`, loginRequest)
      .pipe(
        tap(response => this.storeAuthentication(response)), // Store the full response
        catchError(this.handleError)
      );
  }

  register(registerRequest: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, registerRequest, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  logout(): void {
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(JWT_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return !!user && user.roles.includes('ROLE_ADMIN');
  }

  // Update storeAuthentication to save the userId
  private storeAuthentication(response: AuthenticationResponse): void {
    if (response?.token && response?.username && response?.roles && response?.userId) { // Check for userId
      localStorage.setItem(JWT_TOKEN_KEY, response.token);
      // Create UserInfo object including the id
      const userInfo: UserInfo = {
          id: response.userId, // Store the id
          username: response.username,
          roles: response.roles
      };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      this.currentUserSubject.next(userInfo); // Notify subscribers with full UserInfo
    } else {
        console.error("Invalid authentication response received (missing fields):", response);
        this.logout(); // Logout if response is invalid
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
    } else {
       const backendError = error.error as ApiError;
       if (typeof error.error === 'string') {
         errorMessage = error.error;
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