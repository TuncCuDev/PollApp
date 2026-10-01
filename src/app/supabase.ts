import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { Survey, Question } from './interfaces/models';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://ovgibhfcndbxsbbzwmud.supabase.co'
  supabaseKey = "sb_publishable_HvUagpLMhL1ylpJs7tQOvQ_is9vHYnp"
                  
  supabase = createClient(
    this.supabaseUrl, 
    this.supabaseKey
  );

  surveys = signal<Survey[]>([]);
  questions = signal<Question[]>([])

  async getSurveys() {
    const { data: survey, error } = await this.supabase
    .from('surveys')
    .select('*')
    
    if (!survey) return
    this.surveys.set(survey)
  }

    async getQuestions() {
    const { data: questions, error } = await this.supabase
    .from('questions')
    .select('*')

    if (!questions) return
    this.questions.set(questions)
  }

}
