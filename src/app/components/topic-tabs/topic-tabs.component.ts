import { Component } from '@angular/core';
import { NgFor, TitleCasePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Topic } from '../../models/training-page.model';

@Component({
  selector: 'app-topic-tabs',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive, TitleCasePipe],
  templateUrl: './topic-tabs.component.html',
  styleUrl: './topic-tabs.component.css'
})
export class TopicTabsComponent {
  readonly tabs: Topic[] = ['listen', 'speak', 'read', 'write'];
}
