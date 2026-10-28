import { Routes } from '@angular/router';
import { gmGuard, sheetGuard } from './core/auth/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage) },
  {
    path: 'ficha/:id',
    canActivate: [sheetGuard],
    loadComponent: () => import('./features/character-sheet/sheet-page').then((m) => m.SheetPage),
  },
  {
    path: 'mestre',
    canActivate: [gmGuard],
    loadComponent: () => import('./features/gm-panel/gm-panel').then((m) => m.GmPanel),
  },
  { path: '**', redirectTo: '' },
];
