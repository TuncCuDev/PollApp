import { Component, signal } from '@angular/core';
import { Supabase } from '../supabase';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-survey',
  imports: [FormsModule],
  templateUrl: './survey.html',
  styleUrl: './survey.scss',
})
export class Survey {
  selectedAnswers: Record<string, string[]> = {};
  votes: any[] = [];

  constructor(
    private supabaseService: Supabase,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  dropdownOpen = false;
  categoryDropdownOpen = false;
  newSurveyCategory = '';
  selectedCategory = '';
  answerCount = 2;
  questionCount = 1;
  supabaseName = '';
  supabaseDescription = '';
  supabaseEndDate = '';
  supabaseCategory = '';
  successMessage = signal(false);
  createSurveyOpen = signal(false);
  resultsOpen = true;

  currentSurvey: {
    id: string;
    title: string;
    category: string;
    description: string;
    end_date: string | null;
  } | null = null;

  /**
   * Converts a date into the DD.MM.YYYY format.
   * @param date 
   * @returns 
   */
  formatEndDate(date: string | null): string {
    if (!date) {
      return '';
    }
    const [year, month, day] = date.substring(0, 10).split('-');
    return `${day}.${month}.${year}`;
  }

  /**
   * Adds an answer field to a specific question, up to five options.
   * @param questionIndex 
   */
  addAnswer(questionIndex: number) {
    if (this.surveyQuestions[questionIndex].answerCount < 5) {
      this.surveyQuestions[questionIndex].answerCount++;
    }
  }

  /**
   * Provides access to the questions stored in the Supabase service.
   */
  get questions() {
    return this.supabaseService.questions;
  }

  /**
   * Loads the survey’s questions, details, and votes when the component initializes.
   * @returns 
   */
  async ngOnInit() {
    const surveyId = this.route.snapshot.paramMap.get('id');
    if (!surveyId) return;

    this.currentSurvey = await this.supabaseService.getSurveyById(surveyId);
      await this.supabaseService.getQuestionsBySurvey(surveyId);
    this.votes = await this.supabaseService.getVotesBySurvey(surveyId);
  }

  /**
   * Opens the create-survey overlay.
   */
  openCreateSurvey() {
    this.createSurveyOpen.set(true)
  }

  /**
   * Closes the overlay and resets the category and question settings.
   */
  closeCreateSurvey() {
    this.createSurveyOpen.set(false);
    this.selectedCategory = '';
    this.newSurveyCategory = '';
    this.categoryDropdownOpen = false;
    this.questionCount = 1;
    this.answerCount = 2;
  }

  /**
   * Opens or closes the survey filter dropdown.
   */
   toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  /**
   * Opens or closes the category dropdown.
   */
  toggleCategoryDropdown() {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  /**
   * Clears the content of an input field or textarea.
   * @param input 
   */
  clearInput(input: HTMLInputElement | HTMLTextAreaElement) {
    input.value = '';
  }

  /**
   * Selects a category for the new survey and closes the dropdown.
   * @param category 
   * @param event 
   */
  selectCreateSurveyCategory(category: string, event: Event) {
    event.stopPropagation();
    this.supabaseCategory = category;
    this.newSurveyCategory = category;
    this.categoryDropdownOpen = false;
  }

  /**
   * Selects a category filter and closes the dropdown.
   * @param category 
   * @param event 
   */
  selectCategory(category: string, event: Event) {
    event.stopPropagation();
    this.selectedCategory = category;
    this.dropdownOpen = false;
  }

  /**
   * Provides access to the surveys stored in the Supabase service.
   */
  get surveys(){
    return this.supabaseService.surveys;
  }

  /**
   * Returns a list of unique categories from the surveys.
   */
  get categories(): string[] {
    return [...new Set(
      this.surveys().map(survey => survey.category)
    )];
  }

  /**
   * Navigates back to the home page.
   */
  goToHome() {
    this.router.navigate(['/'])
  }

  /**
   * Selects or deselects an answer, allowing multiple selections when enabled.
   * @param questionId 
   * @param answer 
   * @returns 
   */
  selectAnswer(questionId: string, answer: string) {
    const question = this.questions().find(q => q.id === questionId);
    if (!question) return;
    const selected = this.selectedAnswers[questionId] ?? [];
      if (selected.includes(answer)) {
        this.selectedAnswers[questionId] = selected.filter(a => a !== answer);
        return;
      } 
    if (question.multiple_answers) {
      this.selectedAnswers[questionId] = [...selected,answer];
    } else {
      this.selectedAnswers[questionId] = [answer];
    }
  }

  /**
   * Checks whether an answer is currently selected.
   * @param questionId 
   * @param answer 
   * @returns 
   */
  isSelected(questionId: string, answer: string): boolean {
    return this.selectedAnswers[questionId]?.includes(answer) ?? false;
  }

  /**
   * Returns the number of votes for a specific answer.
   * @param questionId 
   * @param answer 
   * @returns 
   */
  getVoteCount(questionId: string, answer: string): number {
    return this.votes.filter(
      vote =>
        vote.question_id === questionId &&
        vote.answer === answer
    ).length;
  }

  /**
   * Saves the selected answers to Supabase and navigates to the home page.
   * @returns 
   */
  async completeSurvey() {
    const surveyId = this.route.snapshot.paramMap.get('id');
    if (!surveyId) return;

    try {await this.supabaseService.saveVotes(surveyId, this.selectedAnswers);
      this.router.navigate(['/']);
      } catch (error) {
      console.error('Survey konnte nicht gespeichert werden:', error);
    }
  }

  /**
   * Calculates the percentage of votes for an answer, including the current selection.
   * @param questionId 
   * @param answer 
   * @returns 
   */
  getPercentage(questionId: string, answer: string): number {
    const questionVotes = this.votes.filter(vote => vote.question_id === questionId);
    const selected = this.selectedAnswers[questionId] ?? [];
    const answerVotes = questionVotes.filter(vote => vote.answer === answer);
    const currentAnswerCount = answerVotes.length + (selected.includes(answer) ? 1 : 0);
    const totalVotes = questionVotes.length + (selected.length > 0 ? 1 : 0);

    if (totalVotes === 0) {return 0;}
    return Math.round((currentAnswerCount / totalVotes) * 100);
  }
  
  /**
   * Adds a new question, up to a maximum of four questions.
   */
  addQuestion() {
    if (this.questionCount < 4) {
      this.questionCount++;

      this.surveyQuestions = [
        ...this.surveyQuestions,
        this.emptyQuestion()
      ];
    }
  }

  /**
   * Stores the questions being created.
   */
  surveyQuestions = [
    this.emptyQuestion()
  ];

  /**
   * Creates a blank question with two answer fields and multiple answers disbaled by default.
   * @returns 
   */
  emptyQuestion() {
    return {
      question: '',
      description: '',
      answers: ['', '', '', '', ''],
      multiple_answers: false,
      answerCount: 2
    };
  }

  /**
   * Saves the survey details to Supabase and triggers the success message.
   * @returns 
   */
  async saveSurvey() {
    const survey = await this.supabaseService.createSurvey(
      this.supabaseName,
      this.supabaseCategory,
      this.supabaseDescription,
      this.supabaseEndDate
    );
    if (!survey) return;
    const questionsToSave = this.buildQuestionsToSave(survey.id);
    const saved = await this.saveQuestions(questionsToSave);
    if (!saved) return;
    this.successMessage.set(true);
    setTimeout(() => this.finishPublish(), 4000);
  }

  /**
   * Saves the prepared questions to Supabase and returns whether the operation succeeded.
   * @param questionsToSave 
   * @returns 
   */
  private async saveQuestions(questionsToSave: any[]): Promise<boolean> {
    const error = await this.supabaseService.createQuestions(questionsToSave);
    return !error;
  }

  /**
   * Prepares the question data for insertion into the database.
   * @param surveyId 
   * @returns 
   */
  private buildQuestionsToSave(surveyId: string) {
    return this.surveyQuestions
      .slice(0, this.questionCount)
      .map((question, index) => ({
        survey_id: surveyId,
        question_number: index + 1,
        question: question.question,
        description: question.description,
        answer_a: question.answers[0],
        answer_b: question.answers[1],
        answer_c: question.answers[2],
        answer_d: question.answers[3],
        answer_e: question.answers[4],
        multiple_answers: question.multiple_answers
      }));
  }

  /**
   * Hides the success message and closes the survey creation overlay.
   */
  private finishPublish() {
    this.successMessage.set(false);
    this.resetSurveyForm();
    this.createSurveyOpen.set(false);
    this.router.navigate(['/']);
  }

  /**
   * Clears the form fields and restores the default question settings.
   */
  private resetSurveyForm() {
    this.supabaseName = '';
    this.supabaseDescription = '';
    this.supabaseEndDate = '';
    this.supabaseCategory = '';
    this.newSurveyCategory = '';
    this.questionCount = 1;
    this.answerCount = 2;
    this.surveyQuestions = [this.emptyQuestion()];
    this.categoryDropdownOpen = false;
  }

  /**
   * Checks whether all required survey fields are completed.
   * @returns 
   */
  isSurveyComplete(): boolean {
  const questions = this.questions();

  if (!questions.length) {
    return false;
  }

  return questions.every(question => {
    const selected = this.selectedAnswers[question.id];
    return Array.isArray(selected) && selected.length > 0;
  });
}

  /**
   * Checks whether the survey name and category are provided.
   * @returns 
   */
  private areQuestionsComplete(): boolean {
    const questions = this.surveyQuestions.slice(0, this.questionCount);
    for (const question of questions) {
      if (!question.question.trim()) {
        return false;
      }
      for (let i = 0; i < this.answerCount; i++) {
        if (!question.answers[i]?.trim()) {
          return false;
        }
      }
    }
    return true;
  }
}

