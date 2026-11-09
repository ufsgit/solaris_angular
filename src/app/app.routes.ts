import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'company-code',
    loadComponent: () =>
      import('./features/auth/company-code/company-code.component').then(
        (m) => m.CompanyCodeComponent
      ),
    canActivate: [guestGuard]
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'leads'
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./features/leads/lead-list/lead-list.component').then((m) => m.LeadListComponent)
      },
      {
        path: 'leads/create',
        loadComponent: () =>
          import('./features/leads/lead-form/lead-form.component').then((m) => m.LeadFormComponent)
      },
      {
        path: 'leads/:id/edit',
        loadComponent: () =>
          import('./features/leads/lead-form/lead-form.component').then((m) => m.LeadFormComponent)
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-list/task-list.component').then((m) => m.TaskListComponent)
      },
      {
        path: 'tasks/daily',
        loadComponent: () =>
          import('./features/tasks/task-overview/task-overview.component').then(
            (m) => m.TaskOverviewComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'leads'
  }
];
