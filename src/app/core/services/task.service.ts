import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  SaveTaskRequest,
  ProcessFlowResponse,
  TaskStatusChangePayload,
  TaskOverviewItem,
  SearchTaskFilterParams,
  SearchTaskResponse,
  SearchTaskItem,
  SearchTaskMetadata
} from '../models/task.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  searchTasks(filters: SearchTaskFilterParams): Observable<SearchTaskResponse> {
    let params = new HttpParams()
      .set('Customer_Name', filters.Customer_Name || '')
      .set('Phone_Number', filters.Phone_Number || '')
      .set('Consumer_Number', filters.Consumer_Number || '')
      .set('Task_Status_Id', filters.Task_Status_Id || '0')
      .set('Task_Type_Id', filters.Task_Type_Id || '0')
      .set('To_User', filters.To_User || '0')
      .set('Department_Id', filters.Department_Id || '0')
      .set('Enquiry_For_Id', filters.Enquiry_For_Id || '0')
      .set('Priority_Id_', (filters.Priority_Id_ ?? 0).toString())
      .set('Is_Date', filters.Is_Date || '0')
      .set('Fromdate', filters.Fromdate || '')
      .set('Todate', filters.Todate || '')
      .set('Is_Task_Date', filters.Is_Task_Date || '0')
      .set('Task_Fromdate', filters.Task_Fromdate || '')
      .set('Task_Todate', filters.Task_Todate || '')
      .set('Customer_Type_Id_', (filters.Customer_Type_Id_ ?? 0).toString())
      .set('Entry_Type_', (filters.Entry_Type_ ?? 0).toString())
      .set('Order_By_', (filters.Order_By_ ?? 0).toString())
      .set('Order_Type_', filters.Order_Type_ || 'DESC')
      .set('Page_Index', filters.Page_Index.toString())
      .set('PageSize', filters.PageSize.toString());

    return this.http.get<any>('task/Search_task_by_customer', { params }).pipe(
      map((res) => {
        let metadata: SearchTaskMetadata = { Total_Items: 0, Total_Pages: 1 };
        let data: SearchTaskItem[] = [];

        if (res && res.metadata) {
          metadata = {
            Total_Items: Number(res.metadata.Total_Items) || 0,
            Total_Pages: Number(res.metadata.Total_Pages) || 1
          };
        }
        if (res && Array.isArray(res.data)) {
          data = res.data;
        } else if (Array.isArray(res)) {
          data = res;
          metadata = { Total_Items: res.length, Total_Pages: Math.ceil(res.length / filters.PageSize) || 1 };
        }

        return { metadata, data };
      })
    );
  }

  saveTask(task: SaveTaskRequest): Observable<any> {
    return this.http.post<any>('task/Save_task', task);
  }

  getProcessFlow(
    taskTypeId: number,
    statusId: number,
    customerId: number,
    loginUserId?: number,
    enquiryForId: number = 0
  ): Observable<ProcessFlowResponse> {
    const userId = loginUserId ?? this.auth.currentUserId();
    const params = new HttpParams()
      .set('Task_Type_Id', taskTypeId.toString())
      .set('Status_Id', statusId.toString())
      .set('Customer_Id', customerId.toString())
      .set('Login_User_Id', userId.toString())
      .set('Enquiry_For_Id', enquiryForId.toString());

    return this.http.get<ProcessFlowResponse>('process_flow/Get_Task_Types_Of_Process_Flow', { params });
  }

  getProcessFlowWithCustomFields(
    taskTypeId: number,
    statusId: number,
    customerId: number,
    customFields: any[],
    loginUserId?: number,
    enquiryForId: number = 0
  ): Observable<ProcessFlowResponse> {
    const userId = loginUserId ?? this.auth.currentUserId();
    const params = new HttpParams()
      .set('Task_Type_Id', taskTypeId.toString())
      .set('Status_Id', statusId.toString())
      .set('Customer_Id', customerId.toString())
      .set('Login_User_Id', userId.toString())
      .set('Enquiry_For_Id', enquiryForId.toString())
      .set('Custom_Fields', JSON.stringify(customFields));

    return this.http.get<ProcessFlowResponse>(
      'process_flow/Get_Task_Types_Of_Process_Flow_With_Custom_Field',
      { params }
    );
  }

  changeTaskStatus(payload: TaskStatusChangePayload): Observable<any> {
    return this.http.post<any>('task/Change_Task_Status', payload);
  }

  getTaskOverview(fromDate: string, toDate: string, userId?: number): Observable<TaskOverviewItem[]> {
    const effectiveUserId = userId ?? this.auth.currentUserId();
    const params = new HttpParams()
      .set('User_Id', effectiveUserId.toString())
      .set('From_Date', fromDate)
      .set('To_Date', toDate);

    return this.http.get<any>('task/Task_Overview', { params }).pipe(
      map((res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.task)) return res.task;
        return [];
      })
    );
  }

  getTasksByCustomer(customerId: number): Observable<TaskOverviewItem[]> {
    const params = new HttpParams().set('Customer_Id', customerId.toString());
    return this.http.get<any>('task/Get_task_By_Customer', { params }).pipe(
      map((res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }
}
