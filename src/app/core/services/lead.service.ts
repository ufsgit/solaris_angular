import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  SearchLeadItem,
  LeadFilterParams,
  SaveLeadRequest
} from '../models/lead.models';
import { AuthService } from './auth.service';

export interface LeadSearchResult {
  leads: SearchLeadItem[];
  summaries: SearchLeadItem[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  searchLeads(filters: LeadFilterParams): Observable<LeadSearchResult> {
    const currentUserId = this.auth.currentUserId();
    const currentBranchId = this.auth.currentBranchId();

    let params = new HttpParams()
      .set('Customer_Name_', filters.Customer_Name_ ?? '')
      .set('Phone_Number_', filters.Phone_Number_ ?? '')
      .set('Consumer_Number_', filters.Consumer_Number_ ?? '')
      .set('Is_Date_', filters.Is_Date_ ?? '0')
      .set('Fromdate_', filters.Fromdate_ ?? '')
      .set('Todate_', filters.Todate_ ?? '')
      .set('To_User_Id_', filters.To_User_Id_ ?? '')
      .set('Login_User_Id_', (filters.Login_User_Id_ ?? currentUserId).toString())
      .set('Status_Id_', filters.Status_Id_ ?? '0')
      .set('Page_Index1_', (filters.Page_Index1_ ?? 1).toString())
      .set('Page_Index2_', (filters.Page_Index2_ ?? 20).toString())
      .set('Enquiry_For_Id_', filters.Enquiry_For_Id_ ?? '0')
      .set('Enquiry_Source_Id_', filters.Enquiry_Source_Id_ ?? '')
      .set('Branch_Id_', filters.Branch_Id_ ?? (this.auth.isAdmin() ? '' : currentBranchId.toString()))
      .set('User_Details_Id_', (filters.User_Details_Id_ ?? currentUserId).toString())
      .set('Lead_Id_', (filters.Lead_Id_ ?? 0).toString())
      .set('Order_By_', (filters.Order_By_ ?? 0).toString())
      .set('Order_Type_', filters.Order_Type_ ?? 'DESC')
      .set('Entry_Type_', (filters.Entry_Type_ ?? 0).toString())
      .set('Priority_Id_', (filters.Priority_Id_ ?? 0).toString());

    return this.http.get<any>('lead/Search_lead', { params }).pipe(
      map((res) => {
        let items: any[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (res && Array.isArray(res.data)) {
          items = res.data;
        } else if (res && Array.isArray(res.lead)) {
          items = res.lead;
        }

        // Separate tp == 1 (real leads) and tp == 2 (summary rows)
        const leads: SearchLeadItem[] = items.filter((item) => Number(item.tp) === 1 || item.tp === undefined);
        const summaries: SearchLeadItem[] = items.filter((item) => Number(item.tp) === 2);

        // Calculate total count
        let total = leads.length;
        if (summaries.length > 0) {
          const sumRow = summaries[0];
          total = sumRow.Total_Lead_Count ?? sumRow.Total_Count ?? sumRow.Count ?? total;
        }

        return {
          leads,
          summaries,
          totalCount: Number(total) || leads.length
        };
      })
    );
  }

  getLeadById(leadId: number): Observable<SearchLeadItem | null> {
    return this.searchLeads({ Lead_Id_: leadId, Page_Index1_: 1, Page_Index2_: 1 }).pipe(
      map((res) => (res.leads.length > 0 ? res.leads[0] : null))
    );
  }

  saveLead(payload: SaveLeadRequest): Observable<any> {
    return this.http.post<any>('lead/Save_lead', payload);
  }
}

