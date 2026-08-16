export type Topic = 'listen' | 'speak' | 'read' | 'write';

export interface TrainingPage {
  topic: Topic;
  level: number;
  title: string;
  explanation: string;
  exercise: string;
  isTemplate: boolean;
}

export interface SubmissionPayload {
  topic: Topic;
  level: number;
  answer: string;
}
