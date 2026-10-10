import { Component, signal } from '@angular/core';
import { Supabase } from '../supabase';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface SurveyQuestionForm {
  question: string;
  description: string;
  answers: string[];
  multiple_answers: boolean;
  answerCount: number;
}
@Component({
  selector: 'app-mainpage',
  imports: [FormsModule],
  templateUrl: './mainpage.html',
  styleUrl: './mainpage.scss',
  
})
export class Mainpage {
  activeTab: 'active' | 'past' = 'active';
  dropdownOpen = false;
  selectedCategory = 'All';
  categoryDropdownOpen = false;
  newSurveyCategory = '';
  answerCount = 2;
  questionCount = 1;
  supabaseName = '';
  supabaseDescription = '';
  supabaseEndDate = '';
  supabaseCategory = '';
  successMessage = signal(false);
  surveyQuestions = [this.emptyQuestion()];

  constructor(
    private supabaseService: Supabase,
    private router: Router) {}

  /**
   * Loads all surveys from Supabase.
   */
  async ngOnInit() {
    await this.supabaseService.getSurveys();
  }

  /**
   * Provides access to have the surveys stored in the Supbase service.
   */
  get surveys(){
    return this.supabaseService.surveys;
  }

  /**
   * Adds another answer field to the selected question.
   * @param questionIndex 
   */
  addAnswer(questionIndex: number) {
    if (this.surveyQuestions[questionIndex].answerCount < 5) {
      this.surveyQuestions[questionIndex].answerCount++;
    }
  }

  /**
   * Clears the content of the specified input field or textarea.
   * @param input 
   */
  clearInput(input: HTMLInputElement | HTMLTextAreaElement) {
    input.value = '';
  }

  /**
   * Selects a category and closes the dropdown.
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
   * Calculates the number of days remaining until a survey’s end date.
   * @param endDate 
   * @returns 
   */
  getDaysLeft(endDate: string): number {
    const today = new Date();
    const end = new Date(endDate);
    const difference = end.getTime() - today.getTime();
    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

  /**
   * Filters surveys by the selected tab and category.
   */
  get filteredSurveys() {
    const today = new Date();
    return this.surveys().filter(survey => {
      const endDate = new Date(survey.end_date);
      const matchesTab = this.activeTab === 'active' ? endDate >= today : endDate < today;
      const matchesCategory = this.selectedCategory === 'All' || survey.category === this.selectedCategory;
      return matchesTab && matchesCategory;
    });
  }

  /**
   * Returns all unique categories from the surveys.
   */
  get categories(): string[] {
    return [...new Set(
      this.surveys().map(survey => survey.category)
    )];
  }

  /**
   * Opens or closes the category filter dropdown.
   */
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  /**
   * Selects a category and closes the dropdown.
   * @param category 
   * @param event 
   */
  selectCategory(category: string, event: Event) {
    event.stopPropagation();
    this.selectedCategory = category;
    this.dropdownOpen = false;
  }


  /**
   * Navigates to the selected survey’s detail page.
   * @param id 
   */
  openSurvey(id: string) {
    this.router.navigate(['survey', id])
  }

  /**
   * Tracks whether the create-survey overlay is open.
   */
  createSurveyOpen = signal(false)

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
    this.createSurveyOpen.set(false)

    this.selectedCategory = '';
    this.newSurveyCategory = '';
    this.categoryDropdownOpen = false;
    this.questionCount = 1;
    this.answerCount = 2;
  }

  /**
   * Opens or closes the category selection dropdown.
   */
  toggleCategoryDropdown() {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  /**
   * Returns the three active surveys with the nearest end dates.
   */
  get endingSoonSurveys() {
    const today = new Date();

    return this.surveys()
      .filter(survey => new Date(survey.end_date) >= today)
      .sort(
        (a, b) =>
          new Date(a.end_date).getTime() -
          new Date(b.end_date).getTime()
      )
      .slice(0, 3);
  }

   /**
   * Creates a new question with empty fields, five possible answers, multiple answers disabled, and two answer fields by default.
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
   * Coordinates saving the survey and its questions to Supabase.
   * @returns 
   */
  async saveSurvey() {
    const survey = await this.createSurveyRecord();
    if (!survey) return;

    const error = await this.saveSurveyQuestions(survey.id);
    if (error) return;

    this.showPublishSuccess();
  }

  /**
   * Saves the survey details and retrieves the new survey record.
   * @returns 
   */
  private createSurveyRecord() {
    return this.supabaseService.createSurvey(
      this.supabaseName,
      this.supabaseCategory,
      this.supabaseDescription,
      this.supabaseEndDate
    );
  }

  /**
   * Saves all questions linked to the survey.
   * @param surveyId 
   * @returns 
   */
  private async saveSurveyQuestions(surveyId: string) {
    const questions = this.buildQuestionsToSave(surveyId);
    return this.supabaseService.createQuestions(questions);
  }

  /**
   * Prepares the question data for database insertion.
   * @param surveyId 
   * @returns 
   */
  private buildQuestionsToSave(surveyId: string) {
    return this.surveyQuestions
      .slice(0, this.questionCount)
      .map((question, index) =>
        this.buildQuestionRow(question, index, surveyId)
      );
  }

  /**
   * Maps a question and its answers to the database column structure.
   * @param question 
   * @param index 
   * @param surveyId 
   * @returns 
   */
  private buildQuestionRow(
    question: SurveyQuestionForm,
    index: number,
    surveyId: string
  ) {
    return {
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
    };
  }

  /**
   * Displays the success message after publishing.
   */
  private showPublishSuccess() {
    this.successMessage.set(true);
    setTimeout(() => this.finishPublish(), 8000);
  }

  /**
   * Hides the success message and closes the creation overlay.
   */
  private finishPublish() {
    this.successMessage.set(false);
    this.resetSurveyForm();
    this.createSurveyOpen.set(false);
  }

  /**
   * Resets the survey fields and question settings.
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
}