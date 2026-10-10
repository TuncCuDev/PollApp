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

  currentSurvey: {
    id: string;
    title: string;
    category: string;
    description: string;
    end_date: string | null;
  } | null = null;

  formatEndDate(date: string | null): string {
  if (!date) {
    return '';
  }

  const [year, month, day] = date.substring(0, 10).split('-');
  return `${day}.${month}.${year}`;
}

  addAnswer(questionIndex: number) {
  if (this.surveyQuestions[questionIndex].answerCount < 5) {
    this.surveyQuestions[questionIndex].answerCount++;
  }
  }

  get questions() {
    return this.supabaseService.questions;
  }

  async ngOnInit() {
    const surveyId = this.route.snapshot.paramMap.get('id');
    if (!surveyId) return;
    await this.supabaseService.getQuestionsBySurvey(surveyId);
    this.currentSurvey = await this.supabaseService.getSurveyById(surveyId);
    this.votes = await this.supabaseService.getVotesBySurvey(surveyId);
  }

   createSurveyOpen = signal(false)

  openCreateSurvey() {
    this.createSurveyOpen.set(true)
  }

  closeCreateSurvey() {
    this.createSurveyOpen.set(false);
    this.selectedCategory = '';
    this.newSurveyCategory = '';
    this.categoryDropdownOpen = false;
    this.questionCount = 1;
    this.answerCount = 2;
  }

   toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

   toggleCategoryDropdown() {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  clearInput(input: HTMLInputElement | HTMLTextAreaElement) {
    input.value = '';
  }

  selectCreateSurveyCategory(category: string, event: Event) {
  event.stopPropagation();

  this.supabaseCategory = category;
  this.newSurveyCategory = category;
  this.categoryDropdownOpen = false;
}

   selectCategory(category: string, event: Event) {
    event.stopPropagation();
    this.selectedCategory = category;
    this.dropdownOpen = false;
  }

   get surveys(){
    return this.supabaseService.surveys;
  }

   get categories(): string[] {
    return [...new Set(
      this.surveys().map(survey => survey.category)
    )];
  }

  goToHome() {
    this.router.navigate(['/'])
  }

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

  isSelected(questionId: string, answer: string): boolean {
    return this.selectedAnswers[questionId]?.includes(answer) ?? false;
  }

  getVoteCount(questionId: string, answer: string): number {
    return this.votes.filter(
      vote =>
        vote.question_id === questionId &&
        vote.answer === answer
    ).length;
  }

  async completeSurvey() {
    const surveyId = this.route.snapshot.paramMap.get('id');
    if (!surveyId) return;

    try {await this.supabaseService.saveVotes(surveyId, this.selectedAnswers);
      this.router.navigate(['/']);
      } catch (error) {
      console.error('Survey konnte nicht gespeichert werden:', error);
    }
  }

  getPercentage(questionId: string, answer: string): number {
    const questionVotes = this.votes.filter(vote => vote.question_id === questionId);
    const selected = this.selectedAnswers[questionId] ?? [];
    const answerVotes = questionVotes.filter(vote => vote.answer === answer);

    const currentAnswerCount = answerVotes.length + (selected.includes(answer) ? 1 : 0);
    const totalVotes = questionVotes.length + (selected.length > 0 ? 1 : 0);

    if (totalVotes === 0) {return 0;}

    return Math.round((currentAnswerCount / totalVotes) * 100);
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
  this.successMessage.set(true);

  setTimeout(() => {
    this.successMessage.set(false);
    this.createSurveyOpen.set(false);
  }, 8000);

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

