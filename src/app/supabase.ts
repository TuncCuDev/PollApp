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


  /**
   * Retrieves all surveys from the database and updates the local survey list.
   * @returns 
   */
  async getSurveys() {
    const { data: survey, error } = await this.supabase
    .from('surveys')
    .select('*')
    if (!survey) return
    this.surveys.set(survey)
  }

  /**
   * Retrieves a specific survey by its ID.
   * @param surveyId 
   * @returns 
   */
  async getSurveyById(surveyId: string) {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('id, title, category, description, end_date')
      .eq('id', surveyId)
      .single();
    if (error) return null;
    return data;
  }

  /**
   * Retrieves all questions belonging to a specific survey.
   * @param surveyId 
   * @returns 
   */
  async getQuestionsBySurvey(surveyId: string) {
    const { data: questions, error } = await this.supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId);

    if (!questions) return;
    this.questions.set(questions);
  }

  /**
   * Saves the selected answers as votes in the database.
   * @param surveyId 
   * @param selectedAnswers 
   * @returns 
   */
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

    if (error) throw error;
  }

  /**
   * Retrieves all votes associated with a specific survey.
   * @param surveyId 
   * @returns 
   */
  async getVotesBySurvey(surveyId: string) {
    const { data: votes, error } = await this.supabase
      .from('votes')
      .select('*')
      .eq('survey_id', surveyId);
    if (error) return [];
    return votes ?? [];
  }

  /**Creates a new survey in the database and returns the created record.
   * 
   * @param title 
   * @param category 
   * @param description 
   * @param endDate 
   * @returns 
   */
  async createSurvey(
    title: string,
    category: string,
    description: string,
    endDate: string
  ) {
    const { data, error } = await this.supabase
      .from('surveys')
      .insert({
        title: title,
        category: category,
        description: description,
        end_date: endDate
      })
      .select()
      .single();
    if (error)return null;
    return data;
  }

  /**
   * Saves multiple questions to the database.
   * @param questions 
   * @returns 
   */
  async createQuestions(questions: any[]) {
    const { error } = await this.supabase
      .from('questions')
      .insert(questions);
    return error;
  }
}
