import { CustomFieldValuePayload } from './custom-field.models';

export interface ProcessFlowTaskType {
  Task_Type_Id: number;
  Task_Type_Name: string;
  Duration: number;
  Is_Checked: number;
  Order_No: number;
}

export interface ProcessFlowResponse {
  enquiry: Array<{ FlowId: number; message: string }>;
  data: ProcessFlowTaskType[];
  document_types: any[];
  mandatory_status: any[];
  show_custom_field: any[];
}

export interface TaskStatusChangePayload {
  Task_Id: number;
  Status_Id: number;
  Status_Name: string;
  flow_id?: number;
  By_User_Id: string | number;
  Description: string;
  Remarks: string;
  Next_FollowUp_Date?: string;
  Followup_Time?: string;
  Location?: string;
  Latitude?: number;
  Longitude?: number;
  Tasks?: string;
  TaskUsers?: Array<{ task_type_id: number; to_user_id: number }>;
  CustomFields?: CustomFieldValuePayload[];
  Sub_Status_Id?: number | null;
  Sub_Status_Name?: string | null;
  Task_Files?: any[];
}

export interface TaskUserAssignment {
  User_Details_Id: number;
  User_Details_Name: string;
}

export interface SaveTaskRequest {
  Task_Id: number;
  Task_Master_Id?: number;
  Customer_Id: number;
  Task_Type_Id: number;
  Task_Type_Name: string;
  Task_Status_Id: number;
  Task_Status_Name: string;
  Created_By: number;
  Task_Date: string;
  Task_Time: string;
  Completion_Date?: string;
  Completion_Time?: string;
  Description: string;
  Priority_Id: number;
  Task_user: TaskUserAssignment[];
  Task_Files?: any[];
}

export interface TaskOverviewItem {
  Task_Id: number;
  Customer_Id: number;
  Customer_Name: string;
  Phone_Number?: string;
  Mobile?: string;
  Consumer_No?: string;
  Task_Type_Id: number;
  Task_Type_Name: string;
  Task_Status_Id: number;
  Task_Status_Name: string;
  Task_Date: string;
  Task_Time: string;
  Description: string;
  Priority_Id?: number;
  Priority_Name?: string;
  Priority_Color?: string;
  Assigned_User_Name?: string;
  User_Details_Name?: string;
  To_User_Id?: number;
  To_User_Name?: string;
  Overdue?: string | number;
  Location?: string;
  Address?: string;
}

// --- Search Tasks API Contract ---
export interface SearchTaskFilterParams {
  Customer_Name?: string;
  Phone_Number?: string;
  Consumer_Number?: string;
  Task_Status_Id?: string;
  Task_Type_Id?: string;
  To_User?: string;
  Department_Id?: string;
  Enquiry_For_Id?: string;
  Priority_Id_?: number;
  Is_Date?: '0' | '1';
  Fromdate?: string;
  Todate?: string;
  Is_Task_Date?: '0' | '1';
  Task_Fromdate?: string;
  Task_Todate?: string;
  Customer_Type_Id_?: number;
  Entry_Type_?: number;
  Order_By_?: number; // 0 (Default), 1 (Task Date), 4 (Name)
  Order_Type_?: 'ASC' | 'DESC';
  Page_Index: number; // 1-based page index
  PageSize: number; // items per page
}

export interface SearchTaskItem {
  Task_Id: number;
  Task_Master_Id?: number;
  Customer_Id: number;
  Customer_Name: string;
  Mobile?: string;
  Phone_Number?: string;
  Consumer_No?: string;
  Consumer_Number?: string;
  Task_Type_Id: number;
  Task_Type_Name: string;
  Task_Status_Id: number;
  Task_Status_Name: string;
  Task_Date: string;
  Task_Time: string;
  To_User_Id?: number;
  To_User_Name?: string;
  Priority_Id?: number;
  Priority_Name?: string;
  Priority_Color?: string;
  Overdue?: string | number;
  Location?: string;
  Description?: string;
}

export interface SearchTaskMetadata {
  Total_Items: number;
  Total_Pages: number;
}

export interface SearchTaskResponse {
  metadata: SearchTaskMetadata;
  data: SearchTaskItem[];
}
