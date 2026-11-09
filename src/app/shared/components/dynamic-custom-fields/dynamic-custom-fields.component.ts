import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CustomFieldDefinition,
  CustomFieldValuePayload,
  CustomFieldType
} from '../../../core/models/custom-field.models';

interface CanvasState {
  isDrawing: boolean;
  hasDrawn: boolean;
}

@Component({
  selector: 'app-dynamic-custom-fields',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      @if (fields.length === 0) {
        <p class="text-xs text-slate-400 italic py-1">No custom fields for current selection.</p>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (field of fields; track field.customFieldId) {
          <div
            class="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-indigo-200 transition-colors"
            [class.md:col-span-2]="field.customFieldTypeId === 6 || field.customFieldTypeId === 7"
          >
            <!-- Field Label -->
            <label class="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>
                {{ field.customFieldName }}
                @if (field.isMandatory) {
                  <span class="text-rose-500 font-bold ml-0.5">*</span>
                }
              </span>
              <span class="text-[10px] text-slate-400 font-normal uppercase tracking-wider">
                {{ getFieldTypeName(field.customFieldTypeId) }}
              </span>
            </label>

            <!-- 1. Number Only -->
            @if (field.customFieldTypeId === 1) {
              <input
                type="number"
                [required]="field.isMandatory === 1"
                [ngModel]="fieldValues[field.customFieldId]"
                (ngModelChange)="onValueChange(field, $event)"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                [placeholder]="'Enter ' + field.customFieldName"
              />
            }

            <!-- 2. Text Only -->
            @else if (field.customFieldTypeId === 2) {
              <input
                type="text"
                [required]="field.isMandatory === 1"
                [ngModel]="fieldValues[field.customFieldId]"
                (ngModelChange)="onValueChange(field, $event)"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                [placeholder]="'Enter ' + field.customFieldName"
              />
            }

            <!-- 3. Dropdown -->
            @else if (field.customFieldTypeId === 3) {
              <select
                [required]="field.isMandatory === 1"
                [ngModel]="fieldValues[field.customFieldId]"
                (ngModelChange)="onValueChange(field, $event)"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              >
                <option value="">-- Select {{ field.customFieldName }} --</option>
                @for (opt of field.dropdownValues ?? []; track opt.Dropdown_Value_Id) {
                  <option [value]="opt.Dropdown_Value_Name">
                    {{ opt.Dropdown_Value_Name }}
                  </option>
                }
              </select>
            }

            <!-- 4. DatePicker -->
            @else if (field.customFieldTypeId === 4) {
              <input
                type="date"
                [required]="field.isMandatory === 1"
                [ngModel]="fieldValues[field.customFieldId]"
                (ngModelChange)="onValueChange(field, $event)"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            }

            <!-- 5. Checkbox List / Multi-checkbox -->
            @else if (field.customFieldTypeId === 5) {
              <div class="space-y-1.5 pt-1">
                @if (field.checkboxValues && field.checkboxValues.length > 0) {
                  @for (chk of field.checkboxValues; track chk.Checkbox_Value_Id) {
                    <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input
                        type="checkbox"
                        [checked]="isCheckboxOptionChecked(field.customFieldId, chk.Checkbox_Value_Name)"
                        (change)="toggleCheckboxOption(field, chk.Checkbox_Value_Name)"
                        class="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>{{ chk.Checkbox_Value_Name }}</span>
                    </label>
                  }
                } @else {
                  <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input
                      type="checkbox"
                      [checked]="fieldValues[field.customFieldId] === '1' || fieldValues[field.customFieldId] === true"
                      (change)="onValueChange(field, $any($event.target).checked ? '1' : '0')"
                      class="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Yes / Enabled</span>
                  </label>
                }
              </div>
            }

            <!-- 6. File Upload -->
            @else if (field.customFieldTypeId === 6) {
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <input
                    type="file"
                    (change)="onFileUpload(field, $event)"
                    class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition cursor-pointer"
                  />
                </div>
                @if (fieldValues[field.customFieldId]) {
                  <div class="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span class="text-slate-500">Stored file:</span>
                    <a
                      [href]="fieldValues[field.customFieldId]"
                      target="_blank"
                      class="text-indigo-600 font-medium hover:underline truncate max-w-xs"
                    >
                      {{ fieldValues[field.customFieldId] }}
                    </a>
                    <button
                      type="button"
                      (click)="onValueChange(field, '')"
                      class="text-rose-500 hover:text-rose-700 ml-auto font-bold"
                    >
                      ✕
                    </button>
                  </div>
                }
              </div>
            }

            <!-- 7. Signature (HTML5 Canvas Pad) -->
            @else if (field.customFieldTypeId === 7) {
              <div class="flex flex-col gap-2">
                <div class="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50/50">
                  <canvas
                    #sigCanvas
                    [attr.data-field-id]="field.customFieldId"
                    (mousedown)="startDrawing($event, field.customFieldId)"
                    (mousemove)="draw($event, field.customFieldId)"
                    (mouseup)="stopDrawing(field)"
                    (mouseleave)="stopDrawing(field)"
                    (touchstart)="startDrawingTouch($event, field.customFieldId)"
                    (touchmove)="drawTouch($event, field.customFieldId)"
                    (touchend)="stopDrawing(field)"
                    class="w-full h-32 touch-none cursor-crosshair bg-white"
                  ></canvas>
                  <div class="absolute bottom-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      (click)="clearSignature(field.customFieldId, field)"
                      class="px-2.5 py-1 text-xs font-medium bg-white/90 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md shadow-xs transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                @if (fieldValues[field.customFieldId]) {
                  <div class="flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
                    ✓ Signature captured
                  </div>
                }
              </div>
            }

            <!-- Mandatory validation hint -->
            @if (field.isMandatory && !isFieldFilled(field)) {
              <span class="text-[11px] text-rose-500">This field is mandatory.</span>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class DynamicCustomFieldsComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() fields: CustomFieldDefinition[] = [];
  @Input() initialValues: CustomFieldValuePayload[] = [];
  @Output() valuesChange = new EventEmitter<CustomFieldValuePayload[]>();

  @ViewChildren('sigCanvas') canvasElements!: QueryList<ElementRef<HTMLCanvasElement>>;

  fieldValues: { [key: number]: any } = {};
  canvasStates: { [key: number]: CanvasState } = {};

  ngOnInit(): void {
    this.hydrateValues();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['initialValues']) {
      this.hydrateValues();
    }
  }

  ngAfterViewInit(): void {
    this.initSignatureCanvases();
  }

  private hydrateValues(): void {
    if (this.initialValues && this.initialValues.length > 0) {
      for (const item of this.initialValues) {
        this.fieldValues[item.Custom_Field_Id] = item.Field_Value;
      }
    }
    // Set default values if not set
    for (const f of this.fields) {
      if (this.fieldValues[f.customFieldId] === undefined) {
        this.fieldValues[f.customFieldId] = f.datavalue ?? '';
      }
    }
  }

  onValueChange(field: CustomFieldDefinition, value: any): void {
    this.fieldValues[field.customFieldId] = value;
    this.emitChange();
  }

  isCheckboxOptionChecked(fieldId: number, optionName: string): boolean {
    const raw = this.fieldValues[fieldId];
    if (!raw) return false;
    if (Array.isArray(raw)) return raw.includes(optionName);
    return String(raw).split(',').map((s) => s.trim()).includes(optionName);
  }

  toggleCheckboxOption(field: CustomFieldDefinition, optionName: string): void {
    const current = this.fieldValues[field.customFieldId];
    let selected: string[] = [];
    if (Array.isArray(current)) {
      selected = [...current];
    } else if (current) {
      selected = String(current).split(',').map((s) => s.trim()).filter(Boolean);
    }

    const idx = selected.indexOf(optionName);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      selected.push(optionName);
    }

    this.fieldValues[field.customFieldId] = selected.join(', ');
    this.emitChange();
  }

  onFileUpload(field: CustomFieldDefinition, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        // In real Cloudflare/S3, upload to endpoint, but here store base64/URL string
        const dataUrl = reader.result as string;
        this.fieldValues[field.customFieldId] = dataUrl;
        this.emitChange();
      };
      reader.readAsDataURL(file);
    }
  }

  // --- Signature Pad Methods ---
  private initSignatureCanvases(): void {
    setTimeout(() => {
      this.canvasElements?.forEach((canvasRef) => {
        const canvas = canvasRef.nativeElement;
        const fieldId = Number(canvas.getAttribute('data-field-id'));
        canvas.width = canvas.parentElement?.clientWidth || 350;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
        this.canvasStates[fieldId] = { isDrawing: false, hasDrawn: false };

        // If existing signature dataUrl
        if (this.fieldValues[fieldId]) {
          const img = new Image();
          img.onload = () => ctx?.drawImage(img, 0, 0);
          img.src = this.fieldValues[fieldId];
        }
      });
    }, 100);
  }

  startDrawing(event: MouseEvent, fieldId: number): void {
    const canvas = this.getCanvas(fieldId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    this.canvasStates[fieldId] = { isDrawing: true, hasDrawn: true };
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  draw(event: MouseEvent, fieldId: number): void {
    const state = this.canvasStates[fieldId];
    if (!state || !state.isDrawing) return;
    const canvas = this.getCanvas(fieldId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
  }

  startDrawingTouch(event: TouchEvent, fieldId: number): void {
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = this.getCanvas(fieldId);
    if (!canvas || !touch) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    this.canvasStates[fieldId] = { isDrawing: true, hasDrawn: true };
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  drawTouch(event: TouchEvent, fieldId: number): void {
    event.preventDefault();
    const state = this.canvasStates[fieldId];
    if (!state || !state.isDrawing) return;
    const touch = event.touches[0];
    const canvas = this.getCanvas(fieldId);
    if (!canvas || !touch) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  }

  stopDrawing(field: CustomFieldDefinition): void {
    const state = this.canvasStates[field.customFieldId];
    if (state && state.isDrawing) {
      state.isDrawing = false;
      const canvas = this.getCanvas(field.customFieldId);
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        this.fieldValues[field.customFieldId] = dataUrl;
        this.emitChange();
      }
    }
  }

  clearSignature(fieldId: number, field: CustomFieldDefinition): void {
    const canvas = this.getCanvas(fieldId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      this.fieldValues[fieldId] = '';
      if (this.canvasStates[fieldId]) {
        this.canvasStates[fieldId].hasDrawn = false;
      }
      this.emitChange();
    }
  }

  private getCanvas(fieldId: number): HTMLCanvasElement | null {
    const match = this.canvasElements?.find(
      (ref) => Number(ref.nativeElement.getAttribute('data-field-id')) === fieldId
    );
    return match ? match.nativeElement : null;
  }

  isFieldFilled(field: CustomFieldDefinition): boolean {
    const val = this.fieldValues[field.customFieldId];
    if (val === undefined || val === null || val === '') return false;
    return true;
  }

  getFieldTypeName(typeId: number): string {
    switch (typeId) {
      case CustomFieldType.NumberOnly:
        return 'Number';
      case CustomFieldType.TextOnly:
        return 'Text';
      case CustomFieldType.Dropdown:
        return 'Dropdown';
      case CustomFieldType.DatePicker:
        return 'Date';
      case CustomFieldType.Checkbox:
        return 'Checkbox';
      case CustomFieldType.FileUpload:
        return 'File';
      case CustomFieldType.Signature:
        return 'Signature';
      default:
        return 'Custom';
    }
  }

  getSerializedValues(): CustomFieldValuePayload[] {
    return this.fields.map((f) => ({
      Custom_Field_Id: f.customFieldId,
      Custom_Field_Name: f.customFieldName,
      Custom_Field_Type_Id: f.customFieldTypeId,
      Field_Value: this.fieldValues[f.customFieldId] ?? '',
      Is_Mandatory: f.isMandatory
    }));
  }

  isValid(): boolean {
    for (const f of this.fields) {
      if (f.isMandatory && !this.isFieldFilled(f)) {
        return false;
      }
    }
    return true;
  }

  private emitChange(): void {
    this.valuesChange.emit(this.getSerializedValues());
  }
}

