// src/types/interactiveSubmissionExtended.ts
import { InteractiveAssignment, InteractiveResponse, InteractiveSubmission } from './interactiveAssignment';

// Extended interface to handle the nested assignment data from the API
export interface InteractiveSubmissionExtended extends InteractiveSubmission {
  interactive_assignment?: {
    title: string;
    type: string;
    difficulty_level?: string;
  };
}
