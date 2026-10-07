import { Component, signal } from '@angular/core';
import { Supabase } from '../supabase';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-survey',
  imports: [],
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
  selectedCategory = 'All';
  answerCount = 2;
  questionCount = 1;


  addAnswer() {
    if (this.answerCount < 5) {
      this.answerCount++;
    }
  }

  get questions() {
    return this.supabaseService.questions;
  }

  async ngOnInit() {
    const surveyId = this.route.snapshot.paramMap.get('id');
    if (!surveyId) return;
    await this.supabaseService.getQuestionsBySurvey(surveyId);
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

   selectCategory(category: string, event: Event) {
    event.stopPropagation();
    this.selectedCategory = category;
    this.dropdownOpen = false;
  }

   selectCreateSurveyCategory(category: string, event: Event) {
    event.stopPropagation();

    this.newSurveyCategory = category;
    this.categoryDropdownOpen = false;
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

  isSurveyComplete(): boolean {
    return this.questions().every(question => {
      const selected = this.selectedAnswers[question.id] ?? [];
      return selected.length > 0;
    });
  }
}

