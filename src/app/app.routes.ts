import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'driven',
    loadComponent: () => import('./driven/driven.page').then((m) => m.DrivenPage),
  },
  {
    path: '',
    redirectTo: 'registro',
    pathMatch: 'full',
  },
];