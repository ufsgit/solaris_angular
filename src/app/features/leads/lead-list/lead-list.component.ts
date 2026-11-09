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
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LeadService, LeadSearchResult } from '../../../core/services/lead.service';
import { MetadataService } from '../../../core/services/metadata.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SearchLeadItem, LeadFilterParams } from '../../../core/models/lead.models';
import {
  WorkingStatusItem,
  EnquiryForItem,
  UserDetailItem
} from '../../../core/models/auth.models';
import { FollowupModalComponent } from '../../followup/followup-modal/followup-modal.component';
import { TaskCreateModalComponent } from '../../tasks/task-create-modal/task-create-modal.component';
import { CustomerTasksDrawerComponent } from '../../tasks/customer-tasks-drawer/customer-tasks-drawer.component';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    FollowupModalComponent,
    TaskCreateModalComponent,
    CustomerTasksDrawerComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Search Leads Pipeline
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Server-side debounced search across names, phone numbers, consumer IDs, and multi-tenant status flows.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="fetchLeads()"
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

          <a
            routerLink="/leads/create"
            class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Lead</span>
          </a>
        </div>
      </div>

      <!-- KPI Summary Cards (Aggregated from tp == 2 responses) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Leads Count</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">
              {{ totalCount() }}
            </div>
            <div class="text-[11px] text-emerald-600 font-medium mt-0.5">Active Ingested</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            ⚡
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Page Records</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">
              {{ leads().length }}
            </div>
            <div class="text-[11px] text-slate-400 font-medium mt-0.5">Page {{ currentPage() }} of {{ totalPages() }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            📄
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">High Priority</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">
              {{ highPriorityCount() }}
            </div>
            <div class="text-[11px] text-rose-600 font-medium mt-0.5">Critical Attention</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            🔥
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Branch Scope</div>
            <div class="text-sm font-bold text-slate-900 mt-1 truncate max-w-[140px]">
              {{ auth.isAdmin() ? 'Super Admin' : (auth.currentUser()?.Branch_Name || 'Branch') }}
            </div>
            <div class="text-[11px] text-indigo-600 font-medium mt-0.5">
              {{ auth.isAdmin() ? 'Global Multi-Branch' : 'Scoped View' }}
            </div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            🏢
          </div>
        </div>
      </div>

      <!-- Search & Filter Bar (Design Pattern) -->
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
              placeholder="Search by customer name, mobile, or consumer number..."
              class="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
            />
          </div>

          <!-- Quick Status Filter -->
          <select
            [formControl]="statusFilter"
            class="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
          >
            <option value="0">All Statuses</option>
            @for (s of statuses(); track s.Status_Id) {
              <option [value]="s.Status_Id.toString()">{{ s.Status_Name }}</option>
            }
          </select>

          <!-- Quick Enquiry For Filter -->
          <select
            [formControl]="enquiryForFilter"
            class="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none transition"
          >
            <option value="0">All Products / Enquiry</option>
            @for (ef of enquiryForList(); track ef.Enquiry_For_Id) {
              <option [value]="ef.Enquiry_For_Id.toString()">{{ ef.Enquiry_For_Name }}</option>
            }
          </select>

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
            (click)="toggleDateFilter()"
            [class.bg-indigo-600]="isDateFilterActive()"
            [class.text-white]="isDateFilterActive()"
            [class.border-indigo-600]="isDateFilterActive()"
            [class.bg-slate-50]="!isDateFilterActive()"
            [class.text-slate-700]="!isDateFilterActive()"
            class="px-3.5 py-2 border border-slate-300 rounded-xl font-medium text-xs hover:bg-slate-100 transition flex items-center gap-1.5"
          >
            <span>📅 Date Range</span>
            @if (isDateFilterActive()) {
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
            }
          </button>
        </div>

        <!-- Inline Date Range Selector (when active) -->
        @if (isDateFilterActive()) {
          <div class="flex items-center gap-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
            <span class="font-semibold text-indigo-900">Filter Range:</span>
            <input
              type="date"
              [(ngModel)]="fromDate"
              (ngModelChange)="onDateChange()"
              class="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs"
            />
            <span class="text-indigo-400">to</span>
            <input
              type="date"
              [(ngModel)]="toDate"
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

            @if (enquiryForFilter.value && enquiryForFilter.value !== '0') {
              <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-200">
                Enquiry: {{ getSelectedEnquiryName() }}
                <button type="button" (click)="enquiryForFilter.setValue('0')" class="hover:text-indigo-950 font-bold ml-1">✕</button>
              </span>
            }

            @if (priorityFilter.value && priorityFilter.value !== '0') {
              <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-200">
                Priority: {{ getPriorityLabel(priorityFilter.value) }}
                <button type="button" (click)="priorityFilter.setValue('0')" class="hover:text-indigo-950 font-bold ml-1">✕</button>
              </span>
            }

            @if (isDateFilterActive()) {
              <span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-200">
                Date: {{ fromDate }} → {{ toDate }}
                <button type="button" (click)="toggleDateFilter()" class="hover:text-indigo-950 font-bold ml-1">✕</button>
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

      <!-- Lead Table Container -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        @if (isLoading()) {
          <div class="p-12 text-center space-y-3">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            <p class="text-xs text-slate-500">Querying server leads records...</p>
          </div>
        } @else if (leads().length === 0) {
          <div class="p-12 text-center space-y-3">
            <div class="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
              🔍
            </div>
            <h3 class="text-sm font-bold text-slate-800">No Leads Found</h3>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              No matching records for the current filter criteria. Try adjusting your search query or reset filters.
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
                  <th class="py-3 px-4">Customer Details</th>
                  <th class="py-3 px-4">Phone / Consumer #</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Enquiry Product</th>
                  <th class="py-3 px-4">Assigned To</th>
                  <th class="py-3 px-4">Next Follow-up</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs text-slate-700">
                @for (lead of leads(); track (lead.customerId || lead.Customer_Id || $index)) {
                  <tr class="hover:bg-slate-50/70 transition">
                    <!-- Customer Details -->
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-900 text-sm">
                        {{ lead.customerName || lead.Customer_Name }}
                      </div>
                      <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>ID: #{{ lead.customerId || lead.Customer_Id }}</span>
                        @if (lead.city || lead.City) {
                          <span>• {{ lead.city || lead.City }}</span>
                        }
                      </div>
                    </td>

                    <!-- Phone / Consumer # -->
                    <td class="py-3.5 px-4">
                      <div class="font-mono font-medium text-slate-800">
                        {{ lead.contactNumber || lead.Phone_Number || '—' }}
                      </div>
                      @if (lead.Consumer_Number) {
                        <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                          Cons: {{ lead.Consumer_Number }}
                        </div>
                      }
                    </td>

                    <!-- Status -->
                    <td class="py-3.5 px-4">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                        [style.background-color]="(lead.priorityColor || '#6366f1') + '15'"
                        [style.color]="lead.priorityColor || '#4f46e5'"
                      >
                        {{ lead.statusName || lead.Status_Name || 'New' }}
                      </span>
                      @if (lead.priorityName || lead.Priority_Name) {
                        <span class="block text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                          {{ lead.priorityName || lead.Priority_Name }}
                        </span>
                      }
                    </td>

                    <!-- Enquiry Product -->
                    <td class="py-3.5 px-4">
                      <div class="font-medium text-slate-800">
                        {{ lead.enquiryFor || lead.Enquiry_For_Name || 'General Enquiry' }}
                      </div>
                      <div class="text-[11px] text-slate-400">
                        {{ lead.enquirySourceName || lead.Enquiry_Source_Name || 'Direct' }}
                      </div>
                    </td>

                    <!-- Assigned Executive -->
                    <td class="py-3.5 px-4">
                      <div class="font-medium text-slate-800">
                        {{ lead.toUserName || lead.To_User_Name || 'Unassigned' }}
                      </div>
                    </td>

                    <!-- Next Follow-up -->
                    <td class="py-3.5 px-4">
                      <div class="font-semibold text-slate-700">
                        {{ lead.nextFollowUpDate || lead.Next_FollowUp_date || 'Not set' }}
                      </div>
                    </td>

                    <!-- Quick Actions -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          (click)="openFollowup(lead)"
                          class="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                        >
                          Follow-up
                        </button>

                        <button
                          type="button"
                          (click)="openTaskModal(lead)"
                          title="Assign Independent Task"
                          class="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                        >
                          + Task
                        </button>

                        <button
                          type="button"
                          (click)="openCustomerTasks(lead)"
                          title="View Customer Tasks History"
                          class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          📋
                        </button>

                        <a
                          [routerLink]="['/leads', (lead.customerId || lead.Customer_Id), 'edit']"
                          title="Edit Lead"
                          class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            <div>
              Showing records <strong>{{ pageStart() }}</strong> to <strong>{{ pageEnd() }}</strong>
              of <strong>{{ totalCount() }}</strong>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                [disabled]="currentPage() === 1"
                (click)="changePage(currentPage() - 1)"
                class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
              >
                Previous
              </button>
              <span class="px-2 font-bold text-slate-800">Page {{ currentPage() }}</span>
              <button
                type="button"
                [disabled]="pageEnd() >= totalCount() || leads().length < pageSize()"
                (click)="changePage(currentPage() + 1)"
                class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition"
              >
                Next
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Modals & Drawers -->
      @if (activeFollowupLead()) {
        <app-followup-modal
          [lead]="activeFollowupLead()!"
          (close)="activeFollowupLead.set(null)"
          (saved)="onFollowupSaved()"
        />
      }

      @if (activeTaskLead()) {
        <app-task-create-modal
          [customerId]="activeTaskLead()!.customerId || activeTaskLead()!.Customer_Id || 0"
          [customerName]="activeTaskLead()!.customerName || activeTaskLead()!.Customer_Name || ''"
          [enquiryForId]="activeTaskLead()!.Enquiry_For_Id || 0"
          (close)="activeTaskLead.set(null)"
          (created)="onTaskCreated()"
        />
      }

      @if (activeDrawerLead()) {
        <app-customer-tasks-drawer
          [customerId]="activeDrawerLead()!.customerId || activeDrawerLead()!.Customer_Id || 0"
          [customerName]="activeDrawerLead()!.customerName || activeDrawerLead()!.Customer_Name || ''"
          (close)="activeDrawerLead.set(null)"
        />
      }
    </div>
  `
})
export class LeadListComponent implements OnInit, OnDestroy {
  private leadService = inject(LeadService);
  private metadataService = inject(MetadataService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  private subs = new Subscription();

  // Reactive State via Signals
  leads = signal<SearchLeadItem[]>([]);
  statuses = signal<WorkingStatusItem[]>([]);
  enquiryForList = signal<EnquiryForItem[]>([]);
  isLoading = signal<boolean>(false);
  totalCount = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  isDateFilterActive = signal<boolean>(false);

  // Form Controls with RxJS Debouncing
  searchInput = new FormControl('');
  statusFilter = new FormControl('0');
  enquiryForFilter = new FormControl('0');
  priorityFilter = new FormControl('0');

  fromDate = '';
  toDate = '';

  // Active Modals
  activeFollowupLead = signal<SearchLeadItem | null>(null);
  activeTaskLead = signal<SearchLeadItem | null>(null);
  activeDrawerLead = signal<SearchLeadItem | null>(null);

  hasActiveFilters = computed(() => {
    return (
      !!this.searchInput.value ||
      this.statusFilter.value !== '0' ||
      this.enquiryForFilter.value !== '0' ||
      this.priorityFilter.value !== '0' ||
      this.isDateFilterActive()
    );
  });

  pageStart = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  pageEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalCount() || this.leads().length)
  );
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()) || 1);

  highPriorityCount = computed(() => {
    return this.leads().filter(
      (l) => (l.priorityName || l.Priority_Name || '').toLowerCase().includes('high')
    ).length;
  });

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;

    this.loadDropdowns();
    this.fetchLeads();

    // Debounce search input by 350ms to eliminate redundant network queries
    this.subs.add(
      this.searchInput.valueChanges
        .pipe(debounceTime(350), distinctUntilChanged())
        .subscribe(() => {
          this.currentPage.set(1);
          this.fetchLeads();
        })
    );

    this.subs.add(
      this.statusFilter.valueChanges.subscribe(() => {
        this.currentPage.set(1);
        this.fetchLeads();
      })
    );

    this.subs.add(
      this.enquiryForFilter.valueChanges.subscribe(() => {
        this.currentPage.set(1);
        this.fetchLeads();
      })
    );

    this.subs.add(
      this.priorityFilter.valueChanges.subscribe(() => {
        this.currentPage.set(1);
        this.fetchLeads();
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
    this.metadataService.getEnquiryForList().subscribe({
      next: (list) => this.enquiryForList.set(list),
      error: () => {}
    });
  }

  fetchLeads(): void {
    this.isLoading.set(true);
    const page = this.currentPage();
    const size = this.pageSize();

    const params: LeadFilterParams = {
      Customer_Name_: this.searchInput.value || '',
      Phone_Number_: this.searchInput.value || '',
      Consumer_Number_: this.searchInput.value || '',
      Is_Date_: this.isDateFilterActive() ? '1' : '0',
      Fromdate_: this.isDateFilterActive() ? this.fromDate : '',
      Todate_: this.isDateFilterActive() ? this.toDate : '',
      Status_Id_: this.statusFilter.value || '0',
      Enquiry_For_Id_: this.enquiryForFilter.value || '0',
      Priority_Id_: Number(this.priorityFilter.value) || 0,
      Page_Index1_: (page - 1) * size + 1,
      Page_Index2_: page * size,
      Order_By_: 0,
      Order_Type_: 'DESC'
    };

    this.leadService.searchLeads(params).subscribe({
      next: (res: LeadSearchResult) => {
        // Real leads filtered by tp == 1
        this.leads.set(res.leads);
        this.totalCount.set(res.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.leads.set([]);
        this.totalCount.set(0);
        this.toast.error('Failed to load leads from server.');
      }
    });
  }

  changePage(newPage: number): void {
    if (newPage >= 1) {
      this.currentPage.set(newPage);
      this.fetchLeads();
    }
  }

  clearAllFilters(): void {
    this.searchInput.setValue('', { emitEvent: false });
    this.statusFilter.setValue('0', { emitEvent: false });
    this.enquiryForFilter.setValue('0', { emitEvent: false });
    this.priorityFilter.setValue('0', { emitEvent: false });
    this.isDateFilterActive.set(false);
    this.currentPage.set(1);
    this.fetchLeads();
  }

  toggleDateFilter(): void {
    this.isDateFilterActive.update((v) => !v);
    this.currentPage.set(1);
    this.fetchLeads();
  }

  onDateChange(): void {
    if (this.isDateFilterActive()) {
      this.currentPage.set(1);
      this.fetchLeads();
    }
  }

  openFollowup(lead: SearchLeadItem): void {
    this.activeFollowupLead.set(lead);
  }

  openTaskModal(lead: SearchLeadItem): void {
    this.activeTaskLead.set(lead);
  }

  openCustomerTasks(lead: SearchLeadItem): void {
    this.activeDrawerLead.set(lead);
  }

  onFollowupSaved(): void {
    this.toast.success('Follow-up scheduled successfully.');
    this.fetchLeads();
  }

  onTaskCreated(): void {
    this.toast.success('Task created and assigned successfully.');
    this.fetchLeads();
  }

  getSelectedStatusName(): string {
    const val = this.statusFilter.value;
    const found = this.statuses().find((s) => s.Status_Id.toString() === val);
    return found ? found.Status_Name : val || '';
  }

  getSelectedEnquiryName(): string {
    const val = this.enquiryForFilter.value;
    const found = this.enquiryForList().find((e) => e.Enquiry_For_Id.toString() === val);
    return found ? found.Enquiry_For_Name : val || '';
  }

  getPriorityLabel(val: string | null): string {
    switch (val) {
      case '1':
        return 'High';
      case '2':
        return 'Medium';
      case '3':
        return 'Low';
      default:
        return 'All';
    }
  }
}
