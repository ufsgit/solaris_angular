import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompanyConfigService } from '../services/company-config.service';

export const companyGuard: CanActivateFn = () => {
  const companyConfig = inject(CompanyConfigService);
  const router = inject(Router);

  if (companyConfig.hasBaseUrl()) {
    return true;
  }

  return router.createUrlTree(['/company-code']);
};

