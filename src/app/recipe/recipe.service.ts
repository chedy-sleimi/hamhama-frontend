// src/app/recipe/recipe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Recipe, RecipeCategory, RecipeFormData } from '../models/recipe.model';
import { Comment } from '../models/comment.model';
import { ApiError } from '../models/api-error.model';

@Injectable({
    // Provided in the RecipeModule if only used there,
    // or 'root' if potentially used elsewhere (e.g., user liked recipes)
    // Let's go with module-specific for now.
    providedIn: 'root'
})
export class RecipeService {
    private recipeApiUrl = `${environment.apiUrl}/api/recipes`;
    private commentApiUrl = `${environment.apiUrl}/comments`;
    private ratingApiUrl = `${environment.apiUrl}/ratings`;

    constructor(private http: HttpClient) { }

    // --- Recipe Methods ---

    getAllRecipes(params?: { category?: RecipeCategory, name?: string, description?: string, ingredient?: string }): Observable<Recipe[]> {
        let httpParams = new HttpParams();
        if (params) {
            // Handle search - Backend expects separate params, not a single 'query'
             if (params.category) {
                httpParams = httpParams.set('category', params.category);
             }
             if (params.name) {
                 httpParams = httpParams.set('name', params.name);
             }
              if (params.description) {
                 httpParams = httpParams.set('description', params.description);
             }
             if (params.ingredient) {
                 httpParams = httpParams.set('ingredient', params.ingredient);
             }
             // If category or other filters are set, use the search endpoint
             if (params.category || params.name || params.description || params.ingredient) {
                 return this.http.get<Recipe[]>(`${this.recipeApiUrl}/search`, { params: httpParams }).pipe(catchError(this.handleError));
             }
        }
        // Default: Get all recipes
        return this.http.get<Recipe[]>(this.recipeApiUrl).pipe(catchError(this.handleError));
    }


    getRecipeById(id: number): Observable<Recipe> {
        return this.http.get<Recipe>(`${this.recipeApiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    addRecipe(recipeData: RecipeFormData): Observable<Recipe> {
        return this.http.post<Recipe>(this.recipeApiUrl, recipeData).pipe(catchError(this.handleError));
    }

    updateRecipe(id: number, recipeData: RecipeFormData): Observable<Recipe> {
        // Backend expects full Recipe object for update in current implementation, but DTO is better
        // We'll send the FormData DTO which might work if backend mapping is flexible,
        // otherwise adjust backend or send a mapped object.
        return this.http.put<Recipe>(`${this.recipeApiUrl}/${id}`, recipeData).pipe(catchError(this.handleError));
    }

    deleteRecipe(id: number): Observable<void> {
        return this.http.delete<void>(`${this.recipeApiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    // --- Comment Methods ---

    getCommentsByRecipe(recipeId: number): Observable<Comment[]> {
        // Assuming backend populates username or we fetch it separately if needed
        return this.http.get<Comment[]>(`${this.commentApiUrl}/recipe/${recipeId}`).pipe(catchError(this.handleError));
    }

    addComment(recipeId: number, content: string): Observable<string> { // Backend returns string message
        const params = new HttpParams()
            .set('recipeId', recipeId.toString())
            .set('content', content);
        // Backend uses @RequestParam, so send as params, not body
        return this.http.post(`${this.commentApiUrl}/add`, null, { params: params, responseType: 'text' }).pipe(catchError(this.handleError));
    }

    deleteComment(commentId: number): Observable<string> { // Backend returns string message
        return this.http.delete(`${this.commentApiUrl}/delete/${commentId}`, { responseType: 'text' }).pipe(catchError(this.handleError));
    }

    // --- Rating Methods ---

    getAverageRating(recipeId: number): Observable<number> { // Backend returns double
        return this.http.get<number>(`${this.ratingApiUrl}/recipe/${recipeId}/average`).pipe(catchError(this.handleError));
    }

    rateRecipe(recipeId: number, ratingValue: number): Observable<string> { // Backend returns string message
        const params = new HttpParams()
            .set('recipeId', recipeId.toString())
            .set('ratingValue', ratingValue.toString());
        return this.http.post(`${this.ratingApiUrl}/rate`, null, { params: params, responseType: 'text' }).pipe(catchError(this.handleError));
    }

    deleteRating(recipeId: number): Observable<string> { // Backend returns string message
        const params = new HttpParams().set('recipeId', recipeId.toString());
        return this.http.delete(`${this.ratingApiUrl}/delete`, { params: params, responseType: 'text' }).pipe(catchError(this.handleError));
    }

    // --- Nutrition SVG ---
    getNutritionFactsSvg(recipeId: number): Observable<string> {
         return this.http.get(`${this.recipeApiUrl}/${recipeId}/nutrition`, { responseType: 'text' })
            .pipe(catchError(this.handleError));
    }


    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred!';
        const backendError = error.error as ApiError;

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else if (typeof error.error === 'string' && error.error.includes('<svg')) {
             // Handle SVG error response from nutrition facts endpoint
             errorMessage = 'Could not generate nutrition facts. Check recipe details.';
             console.warn("Received SVG error response:", error.error)
        }
        else if (typeof error.error === 'string') {
            errorMessage = error.error; // Plain text error from backend
        } else if (backendError && backendError.message) {
            errorMessage = `Error ${error.status}: ${backendError.message}`;
        } else if (error.message) {
            errorMessage = `Error ${error.status}: ${error.message}`;
        } else {
            errorMessage = `Server returned code ${error.status}, error message: ${error.message || 'Unknown error'}`;
        }

        if (error.status === 404) {
            errorMessage = `Error 404: Resource not found.`;
        }
        if (error.status === 403) {
            errorMessage = `Error 403: You do not have permission to perform this action.`;
        }
        // Add other specific status code handling if needed

        console.error(`Backend returned code ${error.status}, body was: `, error.error);
        return throwError(() => new Error(errorMessage));
    }
}