import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, UserSession } from '../models/auth.models';

const STORAGE_KEY_TOKEN = 'auth_token';
const STORAGE_KEY_USER = 'auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(this.getStoredToken());
  private _currentUser = signal<UserSession | null>(this.getStoredUser());

  readonly token = this._token.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._currentUser()?.User_Type_Id === 1);
  readonly currentUserId = computed(() => this._currentUser()?.User_Details_Id ?? 0);
  readonly currentUserName = computed(() => this._currentUser()?.User_Details_Name ?? 'User');
  readonly currentBranchId = computed(() => this._currentUser()?.Branch_Id ?? 0);
  readonly currentDepartmentId = computed(() => this._currentUser()?.Department_Id ?? 0);

  private getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  private getStoredUser(): UserSession | null {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  login(credentials: LoginRequest): Observable<any> {
    // Relative path handled by api.interceptor
    return this.http.post<any>('Login/Login_Check', credentials).pipe(
      tap((res) => {
        // Handle array response or object response
        const userPayload: UserSession = Array.isArray(res) ? res[0] : res;
        if (userPayload && (userPayload.token || userPayload.User_Details_Id)) {
          this.setSession(userPayload);
        }
      })
    );
  }

  setSession(session: UserSession): void {
    const token = session.token || 'authenticated-session-token';
    const completeSession: UserSession = {
      ...session,
      token
    };

    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(completeSession));

    this._token.set(token);
    this._currentUser.set(completeSession);
  }

  logout(redirect: boolean = true): void {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    this._token.set(null);
    this._currentUser.set(null);

    if (redirect) {
      this.router.navigate(['/login']);
    }
  }
}

