import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Mainpage } from './mainpage/mainpage';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Mainpage],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('PollApp');
}
