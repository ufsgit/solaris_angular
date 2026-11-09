import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CompanyConfigService } from '../../../core/services/company-config.service';
import { ToastContainerComponent } from '../toast-container/toast-container.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        <!-- Logo & Tenant Info -->
        <div class="p-5 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div class="font-bold text-white tracking-tight leading-tight">Solaris CRM</div>
              <div class="text-[11px] text-indigo-400 font-mono uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {{ companyConfig.companyCode() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <div class="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            CRM Modules
          </div>

          <a
            routerLink="/leads"
            routerLinkActive="bg-indigo-600/20 text-white border-l-4 border-indigo-500 font-semibold"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition group"
          >
            <svg class="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Search Leads</span>
          </a>

          <a
            routerLink="/leads/create"
            routerLinkActive="bg-indigo-600/20 text-white border-l-4 border-indigo-500 font-semibold"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition group"
          >
            <svg class="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Create New Lead</span>
          </a>

          <a
            routerLink="/tasks"
            routerLinkActive="bg-indigo-600/20 text-white border-l-4 border-indigo-500 font-semibold"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition group"
          >
            <svg class="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Search Tasks</span>
          </a>

          <a
            routerLink="/tasks/daily"
            routerLinkActive="bg-indigo-600/20 text-white border-l-4 border-indigo-500 font-semibold"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition group"
          >
            <svg class="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Daily Tasks Overview</span>
          </a>
        </nav>

        <!-- User Session Card in Sidebar -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/40">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {{ auth.currentUserName().substring(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-semibold text-white truncate">
                {{ auth.currentUserName() }}
              </div>
              <div class="text-[11px] text-slate-400 truncate">
                {{ auth.currentUser()?.User_Type_Name || 'Standard User' }}
              </div>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span class="truncate">{{ auth.currentUser()?.Branch_Name || 'Main Branch' }}</span>
            <button
              (click)="auth.logout()"
              class="text-rose-400 hover:text-rose-300 font-medium transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <!-- Top App Bar -->
        <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Cloud</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {{ companyConfig.companyCode() }}
            </span>
            @if (auth.isAdmin()) {
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Administrator
              </span>
            } @else {
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Scoped to {{ auth.currentUser()?.Branch_Name }}
              </span>
            }
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/leads/create"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Lead</span>
            </a>

            <div class="h-4 w-px bg-slate-200 mx-1"></div>

            <button
              (click)="auth.logout()"
              title="Logout"
              class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <!-- Route Body -->
        <main class="flex-1 p-6 md:p-8">
          <router-outlet />
        </main>
      </div>

      <!-- Global Toast Container -->
      <app-toast-container />
    </div>
  `
})
export class LayoutComponent {
  auth = inject(AuthService);
  companyConfig = inject(CompanyConfigService);
}
