/**
 * Task Updates Service
 * Manages Server-Sent Events for real-time task updates
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';

export interface TaskUpdateEvent {
  taskId: string;
  status: string;
  currentStep?: number;
  totalSteps?: number;
  message?: string;
  result?: any;
  error?: string;
  timestamp: string;
}

@Injectable()
export class TaskUpdatesService {
  private readonly logger = new Logger(TaskUpdatesService.name);
  private readonly taskStreams = new Map<string, Subject<TaskUpdateEvent>>();

  constructor(private readonly eventEmitter: EventEmitter2) {
    // Listen to task events from the system
    this.setupEventListeners();
  }

  /**
   * Get or create a stream for a task
   */
  getTaskStream(taskId: string): Subject<TaskUpdateEvent> {
    if (!this.taskStreams.has(taskId)) {
      this.logger.log(`Creating new SSE stream for task: ${taskId}`);
      this.taskStreams.set(taskId, new Subject<TaskUpdateEvent>());
    }
    
    return this.taskStreams.get(taskId)!;
  }

  /**
   * Send update to task stream
   */
  sendUpdate(taskId: string, update: Partial<TaskUpdateEvent>) {
    const stream = this.taskStreams.get(taskId);
    
    if (stream && !stream.closed) {
      const event: TaskUpdateEvent = {
        taskId,
        timestamp: new Date().toISOString(),
        ...update,
      };
      
      this.logger.log(`Sending SSE update for task ${taskId}: ${update.status || update.message}`);
      stream.next(event);
    }
  }

  /**
   * Complete and close a task stream
   */
  closeStream(taskId: string) {
    const stream = this.taskStreams.get(taskId);
    
    if (stream) {
      this.logger.log(`Closing SSE stream for task: ${taskId}`);
      stream.complete();
      this.taskStreams.delete(taskId);
    }
  }

  /**
   * Setup event listeners for task updates from the system
   */
  private setupEventListeners() {
    // Listen to task status changes
    this.eventEmitter.on('task.status.changed', (data: any) => {
      this.sendUpdate(data.taskId, {
        status: data.status,
        currentStep: data.currentStep,
        totalSteps: data.totalSteps,
        message: `Task status changed to ${data.status}`,
      });
    });

    // Listen to task step completion
    this.eventEmitter.on('task.step.completed', (data: any) => {
      this.sendUpdate(data.taskId, {
        status: 'RUNNING',
        currentStep: data.stepNumber,
        totalSteps: data.totalSteps,
        message: `Completed step ${data.stepNumber} of ${data.totalSteps}: ${data.stepName}`,
      });
    });

    // Listen to task completion
    this.eventEmitter.on('task.completed', (data: any) => {
      this.sendUpdate(data.taskId, {
        status: 'SUCCEEDED',
        result: data.result,
        message: 'Task completed successfully',
      });
      
      // Close stream after a delay to allow final message to be received
      setTimeout(() => this.closeStream(data.taskId), 1000);
    });

    // Listen to task failure
    this.eventEmitter.on('task.failed', (data: any) => {
      this.sendUpdate(data.taskId, {
        status: 'FAILED',
        error: data.error,
        message: `Task failed: ${data.error}`,
      });
      
      // Close stream after a delay
      setTimeout(() => this.closeStream(data.taskId), 1000);
    });
  }
}
