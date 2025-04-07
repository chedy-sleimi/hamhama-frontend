// src/app/ingredient/ingredient-list/ingredient-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IngredientService } from '../ingredient.service';
import { Ingredient } from '../../models/ingredient.model';
import { Subject, takeUntil, catchError, of, tap, finalize } from 'rxjs';

@Component({
  selector: 'app-ingredient-list',
  standalone: false,
  templateUrl: './ingredient-list.component.html',
})
export class IngredientListComponent implements OnInit, OnDestroy {
  ingredients: Ingredient[] = [];
  ingredientForm: FormGroup;
  editingIngredient: Ingredient | null = null;

  loading = true;
  saving = false;
  submitted = false;
  error: string | null = null;
  editError: string | null = null; // Separate error for edit/add form
  successMessage: string | null = null;
  deletingIngredientId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
      private ingredientService: IngredientService,
      private fb: FormBuilder
  ) {
      this.ingredientForm = this.fb.group({
          name: ['', Validators.required]
      });
  }

  ngOnInit(): void {
    this.loadIngredients();
  }

  loadIngredients(): void {
    this.loading = true;
    this.error = null;
    this.ingredientService.getAllIngredients()
      .pipe(
          takeUntil(this.destroy$),
          tap(() => this.loading = false),
          catchError(err => {
              this.error = `Failed to load ingredients: ${err.message}`;
              this.loading = false;
              return of([]);
          })
      )
      .subscribe(ingredients => {
          this.ingredients = ingredients;
      });
  }

  // Convenience getter
  get f() { return this.ingredientForm.controls; }

  startEdit(ingredient: Ingredient): void {
      this.editingIngredient = ingredient;
      this.ingredientForm.patchValue({ name: ingredient.name });
      this.editError = null;
      this.successMessage = null;
      this.submitted = false;
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  }

  cancelEdit(): void {
      this.editingIngredient = null;
      this.ingredientForm.reset();
      this.submitted = false;
      this.editError = null;
  }

  saveIngredient(): void {
      this.submitted = true;
      this.editError = null;
      this.successMessage = null;

      if (this.ingredientForm.invalid) {
          return;
      }

      this.saving = true;
      const ingredientData = { name: this.f['name'].value };

      const saveObs = this.editingIngredient
        ? this.ingredientService.updateIngredient(this.editingIngredient.id, ingredientData)
        : this.ingredientService.addIngredient(ingredientData);

      saveObs.pipe(
          takeUntil(this.destroy$),
          finalize(() => this.saving = false)
      ).subscribe({
          next: (savedIngredient) => {
              this.successMessage = `Ingredient '${savedIngredient.name}' ${this.editingIngredient ? 'updated' : 'added'} successfully!`;
              this.cancelEdit(); // Reset form
              this.loadIngredients(); // Refresh list
          },
          error: (err) => {
              this.editError = `Failed to save ingredient: ${err.message}`;
          }
      });
  }


  deleteIngredient(id: number): void {
      if (!confirm(`Are you sure you want to delete ingredient ID ${id}?`)) {
          return;
      }
      this.deletingIngredientId = id;
      this.error = null; // Clear list errors
      this.ingredientService.deleteIngredient(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
              next: () => {
                  this.successMessage = `Ingredient ID ${id} deleted.`;
                  this.deletingIngredientId = null;
                  this.loadIngredients(); // Refresh the list
                   // Clear edit form if the deleted item was being edited
                   if (this.editingIngredient?.id === id) {
                       this.cancelEdit();
                   }
              },
              error: (err) => {
                  this.error = `Failed to delete ingredient ${id}: ${err.message}`;
                  this.deletingIngredientId = null;
              }
          });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}