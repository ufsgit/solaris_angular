import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetadataService } from '../../../core/services/metadata.service';
import { FollowupService } from '../../../core/services/followup.service';
import { AuthService } from '../../../core/services/auth.service';
import { SearchLeadItem } from '../../../core/models/lead.models';
import { WorkingStatusItem, UserDetailItem } from '../../../core/models/auth.models';
import {
  CustomFieldDefinition,
  CustomFieldValuePayload
} from '../../../core/models/custom-field.models';
import { AudioFileAttachment, SaveFollowupRequest } from '../../../core/models/followup.models';
import { DynamicCustomFieldsComponent } from '../../../shared/components/dynamic-custom-fields/dynamic-custom-fields.component';

@Component({
  selector: 'app-followup-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicCustomFieldsComponent],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 class="text-base font-bold text-slate-800">
              Add Follow-up & Progression
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Customer: <strong class="text-indigo-600">{{ lead.customerName || lead.Customer_Name }}</strong>
              (ID: #{{ customerId }})
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
        <div class="p-6 overflow-y-auto space-y-5 flex-1">
          @if (errorMessage()) {
            <div class="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {{ errorMessage() }}
            </div>
          }

          <!-- Grid: Status & Next Followup Date -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                New Status <span class="text-rose-500">*</span>
              </label>
              <select
                [(ngModel)]="selectedStatusId"
                (ngModelChange)="onStatusChange($event)"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option [value]="0">-- Choose Status --</option>
                @for (status of statuses(); track status.Status_Id) {
                  <option [value]="status.Status_Id">{{ status.Status_Name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Next Follow-up Date <span class="text-rose-500">*</span>
              </label>
              <input
                type="date"
                [(ngModel)]="nextFollowUpDate"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <!-- Time & Deal Amount -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Follow-up Time
              </label>
              <input
                type="time"
                [(ngModel)]="followupTime"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Expected Amount / Value (₹)
              </label>
              <input
                type="number"
                [(ngModel)]="amount"
                placeholder="e.g. 350000"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <!-- Reassign To User -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Assign Follow-up To Executive <span class="text-rose-500">*</span>
            </label>
            <select
              [(ngModel)]="toUserId"
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            >
              @for (user of users(); track user.User_Details_Id) {
                <option [value]="user.User_Details_Id">
                  {{ user.User_Details_Name }} ({{ user.Department_Name || 'General' }})
                </option>
              }
            </select>
          </div>

          <!-- Dynamic Custom Fields Section for this Status -->
          @if (customFields().length > 0) {
            <div class="pt-2 border-t border-slate-200">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status Custom Fields
                </h3>
                <span class="text-[11px] text-indigo-600 font-medium">Required for this stage</span>
              </div>
              <app-dynamic-custom-fields
                #customFieldsComp
                [fields]="customFields()"
                (valuesChange)="onCustomFieldsChanged($event)"
              />
            </div>
          }

          <!-- Remarks / Notes -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Follow-up Remarks / Client Feedback <span class="text-rose-500">*</span>
            </label>
            <textarea
              [(ngModel)]="remark"
              rows="3"
              placeholder="Provide a detailed update about this customer interaction..."
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
            ></textarea>
          </div>

          <!-- Audio Note Attachment -->
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <label class="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Voice Note / Audio Call Recording</span>
              <span class="text-[11px] text-slate-400">Optional</span>
            </label>
            <div class="flex items-center gap-3">
              <input
                type="file"
                accept="audio/*"
                (change)="onAudioSelected($event)"
                class="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              @if (audioFiles.length > 0) {
                <span class="text-xs text-emerald-600 font-medium">
                  ✓ {{ audioFiles[0].File_Name }}
                </span>
              }
            </div>
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
            (click)="submitFollowup()"
            [disabled]="isSaving() || !selectedStatusId || !remark.trim()"
            class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            @if (isSaving()) {
              <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span>Saving...</span>
            } @else {
              <span>Save Follow-up</span>
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class FollowupModalComponent implements OnInit {
  @Input({ required: true }) lead!: SearchLeadItem;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('customFieldsComp') customFieldsComp?: DynamicCustomFieldsComponent;

  private metadataService = inject(MetadataService);
  private followupService = inject(FollowupService);
  private authService = inject(AuthService);

  statuses = signal<WorkingStatusItem[]>([]);
  users = signal<UserDetailItem[]>([]);
  customFields = signal<CustomFieldDefinition[]>([]);

  selectedStatusId: number = 0;
  nextFollowUpDate: string = '';
  followupTime: string = '11:00';
  amount: number = 0;
  toUserId: number = 0;
  remark: string = '';
  audioFiles: AudioFileAttachment[] = [];
  serializedCustomFields: CustomFieldValuePayload[] = [];

  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  get customerId(): number {
    return this.lead.customerId ?? this.lead.Customer_Id ?? 0;
  }

  ngOnInit(): void {
    // Set default date to +2 days
    const d = new Date();
    d.setDate(d.getDate() + 2);
    this.nextFollowUpDate = d.toISOString().split('T')[0];

    this.toUserId = this.lead.toUserId ?? this.lead.To_User_Id ?? this.authService.currentUserId();
    this.amount = this.lead.projectCost ?? this.lead.Project_Cost ?? 0;
    this.selectedStatusId = this.lead.statusId ?? this.lead.Status_Id ?? 0;

    this.loadStatuses();
    this.loadUsers();

    if (this.selectedStatusId > 0) {
      this.loadCustomFieldsForStatus(this.selectedStatusId);
    }
  }

  private loadStatuses(): void {
    this.metadataService.getWorkingStatusList().subscribe({
      next: (list) => this.statuses.set(list),
      error: () => {}
    });
  }

  private loadUsers(): void {
    this.metadataService.getUsers().subscribe({
      next: (list) => {
        this.users.set(list);
        if (!this.toUserId && list.length > 0) {
          this.toUserId = list[0].User_Details_Id;
        }
      },
      error: () => {}
    });
  }

  onStatusChange(statusId: number): void {
    if (statusId > 0) {
      this.loadCustomFieldsForStatus(statusId);
    } else {
      this.customFields.set([]);
    }
  }

  private loadCustomFieldsForStatus(statusId: number): void {
    this.metadataService.getCustomFieldsOnStatusChange(statusId, this.customerId).subscribe({
      next: (fields) => this.customFields.set(fields),
      error: () => this.customFields.set([])
    });
  }

  onCustomFieldsChanged(vals: CustomFieldValuePayload[]): void {
    this.serializedCustomFields = vals;
  }

  onAudioSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.audioFiles = [
          {
            File_Path: reader.result as string,
            File_Name: file.name,
            File_Type: file.type || 'audio/mp3'
          }
        ];
      };
      reader.readAsDataURL(file);
    }
  }

  submitFollowup(): void {
    if (!this.selectedStatusId) {
      this.errorMessage.set('Please select a status.');
      return;
    }
    if (!this.remark.trim()) {
      this.errorMessage.set('Please enter followup remarks.');
      return;
    }

    if (this.customFieldsComp && !this.customFieldsComp.isValid()) {
      this.errorMessage.set('Please complete all mandatory custom fields.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const currentUser = this.authService.currentUser();
    const selectedStatus = this.statuses().find((s) => s.Status_Id == this.selectedStatusId);
    const assignedUser = this.users().find((u) => u.User_Details_Id == this.toUserId);

    const payload: SaveFollowupRequest = {
      Customer_Id: this.customerId,
      FollowUp: {
        FollowUp_Id: 0,
        Status_Id: Number(this.selectedStatusId),
        Status_Name: selectedStatus?.Status_Name || 'Updated Status',
        Next_FollowUp_date: this.nextFollowUpDate,
        By_User_Id: this.authService.currentUserId(),
        By_User_Name: this.authService.currentUserName(),
        To_User_Id: Number(this.toUserId),
        To_User_Name: assignedUser?.User_Details_Name || 'Executive',
        Branch_Id: currentUser?.Branch_Id ?? 1,
        Branch_Name: currentUser?.Branch_Name ?? 'Head Office',
        Department_Id: currentUser?.Department_Id ?? 2,
        Department_Name: currentUser?.Department_Name ?? 'Sales',
        Remark: this.remark.trim(),
        Followup_Time: this.followupTime,
        Transfer_Status_Id: '0',
        Transfer_Status_Name: '',
        amount: this.amount.toString(),
        Audio_Files: this.audioFiles,
        customFields: this.customFieldsComp ? this.customFieldsComp.getSerializedValues() : []
      }
    };

    this.followupService.saveFollowup(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to save follow-up. Please try again.'
        );
      }
    });
  }
}

