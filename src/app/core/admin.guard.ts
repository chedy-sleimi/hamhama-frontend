// src/app/core/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    } else {
      console.log('AdminGuard: User is not an admin, redirecting.');
      // Redirect to home or unauthorized page
      return this.router.createUrlTree(['/recipes']); // Redirect to recipes list for non-admins
    }
  }
}