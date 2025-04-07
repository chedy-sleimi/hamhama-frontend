// src/app/user/profile-edit/profile-edit.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UserUpdateData } from '../user.service';
import { AuthService } from '../../core/auth.service';
import { UserProfile } from '../../models/user.model';
import { Subject, takeUntil, catchError, of, tap, finalize, switchMap } from 'rxjs';
import { Location } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile-edit',
  standalone: false,
  templateUrl: './profile-edit.component.html',
})
export class ProfileEditComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup; // Initialize in ngOnInit after fetching data
  loading = true;
  saving = false;
  savingPrivacy = false;
  deletingPicture = false;
  submitted = false;
  error: string | null = null;
  privacyError: string | null = null;
  pictureError: string | null = null;
  successMessage: string | null = null;

  profilePicturePreview: string | null = null;
  selectedFile: File | null = null;
  isDefaultPlaceholder = true;
  initialPrivacyValue: boolean | null = null;
  currentUserId: number | null = null; // Store the current user's ID


  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = null;
    this.authService.currentUser.pipe(
        takeUntil(this.destroy$),
        tap(user => {
             // Fetch user ID if needed for updateUser call later
             // Assuming backend allows self-update without ID in path
             // Or we need a way to get the ID if the service method requires it.
             // For now, assume updateUser doesn't strictly need ID passed if it's a self-update.
        }),
        switchMap(() => this.userService.getMyProfile()), // Fetch profile data
        catchError(err => {
             this.error = `Failed to load profile: ${err.message}`;
             this.loading = false;
             return of(null);
        })
    ).subscribe(profile => {
        if (profile) {
            this.initializeForm(profile);
            this.profilePicturePreview = this.getImageUrl(profile.profilePictureUrl);
            this.isDefaultPlaceholder = !profile.profilePictureUrl || profile.profilePictureUrl.endsWith("null.jpg");
            this.initialPrivacyValue = profile.isPrivate ?? false; // Store initial privacy
        }
        this.loading = false;
    });
  }

   initializeForm(profile: UserProfile): void {
     this.profileForm = this.fb.group({
       // Use profile data to initialize
       username: [profile.username, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
       email: [profile.email, [Validators.required, Validators.email, Validators.maxLength(100)]],
       isPrivate: [profile.isPrivate ?? false] // Initialize privacy control
       // Add other controls
     });
   }


  // Convenience getter
  get f() { return this.profileForm.controls; }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
       // Basic validation (type, size)
       if (!file.type.startsWith('image/jpeg')) {
           this.pictureError = "Only JPG images are allowed.";
           this.selectedFile = null;
           return;
       }
       if (file.size > 5 * 1024 * 1024) { // 5MB
            this.pictureError = "File size exceeds 5MB limit.";
            this.selectedFile = null;
            return;
       }

      this.selectedFile = file;
      this.pictureError = null;

      // Generate preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicturePreview = e.target.result;
        this.isDefaultPlaceholder = false;
      };
      reader.readAsDataURL(file);

      // Immediately upload or wait for main form save? Let's upload immediately.
      this.uploadProfilePicture();
    }
  }

  uploadProfilePicture(): void {
      if (!this.selectedFile) {
          this.pictureError = "No file selected to upload.";
          return;
      }
      this.saving = true; // Use general saving flag or a specific one
      this.pictureError = null;
      this.userService.updateMyProfilePicture(this.selectedFile)
         .pipe(
             takeUntil(this.destroy$),
             finalize(() => this.saving = false)
         )
         .subscribe({
              next: (message) => {
                  this.successMessage = message;
                  this.selectedFile = null; // Clear selection after upload
                  // Preview is already updated
              },
              error: (err) => {
                   this.pictureError = `Upload failed: ${err.message}`;
                   // Optionally reset preview if upload fails?
                   // this.profilePicturePreview = this.getImageUrl(this.profile?.profilePictureUrl);
              }
         });
  }

   deleteProfilePicture(): void {
       if (!confirm("Are you sure you want to delete your profile picture?")) return;

       this.deletingPicture = true;
       this.pictureError = null;
       this.userService.deleteMyProfilePicture()
           .pipe(
               takeUntil(this.destroy$),
               finalize(() => this.deletingPicture = false)
           )
           .subscribe({
               next: (message) => {
                   this.successMessage = message;
                   this.profilePicturePreview = 'assets/placeholder-profile.png'; // Reset preview
                   this.isDefaultPlaceholder = true;
                   this.selectedFile = null;
               },
               error: (err) => {
                   this.pictureError = `Delete failed: ${err.message}`;
               }
           });
   }


  onSubmit(): void {
    this.submitted = true;
    this.error = null;
    this.successMessage = null;

    if (this.profileForm.invalid) {
      return;
    }

     if (!this.profileForm.dirty) {
        this.error = "No changes detected in profile details.";
        return; // Don't submit if nothing changed
    }


    this.saving = true;
    const formData: UserUpdateData = {
        // Only include fields that are meant to be updated via this form
        username: this.f['username'].value,
        email: this.f['email'].value,
    };

    // Assuming the backend uses the authenticated user context for self-update
    // Pass ID if service/backend requires it explicitly for self-update
    this.userService.updateUser(0, formData) // Pass 0 or null if backend identifies user from token
      .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.saving = false)
       )
      .subscribe({
        next: (updatedUser) => {
           this.successMessage = 'Profile details updated successfully!';
           this.profileForm.markAsPristine(); // Mark as not dirty after successful save
           this.submitted = false;
           // Optionally update local auth state if username changed
           // this.authService.updateLocalUser({ username: updatedUser.username });
        },
        error: (err) => {
          this.error = `Failed to update profile: ${err.message}`;
        }
      });
  }

   updatePrivacy(): void {
       const currentPrivacyValue = this.f['isPrivate'].value;
       if (currentPrivacyValue === this.initialPrivacyValue) {
           this.privacyError = "Privacy setting hasn't changed.";
           return;
       }

       this.savingPrivacy = true;
       this.privacyError = null;
       this.successMessage = null;

       this.userService.updateMyPrivacySetting(currentPrivacyValue)
           .pipe(
               takeUntil(this.destroy$),
               finalize(() => this.savingPrivacy = false)
           )
           .subscribe({
               next: (message) => {
                   this.successMessage = message;
                   this.initialPrivacyValue = currentPrivacyValue; // Update initial value on success
               },
               error: (err) => {
                   this.privacyError = `Failed to update privacy: ${err.message}`;
                    // Revert radio button visually on error?
                    this.profileForm.patchValue({ isPrivate: this.initialPrivacyValue });
               }
           });
   }

  cancel(): void {
    this.location.back();
  }

   // Helper to construct full image URL
   getImageUrl(imagePath: string | undefined | null): string {
    if (!imagePath || imagePath.endsWith("null.jpg")) {
        return 'assets/placeholder-profile.png'; // Placeholder
    }
    if (imagePath.startsWith('/')) {
         if (imagePath.startsWith(environment.apiUrl)) {
             return imagePath;
         }
        return `${environment.apiUrl}${imagePath}`;
    }
    return imagePath;
    }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}