import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../../core/services/task.service';
import { TaskOverviewItem } from '../../../core/models/task.models';

@Component({
  selector: 'app-customer-tasks-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div class="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 class="text-sm font-bold text-slate-800">Customer Task History</h2>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ customerName }} (ID: #{{ customerId }})
            </p>
          </div>
          <button
            type="button"
            (click)="close.emit()"
            class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          @if (isLoading()) {
            <div class="p-8 text-center space-y-2">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
              <p class="text-xs text-slate-500">Retrieving customer tasks...</p>
            </div>
          } @else if (tasks().length === 0) {
            <div class="p-8 text-center space-y-2">
              <div class="w-10 h-10 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-400 text-sm">
                📋
              </div>
              <h4 class="text-xs font-bold text-slate-700">No Associated Tasks</h4>
              <p class="text-[11px] text-slate-400">
                No tasks have been scheduled or completed for this customer yet.
              </p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (task of tasks(); track task.Task_Id) {
                <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {{ task.Task_Type_Name }}
                    </span>
                    <span class="text-[11px] font-mono text-slate-400">
                      {{ task.Task_Date }} {{ task.Task_Time }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-700 font-medium mb-2">
                    {{ task.Description }}
                  </p>

                  <div class="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span class="font-semibold text-indigo-600">
                      {{ task.Task_Status_Name || 'Pending' }}
                    </span>
                    @if (task.User_Details_Name || task.Assigned_User_Name) {
                      <span>👤 {{ task.User_Details_Name || task.Assigned_User_Name }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            (click)="close.emit()"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  `
})
export class CustomerTasksDrawerComponent implements OnInit {
  @Input({ required: true }) customerId!: number;
  @Input() customerName: string = '';
  @Output() close = new EventEmitter<void>();

  private taskService = inject(TaskService);

  tasks = signal<TaskOverviewItem[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    if (this.customerId > 0) {
      this.loadTasks();
    }
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getTasksByCustomer(this.customerId).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        this.tasks.set(data);
      },
      error: () => {
        this.isLoading.set(false);
        this.tasks.set([]);
      }
    });
  }
}

