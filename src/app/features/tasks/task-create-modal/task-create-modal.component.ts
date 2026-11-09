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
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { MetadataService } from '../../../core/services/metadata.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskTypeItem, UserDetailItem } from '../../../core/models/auth.models';
import { SaveTaskRequest } from '../../../core/models/task.models';

@Component({
  selector: 'app-task-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 class="text-base font-bold text-slate-800">
              Create Independent Task
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Customer: <strong class="text-indigo-600">{{ customerName }}</strong> (ID: #{{ customerId }})
            </p>
          </div>
          <button
            type="button"
            (click)="close.emit()"
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition"
          >
            ✕
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          @if (errorMessage()) {
            <div class="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {{ errorMessage() }}
            </div>
          }

          <!-- Task Type & Priority -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Task Type <span class="text-rose-500">*</span>
              </label>
              <select
                [(ngModel)]="taskTypeId"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option [value]="0">-- Select Task Type --</option>
                @for (type of taskTypes(); track type.Task_Type_Id) {
                  <option [value]="type.Task_Type_Id">{{ type.Task_Type_Name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                [(ngModel)]="priorityId"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option [value]="1">High Priority</option>
                <option [value]="2">Medium Priority</option>
                <option [value]="3">Low Priority</option>
              </select>
            </div>
          </div>

          <!-- Date & Time -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Task Scheduled Date <span class="text-rose-500">*</span>
              </label>
              <input
                type="date"
                [(ngModel)]="taskDate"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Time
              </label>
              <input
                type="time"
                [(ngModel)]="taskTime"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <!-- Assign User -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Assign Executive / Engineer <span class="text-rose-500">*</span>
            </label>
            <select
              [(ngModel)]="assignedUserId"
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            >
              @for (user of users(); track user.User_Details_Id) {
                <option [value]="user.User_Details_Id">
                  {{ user.User_Details_Name }} ({{ user.Department_Name || 'General' }})
                </option>
              }
            </select>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Task Scope & Instructions <span class="text-rose-500">*</span>
            </label>
            <textarea
              [(ngModel)]="description"
              rows="3"
              placeholder="Detailed instructions for the assigned engineer..."
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            (click)="close.emit()"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="saveTask()"
            [disabled]="isSaving() || !taskTypeId || !description.trim()"
            class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            @if (isSaving()) {
              <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span>Creating...</span>
            } @else {
              <span>Create Task</span>
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class TaskCreateModalComponent implements OnInit {
  @Input({ required: true }) customerId!: number;
  @Input() customerName: string = '';
  @Input() enquiryForId: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  private taskService = inject(TaskService);
  private metadataService = inject(MetadataService);
  private authService = inject(AuthService);

  taskTypes = signal<TaskTypeItem[]>([]);
  users = signal<UserDetailItem[]>([]);

  taskTypeId: number = 0;
  priorityId: number = 1;
  taskDate: string = new Date().toISOString().split('T')[0];
  taskTime: string = '10:30';
  assignedUserId: number = 0;
  description: string = '';

  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.assignedUserId = this.authService.currentUserId();
    this.loadTaskTypes();
    this.loadUsers();
  }

  private loadTaskTypes(): void {
    this.metadataService.getTaskTypes('', this.enquiryForId).subscribe({
      next: (types) => this.taskTypes.set(types),
      error: () => {}
    });
  }

  private loadUsers(): void {
    this.metadataService.getUsers().subscribe({
      next: (list) => {
        this.users.set(list);
        if (!this.assignedUserId && list.length > 0) {
          this.assignedUserId = list[0].User_Details_Id;
        }
      },
      error: () => {}
    });
  }

  saveTask(): void {
    if (!this.taskTypeId) {
      this.errorMessage.set('Please select a task type.');
      return;
    }
    if (!this.description.trim()) {
      this.errorMessage.set('Please provide instructions for this task.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const selectedType = this.taskTypes().find((t) => t.Task_Type_Id == this.taskTypeId);
    const assignedUser = this.users().find((u) => u.User_Details_Id == this.assignedUserId);

    const payload: SaveTaskRequest = {
      Task_Id: 0,
      Task_Master_Id: 0,
      Customer_Id: this.customerId,
      Task_Type_Id: Number(this.taskTypeId),
      Task_Type_Name: selectedType?.Task_Type_Name || 'General Task',
      Task_Status_Id: 1, // Pending
      Task_Status_Name: 'Pending',
      Created_By: this.authService.currentUserId(),
      Task_Date: this.taskDate,
      Task_Time: this.taskTime,
      Completion_Date: '',
      Completion_Time: '',
      Description: this.description.trim(),
      Priority_Id: Number(this.priorityId),
      Task_user: [
        {
          User_Details_Id: Number(this.assignedUserId),
          User_Details_Name: assignedUser?.User_Details_Name || 'Assigned User'
        }
      ],
      Task_Files: []
    };

    this.taskService.saveTask(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.created.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to create task. Please try again.'
        );
      }
    });
  }
}

