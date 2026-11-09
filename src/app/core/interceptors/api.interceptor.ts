import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { CompanyConfigService } from '../services/company-config.service';
import { AuthService } from '../services/auth.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const companyConfig = inject(CompanyConfigService);
  const authService = inject(AuthService);

  let finalUrl = req.url;
  const isAbsoluteUrl = /^https?:\/\//i.test(req.url);

  if (!isAbsoluteUrl) {
    const baseUrl = companyConfig.getBaseUrl();
    if (baseUrl) {
      // Ensure no double slashes when concatenating
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const cleanPath = req.url.startsWith('/') ? req.url.substring(1) : req.url;
      finalUrl = `${cleanBase}${cleanPath}`;
    }
  }

  // Add headers
  let headers = req.headers;
  const token = authService.token();
  if (token && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const modifiedReq = req.clone({
    url: finalUrl,
    headers
  });

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Clear session and navigate to login
        authService.logout(true);
      }
      return throwError(() => error);
    })
  );
};

