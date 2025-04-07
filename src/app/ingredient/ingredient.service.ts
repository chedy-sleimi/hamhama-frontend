// src/app/ingredient/ingredient.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ingredient, SubstituteDTO } from '../models/ingredient.model'; // Use models
import { ApiError } from '../models/api-error.model';

@Injectable({
  providedIn: 'root' // Or provide in IngredientModule
})
export class IngredientService {
    private apiUrl = `${environment.apiUrl}/api/ingredients`;

    constructor(private http: HttpClient) { }

    getAllIngredients(): Observable<Ingredient[]> {
        return this.http.get<Ingredient[]>(this.apiUrl).pipe(catchError(this.handleError));
    }

    getIngredientById(id: number): Observable<Ingredient> {
        return this.http.get<Ingredient>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    // Admin Ops
    addIngredient(ingredientData: { name: string }): Observable<Ingredient> {
        return this.http.post<Ingredient>(this.apiUrl, ingredientData).pipe(catchError(this.handleError));
    }

    updateIngredient(id: number, ingredientData: { name: string }): Observable<Ingredient> {
        return this.http.put<Ingredient>(`${this.apiUrl}/${id}`, ingredientData).pipe(catchError(this.handleError));
    }

    deleteIngredient(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    // Authenticated User Ops
    getSubstitutes(ingredientId: number): Observable<SubstituteDTO> {
        return this.http.post<SubstituteDTO>(`${this.apiUrl}/${ingredientId}/substitutes`, null).pipe(catchError(this.handleError));
    }

    generateRecipeImage(ingredientIds: number[]): Observable<Blob> {
        // Expecting image bytes, request Blob
        return this.http.post(`${this.apiUrl}/generate-image`, ingredientIds, { responseType: 'blob' })
            .pipe(catchError(this.handleError));
    }


    private handleError(error: HttpErrorResponse) {
       let errorMessage = 'An unknown error occurred!';
        const backendError = error.error as ApiError;

        // Handle Blob error separately if needed (e.g., for generateRecipeImage)
        if (error.error instanceof Blob && error.error.type === 'application/json') {
             // Try to parse error from blob
             // This is complex, might need FileReader async. Simpler to rely on status code.
              errorMessage = `Error ${error.status}: Failed to process request.`;
        } else if (error.error instanceof ErrorEvent) {
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

         console.error(`Backend returned code ${error.status}, body was: `, error.error);
        return throwError(() => new Error(errorMessage));
    }
}