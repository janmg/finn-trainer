import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { SubmissionPayload, TrainingPage, Topic } from '../models/training-page.model';

@Injectable({ providedIn: 'root' })
export class TrainingApiService {
  private readonly baseUrl = environment.apiBaseUrl || '/api';

  constructor(private readonly http: HttpClient) {}

  getPage(topic: Topic, level: number): Observable<TrainingPage> {
    const url = `${this.baseUrl}/pages/${topic}/${level}`;
    console.log(`[TrainingApiService] Making request to: ${url}`);
    console.time(`[TrainingApiService] Request duration for ${topic}/${level}`);

    return this.http.get<TrainingPage>(url).pipe(
      tap((response) => {
        console.timeEnd(`[TrainingApiService] Request duration for ${topic}/${level}`);
        console.log(`[TrainingApiService] Response received for ${topic}/${level}:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.timeEnd(`[TrainingApiService] Request duration for ${topic}/${level}`);
        console.error(`[TrainingApiService] Request failed for ${topic}/${level}:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error,
        });
        return throwError(() => error);
      })
    );
  }

  submit(payload: SubmissionPayload): Observable<{ message: string }> {
    const url = `${this.baseUrl}/submissions`;
    console.log(`[TrainingApiService] Submitting answer to: ${url}`, payload);
    console.time(`[TrainingApiService] Submit duration`);

    return this.http.post<{ message: string }>(url, payload).pipe(
      tap((response) => {
        console.timeEnd(`[TrainingApiService] Submit duration`);
        console.log(`[TrainingApiService] Submission successful:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.timeEnd(`[TrainingApiService] Submit duration`);
        console.error(`[TrainingApiService] Submission failed:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error,
        });
        return throwError(() => error);
      })
    );
  }
}
