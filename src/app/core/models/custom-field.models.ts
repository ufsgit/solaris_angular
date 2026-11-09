export enum CustomFieldType {
  NumberOnly = 1,
  TextOnly = 2,
  Dropdown = 3,
  DatePicker = 4,
  Checkbox = 5,
  FileUpload = 6,
  Signature = 7,
}

export interface DropdownOption {
  Dropdown_Value_Id: number;
  Dropdown_Value_Name: string;
}

export interface CheckboxOption {
  Checkbox_Value_Id: number;
  Checkbox_Value_Name: string;
  Is_Checked?: number;
}

export interface CustomFieldDefinition {
  customFieldId: number;
  customFieldName: string;
  customFieldTypeId: CustomFieldType;
  isMandatory: number;
  datavalue?: string;
  dropdownValues?: DropdownOption[];
  checkboxValues?: CheckboxOption[];
  // Support both camelCase and PascalCase variations from backend
  Custom_Field_Id?: number;
  Custom_Field_Name?: string;
  Custom_Field_Type_Id?: number;
  Is_Mandatory?: number;
  Default_Value?: string;
  Options?: DropdownOption[];
}

export interface CustomFieldValuePayload {
  Custom_Field_Id: number;
  Custom_Field_Name: string;
  Custom_Field_Type_Id: number;
  Field_Value: any;
  Is_Mandatory: number;
}

