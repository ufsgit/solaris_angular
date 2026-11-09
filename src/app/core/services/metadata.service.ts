import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  UserDetailItem,
  EnquiryForItem,
  EnquirySourceItem,
  WorkingStatusItem,
  TaskTypeItem
} from '../models/auth.models';
import { CustomFieldDefinition } from '../models/custom-field.models';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  private http = inject(HttpClient);

  getUsers(name: string = '', branchId: number = 0, departmentId: number = 0): Observable<UserDetailItem[]> {
    let params = new HttpParams().set('User_Details_Name', name);
    if (branchId > 0) {
      params = params.set('Branch_Id', branchId.toString());
    }
    if (departmentId > 0) {
      params = params.set('Department_Id', departmentId.toString());
    }

    return this.http.get<any>('user_details/Search_user_details', { params }).pipe(
      map((res) => this.extractArray<UserDetailItem>(res))
    );
  }

  getEnquiryForList(): Observable<EnquiryForItem[]> {
    return this.http.get<any>('lead/Search_Enquiry_For').pipe(
      map((res) => this.extractArray<EnquiryForItem>(res))
    );
  }

  getEnquirySourceList(): Observable<EnquirySourceItem[]> {
    return this.http.get<any>('lead/Search_Enquiry_Source').pipe(
      map((res) => this.extractArray<EnquirySourceItem>(res))
    );
  }

  getWorkingStatusList(): Observable<WorkingStatusItem[]> {
    return this.http.get<any>('status/Search_status').pipe(
      map((res) => this.extractArray<WorkingStatusItem>(res))
    );
  }

  getTaskTypes(name: string = '', enquiryForId: number = 0): Observable<TaskTypeItem[]> {
    let params = new HttpParams().set('Task_Type_Name', name);
    if (enquiryForId > 0) {
      params = params.set('Enquiry_For_Id', enquiryForId.toString());
    }
    return this.http.get<any>('task_status/Search_task_type', { params }).pipe(
      map((res) => this.extractArray<TaskTypeItem>(res))
    );
  }

  getStatusByTaskTypeId(taskTypeId: number, viewInId: number = 0): Observable<WorkingStatusItem[]> {
    return this.http.get<any>(`status/Get_status_by_task_type_id/${taskTypeId}/${viewInId}`).pipe(
      map((res) => this.extractArray<WorkingStatusItem>(res))
    );
  }

  getCustomFieldsOnStatusChange(statusId: number, leadId: number = 0): Observable<CustomFieldDefinition[]> {
    const params = new HttpParams()
      .set('status_id', statusId.toString())
      .set('lead_id', leadId.toString());
    return this.http.get<any>('status/Get_CustomFields_On_StatusChange', { params }).pipe(
      map((res) => this.normalizeCustomFields(this.extractArray<any>(res)))
    );
  }

  getCustomFieldsOnEnquiryFor(enquiryForId: number, leadId: number = 0, departmentId: number = 0): Observable<CustomFieldDefinition[]> {
    const params = new HttpParams()
      .set('enquiry_for_id', enquiryForId.toString())
      .set('lead_id', leadId.toString())
      .set('department_id', departmentId.toString());
    return this.http.get<any>('lead/Get_CustomFields_On_EnquiryFor', { params }).pipe(
      map((res) => this.normalizeCustomFields(this.extractArray<any>(res)))
    );
  }

  private extractArray<T>(res: any): T[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.enquiry)) return res.enquiry;
    return [];
  }

  private normalizeCustomFields(rawFields: any[]): CustomFieldDefinition[] {
    return rawFields.map((f) => ({
      customFieldId: f.customFieldId ?? f.Custom_Field_Id ?? 0,
      customFieldName: f.customFieldName ?? f.Custom_Field_Name ?? '',
      customFieldTypeId: f.customFieldTypeId ?? f.Custom_Field_Type_Id ?? 2,
      isMandatory: f.isMandatory ?? f.Is_Mandatory ?? 0,
      datavalue: f.datavalue ?? f.Field_Value ?? f.Default_Value ?? '',
      dropdownValues: f.dropdownValues ?? f.Options ?? [],
      checkboxValues: f.checkboxValues ?? []
    }));
  }
}

