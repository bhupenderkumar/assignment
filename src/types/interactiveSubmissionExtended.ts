// src/types/interactiveSubmissionExtended.ts
import { InteractiveAssignment, InteractiveResponse, InteractiveSubmission } from './interactiveAssignment';

// Extended interface to handle the nested assignment data from the API
export interface InteractiveSubmissionExtended extends InteractiveSubmission {
  // Properties from the database that might come in snake_case
  assignment_id?: string;
  user_id?: string;
  started_at?: string | Date;
  submitted_at?: string | Date;

  // Nested assignment data
  interactive_assignment?: {
    title: string;
    type: string;
    difficulty_level?: string;
  };

  // Additional properties for UI display
  assignmentTitle?: string;
}
