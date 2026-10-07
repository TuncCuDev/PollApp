import { Component, signal } from '@angular/core';
import { Supabase } from '../supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mainpage',
  imports: [],
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


  constructor(
    private supabaseService: Supabase,
    private router: Router) {}

  async ngOnInit() {
    await this.supabaseService.getSurveys();
  }

  get surveys(){
    return this.supabaseService.surveys;
  }

   addAnswer() {
    if (this.answerCount < 5) {
      this.answerCount++;
    }
  }

  clearInput(input: HTMLInputElement | HTMLTextAreaElement) {
  input.value = '';
}

addQuestion() {}

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

  selectCreateSurveyCategory(category: string, event: Event) {
    event.stopPropagation();

    this.newSurveyCategory = category;
    this.categoryDropdownOpen = false;
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
}
