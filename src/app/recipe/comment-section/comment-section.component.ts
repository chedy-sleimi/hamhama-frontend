// src/app/recipe/comment-section/comment-section.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { RecipeService } from '../recipe.service';
import { AuthService } from '../../core/auth.service';
import { Comment } from '../../models/comment.model';
import { Subject, takeUntil, catchError, of, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-comment-section',
  templateUrl: './comment-section.component.html',
  standalone: false
})
export class CommentSectionComponent implements OnInit, OnDestroy {
  @Input() recipeId!: number;

  comments: Comment[] = [];
  loading = true;
  error: string | null = null;
  submitError: string | null = null;
  deleteError: string | null = null;

  newCommentContent = '';
  submittingComment = false;
  isAuthenticated = false;
  currentUserId: number | null = null;
  isAdmin = false;
  deletingCommentId: number | null = null;

  editingCommentId: number | null = null;
  editedCommentContent: string = '';
  savingEdit = false;

  // State to track image loading errors per comment
  imageErrorStates: { [commentId: number]: boolean } = {};

  private destroy$ = new Subject<void>();
  private currentUserSub: any;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // ... (existing ngOnInit logic is fine) ...
     if (!this.recipeId) {
        this.error = 'Recipe ID is required for comments.';
        this.loading = false;
        return;
     }
     this.currentUserSub = this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
       this.isAuthenticated = !!user;
       this.isAdmin = this.authService.isAdmin();
       this.currentUserId = user?.id ?? null;
        if (this.isAuthenticated && this.currentUserId === null) {
          console.error("Authenticated user ID could not be determined. Comment owner checks will fail.");
        }
     });
     this.loadComments();
  }

  loadComments(): void {
    this.loading = true;
    this.error = null;
    this.imageErrorStates = {}; // Reset error states when loading new comments
    this.recipeService.getCommentsByRecipe(this.recipeId)
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading = false)
      )
      .subscribe({
          next: (comments: Comment[]) => {
            this.comments = comments;
          },
          error: (err) => {
            this.error = `Failed to load comments: ${err.message}`;
            console.error(err);
          }
      });
  }

  // --- Edit/Add/Delete methods are fine as before ---
  addComment(): void {
     if (!this.newCommentContent.trim() || this.submittingComment) return;
     this.submittingComment = true;
     this.submitError = null;
     this.recipeService.addComment(this.recipeId, this.newCommentContent)
       .pipe(takeUntil(this.destroy$), finalize(() => this.submittingComment = false))
       .subscribe({
         next: () => { this.newCommentContent = ''; this.loadComments(); },
         error: (err) => { this.submitError = `Failed to add comment: ${err.message}`; }
       });
   }
   startEdit(comment: Comment): void { /* ... */ this.editingCommentId = comment.id; this.editedCommentContent = comment.content; this.submitError = null; this.deleteError = null; }
   cancelEdit(): void { /* ... */ this.editingCommentId = null; this.editedCommentContent = ''; this.savingEdit = false; this.submitError = null; }
   saveEdit(): void {
     if (!this.editedCommentContent.trim() || !this.editingCommentId || this.savingEdit) return;
     this.savingEdit = true; this.submitError = null;
     this.recipeService.updateComment(this.editingCommentId, this.editedCommentContent)
        .pipe(takeUntil(this.destroy$), finalize(() => this.savingEdit = false))
        .subscribe({
           next: (updatedComment) => {
              const index = this.comments.findIndex(c => c.id === updatedComment.id);
              if (index !== -1) { this.comments[index] = { ...this.comments[index], ...updatedComment }; }
              else { this.loadComments(); }
              this.cancelEdit();
           },
           error: (err) => { this.submitError = `Failed to update comment: ${err.message}`; }
        });
    }
   isOwner(commentUserId: number | undefined | null): boolean { /* ... */ if (!this.isAuthenticated || !commentUserId || !this.currentUserId) return false; return commentUserId === this.currentUserId; }
   canDelete(commentUserId: number | undefined | null): boolean { /* ... */ if (!this.isAuthenticated) return false; if (this.isAdmin) return true; return this.isOwner(commentUserId); }
   deleteComment(commentId: number): void {
     if (!confirm('Are you sure you want to delete this comment?')) return;
     this.deletingCommentId = commentId; this.deleteError = null; this.submitError = null;
     this.recipeService.deleteComment(commentId)
         .pipe(takeUntil(this.destroy$), finalize(() => this.deletingCommentId = null))
         .subscribe({
             next: () => { this.comments = this.comments.filter(c => c.id !== commentId); },
             error: (err) => { this.deleteError = `Failed to delete comment: ${err.message}`; console.error("Delete error:", err); }
         });
   }
   // -----------------------------------------------


  // --- Revised Image Handling ---
  getProfilePictureUrl(comment: Comment): string | null { // Return string URL or null
    // Only return a URL if the backend provided a non-empty path
    if (comment.authorProfilePictureUrl && comment.authorProfilePictureUrl.trim() !== '') {
      const url = comment.authorProfilePictureUrl;
      // Construct full URL if it's relative (starts with '/')
      if (url.startsWith('/')) {
          // Avoid double-prepending if backend already includes it sometimes
          return url.startsWith(environment.apiUrl) ? url : `${environment.apiUrl}${url}`;
      }
      // Assume it's already an absolute URL if not starting with '/'
      return url;
    }
    // Return null if no picture URL was provided by the backend
    return null;
  }

  // Mark specific image as errored
  handleImageError(commentId: number): void {
    console.log(`Image failed to load for comment ${commentId}, showing fallback.`);
    this.imageErrorStates[commentId] = true;
  }
  // -----------------------------

  ngOnDestroy(): void {
    if (this.currentUserSub) { this.currentUserSub.unsubscribe(); }
    this.destroy$.next();
    this.destroy$.complete();
  }
}