import { Routes } from '@angular/router';

import { TrainingPageComponent } from './components/training-page/training-page.component';
import { ToolsPageComponent } from './components/tools-page/tools-page.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'train/listen/1' },
  { path: 'tools', component: ToolsPageComponent },
  { path: 'train/:topic/:level', component: TrainingPageComponent },
  { path: '**', redirectTo: 'train/listen/1' }
];
