// src/app/recipe/recipe-detail/recipe-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../recipe.service';
import { Recipe } from '../../models/recipe.model';
import { AuthService } from '../../core/auth.service';
import { Subject, takeUntil, catchError, of, Observable, map } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-recipe-detail',
  standalone: false,
  templateUrl: './recipe-detail.component.html',
})
export class RecipeDetailComponent implements OnInit, OnDestroy {
  recipe: Recipe | null = null;
  loading = true;
  error: string | null = null;
  deleting = false;
  isOwnerOrAdmin$: Observable<boolean>;

  loadingNutrition = false;
  nutritionError: string | null = null;
  nutritionSvg: string | null = null;
  sanitizedNutritionSvg: SafeHtml | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
      this.isOwnerOrAdmin$ = of(false); // Default
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const recipeId = +idParam;
      this.loadRecipe(recipeId);
    } else {
      this.error = "Recipe ID not found in URL.";
      this.loading = false;
    }
  }

  loadRecipe(id: number): void {
    this.loading = true;
    this.error = null;
    this.recipeService.getRecipeById(id)
      .pipe(
          takeUntil(this.destroy$),
          catchError(err => {
              this.error = err.message;
              this.loading = false;
              return of(null); // Return null on error
        })
       )
      .subscribe(recipe => {
        this.recipe = recipe;
        this.loading = false;
        if (recipe) {
            this.checkOwnership(recipe.authorUsername);
        }
      });
  }

   checkOwnership(authorUsername: string): void {
        this.isOwnerOrAdmin$ = this.authService.currentUser.pipe(
            map(user => {
                if (!user) return false;
                const isAdmin = user.roles.includes('ROLE_ADMIN');
                const isOwner = user.username === authorUsername;
                return isAdmin || isOwner;
            })
        );
    }

  deleteRecipe(): void {
    if (!this.recipe || !confirm('Are you sure you want to delete this recipe?')) {
      return;
    }
    this.deleting = true;
    this.recipeService.deleteRecipe(this.recipe.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.router.navigate(['/recipes']); // Navigate back to list after delete
        },
        error: (err) => {
          this.error = `Failed to delete recipe: ${err.message}`;
          this.deleting = false;
        }
      });
  }

  loadNutrition(): void {
      if (!this.recipe) return;
      this.loadingNutrition = true;
      this.nutritionError = null;
      this.nutritionSvg = null;
      this.sanitizedNutritionSvg = null;

      this.recipeService.getNutritionFactsSvg(this.recipe.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (svg) => {
                this.nutritionSvg = svg;
                // IMPORTANT: Sanitize the SVG before rendering
                this.sanitizedNutritionSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
                this.loadingNutrition = false;
            },
            error: (err) => {
                 this.nutritionError = err.message;
                 this.loadingNutrition = false;
            }
        });
  }

   // Helper to construct full image URL
   getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) {
        return 'assets/placeholder-recipe.png'; // Provide a placeholder
    }
    if (imagePath.startsWith('/')) {
        return `${environment.apiUrl}${imagePath}`;
    }
    return imagePath;
    }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}