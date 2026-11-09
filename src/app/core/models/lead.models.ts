import { CustomFieldValuePayload } from './custom-field.models';

export interface SearchLeadItem {
  customerId?: number;
  Customer_Id?: number;
  customerName?: string;
  Customer_Name?: string;
  contactNumber?: string;
  Phone_Number?: string;
  email?: string;
  Email_Address?: string;
  address1?: string;
  Address?: string;
  city?: string;
  City?: string;
  statusId?: number;
  Status_Id?: number;
  statusName?: string;
  Status_Name?: string;
  nextFollowUpDate?: string;
  Next_FollowUp_date?: string;
  toUserId?: number;
  To_User_Id?: number;
  toUserName?: string;
  To_User_Name?: string;
  enquiryFor?: string;
  Enquiry_For_Name?: string;
  Enquiry_For_Id?: number;
  enquirySourceName?: string;
  Enquiry_Source_Name?: string;
  priorityName?: string;
  Priority_Name?: string;
  priorityColor?: string;
  Priority_Color?: string;
  projectCost?: number;
  Project_Cost?: number;
  Consumer_Number?: string;
  Consumer_No?: string;
  tp: number; // 1 = Real Lead, 2 = Summary Row
  
  // Summary row specific fields (when tp == 2)
  Total_Lead_Count?: number;
  Total_Count?: number;
  Count?: number;
  Title?: string;
  Value?: any;
}

export interface LeadFilterParams {
  Customer_Name_?: string;
  Phone_Number_?: string;
  Consumer_Number_?: string;
  Is_Date_?: '0' | '1';
  Fromdate_?: string;
  Todate_?: string;
  To_User_Id_?: string;
  Login_User_Id_?: number | string;
  Status_Id_?: string;
  Page_Index1_?: number;
  Page_Index2_?: number;
  Enquiry_For_Id_?: string;
  Enquiry_Source_Id_?: string;
  Branch_Id_?: string;
  User_Details_Id_?: number | string;
  Lead_Id_?: number;
  Order_By_?: number; // 0: Default, 1: Date, 2: Creation Date, 4: Name
  Order_Type_?: 'ASC' | 'DESC';
  Entry_Type_?: number;
  Priority_Id_?: number;
}

export interface SaveLeadRequest {
  Lead_Mobile_Existed_Check: number;
  Work_Completion_Date?: string;
  lead: {
    Customer_Id: number;
    Customer_Name: string;
    Phone_Number: string;
    Email_Address?: string;
    Address?: string;
    City?: string;
    State?: string;
    District_Id?: number;
    District?: string;
    Pincode?: string;
    Landmark?: string;
    Latitude?: string;
    Longitude?: string;
    Enquiry_Source_Id: number;
    Enquiry_Source_Name: string;
    Enquiry_For_Id: number;
    Enquiry_For_Name: string;
    Consumer_Name?: string;
    Consumer_Number?: string;
    Project_Cost?: number;
    Age?: number;
    PE_Id?: number;
    CRE_Id?: number;
    Lead_Type_Id?: number;
    Priority_Id?: number;
    customFields?: CustomFieldValuePayload[];
    enquiryForCustomFields?: CustomFieldValuePayload[];
  };
  followup: {
    Next_FollowUp_date: string;
    Status_Id: number;
    Status_Name: string;
    Branch_Id: number;
    Branch_Name: string;
    Department_Id: number;
    Department_Name: string;
    By_User_Id: number;
    By_User_Name: string;
    To_User_Id: number;
    To_User_Name: string;
    Remark: string;
    amount?: number;
    secondaryStatusId?: number;
    secondaryStatusName?: string;
    time?: string;
  };
}

