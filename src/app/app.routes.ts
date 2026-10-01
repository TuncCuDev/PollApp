import { Routes } from '@angular/router';
import { Mainpage } from './mainpage/mainpage';
import { Survey } from './survey/survey';

export const routes: Routes = [
      {
    path: '',
    component: Mainpage
  },
  {
    path: 'survey/:id',
    component: Survey
  }
];
