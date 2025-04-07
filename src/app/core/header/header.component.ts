// src/app/core/header/header.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser$: Observable<any>; // Adjust type if UserInfo is defined
  isAdmin$: Observable<boolean>;

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