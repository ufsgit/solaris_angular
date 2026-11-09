import {
  Component,
  OnInit,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LeadService } from '../../../core/services/lead.service';
import { MetadataService } from '../../../core/services/metadata.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  EnquiryForItem,
  EnquirySourceItem,
  WorkingStatusItem,
  UserDetailItem
} from '../../../core/models/auth.models';
import {
  CustomFieldDefinition,
  CustomFieldValuePayload
} from '../../../core/models/custom-field.models';
import { SaveLeadRequest } from '../../../core/models/lead.models';
import { DynamicCustomFieldsComponent } from '../../../shared/components/dynamic-custom-fields/dynamic-custom-fields.component';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DynamicCustomFieldsComponent],
  template: `
    <div class="max-w-5xl mx-auto space-y-6 pb-12">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a
            routerLink="/leads"
            class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition"
          >
            ←
          </a>
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {{ isEditMode() ? 'Edit Lead #' + leadId : 'Create New Customer Lead' }}
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Enter customer particulars, product scope, and initial follow-up schedule.
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="onSubmit()"
          [disabled]="isSaving() || !customerName.trim() || !phoneNumber.trim()"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
        >
          @if (isSaving()) {
            <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span>Saving Lead...</span>
          } @else {
            <span>{{ isEditMode() ? 'Update Lead' : 'Save & Ingest Lead' }}</span>
          }
        </button>
      </div>

      @if (errorMessage()) {
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <form (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- 1. Customer Particulars -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Customer Information
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="customerName"
                name="customerName"
                required
                placeholder="e.g. Jane Doe"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone Number <span class="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                [(ngModel)]="phoneNumber"
                name="phoneNumber"
                required
                placeholder="e.g. 9876543210"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                [(ngModel)]="emailAddress"
                name="emailAddress"
                placeholder="e.g. jane@example.com"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <!-- Address & Location -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Address / Street
              </label>
              <input
                type="text"
                [(ngModel)]="address"
                name="address"
                placeholder="e.g. MG Road, Suite 4"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Landmark
              </label>
              <input
                type="text"
                [(ngModel)]="landmark"
                name="landmark"
                placeholder="e.g. Near Metro Pillar 450"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <!-- City, State, District, Pincode -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                [(ngModel)]="city"
                name="city"
                placeholder="Kochi"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                [(ngModel)]="district"
                name="district"
                placeholder="Ernakulam"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                [(ngModel)]="state"
                name="state"
                placeholder="Kerala"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                [(ngModel)]="pincode"
                name="pincode"
                placeholder="682016"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>
        </div>

        <!-- 2. Enquiry Scope & Commercials -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Product & Commercial Details
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Enquiry For (Product) <span class="text-rose-500">*</span>
              </label>
              <select
                [(ngModel)]="enquiryForId"
                name="enquiryForId"
                (ngModelChange)="onEnquiryForChanged($event)"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option [value]="0">-- Select Enquiry Product --</option>
                @for (ef of enquiryForList(); track ef.Enquiry_For_Id) {
                  <option [value]="ef.Enquiry_For_Id">{{ ef.Enquiry_For_Name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Enquiry Source <span class="text-rose-500">*</span>
              </label>
              <select
                [(ngModel)]="enquirySourceId"
                name="enquirySourceId"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option [value]="0">-- Select Source --</option>
                @for (src of enquirySourceList(); track src.Enquiry_Source_Id) {
                  <option [value]="src.Enquiry_Source_Id">{{ src.Enquiry_Source_Name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                [(ngModel)]="priorityId"
                name="priorityId"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option [value]="1">High Priority</option>
                <option [value]="2">Medium Priority</option>
                <option [value]="3">Low Priority</option>
              </select>
            </div>
          </div>

          <!-- Project Cost & Consumer Numbers -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Project Cost (₹)
              </label>
              <input
                type="number"
                [(ngModel)]="projectCost"
                name="projectCost"
                placeholder="350000"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Consumer / Account Number
              </label>
              <input
                type="text"
                [(ngModel)]="consumerNumber"
                name="consumerNumber"
                placeholder="e.g. 1155443322"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Target Work Completion Date
              </label>
              <input
                type="date"
                [(ngModel)]="workCompletionDate"
                name="workCompletionDate"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <!-- Dynamic Custom Fields for Enquiry For -->
          @if (enquiryForCustomFields().length > 0) {
            <div class="pt-4 border-t border-slate-100">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Product Specification Custom Fields
              </h3>
              <app-dynamic-custom-fields
                #enquiryCustomFieldsComp
                [fields]="enquiryForCustomFields()"
              />
            </div>
          }
        </div>

        <!-- 3. Initial Follow-up & Assignment -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Initial Follow-up & Routing
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Lead Initial Status <span class="text-rose-500">*</span>
              </label>
              <select
                [(ngModel)]="statusId"
                name="statusId"
                (ngModelChange)="onStatusChanged($event)"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                <option [value]="0">-- Select Initial Status --</option>
                @for (st of statusList(); track st.Status_Id) {
                  <option [value]="st.Status_Id">{{ st.Status_Name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                First Follow-up Date <span class="text-rose-500">*</span>
              </label>
              <input
                type="date"
                [(ngModel)]="nextFollowUpDate"
                name="nextFollowUpDate"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Assign Executive <span class="text-rose-500">*</span>
              </label>
              <select
                [(ngModel)]="toUserId"
                name="toUserId"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              >
                @for (u of userList(); track u.User_Details_Id) {
                  <option [value]="u.User_Details_Id">
                    {{ u.User_Details_Name }} ({{ u.Department_Name || 'Sales' }})
                  </option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Initial Remarks / Origin Note
            </label>
            <textarea
              [(ngModel)]="remark"
              name="remark"
              rows="3"
              placeholder="e.g. Lead registered via web portal with direct enquiry"
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
            ></textarea>
          </div>

          <!-- Dynamic Custom Fields on Status -->
          @if (statusCustomFields().length > 0) {
            <div class="pt-4 border-t border-slate-100">
              <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Status Specific Fields
              </h3>
              <app-dynamic-custom-fields
                #statusCustomFieldsComp
                [fields]="statusCustomFields()"
              />
            </div>
          }
        </div>
      </form>
    </div>
  `
})
export class LeadFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private leadService = inject(LeadService);
  private metadataService = inject(MetadataService);
  private authService = inject(AuthService);

  @ViewChild('enquiryCustomFieldsComp') enquiryCustomFieldsComp?: DynamicCustomFieldsComponent;
  @ViewChild('statusCustomFieldsComp') statusCustomFieldsComp?: DynamicCustomFieldsComponent;

  isEditMode = signal(false);
  leadId: number = 0;

  // Metadata signals
  enquiryForList = signal<EnquiryForItem[]>([]);
  enquirySourceList = signal<EnquirySourceItem[]>([]);
  statusList = signal<WorkingStatusItem[]>([]);
  userList = signal<UserDetailItem[]>([]);

  // Dynamic Custom Fields
  enquiryForCustomFields = signal<CustomFieldDefinition[]>([]);
  statusCustomFields = signal<CustomFieldDefinition[]>([]);

  // Form Fields
  customerName = '';
  phoneNumber = '';
  emailAddress = '';
  address = '';
  city = 'Kochi';
  district = 'Ernakulam';
  state = 'Kerala';
  pincode = '682016';
  landmark = '';
  latitude = '9.9816';
  longitude = '76.2999';

  enquiryForId: number = 0;
  enquirySourceId: number = 0;
  priorityId: number = 2;
  projectCost: number = 350000;
  consumerNumber = '';
  workCompletionDate = '';

  statusId: number = 0;
  nextFollowUpDate = '';
  toUserId: number = 0;
  remark = 'Lead registered via portal';

  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const today = new Date();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    this.nextFollowUpDate = nextDate.toISOString().split('T')[0];

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    this.workCompletionDate = targetDate.toISOString().split('T')[0];

    this.loadDropdowns();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'create') {
      this.isEditMode.set(true);
      this.leadId = Number(idParam);
      this.loadLeadData(this.leadId);
    }
  }

  private loadDropdowns(): void {
    this.metadataService.getEnquiryForList().subscribe({
      next: (list) => {
        this.enquiryForList.set(list);
        if (!this.enquiryForId && list.length > 0) {
          this.enquiryForId = list[0].Enquiry_For_Id;
          this.onEnquiryForChanged(this.enquiryForId);
        }
      }
    });

    this.metadataService.getEnquirySourceList().subscribe({
      next: (list) => {
        this.enquirySourceList.set(list);
        if (!this.enquirySourceId && list.length > 0) {
          this.enquirySourceId = list[0].Enquiry_Source_Id;
        }
      }
    });

    this.metadataService.getWorkingStatusList().subscribe({
      next: (list) => {
        this.statusList.set(list);
        if (!this.statusId && list.length > 0) {
          this.statusId = list[0].Status_Id;
          this.onStatusChanged(this.statusId);
        }
      }
    });

    this.metadataService.getUsers().subscribe({
      next: (list) => {
        this.userList.set(list);
        if (!this.toUserId) {
          this.toUserId = this.authService.currentUserId() || (list[0]?.User_Details_Id ?? 0);
        }
      }
    });
  }

  private loadLeadData(id: number): void {
    this.leadService.getLeadById(id).subscribe({
      next: (lead) => {
        if (!lead) return;
        this.customerName = lead.customerName || lead.Customer_Name || '';
        this.phoneNumber = lead.contactNumber || lead.Phone_Number || '';
        this.emailAddress = lead.email || lead.Email_Address || '';
        this.address = lead.address1 || lead.Address || '';
        this.city = lead.city || lead.City || '';
        this.projectCost = lead.projectCost || lead.Project_Cost || 0;
        if (lead.Enquiry_For_Id) {
          this.enquiryForId = lead.Enquiry_For_Id;
          this.onEnquiryForChanged(this.enquiryForId);
        }
      }
    });
  }

  onEnquiryForChanged(enquiryForId: number): void {
    if (!enquiryForId) {
      this.enquiryForCustomFields.set([]);
      return;
    }
    const deptId = this.authService.currentDepartmentId();
    this.metadataService.getCustomFieldsOnEnquiryFor(enquiryForId, this.leadId, deptId).subscribe({
      next: (fields) => this.enquiryForCustomFields.set(fields),
      error: () => this.enquiryForCustomFields.set([])
    });
  }

  onStatusChanged(statusId: number): void {
    if (!statusId) {
      this.statusCustomFields.set([]);
      return;
    }
    this.metadataService.getCustomFieldsOnStatusChange(statusId, this.leadId).subscribe({
      next: (fields) => this.statusCustomFields.set(fields),
      error: () => this.statusCustomFields.set([])
    });
  }

  onSubmit(): void {
    if (!this.customerName.trim() || !this.phoneNumber.trim()) {
      this.errorMessage.set('Customer Name and Phone Number are required.');
      return;
    }

    if (this.enquiryCustomFieldsComp && !this.enquiryCustomFieldsComp.isValid()) {
      this.errorMessage.set('Please fill in all mandatory enquiry custom fields.');
      return;
    }

    if (this.statusCustomFieldsComp && !this.statusCustomFieldsComp.isValid()) {
      this.errorMessage.set('Please fill in all mandatory status custom fields.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const currentUser = this.authService.currentUser();
    const selectedEnquiryFor = this.enquiryForList().find((e) => e.Enquiry_For_Id == this.enquiryForId);
    const selectedSource = this.enquirySourceList().find((s) => s.Enquiry_Source_Id == this.enquirySourceId);
    const selectedStatus = this.statusList().find((s) => s.Status_Id == this.statusId);
    const assignedUser = this.userList().find((u) => u.User_Details_Id == this.toUserId);

    const enquiryCustomValues: CustomFieldValuePayload[] = this.enquiryCustomFieldsComp
      ? this.enquiryCustomFieldsComp.getSerializedValues()
      : [];

    const statusCustomValues: CustomFieldValuePayload[] = this.statusCustomFieldsComp
      ? this.statusCustomFieldsComp.getSerializedValues()
      : [];

    const payload: SaveLeadRequest = {
      Lead_Mobile_Existed_Check: 0,
      Work_Completion_Date: this.workCompletionDate,
      lead: {
        Customer_Id: this.leadId,
        Customer_Name: this.customerName.trim(),
        Phone_Number: this.phoneNumber.trim(),
        Email_Address: this.emailAddress.trim(),
        Address: this.address.trim(),
        City: this.city,
        State: this.state,
        District_Id: 3,
        District: this.district,
        Pincode: this.pincode,
        Landmark: this.landmark,
        Latitude: this.latitude,
        Longitude: this.longitude,
        Enquiry_Source_Id: Number(this.enquirySourceId),
        Enquiry_Source_Name: selectedSource?.Enquiry_Source_Name || 'Direct',
        Enquiry_For_Id: Number(this.enquiryForId),
        Enquiry_For_Name: selectedEnquiryFor?.Enquiry_For_Name || 'General',
        Consumer_Name: this.customerName.trim(),
        Consumer_Number: this.consumerNumber.trim(),
        Project_Cost: Number(this.projectCost) || 0,
        Age: 35,
        PE_Id: 0,
        CRE_Id: 0,
        Lead_Type_Id: 1,
        Priority_Id: Number(this.priorityId),
        customFields: statusCustomValues,
        enquiryForCustomFields: enquiryCustomValues
      },
      followup: {
        Next_FollowUp_date: this.nextFollowUpDate,
        Status_Id: Number(this.statusId),
        Status_Name: selectedStatus?.Status_Name || 'New Enquiry',
        Branch_Id: currentUser?.Branch_Id ?? 1,
        Branch_Name: currentUser?.Branch_Name ?? 'Head Office',
        Department_Id: currentUser?.Department_Id ?? 2,
        Department_Name: currentUser?.Department_Name ?? 'Sales',
        By_User_Id: this.authService.currentUserId(),
        By_User_Name: this.authService.currentUserName(),
        To_User_Id: Number(this.toUserId),
        To_User_Name: assignedUser?.User_Details_Name || 'Sales Executive',
        Remark: this.remark.trim(),
        amount: Number(this.projectCost) || 0,
        secondaryStatusId: 0,
        secondaryStatusName: '',
        time: '11:00'
      }
    };

    this.leadService.saveLead(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/leads']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to save lead. Please check network/parameters.'
        );
      }
    });
  }
}

