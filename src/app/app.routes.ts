import { Routes } from '@angular/router';

import { TrainingPageComponent } from './components/training-page/training-page.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'train/listen/1' },
  { path: 'train/:topic/:level', component: TrainingPageComponent },
  { path: '**', redirectTo: 'train/listen/1' }
];
