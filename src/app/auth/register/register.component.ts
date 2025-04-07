// src/app/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: false,
  styleUrls: ['./register.component.scss'] // Shared styles or specific ones
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
     // Redirect to home if already logged in
     if (this.authService.currentUserValue) {
        this.router.navigate(['/']);
      }

    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {}

  // Convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.error = null;
    this.successMessage = null;

    // Stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.register({
        username: this.f['username'].value,
        email: this.f['email'].value,
        password: this.f['password'].value
    })
      .pipe(first())
      .subscribe({
        next: (message) => {
          this.successMessage = message || 'Registration successful! Please log in.'; // Use message from backend
          this.loading = false;
          this.registerForm.reset();
          this.submitted = false; // Reset submitted flag after success
          // Optionally redirect after a delay
          // setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        },
        error: error => {
          this.error = error.message || 'Registration failed. Please try again.'; // Use error message from AuthService handler
          this.loading = false;
        }
      });
  }
}