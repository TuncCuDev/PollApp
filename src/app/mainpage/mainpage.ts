import { Component, signal } from '@angular/core';
import { Supabase } from '../supabase';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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


  constructor(
    private supabaseService: Supabase,
    private router: Router) {}

  async ngOnInit() {
    await this.supabaseService.getSurveys();
  }

  get surveys(){
    return this.supabaseService.surveys;
  }

  addAnswer(questionIndex: number) {
  if (this.surveyQuestions[questionIndex].answerCount < 5) {
    this.surveyQuestions[questionIndex].answerCount++;
  }
}

  clearInput(input: HTMLInputElement | HTMLTextAreaElement) {
  input.value = '';
}

selectCreateSurveyCategory(category: string, event: Event) {
    event.stopPropagation();

    this.supabaseCategory = category;
    this.categoryDropdownOpen = false;
  }

  addQuestion() {
    if (this.questionCount < 4) {
      this.questionCount++;

      this.surveyQuestions = [
        ...this.surveyQuestions,
        this.emptyQuestion()
      ];
    }
  }

  getDaysLeft(endDate: string): number {
    const today = new Date();
    const end = new Date(endDate);
    const difference = end.getTime() - today.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

 get filteredSurveys() {
  const today = new Date();
  return this.surveys().filter(survey => {
    const endDate = new Date(survey.end_date);
    const matchesTab = this.activeTab === 'active' ? endDate >= today : endDate < today;
    const matchesCategory = this.selectedCategory === 'All' || survey.category === this.selectedCategory;

    return matchesTab && matchesCategory;
  });
}

  get categories(): string[] {
    return [...new Set(
      this.surveys().map(survey => survey.category)
    )];
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectCategory(category: string, event: Event) {
    event.stopPropagation();
    this.selectedCategory = category;
    this.dropdownOpen = false;
  }

  openSurvey(id: string) {
    this.router.navigate(['survey', id])
  }

  createSurveyOpen = signal(false)

  openCreateSurvey() {
    this.createSurveyOpen.set(true)
  }

  closeCreateSurvey() {
    this.createSurveyOpen.set(false)

    this.selectedCategory = '';
    this.newSurveyCategory = '';
    this.categoryDropdownOpen = false;
    this.questionCount = 1;
    this.answerCount = 2;
  }

  toggleCategoryDropdown() {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

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

  surveyQuestions = [
    this.emptyQuestion()
  ];

  emptyQuestion() {
  return {
    question: '',
    description: '',
    answers: ['', '', '', '', ''],
    multiple_answers: false,
    answerCount: 2
  };
}

  async saveSurvey() {
  const survey = await this.supabaseService.createSurvey(
    this.supabaseName,
    this.supabaseCategory,
    this.supabaseDescription,
    this.supabaseEndDate
  );

  if (!survey) {
    return;
  }

  const questionsToSave = this.surveyQuestions
    .slice(0, this.questionCount)
    .map((question, index) => ({
      survey_id: survey.id,
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

  const error = await this.supabaseService.createQuestions(
    questionsToSave
  );

  if (error) {
    return;
  }

  this.supabaseName = '';
  this.supabaseDescription = '';
  this.supabaseEndDate = '';
  this.supabaseCategory = '';

  this.questionCount = 1;
  this.answerCount = 2;
  this.surveyQuestions = [this.emptyQuestion()];

  this.categoryDropdownOpen = false;
  this.createSurveyOpen.set(false);

  console.log('Survey erfolgreich gespeichert!');
}

isSurveyComplete(): boolean {
  if (!this.supabaseName.trim()) {
    return false;
  }

  if (!this.supabaseCategory.trim()) {
    return false;
  }

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
