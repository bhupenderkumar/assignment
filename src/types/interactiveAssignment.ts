// src/types/interactiveAssignment.ts

export type InteractiveAssignmentType =
  | 'MATCHING'
  | 'COMPLETION'
  | 'DRAWING'
  | 'COLORING'
  | 'MULTIPLE_CHOICE'
  | 'ORDERING'
  | 'TRACING'
  | 'AUDIO_READING'
  | 'COUNTING'
  | 'IDENTIFICATION'
  | 'PUZZLE'
  | 'SORTING'
  | 'HANDWRITING'
  | 'LETTER_TRACING'
  | 'NUMBER_RECOGNITION'
  | 'PICTURE_WORD_MATCHING'
  | 'PATTERN_COMPLETION'
  | 'CATEGORIZATION';

export type InteractiveAssignmentStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type SubmissionStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'GRADED';

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
}

export interface InteractiveAssignment {
  id: string;
  title: string;
  description: string;
  type: InteractiveAssignmentType;
  status: InteractiveAssignmentStatus;
  dueDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  audioInstructions?: string; // URL to audio file with instructions
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeMinutes?: number;
  hasAudioFeedback?: boolean;
  hasCelebration?: boolean;
  ageGroup?: string;
  requiresHelp?: boolean;
  shareableLink?: string;
  shareableLinkExpiresAt?: Date;
  questions?: InteractiveQuestion[];
  attachments?: FileAttachment[];
}

export interface InteractiveQuestion {
  id: string;
  assignmentId: string;
  questionType: InteractiveAssignmentType;
  questionText: string;
  questionData: any; // JSON data specific to question type
  order: number;
  audioInstructions?: string; // URL to audio file with question-specific instructions
  hintText?: string; // Optional hint for the user
  hintImageUrl?: string; // Optional hint image
  feedbackCorrect?: string; // Feedback text for correct answers
  feedbackIncorrect?: string; // Feedback text for incorrect answers
}

export interface InteractiveSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  status: SubmissionStatus;
  startedAt: Date;
  submittedAt?: Date;
  score?: number;
  feedback?: string;
  responses?: InteractiveResponse[];
  attachments?: FileAttachment[];
}

export interface InteractiveResponse {
  id: string;
  submissionId: string;
  questionId: string;
  responseData: any; // JSON data specific to response
  isCorrect?: boolean;
}

// Question type specific interfaces
export interface MatchingQuestion {
  pairs: {
    id: string;
    left: string;
    right: string;
    leftType?: 'text' | 'image';
    rightType?: 'text' | 'image';
  }[];
}

export interface CompletionQuestion {
  text: string;
  blanks: {
    id: string;
    answer: string;
    position: number;
  }[];
}

export interface MultipleChoiceQuestion {
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    imageUrl?: string;
  }[];
  allowMultiple: boolean;
}

export interface OrderingQuestion {
  items: {
    id: string;
    text: string;
    correctPosition: number;
    imageUrl?: string;
  }[];
}

export interface DrawingQuestion {
  instructions: string;
  backgroundImageUrl?: string;
  canvasWidth: number;
  canvasHeight: number;
}

// Response type specific interfaces
export interface MatchingResponse {
  pairs: {
    leftId: string;
    rightId: string;
  }[];
}

export interface CompletionResponse {
  answers: {
    blankId: string;
    answer: string;
  }[];
}

export interface MultipleChoiceResponse {
  selectedOptions: string[]; // Array of option IDs
}

export interface OrderingResponse {
  orderedItems: {
    id: string;
    position: number;
  }[];
}

export interface DrawingResponse {
  drawingData: string; // Base64 encoded image data
  completionPercentage?: number; // Percentage of completion (0-100)
}

// Anonymous user interface
export interface AnonymousUser {
  id: string;
  name: string;
  contactInfo?: string;
  createdAt: Date;
  lastActiveAt: Date;
}

// User progress interface
export interface UserProgress {
  id: string;
  userId: string;
  assignmentId: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  timeSpent?: number; // in seconds
  attempts: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  feedback?: string;
}
