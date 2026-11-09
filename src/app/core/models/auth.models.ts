// Authentication & Session Models
export interface LoginRequest {
  userName: string;
  password: string;
}

export interface UserSession {
  token: string;
  User_Details_Id: number;
  User_Details_Name: string;
  User_Type_Id: number;
  User_Type_Name: string;
  Branch_Id: number;
  Branch_Name: string;
  Department_Id: number;
  Department_Name: string;
  Allow_App_Login?: string | number;
}

export interface CompanyUrlItem {
  CompanyUrl: string;
}

export interface CompanyUrlResponse {
  success: boolean;
  company_url?: CompanyUrlItem[];
  CompanyUrl?: string;
  message?: string;
}

// User Metadata
export interface UserDetailItem {
  User_Details_Id: number;
  User_Details_Name: string;
  User_Type_Id?: number;
  User_Type_Name?: string;
  Branch_Id?: number;
  Branch_Name?: string;
  Department_Id?: number;
  Department_Name?: string;
  Phone_Number?: string;
  Email_Address?: string;
}

export interface LookupItem {
  Id: number;
  Name: string;
}

export interface EnquiryForItem {
  Enquiry_For_Id: number;
  Enquiry_For_Name: string;
}

export interface EnquirySourceItem {
  Enquiry_Source_Id: number;
  Enquiry_Source_Name: string;
}

export interface WorkingStatusItem {
  Status_Id: number;
  Status_Name: string;
  Color?: string;
  Type?: string;
}

export interface TaskTypeItem {
  Task_Type_Id: number;
  Task_Type_Name: string;
}

