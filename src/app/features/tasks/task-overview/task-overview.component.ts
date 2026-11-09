import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { MetadataService } from '../../../core/services/metadata.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskOverviewItem } from '../../../core/models/task.models';
import { UserDetailItem } from '../../../core/models/auth.models';
import { TaskStatusModalComponent } from '../task-status-modal/task-status-modal.component';
import { TaskCreateModalComponent } from '../task-create-modal/task-create-modal.component';

@Component({
  selector: 'app-task-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TaskStatusModalComponent,
    TaskCreateModalComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Title & Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Daily Tasks & Process Flow Engine
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Automated process progression, milestone tracking, and task delegation.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="loadTasks()"
            [disabled]="isLoading()"
            class="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <svg
              class="w-3.5 h-3.5 text-slate-500"
              [class.animate-spin]="isLoading()"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Tasks</span>
          </button>

          <button
            type="button"
            (click)="openCreateTaskModal()"
            class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Task</span>
          </button>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Date Range -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500">From:</span>
            <input
              type="date"
              [(ngModel)]="fromDate"
              (ngModelChange)="loadTasks()"
              class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500">To:</span>
            <input
              type="date"
              [(ngModel)]="toDate"
              (ngModelChange)="loadTasks()"
              class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <!-- User Selector -->
          @if (auth.isAdmin()) {
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500">Assignee:</span>
              <select
                [(ngModel)]="selectedUserId"
                (ngModelChange)="loadTasks()"
                class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option [value]="0">All Users (Admin View)</option>
                @for (u of users(); track u.User_Details_Id) {
                  <option [value]="u.User_Details_Id">{{ u.User_Details_Name }}</option>
                }
              </select>
            </div>
          }
        </div>

        <div class="text-xs text-slate-500">
          Total Assigned Tasks: <strong class="text-slate-900">{{ tasks().length }}</strong>
        </div>
      </div>

      <!-- Task Cards Grid -->
      @if (isLoading()) {
        <div class="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p class="text-xs text-slate-500">Loading daily tasks queue...</p>
        </div>
      } @else if (tasks().length === 0) {
        <div class="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div class="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
            ✓
          </div>
          <h3 class="text-sm font-bold text-slate-800">No Tasks Scheduled</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            All tasks for this period have either been cleared or not yet scheduled.
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (task of tasks(); track task.Task_Id) {
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
              <div>
                <!-- Top Badge & Date -->
                <div class="flex items-center justify-between mb-3">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {{ task.Task_Type_Name }}
                  </span>
                  <span class="text-xs text-slate-400 font-mono">
                    {{ task.Task_Date }} {{ task.Task_Time }}
                  </span>
                </div>

                <!-- Customer Details -->
                <h3 class="text-sm font-bold text-slate-900 mb-1">
                  {{ task.Customer_Name }}
                </h3>
                <p class="text-xs text-slate-500 mb-3 line-clamp-2">
                  {{ task.Description }}
                </p>

                <!-- Status pill -->
                <div class="flex items-center gap-2 mb-4">
                  <span class="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    {{ task.Task_Status_Name || 'Pending' }}
                  </span>
                  @if (task.User_Details_Name || task.Assigned_User_Name) {
                    <span class="text-[11px] text-slate-400 truncate">
                      👤 {{ task.User_Details_Name || task.Assigned_User_Name }}
                    </span>
                  }
                </div>
              </div>

              <!-- Footer with Trigger Process Flow Button -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] text-slate-400">ID: #{{ task.Task_Id }}</span>
                <button
                  type="button"
                  (click)="openStatusModal(task)"
                  class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <span>Progression & Flow ⚡</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modals -->
      @if (selectedTaskForStatus()) {
        <app-task-status-modal
          [task]="selectedTaskForStatus()!"
          (close)="selectedTaskForStatus.set(null)"
          (committed)="onTaskStatusCommitted()"
        />
      }

      @if (showCreateTaskModal()) {
        <app-task-create-modal
          [customerId]="1204"
          customerName="General Client"
          (close)="showCreateTaskModal.set(false)"
          (created)="onTaskCreated()"
        />
      }
    </div>
  `
})
export class TaskOverviewComponent implements OnInit {
  private taskService = inject(TaskService);
  private metadataService = inject(MetadataService);
  auth = inject(AuthService);

  tasks = signal<TaskOverviewItem[]>([]);
  users = signal<UserDetailItem[]>([]);
  isLoading = signal(false);

  fromDate = '';
  toDate = '';
  selectedUserId: number = 0;

  selectedTaskForStatus = signal<TaskOverviewItem | null>(null);
  showCreateTaskModal = signal(false);

  ngOnInit(): void {
    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 7);

    this.fromDate = today.toISOString().split('T')[0];
    this.toDate = future.toISOString().split('T')[0];
    this.selectedUserId = this.auth.currentUserId();

    this.loadUsers();
    this.loadTasks();
  }

  private loadUsers(): void {
    this.metadataService.getUsers().subscribe({
      next: (list) => this.users.set(list)
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    const uid = this.selectedUserId > 0 ? this.selectedUserId : undefined;

    this.taskService.getTaskOverview(this.fromDate, this.toDate, uid).subscribe({
      next: (items) => {
        this.isLoading.set(false);
        this.tasks.set(items);
      },
      error: () => {
        this.isLoading.set(false);
        this.tasks.set([]);
      }
    });
  }

  openStatusModal(task: TaskOverviewItem): void {
    this.selectedTaskForStatus.set(task);
  }

  openCreateTaskModal(): void {
    this.showCreateTaskModal.set(true);
  }

  onTaskStatusCommitted(): void {
    this.loadTasks();
  }

  onTaskCreated(): void {
    this.loadTasks();
  }
}

