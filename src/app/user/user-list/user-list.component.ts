// src/app/user/user-list/user-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../user.service';
import { User } from '../../models/user.model';
import { Subject, takeUntil, catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = true;
  error: string | null = null;
  deletingUserId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    this.userService.getAllUsers()
      .pipe(
          takeUntil(this.destroy$),
          tap(() => this.loading = false),
          catchError(err => {
              this.error = `Failed to load users: ${err.message}`;
              this.loading = false;
              return of([]);
          })
      )
      .subscribe(users => {
          this.users = users;
      });
  }

  deleteUser(id: number): void {
      if (!confirm(`Are you sure you want to delete user ID ${id}? This action cannot be undone.`)) {
          return;
      }
      this.deletingUserId = id;
      this.error = null; // Clear previous errors
      this.userService.deleteUser(id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
              next: () => {
                  this.deletingUserId = null;
                  this.loadUsers(); // Refresh the list
              },
              error: (err) => {
                  this.error = `Failed to delete user ${id}: ${err.message}`;
                  this.deletingUserId = null;
              }
          });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}