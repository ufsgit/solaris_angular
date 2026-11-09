import { CustomFieldValuePayload } from './custom-field.models';

export interface AudioFileAttachment {
  File_Path: string;
  File_Name: string;
  File_Type: string;
}

export interface FollowupPayload {
  FollowUp_Id: number;
  Status_Id: number;
  Status_Name: string;
  Next_FollowUp_date: string;
  By_User_Id: number;
  By_User_Name: string;
  To_User_Id: number;
  To_User_Name: string;
  Branch_Id: number;
  Branch_Name: string;
  Department_Id: number;
  Department_Name: string;
  Remark: string;
  Followup_Time?: string;
  Transfer_Status_Id?: string | number;
  Transfer_Status_Name?: string;
  amount?: string | number;
  Audio_Files?: AudioFileAttachment[];
  customFields?: CustomFieldValuePayload[];
}

export interface SaveFollowupRequest {
  Customer_Id: number;
  FollowUp: FollowupPayload;
}

