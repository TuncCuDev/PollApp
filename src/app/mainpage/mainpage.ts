import { Component } from '@angular/core';
import { Supabase } from '../supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mainpage',
  imports: [],
  templateUrl: './mainpage.html',
  styleUrl: './mainpage.scss',
})
export class Mainpage {

  constructor(
    private supabaseService: Supabase,
    private router: Router) {}

  async ngOnInit() {
    await this.supabaseService.getSurveys();
  }

  get surveys(){
    return this.supabaseService.surveys;
  }

  getDaysLeft(endDate: string): number {
    const today = new Date();
    const end = new Date(endDate);
    const difference = end.getTime() - today.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

  activeTab: 'active' | 'past' = 'active';
  dropdownOpen = false;
  selectedCategory = 'All';

  get filteredSurveys() {
    const today = new Date();

    return this.surveys().filter(survey => {
      const endDate = new Date(survey.end_date);

      if (this.activeTab === 'active') {
        return endDate >= today;
      }
      return endDate < today;
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

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.dropdownOpen = false;
  }

  openSurvey(id: string) {
    this.router.navigate(['survey', id])
  }

}
