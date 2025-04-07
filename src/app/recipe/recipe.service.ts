import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Recipe, RecipeCategory, RecipeFormData } from '../models/recipe.model';
import { Comment } from '../models/comment.model'; // Ensure Comment model is updated
import { ApiError } from '../models/api-error.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private recipeApiUrl = `${environment.apiUrl}/api/recipes`;
  private commentApiUrl = `${environment.apiUrl}/comments`; // Base URL for comments
  private ratingApiUrl = `${environment.apiUrl}/ratings`;

  constructor(private http: HttpClient) { }

  // --- Recipe Methods ---

  getAllRecipes(params?: { category?: RecipeCategory, name?: string, description?: string, ingredient?: string }): Observable<Recipe[]> {
      let httpParams = new HttpParams();
      if (params) {
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
           if (params.category || params.name || params.description || params.ingredient) {
               return this.http.get<Recipe[]>(`${this.recipeApiUrl}/search`, { params: httpParams }).pipe(catchError(this.handleError));
           }
      }
      return this.http.get<Recipe[]>(this.recipeApiUrl).pipe(catchError(this.handleError));
  }

  getRecipeById(id: number): Observable<Recipe> {
      return this.http.get<Recipe>(`${this.recipeApiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  addRecipe(recipeData: RecipeFormData): Observable<Recipe> {
      return this.http.post<Recipe>(this.recipeApiUrl, recipeData).pipe(catchError(this.handleError));
  }

  updateRecipe(id: number, recipeData: RecipeFormData): Observable<Recipe> {
      return this.http.put<Recipe>(`${this.recipeApiUrl}/${id}`, recipeData).pipe(catchError(this.handleError));
  }

  deleteRecipe(id: number): Observable<void> {
      return this.http.delete<void>(`${this.recipeApiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  // --- Comment Methods ---

  getCommentsByRecipe(recipeId: number): Observable<Comment[]> {
    // Expecting CommentDTO array from backend, which maps to Comment interface
    return this.http.get<Comment[]>(`${this.commentApiUrl}/recipe/${recipeId}`)
      .pipe(catchError(this.handleError));
  }

  addComment(recipeId: number, content: string): Observable<string> { // Backend returns string message
    const params = new HttpParams()
        .set('recipeId', recipeId.toString())
        .set('content', content);
    return this.http.post(`${this.commentApiUrl}/add`, null, { params: params, responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  updateComment(commentId: number, content: string): Observable<Comment> { // Expecting updated Comment DTO back
    const params = new HttpParams().set('content', content);
    // Use PUT request for updates
    return this.http.put<Comment>(`${this.commentApiUrl}/${commentId}`, null, { params: params })
      .pipe(catchError(this.handleError));
  }

  deleteComment(commentId: number): Observable<string> { // Backend returns string message
    return this.http.delete(`${this.commentApiUrl}/delete/${commentId}`, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  // --- Rating Methods ---

  getAverageRating(recipeId: number): Observable<number> {
      return this.http.get<number>(`${this.ratingApiUrl}/recipe/${recipeId}/average`).pipe(catchError(this.handleError));
  }

  rateRecipe(recipeId: number, ratingValue: number): Observable<string> {
      const params = new HttpParams()
          .set('recipeId', recipeId.toString())
          .set('ratingValue', ratingValue.toString());
      return this.http.post(`${this.ratingApiUrl}/rate`, null, { params: params, responseType: 'text' }).pipe(catchError(this.handleError));
  }

  deleteRating(recipeId: number): Observable<string> {
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
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
      } else if (typeof error.error === 'string') {
          // Server-side plain text error
           if (error.status === 403) {
                errorMessage = `Error 403: You do not have permission. (${error.error})`;
           } else if (error.status === 400) {
               errorMessage = `Error 400: Bad Request. (${error.error})`;
           }
           else {
                errorMessage = error.error; // General plain text error
           }
      } else if (backendError && backendError.message) {
          // Standard Spring Boot error response
          errorMessage = `Error ${error.status}: ${backendError.message}`;
      } else if (error.message) {
          // Fallback to HttpErrorResponse message
          errorMessage = `Error ${error.status}: ${error.message}`;
      } else {
          // Generic fallback
          errorMessage = `Server returned code ${error.status}, error message: ${error.message || 'Unknown error'}`;
      }

      // Specific status code handling (can override above messages)
      if (error.status === 0 && error.statusText === "Unknown Error") {
            // This often indicates a network error or CORS issue (already resolved, hopefully)
            errorMessage = 'Could not connect to the server. Please check your network or try again later.';
       }
       else if (error.status === 404) {
          errorMessage = `Error 404: Resource not found.`;
      } else if (error.status === 403) {
           // Refine 403 message if not already handled by plain text check
          if (!errorMessage.startsWith('Error 403')) {
               errorMessage = `Error 403: You do not have permission to perform this action.`;
          }
      } else if (error.status === 401) {
          errorMessage = `Error 401: Unauthorized. Please log in.`;
      }


      console.error(`Backend returned code ${error.status}, body was: `, error.error);
      // Return an error observable with a user-friendly message
      return throwError(() => new Error(errorMessage));
  }
}