import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TaskService } from '../../../core/services/task.service';
import { MetadataService } from '../../../core/services/metadata.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  SearchTaskItem,
  SearchTaskFilterParams,
  SearchTaskResponse,
  TaskOverviewItem
} from '../../../core/models/task.models';
import {
  WorkingStatusItem,
  TaskTypeItem,
  UserDetailItem,
  EnquiryForItem
} from '../../../core/models/auth.models';
import { TaskStatusModalComponent } from '../task-status-modal/task-status-modal.component';
import { TaskCreateModalComponent } from '../task-create-modal/task-create-modal.component';
import { CustomerTasksDrawerComponent } from '../customer-tasks-drawer/customer-tasks-drawer.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TaskStatusModalComponent,
    TaskCreateModalComponent,
    CustomerTasksDrawerComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Search Tasks Pipeline
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Search tasks across customers, filter by scheduled task dates, follow-up milestones, types, and technicians.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="fetchTasks()"
            [disabled]="isLoading()"
            class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1.5"
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
            <span>Refresh</span>
          </button>

          <button
            type="button"
            (click)="openCreateTaskModal()"
            class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Task</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks Found</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">
              {{ totalItems() }}
            </div>
            <div class="text-[11px] text-indigo-600 font-medium mt-0.5">Across Customers</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            ⚡
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Page Records</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">
              {{ tasks().length }}
            </div>
            <div class="text-[11px] text-slate-400 font-medium mt-0.5">Page {{ pageIndex() }} of {{ totalPages() }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            📄
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue Alerts</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">
              {{ overdueCount() }}
            </div>
            <div class="text-[11px] text-rose-600 font-medium mt-0.5">Urgent Intervention</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            ⚠
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Technician Queue</div>
            <div class="text-sm font-bold text-slate-900 mt-1 truncate max-w-[140px]">
              {{ auth.isAdmin() ? 'Global Staff' : auth.currentUserName() }}
            </div>
            <div class="text-[11px] text-emerald-600 font-medium mt-0.5">
              {{ auth.isAdmin() ? 'Administrator Scope' : 'Assigned Technician' }}
            </div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            🔧
          </div>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Debounced Reactive Search Input -->
          <div class="relative flex-1 min-w-[260px]">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              [formControl]="searchInput"
              placeholder="Search by customer name, phone, or consumer #..."
              class="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
            />
          </div>

          <!-- Task Status Filter -->
          <select
            [formControl]="statusFilter"
            class="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
          >
            <option value="0">All Task Statuses</option>
            @for (s of statuses(); track s.Status_Id) {
              <option [value]="s.Status_Id.toString()">{{ s.Status_Name }}</option>
            }
          </select>

          <!-- Task Type Filter -->
          <select
            [formControl]="typeFilter"
            class="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
          >
            <option value="0">All Task Types</option>
            @for (t of taskTypes(); track t.Task_Type_Id) {
              <option [value]="t.Task_Type_Id.toString()">{{ t.Task_Type_Name }}</option>
            }
          </select>

          <!-- Assigned User Filter -->
          @if (auth.isAdmin()) {
            <select
              [formControl]="userFilter"
              class="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
            >
              <option value="0">All Technicians</option>
              @for (u of users(); track u.User_Details_Id) {
                <option [value]="u.User_Details_Id.toString()">{{ u.User_Details_Name }}</option>
              }
            </select>
          }

          <!-- Priority Filter -->
          <select
            [formControl]="priorityFilter"
            class="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
          >
            <option value="0">All Priorities</option>
            <option value="1">High Priority</option>
            <option value="2">Medium Priority</option>
            <option value="3">Low Priority</option>
          </select>

          <!-- Quick Date Toggle Button -->
          <button
            type="button"
            (click)="toggleTaskDateFilter()"
            [class.bg-indigo-600]="isTaskDateFilterActive()"
            [class.text-white]="isTaskDateFilterActive()"
            [class.border-indigo-600]="isTaskDateFilterActive()"
            [class.bg-slate-50]="!isTaskDateFilterActive()"
            [class.text-slate-700]="!isTaskDateFilterActive()"
            class="px-3.5 py-2 border border-slate-300 rounded-xl font-medium text-xs hover:bg-slate-100 transition flex items-center gap-1.5"
          >
            <span>📅 Task Date</span>
            @if (isTaskDateFilterActive()) {
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
            }
          </button>
        </div>

        <!-- Inline Task Date Range Selector -->
        @if (isTaskDateFilterActive()) {
          <div class="flex items-center gap-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
            <span class="font-semibold text-indigo-900">Task Scheduled Range:</span>
            <input
              type="date"
              [(ngModel)]="taskFromDate"
              (ngModelChange)="onDateChange()"
              class="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs"
            />
            <span class="text-indigo-400">to</span>
            <input
              type="date"
              [(ngModel)]="taskToDate"
              (ngModelChange)="onDateChange()"
              class="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs"
            />
          </div>
        }

        <!-- Active Filter Chips Bar -->
        @if (hasActiveFilters()) {
          <div class="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Filters:</span>

            @if (searchInput.value) {
              <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-200">
                Search: "{{ searchInput.value }}"
                <button type="button" (click)="searchInput.setValue('')" class="hover:text-indigo-950 font-bold ml-1">✕</button>
              </span>
            }

            @if (statusFilter.value && statusFilter.value !== '0') {
              <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-200">
                Status: {{ getSelectedStatusName() }}
                <button type="button" (click)="statusFilter.setValue('0')" class="hover:text-indigo-950 font-bold ml-1">✕</button>
              </span>
            }

            @if (typeFilter.value && typeFilter.value !== '0') {
              <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-200">
                Type: {{ getSelectedTypeName() }}
                <button type="button" (click)="typeFilter.setValue('0')" class="hover:text-indigo-950 font-bold ml-1">✕</button>
              </span>
            }

            @if (userFilter.value && userFilter.value !== '0') {
              <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-200">
                Assigned: {{ getSelectedUserName() }}
                <button type="button" (click)="userFilter.setValue('0')" class="hover:text-indigo-950 font-bold ml-1">✕</button>
              </span>
            }

            @if (isTaskDateFilterActive()) {
              <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-200">
                Date: {{ taskFromDate }} → {{ taskToDate }}
                <button type="button" (click)="toggleTaskDateFilter()" class="hover:text-indigo-950 font-bold ml-1">✕</button>
              </span>
            }

            <button
              type="button"
              (click)="clearAllFilters()"
              class="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        }
      </div>

      <!-- Task Table Container -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        @if (isLoading()) {
          <div class="p-12 text-center space-y-3">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            <p class="text-xs text-slate-500">Querying server task records...</p>
          </div>
        } @else if (tasks().length === 0) {
          <div class="p-12 text-center space-y-3">
            <div class="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
              📋
            </div>
            <h3 class="text-sm font-bold text-slate-800">No Tasks Found</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              No matching task records for the current filter criteria. Try resetting filters or schedule a new task.
            </p>
            <button
              type="button"
              (click)="clearAllFilters()"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
            >
              Reset Filters
            </button>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th class="py-3 px-4">Task Type & ID</th>
                  <th class="py-3 px-4">Customer Details</th>
                  <th class="py-3 px-4">Scheduled Date & Time</th>
                  <th class="py-3 px-4">Assigned Technician</th>
                  <th class="py-3 px-4">Priority / Status</th>
                  <th class="py-3 px-4">Location</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
                @for (task of tasks(); track task.Task_Id) {
                  <tr class="hover:bg-slate-50/70 transition">
                    <!-- Task Type & ID -->
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-900 text-sm">
                        {{ task.Task_Type_Name }}
                      </div>
                      <div class="text-[11px] text-indigo-600 font-mono mt-0.5">
                        Task #{{ task.Task_Id }}
                      </div>
                    </td>

                    <!-- Customer Details -->
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-900">
                        {{ task.Customer_Name }}
                      </div>
                      <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <span>{{ task.Mobile || task.Phone_Number || '—' }}</span>
                        @if (task.Consumer_No || task.Consumer_Number) {
                          <span>• Cons: {{ task.Consumer_No || task.Consumer_Number }}</span>
                        }
                      </div>
                    </td>

                    <!-- Scheduled Date & Time -->
                    <td class="py-3.5 px-4">
                      <div class="font-medium text-slate-800">
                        {{ task.Task_Date }}
                      </div>
                      <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                        {{ task.Task_Time || '10:00 AM' }}
                      </div>
                    </td>

                    <!-- Assigned Technician -->
                    <td class="py-3.5 px-4">
                      <div class="font-medium text-slate-800 flex items-center gap-1.5">
                        <span>👤</span>
                        <span>{{ task.To_User_Name || 'Unassigned' }}</span>
                      </div>
                    </td>

                    <!-- Priority & Status -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-1.5 mb-1">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [style.background-color]="(task.Priority_Color || '#6366f1') + '15'"
                          [style.color]="task.Priority_Color || '#4f46e5'"
                        >
                          {{ task.Priority_Name || 'Standard' }}
                        </span>
                        @if (task.Overdue === '1' || task.Overdue === 1) {
                          <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                            OVERDUE
                          </span>
                        }
                      </div>
                      <span class="inline-block text-[11px] font-semibold text-slate-600">
                        {{ task.Task_Status_Name || 'Pending' }}
                      </span>
                    </td>

                    <!-- Location -->
                    <td class="py-3.5 px-4">
                      <div class="text-slate-600 truncate max-w-[130px]" [title]="task.Location || 'Site'">
                        📍 {{ task.Location || 'Site Office' }}
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          (click)="openStatusModal(task)"
                          title="Execute Process Flow & Status Progression"
                          class="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition flex items-center gap-1"
                        >
                          <span>Flow ⚡</span>
                        </button>

                        <button
                          type="button"
                          (click)="openCustomerTasks(task.Customer_Id, task.Customer_Name)"
                          title="View All Customer Tasks"
                          class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            <div>
              Showing items <strong>{{ pageStart() }}</strong> to <strong>{{ pageEnd() }}</strong>
              of <strong>{{ totalItems() }}</strong>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                [disabled]="pageIndex() === 1"
                (click)="changePage(pageIndex() - 1)"
                class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
              >
                Previous
              </button>
              <span class="px-2 font-bold text-slate-800">Page {{ pageIndex() }} of {{ totalPages() }}</span>
              <button
                type="button"
                [disabled]="pageIndex() >= totalPages() || tasks().length < pageSize()"
                (click)="changePage(pageIndex() + 1)"
                class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
              >
                Next
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Modals & Drawers -->
      @if (selectedTaskForStatus()) {
        <app-task-status-modal
          [task]="selectedTaskForStatus()!"
          (close)="selectedTaskForStatus.set(null)"
          (committed)="onTaskStatusCommitted()"
        />
      }

      @if (showCreateTaskModal()) {
        <app-task-create-modal
          [customerId]="selectedCustomerForTask()?.id || 1204"
          [customerName]="selectedCustomerForTask()?.name || 'Customer'"
          (close)="showCreateTaskModal.set(false)"
          (created)="onTaskCreated()"
        />
      }

      @if (activeDrawerCustomer()) {
        <app-customer-tasks-drawer
          [customerId]="activeDrawerCustomer()!.id"
          [customerName]="activeDrawerCustomer()!.name"
          (close)="activeDrawerCustomer.set(null)"
        />
      }
    </div>
  `
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private metadataService = inject(MetadataService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  private subs = new Subscription();

  // Reactive State
  tasks = signal<SearchTaskItem[]>([]);
  statuses = signal<WorkingStatusItem[]>([]);
  taskTypes = signal<TaskTypeItem[]>([]);
  users = signal<UserDetailItem[]>([]);
  isLoading = signal<boolean>(false);

  totalItems = signal<number>(0);
  totalPages = signal<number>(1);
  pageIndex = signal<number>(1);
  pageSize = signal<number>(20);
  isTaskDateFilterActive = signal<boolean>(false);

  // Form Controls with Debounce
  searchInput = new FormControl('');
  statusFilter = new FormControl('0');
  typeFilter = new FormControl('0');
  userFilter = new FormControl('0');
  priorityFilter = new FormControl('0');

  taskFromDate = '';
  taskToDate = '';

  // Modals
  selectedTaskForStatus = signal<TaskOverviewItem | null>(null);
  showCreateTaskModal = signal(false);
  selectedCustomerForTask = signal<{ id: number; name: string } | null>(null);
  activeDrawerCustomer = signal<{ id: number; name: string } | null>(null);

  hasActiveFilters = computed(() => {
    return (
      !!this.searchInput.value ||
      this.statusFilter.value !== '0' ||
      this.typeFilter.value !== '0' ||
      this.userFilter.value !== '0' ||
      this.priorityFilter.value !== '0' ||
      this.isTaskDateFilterActive()
    );
  });

  pageStart = computed(() => (this.pageIndex() - 1) * this.pageSize() + 1);
  pageEnd = computed(() =>
    Math.min(this.pageIndex() * this.pageSize(), this.totalItems() || this.tasks().length)
  );

  overdueCount = computed(() => {
    return this.tasks().filter((t) => t.Overdue === '1' || t.Overdue === 1).length;
  });

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.taskFromDate = today;
    this.taskToDate = today;

    this.loadDropdowns();
    this.fetchTasks();

    // Debounce search input by 350ms to eliminate redundant network queries
    this.subs.add(
      this.searchInput.valueChanges
        .pipe(debounceTime(350), distinctUntilChanged())
        .subscribe(() => {
          this.pageIndex.set(1);
          this.fetchTasks();
        })
    );

    this.subs.add(
      this.statusFilter.valueChanges.subscribe(() => {
        this.pageIndex.set(1);
        this.fetchTasks();
      })
    );

    this.subs.add(
      this.typeFilter.valueChanges.subscribe(() => {
        this.pageIndex.set(1);
        this.fetchTasks();
      })
    );

    this.subs.add(
      this.userFilter.valueChanges.subscribe(() => {
        this.pageIndex.set(1);
        this.fetchTasks();
      })
    );

    this.subs.add(
      this.priorityFilter.valueChanges.subscribe(() => {
        this.pageIndex.set(1);
        this.fetchTasks();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadDropdowns(): void {
    this.metadataService.getWorkingStatusList().subscribe({
      next: (list) => this.statuses.set(list),
      error: () => {}
    });

    this.metadataService.getTaskTypes().subscribe({
      next: (types) => this.taskTypes.set(types),
      error: () => {}
    });

    this.metadataService.getUsers().subscribe({
      next: (list) => this.users.set(list),
      error: () => {}
    });
  }

  fetchTasks(): void {
    this.isLoading.set(true);

    const assignedUser = this.auth.isAdmin()
      ? this.userFilter.value || '0'
      : this.auth.currentUserId().toString();

    const filters: SearchTaskFilterParams = {
      Customer_Name: this.searchInput.value || '',
      Phone_Number: this.searchInput.value || '',
      Consumer_Number: this.searchInput.value || '',
      Task_Status_Id: this.statusFilter.value || '0',
      Task_Type_Id: this.typeFilter.value || '0',
      To_User: assignedUser,
      Department_Id: '0',
      Enquiry_For_Id: '0',
      Priority_Id_: Number(this.priorityFilter.value) || 0,
      Is_Date: '0',
      Fromdate: '',
      Todate: '',
      Is_Task_Date: this.isTaskDateFilterActive() ? '1' : '0',
      Task_Fromdate: this.isTaskDateFilterActive() ? this.taskFromDate : '',
      Task_Todate: this.isTaskDateFilterActive() ? this.taskToDate : '',
      Customer_Type_Id_: 0,
      Entry_Type_: 0,
      Order_By_: 0,
      Order_Type_: 'DESC',
      Page_Index: this.pageIndex(),
      PageSize: this.pageSize()
    };

    this.taskService.searchTasks(filters).subscribe({
      next: (res: SearchTaskResponse) => {
        this.tasks.set(res.data || []);
        this.totalItems.set(res.metadata.Total_Items || res.data?.length || 0);
        this.totalPages.set(res.metadata.Total_Pages || 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.tasks.set([]);
        this.totalItems.set(0);
        this.totalPages.set(1);
        this.toast.error('Failed to load tasks from server.');
      }
    });
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.pageIndex.set(newPage);
      this.fetchTasks();
    }
  }

  clearAllFilters(): void {
    this.searchInput.setValue('', { emitEvent: false });
    this.statusFilter.setValue('0', { emitEvent: false });
    this.typeFilter.setValue('0', { emitEvent: false });
    this.userFilter.setValue('0', { emitEvent: false });
    this.priorityFilter.setValue('0', { emitEvent: false });
    this.isTaskDateFilterActive.set(false);
    this.pageIndex.set(1);
    this.fetchTasks();
  }

  toggleTaskDateFilter(): void {
    this.isTaskDateFilterActive.update((v) => !v);
    this.pageIndex.set(1);
    this.fetchTasks();
  }

  onDateChange(): void {
    if (this.isTaskDateFilterActive()) {
      this.pageIndex.set(1);
      this.fetchTasks();
    }
  }

  openStatusModal(task: SearchTaskItem): void {
    // Map to TaskOverviewItem format
    const item: TaskOverviewItem = {
      Task_Id: task.Task_Id,
      Customer_Id: task.Customer_Id,
      Customer_Name: task.Customer_Name,
      Phone_Number: task.Mobile || task.Phone_Number,
      Task_Type_Id: task.Task_Type_Id,
      Task_Type_Name: task.Task_Type_Name,
      Task_Status_Id: task.Task_Status_Id,
      Task_Status_Name: task.Task_Status_Name,
      Task_Date: task.Task_Date,
      Task_Time: task.Task_Time,
      Description: task.Description || task.Task_Type_Name,
      Priority_Name: task.Priority_Name,
      Priority_Color: task.Priority_Color,
      Assigned_User_Name: task.To_User_Name,
      Location: task.Location
    };
    this.selectedTaskForStatus.set(item);
  }

  openCreateTaskModal(customerId: number = 1204, customerName: string = 'General Customer'): void {
    this.selectedCustomerForTask.set({ id: customerId, name: customerName });
    this.showCreateTaskModal.set(true);
  }

  openCustomerTasks(customerId: number, customerName: string): void {
    this.activeDrawerCustomer.set({ id: customerId, name: customerName });
  }

  onTaskStatusCommitted(): void {
    this.toast.success('Task status updated and subsequent tasks committed.');
    this.fetchTasks();
  }

  onTaskCreated(): void {
    this.toast.success('New task created successfully.');
    this.fetchTasks();
  }

  getSelectedStatusName(): string {
    const val = this.statusFilter.value;
    const found = this.statuses().find((s) => s.Status_Id.toString() === val);
    return found ? found.Status_Name : val || '';
  }

  getSelectedTypeName(): string {
    const val = this.typeFilter.value;
    const found = this.taskTypes().find((t) => t.Task_Type_Id.toString() === val);
    return found ? found.Task_Type_Name : val || '';
  }

  getSelectedUserName(): string {
    const val = this.userFilter.value;
    const found = this.users().find((u) => u.User_Details_Id.toString() === val);
    return found ? found.User_Details_Name : val || '';
  }
}
