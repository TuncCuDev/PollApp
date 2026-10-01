import { Component } from '@angular/core';
import { Supabase } from '../supabase';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-survey',
  imports: [],
  templateUrl: './survey.html',
  styleUrl: './survey.scss',
})
export class Survey {
  constructor(
    private supabaseService: Supabase,
    private route: ActivatedRoute
  ) {}

  get questions() {
    return this.supabaseService.questions;
  }

  async ngOnInit() {
    const surveyId = this.route.snapshot.paramMap.get('id');
    if (!surveyId) return;

    await this.supabaseService.getQuestionsBySurvey(surveyId);
  }
}
