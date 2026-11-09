import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyConfigService } from '../../../core/services/company-config.service';

@Component({
  selector: 'app-company-code',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <!-- Background decorative gradients -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative z-10 border border-slate-100">
        <!-- Logo / Brand Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30 mb-4">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Solaris CRM</h1>
          <p class="text-sm text-slate-500 mt-1">Multi-Tenant Cloud Enterprise Suite</p>
        </div>

        <div class="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 mb-6">
          <h2 class="text-xs font-semibold uppercase text-indigo-900 tracking-wider">Step 1: Tenant Resolution</h2>
          <p class="text-xs text-indigo-700 mt-1">
            Enter your organization or company code to connect to your dedicated cloud instance.
          </p>
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
            <label for="companyCode" class="block text-xs font-semibold text-slate-700 mb-1.5">
              Company Code
            </label>
            <div class="relative">
              <input
                id="companyCode"
                name="companyCode"
                type="text"
                [(ngModel)]="companyCode"
                required
                autocomplete="organization"
                placeholder="e.g. solaris, trackbox, vidyanexis"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                [disabled]="isLoading()"
              />
              <span class="absolute right-3 top-2.5 text-slate-400 text-xs font-mono">.ufstech</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1.5">
              Example defaults: <button type="button" (click)="setPreset('solaris')" class="text-indigo-600 font-medium hover:underline">solaris</button>,
              <button type="button" (click)="setPreset('trackbox')" class="text-indigo-600 font-medium hover:underline">trackbox</button>
            </p>
          </div>

          <button
            type="submit"
            [disabled]="isLoading() || !companyCode.trim()"
            class="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            @if (isLoading()) {
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span>Resolving Tenant Endpoint...</span>
            } @else {
              <span>Continue to Login →</span>
            }
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-100 text-center">
          <p class="text-xs text-slate-400">
            Powered by Angular 17+ Modern Architecture • Zero WASM Overhead
          </p>
        </div>
      </div>
    </div>
  `
})
export class CompanyCodeComponent {
  private companyConfig = inject(CompanyConfigService);
  private router = inject(Router);

  companyCode = this.companyConfig.companyCode() ?? 'solaris';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  setPreset(code: string): void {
    this.companyCode = code;
  }

  onSubmit(): void {
    if (!this.companyCode.trim()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.companyConfig.resolveCompanyUrl(this.companyCode).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Could not resolve company URL. Please verify your company code.'
        );
      }
    });
  }
}

