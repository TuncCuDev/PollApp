import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { Survey, Question } from './interfaces/models';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://ovgibhfcndbxsbbzwmud.supabase.co'
  supabaseKey = "sb_publishable_HvUagpLMhL1ylpJs7tQOvQ_is9vHYnp"
  supabase = createClient(this.supabaseUrl, this.supabaseKey);

  surveys = signal<Survey[]>([]);
  questions = signal<Question[]>([])


  async getSurveys() {
    const { data: survey, error } = await this.supabase
    .from('surveys')
    .select('*')
    if (!survey) return
    this.surveys.set(survey)
  }

  async getQuestionsBySurvey(surveyId: string) {
    const { data: questions, error } = await this.supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId);

    if (!questions) return;
    this.questions.set(questions);
  }

  async saveVotes(
    surveyId: string,
    selectedAnswers: Record<string, string[]>) {
      const votes = Object.entries(selectedAnswers).flatMap(
        ([questionId, answers]) =>
          answers.map(answer => ({
            survey_id: surveyId,
            question_id: questionId,
            answer
      }))
    );
    if (votes.length === 0) return;

    const { error } = await this.supabase
      .from('votes')
      .insert(votes);

    if (error) {
      console.error('Fehler beim Speichern der Votes:', error);
      throw error;
    }
  }

  async getVotesBySurvey(surveyId: string) {
    const { data: votes, error } = await this.supabase
      .from('votes')
      .select('*')
      .eq('survey_id', surveyId);

    if (error) {
      console.error('Fehler beim Laden der Votes:', error);
      return [];
    }

    return votes ?? [];
  }
}
