import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { CompanyUrlResponse } from '../models/auth.models';
import { environment } from '../../../environments/environment';

const STORAGE_KEY_BASE_URL = 'company_base_url';
const STORAGE_KEY_CODE = 'company_code';
const RESOLVER_ENDPOINT = `${environment.baseUrl}/settings/Get_Company_Url`;

@Injectable({
  providedIn: 'root'
})
export class CompanyConfigService {
  private _baseUrl = signal<string | null>(this.getStoredBaseUrl());
  private _companyCode = signal<string | null>(this.getStoredCompanyCode());

  readonly baseUrl = this._baseUrl.asReadonly();
  readonly companyCode = this._companyCode.asReadonly();
  readonly isConfigured = computed(() => !!this._baseUrl());

  constructor(private http: HttpClient) {}

  private getStoredBaseUrl(): string | null {
    const stored = localStorage.getItem(STORAGE_KEY_BASE_URL);
    if (!stored) return null;
    return stored.endsWith('/') ? stored : `${stored}/`;
  }

  private getStoredCompanyCode(): string | null {
    return localStorage.getItem(STORAGE_KEY_CODE);
  }

  hasBaseUrl(): boolean {
    return !!this.getBaseUrl();
  }

  getBaseUrl(): string | null {
    return this._baseUrl();
  }

  resolveCompanyUrl(companyCode: string): Observable<CompanyUrlResponse> {
    const cleanCode = companyCode.trim();
    const url = `${RESOLVER_ENDPOINT}?CompanyCode=${encodeURIComponent(cleanCode)}`;

    return this.http.get<CompanyUrlResponse>(url).pipe(
      tap((res) => {
        let extractedUrl = '';
        if (res.CompanyUrl) {
          extractedUrl = res.CompanyUrl;
        } else if (res.company_url && res.company_url.length > 0 && res.company_url[0].CompanyUrl) {
          extractedUrl = res.company_url[0].CompanyUrl;
        }

        if (extractedUrl) {
          if (!extractedUrl.endsWith('/')) {
            extractedUrl += '/';
          }
          this.setCompanyConfig(cleanCode, extractedUrl);
        } else {
          throw new Error('Company URL not found in server response.');
        }
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  setCompanyConfig(companyCode: string, baseUrl: string): void {
    const formattedUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    localStorage.setItem(STORAGE_KEY_CODE, companyCode);
    localStorage.setItem(STORAGE_KEY_BASE_URL, formattedUrl);
    this._companyCode.set(companyCode);
    this._baseUrl.set(formattedUrl);
  }

  clearCompanyConfig(): void {
    localStorage.removeItem(STORAGE_KEY_CODE);
    localStorage.removeItem(STORAGE_KEY_BASE_URL);
    this._companyCode.set(null);
    this._baseUrl.set(null);
  }
}

