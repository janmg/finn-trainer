import { Component, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, switchMap, takeUntil, timeout } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { TrainingApiService } from '../../services/training-api.service';
import { Topic, TrainingPage } from '../../models/training-page.model';

@Component({
  selector: 'app-training-page',
  standalone: true,
  imports: [DecimalPipe, FormsModule, NgFor, NgIf, RouterLink, RouterLinkActive, TitleCasePipe],
  templateUrl: './training-page.component.html',
  styleUrl: './training-page.component.css'
})
export class TrainingPageComponent implements OnInit, OnDestroy {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  page: TrainingPage | null = null;
  isLoading = true;
  errorMessage = '';
  answer = '';
  submitMessage = '';
  selectedLevel = 1;
  topic: Topic = 'listen';
  selectedLanguageTopic = 'vowels';
  loadTrace = 'init';
  isVowelLesson = false;
  vowels = ['a', 'e', 'i', 'o', 'u', 'y', 'ä', 'ö'];
  orderedVowels = ['a', 'o', 'u', 'ä', 'ö', 'y', 'å', 'e', 'i'];
  selectedVowel: string | null = null;
  isPlayingSession = false;
  currentVowel: string | null = null;
  currentRound = 0;
  soundStartTime = 0;
  isCorrect = false;
  totalReactionTime = 0;
  rankedVowels: { vowel: string; averageTime: number }[] = [];

  readonly languageTopics = ['vowels', 'consonants', 'numbers', 'people', 'verbs', 'grammer'];
  readonly trainingModes: Topic[] = ['listen', 'read', 'speak', 'write'];

