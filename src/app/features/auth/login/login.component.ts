import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyConfigService } from '../../../core/services/company-config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <!-- Background glow -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative z-10 border border-slate-100">
        <!-- Logo / Brand Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30 mb-3">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">CRM Sign In</h1>
          
          <!-- Tenant Active Badge -->
          <div class="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tenant: <strong>{{ companyConfig.companyCode() }}</strong></span>
            <button
              type="button"
              (click)="changeCompany()"
              class="ml-1 text-[11px] underline text-indigo-500 hover:text-indigo-800"
            >
              (Change)
            </button>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="p-3 mb-5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="userName" class="block text-xs font-semibold text-slate-700 mb-1.5">
              Username / Email
            </label>
            <input
              id="userName"
              name="userName"
              type="text"
              [(ngModel)]="userName"
              required
              autocomplete="username"
              placeholder="e.g. admin or employee"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              [disabled]="isLoading()"
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              [(ngModel)]="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              [disabled]="isLoading()"
            />
          </div>

          <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span>Remember me</span>
            </label>
            <span class="text-slate-400">Secure API Authentication</span>
          </div>

          <button
            type="submit"
            [disabled]="isLoading() || !userName.trim() || !password.trim()"
            class="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            @if (isLoading()) {
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span>Authenticating...</span>
            } @else {
              <span>Sign In to CRM</span>
            }
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2">
          <p class="text-[11px] text-slate-400 text-center">
            Resolved Server: <code class="text-indigo-600 font-mono text-[10px]">{{ companyConfig.baseUrl() }}</code>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  companyConfig = inject(CompanyConfigService);
  private router = inject(Router);

  userName = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  changeCompany(): void {
    this.companyConfig.clearCompanyConfig();
    this.router.navigate(['/company-code']);
  }

  onSubmit(): void {
    if (!this.userName.trim() || !this.password.trim()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({
      userName: this.userName.trim(),
      password: this.password.trim()
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.router.navigate(['/leads']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Invalid credentials or connection error. Please try again.'
        );
      }
    });
  }
}

