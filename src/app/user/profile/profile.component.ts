// src/app/user/profile/profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../user.service';
import { AuthService } from '../../core/auth.service';
import { UserProfile } from '../../models/user.model';
import { Recipe } from '../../models/recipe.model';
import { Subject, takeUntil, catchError, of, switchMap, combineLatest, map, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  likedRecipes: Recipe[] = []; // Separate state for liked recipes
  loading = true;
  error: string | null = null;
  actionLoading = false; // For follow/block buttons
  actionError: string | null = null;

  viewingUsername: string | null = null;
  currentUserUsername: string | null = null;
  isAuthenticated = false;
  isOwnProfile = false;

  // State for follow/block status (needs backend data)
  isFollowing = false; // Need to fetch this status
  isBlocked = false; // Need to fetch this status (e.g. from blocked list)

  private destroy$ = new Subject<void>();
  private profileUsername$ = new BehaviorSubject<string | null>(null);


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
            this.isAuthenticated = !!user;
            this.currentUserUsername = user?.username ?? null;
            // Re-evaluate own profile status if auth state changes
            this.checkOwnProfile();
             // If authenticated, fetch blocked users list to determine block status
             if (this.isAuthenticated) {
                this.fetchBlockedStatus();
            } else {
                this.isBlocked = false; // Can't be blocked if not logged in
            }
        });

     this.route.paramMap
        .pipe(
            map(params => params.get('username')),
            tap(username => {
                if (!username) {
                    this.error = "Username not found in URL.";
                    this.loading = false;
                    this.profileUsername$.next(null);
                } else {
                    this.viewingUsername = username;
                    this.profileUsername$.next(username);
                    this.checkOwnProfile();
                    this.loadProfileData(); // Trigger loading
                }
            }),
            takeUntil(this.destroy$)
        ).subscribe(); // Subscribe to trigger the pipeline

      // TODO: Fetch current follow status if viewing another user's profile
      // Needs a backend endpoint like GET /api/users/{profileUserId}/is-following
      // this.fetchFollowStatus();
  }

   checkOwnProfile(): void {
       this.isOwnProfile = !!(this.currentUserUsername && this.viewingUsername && this.currentUserUsername === this.viewingUsername);
   }

    loadProfileData(): void {
        const username = this.profileUsername$.value;
        if (!username) return;

        this.loading = true;
        this.error = null;

        // Use the appropriate service method based on own profile vs other
        const profileObservable = this.isOwnProfile
            ? this.userService.getMyProfile()
            : this.userService.getPublicUserProfile(username);


        profileObservable.pipe(
            takeUntil(this.destroy$),
            catchError(err => {
                this.error = err.message; // Display error from service handler
                this.loading = false;
                this.profile = null; // Clear profile on error
                return of(null);
            }),
             // Fetch liked recipes in parallel or sequentially
            switchMap(profileResult => {
                this.profile = profileResult; // Assign profile first
                if (!profileResult) {
                     return of(null); // Stop if profile loading failed
                }
                // Only load liked recipes if profile is accessible and it's own profile?
                // Or if public and privacy allows? Let's assume load always for now if profile exists.
                 // Backend UserProfile DTO includes likedRecipes, so no separate call needed IF that DTO is used.
                 // If backend GET /profile doesn't include likedRecipes:
                 // if (this.isOwnProfile) {
                 //    return this.userService.getMyLikedRecipes().pipe(catchError(() => of([]))); // Handle liked recipes error
                 // } else {
                 //    // Maybe fetch public liked recipes if API allows?
                 //    return of (profileResult.likedRecipes || []); // Use from profile DTO if available
                 // }
                 this.likedRecipes = profileResult.likedRecipes || []; // Assign from profile DTO
                 return of(profileResult); // Pass profile along
            })
        ).subscribe({
            next: (profileResult) => {
                 // Profile already assigned in switchMap
                 this.loading = false;
                 if (this.profile && !this.isOwnProfile) {
                     // Fetch follow/block status after profile is loaded
                     this.fetchFollowStatus();
                     this.fetchBlockedStatus(); // Re-fetch/confirm block status
                 }
            },
             // Error handled in catchError
        });
    }

    fetchFollowStatus(): void {
        if (this.isOwnProfile || !this.isAuthenticated || !this.viewingUsername) {
            this.isFollowing = false;
            return;
        }
        // TODO: Implement this call
        // Need backend endpoint: GET /api/users/{viewingUsername}/is-following
        // this.userService.getFollowStatus(this.viewingUsername).subscribe(status => this.isFollowing = status);
        console.warn("Follow status fetching not implemented yet.");
    }

     fetchBlockedStatus(): void {
         if (this.isOwnProfile || !this.isAuthenticated || !this.viewingUsername) {
             this.isBlocked = false;
             return;
         }
         // Check if the viewingUsername is in the current user's blocked list
         this.userService.getMyBlockedUsers().pipe(takeUntil(this.destroy$)).subscribe({
             next: blockedList => {
                  this.isBlocked = blockedList.some(user => user.username === this.viewingUsername);
             },
             error: () => this.isBlocked = false // Assume not blocked on error
         });
     }


  follow(): void {
    if (!this.profile || this.isOwnProfile || !this.isAuthenticated) return;
    this.actionLoading = true;
    this.actionError = null;
     // We need the ID of the user being followed. Get it from profile? Or fetch separately?
     // Assuming profile DTO doesn't have ID. We need to get ID from username first.
     // This highlights the need for a robust way to get user ID from username.
     console.error("Cannot follow: User ID retrieval from username not implemented.");
     alert("Follow action requires user ID. Feature needs adjustment.");
     this.actionLoading = false;
     return; // Placeholder return

    // Example if ID was available (e.g., this.profile.id):
    // this.userService.followUser(this.profile.id)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       this.isFollowing = true;
    //       // Optionally update follower count visually (or reload profile)
    //        if(this.profile) this.profile.followersCount++;
    //       this.actionLoading = false;
    //     },
    //     error: (err) => {
    //       this.actionError = `Follow failed: ${err.message}`;
    //       this.actionLoading = false;
    //     }
    //   });
  }

  unfollow(): void {
     if (!this.profile || this.isOwnProfile || !this.isAuthenticated) return;
     this.actionLoading = true;
     this.actionError = null;
     console.error("Cannot unfollow: User ID retrieval from username not implemented.");
     alert("Unfollow action requires user ID. Feature needs adjustment.");
     this.actionLoading = false;
     return; // Placeholder return

     // Example if ID was available (e.g., this.profile.id):
    // this.userService.unfollowUser(this.profile.id)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: () => {
    //       this.isFollowing = false;
    //       // Optionally update follower count visually (or reload profile)
    //       if(this.profile) this.profile.followersCount--;
    //       this.actionLoading = false;
    //     },
    //     error: (err) => {
    //       this.actionError = `Unfollow failed: ${err.message}`;
    //       this.actionLoading = false;
    //     }
    //   });
  }

  block(): void {
      if (!this.profile || this.isOwnProfile || !this.isAuthenticated) return;
      this.actionLoading = true;
      this.actionError = null;
      console.error("Cannot block: User ID retrieval from username not implemented.");
      alert("Block action requires user ID. Feature needs adjustment.");
      this.actionLoading = false;
      return; // Placeholder return

      // Example if ID was available (e.g., this.profile.id):
    //   this.userService.blockUser(this.profile.id)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //       next: (message) => {
    //            console.log(message);
    //            this.isBlocked = true;
    //            this.isFollowing = false; // Blocking usually unfollows
    //            this.actionLoading = false;
    //            // Optionally update UI further
    //       },
    //       error: (err) => {
    //           this.actionError = `Block failed: ${err.message}`;
    //           this.actionLoading = false;
    //       }
    //   });
  }

   unblock(): void {
       if (!this.profile || this.isOwnProfile || !this.isAuthenticated) return;
       this.actionLoading = true;
       this.actionError = null;
       console.error("Cannot unblock: User ID retrieval from username not implemented.");
       alert("Unblock action requires user ID. Feature needs adjustment.");
       this.actionLoading = false;
       return; // Placeholder return

       // Example if ID was available (e.g., this.profile.id):
    //    this.userService.unblockUser(this.profile.id)
    //    .pipe(takeUntil(this.destroy$))
    //    .subscribe({
    //        next: (message) => {
    //             console.log(message);
    //             this.isBlocked = false;
    //             this.actionLoading = false;
    //        },
    //        error: (err) => {
    //            this.actionError = `Unblock failed: ${err.message}`;
    //            this.actionLoading = false;
    //        }
    //    });
   }


   // Helper to construct full image URL
   getImageUrl(imagePath: string | undefined): string {
        if (!imagePath || imagePath.endsWith("null.jpg")) { // Check for explicit null marker if backend does that
            return 'assets/placeholder-profile.png'; // Provide a placeholder profile image
        }
        // Assuming backend serves images relative to its root
        if (imagePath.startsWith('/')) {
            // Check if it already includes the domain (might happen if stored differently)
            if (imagePath.startsWith(environment.apiUrl)) {
                return imagePath;
            }
            return `${environment.apiUrl}${imagePath}`;
        }
        return imagePath; // Assume full URL if not starting with /
    }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.profileUsername$.complete();
  }
}