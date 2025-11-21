export interface ToolResponse<T = any> {
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
  params: Record<string, any>;
}

export interface UserProfile {
  travelPrefs?: Record<string, any>;
  socialAccounts?: Record<string, any>;
  resumeUrl?: string;
  storageState?: string;
}
