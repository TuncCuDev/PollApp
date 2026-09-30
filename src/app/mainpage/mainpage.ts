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
}
