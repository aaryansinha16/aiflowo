'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { apiClient } from '@/lib/api-generated';
import { NewChatDialog, ResizableSidebar } from '@/components/molecules';
import { ChatSidebar, ChatView } from '@/components/organisms';
import type { Chat as ChatType, Message } from '@/components/organisms/ChatView';
import { useAuth } from '@/hooks/useAuth';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';

const log = createLogger('chat');

/**
 * Format task result into human-readable message
 * Uses the message field provided by tool handlers for consistent, scalable formatting
 */
function formatTaskResult(task: any): string {
  if (!task.result) return 'Task completed successfully!';
  
  // Handle lightweight responses (greetings, help, etc.)
  if (task.result.isLightweight && task.result.message) {
    return task.result.message;
  }
  
  const { results } = task.result;
  if (!results || !Array.isArray(results) || results.length === 0) {
    // Check if there's a direct message in result
    if (task.result.message) {
      return task.result.message;
    }
    return 'Task completed successfully!';
  }
  
  // Get the first step result
  const stepResult = results[0];
  
  // Use tool-provided message (preferred)
  if (stepResult.result?.message) {
    return stepResult.result.message;
  }
  
  // Fallback: try summary field
  if (stepResult.result?.summary) {
    return stepResult.result.summary;
  }
  
  // Handle flight search results
  if (stepResult.toolName === 'search_flights' && stepResult.result?.data?.flights) {
    const flights = stepResult.result.data.flights;
    if (flights.length === 0) {
      return '❌ No flights found for your search criteria.';
    }
    
    let message = `✈️ Found ${flights.length} flight${flights.length > 1 ? 's' : ''} from ${flights[0].from} to ${flights[0].to}:\n\n`;
    
    // Show all flights (they're already sorted by price from backend)
    flights.forEach((flight: any, index: number) => {
      const departureTime = new Date(flight.departure).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const arrivalTime = new Date(flight.arrival).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      // Parse duration (e.g., "PT2H30M" -> "2h 30m")
      const duration = flight.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm');
      
      // Highlight cheapest flight
      const isCheapest = index === 0;
      const prefix = isCheapest ? '🏆 ' : '';
      
      message += `${prefix}${index + 1}. **${flight.airline}** ${flight.flightNumber}\n`;
      message += `   ${flight.from} → ${flight.to}\n`;
      message += `   🕐 ${departureTime} - ${arrivalTime}\n`;
      message += `   ⏱️ ${duration} | ${flight.stops === 0 ? '✈️ Direct' : `🔄 ${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}\n`;
      message += `   💰 ₹${flight.price.toLocaleString('en-IN')}${isCheapest ? ' (Cheapest)' : ''}\n\n`;
    });
    
    message += `💡 All flights are sorted by price (lowest first).\n\n`;
    message += `Would you like me to help you book one of these flights? Just let me know the flight number!`;
    return message;
  }
  
  // Last resort: generic success message
  return `Task completed successfully using ${stepResult.toolName}`;
}

export default function ChatPage() {
  const router = useRouter();
  const { token, isAuthenticated, user, isLoading: authLoading, checkAuth } = useAuth();
  
  // State
  const [chats, setChats] = React.useState<ChatType[]>([]);
  const [activeChat, setActiveChat] = React.useState<string | undefined>();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [newChatDialogOpen, setNewChatDialogOpen] = React.useState(false);

  // Check auth on mount
  React.useEffect(() => {
    log.debug('Checking auth on mount');
    checkAuth();
  }, []);

  // Fetch chats after auth is checked
  React.useEffect(() => {
    log.debug('Auth state', { authLoading, isAuthenticated, token: token?.slice(0, 20) });

    // Wait for initial auth check
    if (authLoading) {
      log.debug('Waiting for auth to load');
      return;
    }
    
    // Redirect to login if not authenticated
    if (!isAuthenticated || !token) {
      log.debug('Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }
    
    log.debug('Authenticated, loading chats');
    loadChats();
  }, [token, isAuthenticated, authLoading]);

  // Load messages when active chat changes
  React.useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  const loadChats = async () => {
    if (!token) {
      log.debug('loadChats: no token available');
      return;
    }
    
    log.debug('loadChats: starting API call', { token: token.slice(0, 20) });

    try {
      setIsLoadingChats(true);
      setError(undefined);
      
      log.debug('Making API call to /chats');
      const { data, error } = await apiClient.GET('/api/chats', {
        params: {
          query: {
            limit: '100',
            offset: '0',
            orderBy: 'lastActivity',
          },
        },
      });
      
      if (error) {
        log.error('Failed to load chats', error);
        setError('Failed to load chats. Please refresh the page.');
        return;
      }
      
      log.debug('Chats loaded successfully', { count: data.length });
      setChats(data);
      
      // Auto-select first chat if none selected
      if (!activeChat && data.length > 0) {
        setActiveChat(data[0].id);
      }
    } catch (err) {
      log.error('Failed to load chats', err);
      setError('Failed to load chats. Please refresh the page.');
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Track active tasks for SSE subscriptions
  const [activeTasks, setActiveTasks] = React.useState<string[]>([]);

  // Subscribe to task updates via SSE (direct EventSource management)
  React.useEffect(() => {
    if (activeTasks.length === 0 || !token) return;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const eventSources: Map<string, EventSource> = new Map();

    activeTasks.forEach((taskId) => {
      // EventSource doesn't support custom headers, so pass token as query param
      const eventSource = new EventSource(
        `${API_BASE_URL}/api/tasks/${taskId}/stream?token=${encodeURIComponent(token)}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log.debug('Task update', { data });

          // Update message status in UI based on status
          let statusMessage = '';
          if (data.status === 'RUNNING') {
            statusMessage = `🔄 Processing your request...`;
          } else if (data.status === 'SUCCEEDED') {
            statusMessage = `✅ Task completed!`;
          } else if (data.status === 'FAILED') {
            statusMessage = `❌ Task failed: ${data.error || 'Unknown error'}`;
          }

          if (statusMessage) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id.includes(taskId)
                  ? {
                      ...msg,
                      content: statusMessage,
                    }
                  : msg
              )
            );
          }

          // Handle completion - reload to get formatted result
          if (data.status === 'SUCCEEDED') {
            log.debug('Task completed', { data });
            // Reload messages to get final formatted result
            if (activeChat) {
              setTimeout(() => loadMessages(activeChat), 500);
            }
            // Remove from active tasks
            setActiveTasks((prev) => prev.filter((id) => id !== taskId));
          } else if (data.status === 'FAILED') {
            log.error('Task failed', data);
            setError(`Task failed: ${data.error}`);
            // Remove from active tasks
            setActiveTasks((prev) => prev.filter((id) => id !== taskId));
          }
        } catch (error) {
          log.error('Failed to parse event', error);
        }
      };

      eventSource.onerror = (error) => {
        log.error('Connection error', error);
        eventSource.close();
        eventSources.delete(taskId);
      };

      eventSources.set(taskId, eventSource);
    });

    // Cleanup on unmount or when activeTasks changes
    return () => {
      log.debug('Cleaning up connections');
      eventSources.forEach((es) => es.close());
      eventSources.clear();
    };
  }, [activeTasks, activeChat, token]);

  const loadMessages = async (chatId: string) => {
    try {
      setIsLoadingMessages(true);
      setError(undefined);
      
      const { data: chat, error } = await apiClient.GET('/api/chats/{id}', {
        params: {
          path: { id: chatId },
        },
      }) as { data: any; error: any };
      
      if (error) {
        log.error('Failed to load messages', error);
        setError('Failed to load chat messages');
        return;
      }
      
      // Convert tasks to messages format
      const taskMessages: Message[] = [];
      const runningTasks: string[] = [];
      
      if (!chat || !chat.tasks) {
        setMessages([]);
        setActiveTasks([]);
        return;
      }
      
      chat.tasks.forEach((task: any) => {
        // Add user intent as user message
        taskMessages.push({
          id: `user-${task.id}`,
          role: 'user',
          content: task.intent,
          timestamp: task.createdAt,
        });
        
        // Track running tasks for SSE
        if (task.status === 'RUNNING' || task.status === 'PENDING') {
          runningTasks.push(task.id);
        }
        
        // Add task status/result as assistant message
        let assistantContent = '';
        if (task.status === 'RUNNING') {
          assistantContent = `🔄 Working on: ${task.title}\nStep ${task.currentStep} of ${task.totalSteps}`;
        } else if (task.status === 'SUCCEEDED') {
          const formattedResult = formatTaskResult(task);
          assistantContent = formattedResult;
        } else if (task.status === 'FAILED') {
          assistantContent = `❌ Failed: ${task.title}\n\nError: ${task.error || 'Unknown error'}`;
        } else if (task.status === 'PENDING') {
          assistantContent = `⏳ Queued: ${task.title}`;
        }
        
        if (assistantContent) {
          taskMessages.push({
            id: `assistant-${task.id}`,
            role: 'assistant',
            content: assistantContent,
            timestamp: task.updatedAt,
          });
        }
      });
      
      setMessages(taskMessages);
      setActiveTasks(runningTasks);
    } catch (err) {
      log.error('Failed to load messages', err);
      setError('Failed to load chat messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewChat = () => {
    setNewChatDialogOpen(true);
  };

  const handleCreateChat = async (firstMessage: string) => {
    try {
      setError(undefined);
      setIsSending(true);
      
      const { data: newChat, error } = await apiClient.POST('/api/chats', {
        body: {
          firstMessage,
        },
      });
      
      if (error) {
        log.error('Failed to create chat', error);
        setError('Failed to create new chat');
        return;
      }
      
      if (newChat) {
        setChats((prev) => [newChat, ...prev]);
        setActiveChat(newChat.id);
      }
    } catch (err) {
      log.error('Failed to create chat', err);
      setError('Failed to create new chat');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!activeChat || !message.trim()) return;

    try {
      setIsSending(true);
      setError(undefined);

      // Optimistically add user message
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // Create task
      const { data: newTask, error: taskError } = await apiClient.POST('/api/chats/{chatId}/tasks', {
        params: {
          path: {
            chatId: activeChat,
          },
        },
        body: {
          intent: message,
          priority: 'MEDIUM',
        } as any,
      });
      
      if (taskError || !newTask) {
        throw new Error('Failed to create task');
      }

      // Reload messages to get the actual task
      await loadMessages(activeChat);
      
      // Reload chat list to update lastMessage and taskCount
      await loadChats();
    } catch (err) {
      log.error('Failed to send message', err);
      setError('Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    // Keep sidebar open on desktop, close on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Resizable Sidebar */}
      <ResizableSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        defaultWidth={320}
        minWidth={240}
        maxWidth={600}
      >
        <ChatSidebar
          chats={chats.map((chat) => ({
            id: chat.id,
            title: chat.title,
            lastMessage: chat.lastMessage,
            lastActivity: chat.lastActivity,
            taskCount: chat.taskCount || 0,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
          }))}
          activeChat={activeChat}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          isLoading={isLoadingChats}
        />
      </ResizableSidebar>

      {/* Main Chat Area */}
      <div className="flex-1">
        <ChatView
          chatId={activeChat}
          messages={messages}
          isLoading={isSending || isLoadingMessages}
          error={error}
          userName={user?.name || 'You'}
          userAvatar={user?.profile?.profilePicUrl as string}
          onSendMessage={handleSendMessage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={newChatDialogOpen}
        onOpenChange={setNewChatDialogOpen}
        onSubmit={handleCreateChat}
        isLoading={isSending}
      />
    </div>
  );
}
