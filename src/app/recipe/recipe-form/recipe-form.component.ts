// src/app/recipe/recipe-form/recipe-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../recipe.service';
import { Recipe, RecipeCategory, RecipeFormData } from '../../models/recipe.model';
import { Subject, takeUntil, catchError, of, switchMap } from 'rxjs';
import { Location } from '@angular/common'; // Import Location

@Component({
  selector: 'app-recipe-form',
  standalone: false,
  templateUrl: './recipe-form.component.html',
  styleUrls: ['./recipe-form.component.scss']
})
export class RecipeFormComponent implements OnInit, OnDestroy {
  recipeForm: FormGroup;
  isEditMode = false;
  recipeId: number | null = null;
  loading = false; // Loading existing data for edit
  saving = false; // Saving/submitting form
  submitted = false;
  error: string | null = null;
  recipeCategories = Object.values(RecipeCategory);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private location: Location // Inject Location
  ) {
    this.recipeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: [null, Validators.required],
      // Add form controls for ingredients later
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
          takeUntil(this.destroy$),
          switchMap(params => {
              const id = params.get('id');
              if (id) {
                  this.isEditMode = true;
                  this.recipeId = +id;
                  this.loading = true;
                  return this.recipeService.getRecipeById(this.recipeId).pipe(
                      catchError(err => {
                          this.error = `Error loading recipe: ${err.message}`;
                          this.loading = false;
                          return of(null); // Continue with null if recipe load fails
                      })
                  );
              }
              return of(null); // No ID, not edit mode
          })
      )
      .subscribe(recipe => {
          if (this.isEditMode && recipe) {
              this.recipeForm.patchValue({
                  name: recipe.name,
                  description: recipe.description,
                  category: recipe.category
                  // Patch ingredients here
              });
          }
          this.loading = false; // Done loading (or wasn't edit mode)
      });
  }

  // Convenience getter
  get f() { return this.recipeForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = null;

    if (this.recipeForm.invalid) {
      console.log('Form Invalid');
      return;
    }

    this.saving = true;
    const formData: RecipeFormData = {
        name: this.f['name'].value,
        description: this.f['description'].value,
        category: this.f['category'].value,
    };

    const saveObservable = this.isEditMode && this.recipeId
      ? this.recipeService.updateRecipe(this.recipeId, formData)
      : this.recipeService.addRecipe(formData);

    saveObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedRecipe) => {
          this.saving = false;
          // Navigate to the detail page of the created/updated recipe
          this.router.navigate(['/recipes', savedRecipe.id]);
        },
        error: (err) => {
          this.error = `Failed to save recipe: ${err.message}`;
          this.saving = false;
        }
      });
  }

   cancel(): void {
       this.location.back(); // Use Location to go back
   }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}