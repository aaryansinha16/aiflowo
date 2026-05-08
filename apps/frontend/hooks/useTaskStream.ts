/**
 * useTaskStream Hook
 * Subscribe to real-time task updates via Server-Sent Events
 */

import { useEffect, useRef } from 'react';

import { createLogger } from '@/lib/logger';

const log = createLogger('sse:task');

export interface TaskUpdateEvent {
  taskId: string;
  status?: string;
  currentStep?: number;
  totalSteps?: number;
  message?: string;
  result?: any;
  error?: string;
  timestamp: string;
}

export interface UseTaskStreamOptions {
  taskId: string;
  enabled?: boolean;
  onUpdate?: (event: TaskUpdateEvent) => void;
  onComplete?: (event: TaskUpdateEvent) => void;
  onError?: (event: TaskUpdateEvent) => void;
}

export function useTaskStream({
  taskId,
  enabled = true,
  onUpdate,
  onComplete,
  onError,
}: UseTaskStreamOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !taskId) return;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const eventSource = new EventSource(`${API_BASE_URL}/api/tasks/${taskId}/stream`, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: TaskUpdateEvent = JSON.parse(event.data);
        log.debug('Task update', { data });

        // Call general update handler
        onUpdate?.(data);

        // Call specific handlers based on status
        if (data.status === 'SUCCEEDED') {
          onComplete?.(data);
        } else if (data.status === 'FAILED') {
          onError?.(data);
        }
      } catch (error) {
        log.error('Failed to parse event', error);
      }
    };

    eventSource.onerror = (error) => {
      log.error('Connection error', error);
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      log.debug('Closing connection', { taskId });
      eventSource.close();
    };
  }, [taskId, enabled, onUpdate, onComplete, onError]);

  return {
    close: () => eventSourceRef.current?.close(),
  };
}
