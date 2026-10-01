import { Component } from '@angular/core';
import { Supabase } from '../supabase';

@Component({
  selector: 'app-mainpage',
  imports: [],
  templateUrl: './mainpage.html',
  styleUrl: './mainpage.scss',
})
export class Mainpage {

constructor(private supabaseService: Supabase) {}

  async ngOnInit() {
    await this.supabaseService.getSurveys();
    await this.supabaseService.getQuestions();
  }

  get surveys(){
    return this.supabaseService.surveys;
  }

  getDaysLeft(endDate: string): number {
    const today = new Date();
    const end = new Date(endDate);

    const difference = end.getTime() - today.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
}
}
