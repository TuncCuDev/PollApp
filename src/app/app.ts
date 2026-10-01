import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Mainpage } from './mainpage/mainpage';
import { Survey } from './survey/survey';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Mainpage, Survey],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('PollApp');
}
