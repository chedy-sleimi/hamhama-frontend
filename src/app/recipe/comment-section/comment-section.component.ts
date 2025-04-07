// src/app/recipe/comment-section/comment-section.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { RecipeService } from '../recipe.service';
import { AuthService } from '../../core/auth.service';
import { Comment } from '../../models/comment.model';
import { Subject, takeUntil, catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-comment-section',
  standalone: false,
  templateUrl: './comment-section.component.html',
  styleUrls: ['./comment-section.component.scss']
})
export class CommentSectionComponent implements OnInit, OnDestroy {
  @Input() recipeId!: number; // Assume recipeId is always provided

  comments: Comment[] = [];
  loading = true;
  error: string | null = null;
  submitError: string | null = null;

  newCommentContent = '';
  submittingComment = false;
  isAuthenticated = false;
  currentUserUsername: string | null = null;
  isAdmin = false;
  deletingCommentId: number | null = null;


  private destroy$ = new Subject<void>();
   private currentUserSub: any; // To store subscription

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.recipeId) {
      this.error = 'Recipe ID is required for comments.';
      this.loading = false;
      return;
    }

    this.currentUserSub = this.authService.currentUser.subscribe(user => {
        this.isAuthenticated = !!user;
        this.currentUserUsername = user?.username ?? null;
        this.isAdmin = this.authService.isAdmin(); // Check admin status
    });

    this.loadComments();
  }

  loadComments(): void {
    this.loading = true;
    this.error = null;
    this.recipeService.getCommentsByRecipe(this.recipeId)
      .pipe(
          takeUntil(this.destroy$),
           // TODO: If backend doesn't send username, fetch usernames based on userIds here
          tap(() => this.loading = false),
          catchError(err => {
            this.error = `Failed to load comments: ${err.message}`;
            this.loading = false;
            return of([]);
          })
       )
      .subscribe(comments => {
        this.comments = comments;
      });
  }

  addComment(): void {
    if (!this.newCommentContent.trim()) return;

    this.submittingComment = true;
    this.submitError = null;
    this.recipeService.addComment(this.recipeId, this.newCommentContent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submittingComment = false;
          this.newCommentContent = ''; // Clear input
          this.loadComments(); // Refresh comments list
        },
        error: (err) => {
          this.submitError = `Failed to add comment: ${err.message}`;
          this.submittingComment = false;
        }
      });
  }

  isOwnerOrAdmin(commentUserId: number | undefined): boolean {
    if (!this.isAuthenticated) return false;
    if (this.isAdmin) return true;
    // We need user ID from comment for accurate check, backend should provide it
    // Or compare username if ID isn't available (less reliable)
    // For now, assuming comment might not have userId directly accessible from list endpoint
    // This check needs refinement based on actual backend response for GET /comments/recipe/{id}
    // Placeholder: Allow delete if admin, otherwise needs comment.userId check
     return false; // Requires backend to send comment.userId or comment.username accurately
     // If comment had `username`: return this.currentUserUsername === comment.username;
     // If comment had `userId`: fetch current user ID from authService and compare.
  }


  deleteComment(commentId: number): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.deletingCommentId = commentId;
    this.submitError = null; // Clear previous errors
    this.recipeService.deleteComment(commentId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: () => {
                this.deletingCommentId = null;
                this.loadComments(); // Refresh list
            },
            error: (err) => {
                this.submitError = `Failed to delete comment: ${err.message}`;
                this.deletingCommentId = null;
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