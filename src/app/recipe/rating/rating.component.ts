// src/app/recipe/rating/rating.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { RecipeService } from '../recipe.service';
import { AuthService } from '../../core/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-rating',
  standalone: false,
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss']
})
export class RatingComponent implements OnInit, OnDestroy {
  @Input() recipeId!: number;
  @Input() initialRating: number = 0; // Average rating passed from parent

  currentAverageRating: number = 0;
  userRating: number | null = null; // Track the logged-in user's specific rating
  isAuthenticated = false;
  submittingRating = false;
  ratingError: string | null = null;

  private destroy$ = new Subject<void>();
  private currentUserSub: any;

  constructor(
      private recipeService: RecipeService,
      private authService: AuthService
  ) { }

  ngOnInit(): void {
      this.currentAverageRating = this.initialRating;

       this.currentUserSub = this.authService.currentUser.subscribe(user => {
           this.isAuthenticated = !!user;
           // TODO: Fetch user's *specific* rating for this recipe if backend provides it
           // This requires a new backend endpoint like GET /ratings/recipe/{id}/my-rating
           // For now, we'll just allow setting a new rating.
           if (!this.isAuthenticated) {
               this.userRating = null; // Reset user rating on logout
           }
        });

      // Optionally, re-fetch average rating in case it changed since parent loaded
      // this.recipeService.getAverageRating(this.recipeId).subscribe(avg => this.currentAverageRating = avg);
  }

  rate(ratingValue: number): void {
      if (!this.isAuthenticated) return;

      this.submittingRating = true;
      this.ratingError = null;
      this.recipeService.rateRecipe(this.recipeId, ratingValue)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
              next: () => {
                  this.userRating = ratingValue;
                  // Refresh average rating after successful submission
                  this.recipeService.getAverageRating(this.recipeId).subscribe(avg => this.currentAverageRating = avg);
                  this.submittingRating = false;
              },
              error: (err) => {
                  this.ratingError = `Failed to submit rating: ${err.message}`;
                  this.submittingRating = false;
              }
          });
  }

  clearRating(): void {
      if (!this.isAuthenticated) return;

       this.submittingRating = true; // Use same flag for disabling buttons
       this.ratingError = null;
       this.recipeService.deleteRating(this.recipeId)
           .pipe(takeUntil(this.destroy$))
           .subscribe({
               next: () => {
                   this.userRating = null; // Clear user's rating display
                   // Refresh average rating
                   this.recipeService.getAverageRating(this.recipeId).subscribe(avg => this.currentAverageRating = avg);
                    this.submittingRating = false;
               },
               error: (err) => {
                   this.ratingError = `Failed to delete rating: ${err.message}`;
                   this.submittingRating = false;
               }
           });
  }


  ngOnDestroy(): void {
     if (this.currentUserSub) {
       this.currentUserSub.unsubscribe();
     }
    this.destroy$.next();
    this.destroy$.complete();
  }
}