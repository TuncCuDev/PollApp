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

    console.log('Survey', survey)
    console.log('Error', error)

    if (!survey) return
    this.surveys.set(survey)
  }

    async getQuestions() {
    const { data: questions, error } = await this.supabase
    .from('questions')
    .select('*')

    console.log('Questions', questions)
    console.log('Error', error)

    if (!questions) return
    this.surveys.set(questions)
  }

}