  private readonly destroy$ = new Subject<void>();
  private soundQueue: string[] = [];
  private reactionTimesByVowel: Record<string, number[]> = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly trainingApi: TrainingApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[TrainingPageComponent] ngOnInit: Component initialized');

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParams) => {
        const languageTopic = queryParams.get('languageTopic');
        if (languageTopic && this.languageTopics.includes(languageTopic)) {
          this.selectedLanguageTopic = languageTopic;
          console.log('[TrainingPageComponent] Language topic changed to:', languageTopic);
        }
      });

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.isLoading = true;
          this.errorMessage = '';
          this.submitMessage = '';

          const topicParam = (params.get('topic') ?? 'listen').toLowerCase();
          const levelParam = Number(params.get('level') ?? '1');

          this.topic = this.isMode(topicParam) ? topicParam : 'listen';
          this.selectedLevel = this.toValidLevel(levelParam);
          this.loadTrace = `fetching ${this.topic}/${this.selectedLevel}`;

          console.log('[TrainingPageComponent] Route params updated:', {
            topicParam,
            levelParam,
            resolvedTopic: this.topic,
            resolvedLevel: this.selectedLevel,
            isValidTopic: this.isMode(topicParam)
          });

          console.log('[TrainingPageComponent] Calling trainingApi.getPage with:', {
            topic: this.topic,
            level: this.selectedLevel
          });

          return this.trainingApi.getPage(this.topic, this.selectedLevel).pipe(
            timeout(8000)
          );
        })
      )
      .subscribe({
        next: (page) => {
          console.log('[TrainingPageComponent] Page loaded successfully:', page);
          this.page = page;
          this.answer = '';
          this.selectedVowel = null;
          this.isLoading = false;
          this.isVowelLesson = this.topic === 'listen' && this.selectedLevel === 1 && this.selectedLanguageTopic === 'vowels';
          this.loadTrace = `loaded ${page.topic}/${page.level}`;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          console.error('[TrainingPageComponent] Error loading page:', error);
          this.page = null;
          this.isLoading = false;
          this.errorMessage = 'Unable to load this training page right now.';
          this.cdr.markForCheck();

          if (error instanceof HttpErrorResponse) {
            console.error('[TrainingPageComponent] HTTP Error:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              url: error.url,
              errorBody: error.error
            });
            this.loadTrace = `http ${error.status} while loading ${this.topic}/${this.selectedLevel}`;
            return;
          }

          if (error && typeof error === 'object' && 'name' in error && error.name === 'TimeoutError') {
            console.error('[TrainingPageComponent] Request timed out after 8 seconds');
            this.loadTrace = `timeout while loading ${this.topic}/${this.selectedLevel}`;
            return;
          }

          console.error('[TrainingPageComponent] Unknown error type:', {
            errorType: typeof error,
            errorKeys: error && typeof error === 'object' ? Object.keys(error as Record<string, unknown>) : 'N/A',
            error
          });
          this.loadTrace = `unknown error while loading ${this.topic}/${this.selectedLevel}`;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setLanguageTopic(value: string): void {
    this.selectedLanguageTopic = value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { languageTopic: value },
      queryParamsHandling: 'merge'
    });
  }

  onSliderInput(level: number): void {
    this.selectedLevel = this.toValidLevel(level);
  }

  onSliderCommit(levelValue: string): void {
    const validLevel = this.toValidLevel(Number(levelValue));
    if (validLevel === this.page?.level) {
      return;
    }
    this.router.navigate(['/train', this.topic, validLevel]);
  }

  submitAnswer(): void {
    console.log('[TrainingPageComponent] submitAnswer called');

    if (!this.page || !this.answer.trim()) {
      console.warn('[TrainingPageComponent] Cannot submit - page missing or answer empty:', {
        pageExists: !!this.page,
        answerTrimmed: this.answer.trim()
      });
      this.submitMessage = 'Enter an answer before submitting.';
      return;
    }

    const submission = {
      topic: this.page.topic,
      level: this.page.level,
      answer: this.answer.trim()
    };

    console.log('[TrainingPageComponent] Submitting answer:', submission);

    this.trainingApi
      .submit(submission)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('[TrainingPageComponent] Answer submitted successfully');
          this.submitMessage = 'Answer saved successfully.';
          this.answer = '';
        },
        error: (error: unknown) => {
          console.error('[TrainingPageComponent] Error submitting answer:', error);
          this.submitMessage = 'Could not save answer. Try again.';
        }
      });
  }

  private isMode(value: string): value is Topic {
    return value === 'listen' || value === 'speak' || value === 'read' || value === 'write';
  }

  private toValidLevel(level: number): number {
    if (Number.isNaN(level)) {
      return 1;
    }
    return Math.min(5, Math.max(1, Math.floor(level)));
  }

  selectVowel(vowel: string): void {
    if (!this.isPlayingSession || !this.currentVowel) {
      return;
    }

    const reactionTime = Date.now() - this.soundStartTime;
    const isMatch = vowel === this.currentVowel;

    console.log('[TrainingPageComponent] Vowel selected:', {
      selected: vowel,
      current: this.currentVowel,
      match: isMatch,
      reactionTime
    });

    this.isCorrect = isMatch;
    this.selectedVowel = vowel;
    this.totalReactionTime += reactionTime;
    this.reactionTimesByVowel[this.currentVowel] ??= [];
    this.reactionTimesByVowel[this.currentVowel].push(reactionTime);

    if (isMatch) {
      this.submitMessage = `✓ Correct! The sound was ${this.currentVowel.toUpperCase()} (${reactionTime}ms)`;
    } else {
      this.submitMessage = `✗ Incorrect. The sound was ${this.currentVowel.toUpperCase()}, you clicked ${vowel.toUpperCase()}. (${reactionTime}ms)`;
    }

    // Play next sound after a short delay
    setTimeout(() => {
      this.playNextSound();
    }, 1000);
  }

  submitVowelAnswer(): void {
    if (!this.selectedVowel || !this.page) {
      return;
    }

    const submission = {
      topic: this.page.topic,
      level: this.page.level,
      answer: this.selectedVowel
    };

    console.log('[TrainingPageComponent] Submitting vowel answer:', submission);

    this.trainingApi
      .submit(submission)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('[TrainingPageComponent] Vowel answer submitted successfully');
          this.submitMessage = 'Answer saved successfully.';
          this.selectedVowel = null;
        },
        error: (error: unknown) => {
          console.error('[TrainingPageComponent] Error submitting vowel answer:', error);
          this.submitMessage = 'Could not save answer. Try again.';
        }
      });
  }

  playAudio(): void {
    console.log('[TrainingPageComponent] Starting 20-sound session');
    
    if (!this.audioPlayer) {
      this.submitMessage = 'Audio element not found';
      return;
    }

    // Generate 20 random vowels
    this.soundQueue = [];
    for (let i = 0; i < 20; i++) {
      const randomVowel = this.vowels[Math.floor(Math.random() * this.vowels.length)];
      this.soundQueue.push(randomVowel);
    }

    this.isPlayingSession = true;
    this.currentRound = 0;
    this.totalReactionTime = 0;
    this.rankedVowels = [];
    this.reactionTimesByVowel = {};
    this.submitMessage = '';
    this.playNextSound();
  }

  private playNextSound(): void {
    if (this.currentRound >= 20) {
      this.endSession();
      return;
    }

    this.currentRound++;
    this.currentVowel = this.soundQueue[this.currentRound - 1];
    this.selectedVowel = null;
    this.submitMessage = '';

    const audioUrl = `/assets/vowels/${this.currentVowel}.ogg`;
    
    console.log(`[TrainingPageComponent] Playing sound ${this.currentRound}/20: ${this.currentVowel}`);
    
    this.audioPlayer!.nativeElement.src = audioUrl;
    this.soundStartTime = Date.now();
    
    this.audioPlayer!.nativeElement.play().catch((error) => {
      console.error('[TrainingPageComponent] Error playing audio:', error);
      this.submitMessage = 'Could not play audio file';
    });
  }

  playVowelAudio(vowel: string): void {
    if (!this.audioPlayer) {
      return;
    }

    const audio = this.audioPlayer.nativeElement;
    audio.src = `/assets/vowels/${vowel}.ogg`;
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.error('[TrainingPageComponent] Error playing vowel audio:', error);
    });
  }

  private endSession(): void {
    console.log('[TrainingPageComponent] Session completed');
    this.isPlayingSession = false;
    this.currentVowel = null;
    this.rankedVowels = Object.entries(this.reactionTimesByVowel)
      .map(([vowel, times]) => ({
        vowel,
        averageTime: Math.round(times.reduce((total, time) => total + time, 0) / times.length)
      }))
      .sort((first, second) => second.averageTime - first.averageTime);
    this.submitMessage = 'Session complete! Great job.';
  }

  stopAudio(): void {
    console.log('[TrainingPageComponent] Stopping audio');
    if (this.audioPlayer) {
      this.audioPlayer.nativeElement.pause();
      this.audioPlayer.nativeElement.currentTime = 0;
    }
    this.isPlayingSession = false;
    this.currentVowel = null;
    this.currentRound = 0;
    this.soundQueue = [];
    this.totalReactionTime = 0;
    this.rankedVowels = [];
    this.reactionTimesByVowel = {};
    this.submitMessage = '';
  }
}
