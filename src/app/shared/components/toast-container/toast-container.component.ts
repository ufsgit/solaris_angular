import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto p-4 rounded-xl shadow-lg border text-xs flex items-start gap-3 transition-all transform duration-200 animate-slide-up"
          [ngClass]="getToastClasses(toast.type)"
        >
          <span class="text-base shrink-0 leading-none mt-0.5">
            {{ getToastIcon(toast.type) }}
          </span>

          <div class="flex-1 min-w-0">
            @if (toast.title) {
              <div class="font-bold mb-0.5">{{ toast.title }}</div>
            }
            <div class="text-[11px] leading-relaxed opacity-90">{{ toast.message }}</div>
          </div>

          <button
            type="button"
            (click)="toastService.dismiss(toast.id)"
            class="text-current opacity-50 hover:opacity-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-900/90 text-white border-emerald-700/60 shadow-emerald-950/20';
      case 'error':
        return 'bg-rose-900/90 text-white border-rose-700/60 shadow-rose-950/20';
      case 'warning':
        return 'bg-amber-900/90 text-white border-amber-700/60 shadow-amber-950/20';
      default:
        return 'bg-slate-900/90 text-white border-slate-700/60 shadow-slate-950/20';
    }
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  }
}

