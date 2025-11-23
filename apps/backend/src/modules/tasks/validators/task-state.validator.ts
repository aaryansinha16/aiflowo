/**
 * Task State Validator
 * Validates task state transitions
 */

import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TaskStateValidator {
  /**
   * Valid state transition map
   */
  private readonly transitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.PENDING]: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
    [TaskStatus.RUNNING]: [
      TaskStatus.PAUSED,
      TaskStatus.SUCCEEDED,
      TaskStatus.FAILED,
      TaskStatus.CANCELLED,
    ],
    [TaskStatus.PAUSED]: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
    [TaskStatus.SUCCEEDED]: [], // Terminal state
    [TaskStatus.FAILED]: [], // Terminal state
    [TaskStatus.CANCELLED]: [], // Terminal state
  };

  /**
   * Validate if transition from one state to another is allowed
   */
  validateTransition(from: TaskStatus, to: TaskStatus): boolean {
    const validNextStates = this.transitions[from];
    return validNextStates.includes(to);
  }

  /**
   * Get valid next states for current status
   */
  getValidNextStates(current: TaskStatus): TaskStatus[] {
    return this.transitions[current] || [];
  }

  /**
   * Check if a status is terminal (cannot transition further)
   */
  isTerminalState(status: TaskStatus): boolean {
    return (
      status === TaskStatus.SUCCEEDED ||
      status === TaskStatus.FAILED ||
      status === TaskStatus.CANCELLED
    );
  }

  /**
   * Get error message for invalid transition
   */
  getTransitionErrorMessage(from: TaskStatus, to: TaskStatus): string {
    if (this.isTerminalState(from)) {
      return `Cannot transition from terminal state ${from}`;
    }

    const validStates = this.getValidNextStates(from);
    return `Cannot transition from ${from} to ${to}. Valid transitions: ${validStates.join(', ')}`;
  }
}
