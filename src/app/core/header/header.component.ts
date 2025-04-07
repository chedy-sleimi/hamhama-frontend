import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false, // Keep if not using standalone components feature widely
  templateUrl: './header.component.html',
  // No styleUrl needed anymore
})
export class HeaderComponent implements OnInit {
  currentUser$: Observable<any>; // Adjust type if UserInfo is defined
  isAdmin$: Observable<boolean>;
  mobileMenuOpen = false; // For mobile menu toggle

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser;
    this.isAdmin$ = this.currentUser$.pipe(
        map(user => !!user && user.roles.includes('ROLE_ADMIN'))
    );
  }

  ngOnInit(): void {}

  logout(): void {
    this.authService.logout();
  }
}