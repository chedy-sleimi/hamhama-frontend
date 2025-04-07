// src/app/user/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserProfile } from '../models/user.model';
import { Recipe } from '../models/recipe.model'; // Import Recipe if needed for liked recipes list
import { ApiError } from '../models/api-error.model';

// Define DTOs for updates if backend expects specific structures
export interface UserUpdateData {
    username?: string;
    email?: string;
    // Avoid password here, use separate endpoint/method
    // roles?: string[]; // If admin updates roles
}


@Injectable({
    providedIn: 'root' // Or provide in UserModule
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/api/users`;

    constructor(private http: HttpClient) { }

    // --- Admin User Management ---

    getAllUsers(): Observable<User[]> { // For Admin
        return this.http.get<User[]>(this.apiUrl).pipe(catchError(this.handleError));
    }

    // Admin gets raw User entity, maybe needs different DTO later
    getUserById(id: number): Observable<User> { // For Admin
        return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    // Admin creates user - backend needs User object
    createUser(userData: User): Observable<User> { // For Admin
        return this.http.post<User>(this.apiUrl, userData).pipe(catchError(this.handleError));
    }

    // Admin or Self update - Use DTO!
    updateUser(id: number, userData: UserUpdateData): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${id}`, userData).pipe(catchError(this.handleError));
    }

    deleteUser(id: number): Observable<void> { // For Admin
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    // --- Authenticated User Actions ---

    followUser(followingId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/follow/${followingId}`, null).pipe(catchError(this.handleError));
    }

    unfollowUser(followingId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/unfollow/${followingId}`).pipe(catchError(this.handleError));
    }

    likeRecipe(recipeId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/like/${recipeId}`, null).pipe(catchError(this.handleError));
    }

    unlikeRecipe(recipeId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/unlike/${recipeId}`).pipe(catchError(this.handleError));
    }

    blockUser(blockedUserId: number): Observable<string> { // Backend returns string message
        return this.http.post(`${this.apiUrl}/block/${blockedUserId}`, null, { responseType: 'text' }).pipe(catchError(this.handleError));
    }

    unblockUser(blockedUserId: number): Observable<string> { // Backend returns string message
        return this.http.delete(`${this.apiUrl}/unblock/${blockedUserId}`, { responseType: 'text' }).pipe(catchError(this.handleError));
    }

    // --- Profile & Data Retrieval ---

    getMyProfile(): Observable<UserProfile> { // Gets own profile
        return this.http.get<UserProfile>(`${this.apiUrl}/profile`).pipe(catchError(this.handleError));
    }

    // Use this for viewing OTHER users' profiles
    getPublicUserProfile(username: string): Observable<UserProfile> {
        // Adjust backend if it expects ID instead of username for public view
        // Backend path is currently /api/users/{profileUserId}/profile
        // We might need a getUserIdByUsername helper or change backend/frontend path
        // Assuming for now backend can handle /api/users/{username}/profile or we adapt
        // Let's assume we pass username and backend resolves it. If not, adjust.
        // A more robust way is GET /api/users/by-username/{username} first, then use the ID.
        // For now, using the less ideal path structure assuming backend handles it:
         return this.http.get<UserProfile>(`${this.apiUrl}/${username}/profile`).pipe(catchError(this.handleError));
        // Alternative if backend strictly needs ID:
        // 1. Get ID: getUserByUsername(username): Observable<User> -> user.id
        // 2. Get profile: getProfileById(id): Observable<UserProfile>
        // This requires combining calls (e.g., with switchMap).
    }


    // Example: Get user ID by username (if needed for getPublicUserProfile)
    // getUserByUsername(username: string): Observable<User> {
    //     return this.http.get<User>(`${this.apiUrl}/by-username/${username}`).pipe(catchError(this.handleError)); // Needs backend endpoint
    // }


    getMyLikedRecipes(): Observable<Recipe[]> { // Gets own liked recipes
        return this.http.get<Recipe[]>(`${this.apiUrl}/liked-recipes`).pipe(catchError(this.handleError));
    }

    // Requires authentication (handled by guard/interceptor)
    getMyBlockedUsers(): Observable<User[]> { // Gets own blocked users list
        return this.http.get<User[]>(`${this.apiUrl}/blocked-users`).pipe(catchError(this.handleError));
    }

    // Admin or Self (via ID) - called from controller checking access
    getFollowers(userId: number): Observable<User[]> {
         return this.http.get<User[]>(`${this.apiUrl}/${userId}/followers`).pipe(catchError(this.handleError));
    }

    // Admin or Self (via ID) - called from controller checking access
    getFollowing(userId: number): Observable<User[]> {
         return this.http.get<User[]>(`${this.apiUrl}/${userId}/following`).pipe(catchError(this.handleError));
    }


    // --- Settings ---

    updateMyPrivacySetting(isPrivate: boolean): Observable<string> { // Backend returns string message
        const params = new HttpParams().set('isPrivate', isPrivate.toString());
        return this.http.put(`${this.apiUrl}/privacy`, null, { params: params, responseType: 'text' }).pipe(catchError(this.handleError));
    }

    // No dedicated GET /privacy in backend, info is part of UserProfile
    // getMyPrivacySetting(): Observable<boolean> {
    //     return this.http.get<boolean>(`${this.apiUrl}/privacy`).pipe(catchError(this.handleError));
    // }

    updateMyProfilePicture(file: File): Observable<string> { // Backend returns string message
        const formData = new FormData();
        formData.append('file', file, file.name);
        // PUT request to /api/users/profile-picture
        return this.http.put(`${this.apiUrl}/profile-picture`, formData, { responseType: 'text' }).pipe(catchError(this.handleError));
    }

    deleteMyProfilePicture(): Observable<string> { // Backend returns string message
        return this.http.delete(`${this.apiUrl}/profile-picture`, { responseType: 'text' }).pipe(catchError(this.handleError));
    }


    private handleError(error: HttpErrorResponse) {
       let errorMessage = 'An unknown error occurred!';
        const backendError = error.error as ApiError;

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else if (typeof error.error === 'string') {
            errorMessage = error.error; // Plain text error from backend
        } else if (backendError && backendError.message) {
            errorMessage = `Error ${error.status}: ${backendError.message}`;
        } else if (error.message) {
            errorMessage = `Error ${error.status}: ${error.message}`;
        } else {
            errorMessage = `Server returned code ${error.status}, error message: ${error.message || 'Unknown error'}`;
        }

        if (error.status === 404) {
            errorMessage = `Error 404: User or resource not found.`;
        }
         if (error.status === 403) {
            errorMessage = `Error 403: You do not have permission to view this profile or perform this action.`;
        }
         if (error.status === 400) {
            // Specific handling for bad requests (e.g., validation errors)
             errorMessage = `Error 400: Invalid request. ${backendError?.message || error.error || ''}`;
         }


        console.error(`Backend returned code ${error.status}, body was: `, error.error);
        return throwError(() => new Error(errorMessage));
    }
}