import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompanyConfigService } from '../services/company-config.service';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const companyConfig = inject(CompanyConfigService);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!companyConfig.hasBaseUrl()) {
    return router.createUrlTree(['/company-code']);
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

