import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompanyConfigService } from '../services/company-config.service';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const companyConfig = inject(CompanyConfigService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // If company URL is not set yet, let them go to company-code
  if (!companyConfig.hasBaseUrl()) {
    return true;
  }

  // If already logged in, redirect to leads dashboard
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/leads']);
  }

  return true;
};

