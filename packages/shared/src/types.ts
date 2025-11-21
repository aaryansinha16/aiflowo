export interface ToolResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ToolError | null;
}

export interface ToolError {
  message: string;
  code: string;
}

export type TaskStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'paused';

export type TaskIntent =
  | 'flight_search'
  | 'book_flight'
  | 'apply_job'
  | 'fill_form'
  | 'post_social'
  | 'browser_action';

export interface TaskPlan {
  steps: TaskStep[];
}

export interface TaskStep {
  tool: string;
  params: Record<string, unknown>;
}

export interface UserProfile {
  travelPrefs?: Record<string, unknown>;
  socialAccounts?: Record<string, unknown>;
  resumeUrl?: string;
  storageState?: string;
}
