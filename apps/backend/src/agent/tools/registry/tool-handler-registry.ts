/**
 * Tool Handler Registry
 * Manages registration and retrieval of tool handlers
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { ToolName } from '../../types/tools.types';
import { ToolHandler } from '../executor/tool-handler.interface';

/**
 * Registry for managing tool handlers
 */
@Injectable()
export class ToolHandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(ToolHandlerRegistry.name);
  private readonly handlers = new Map<ToolName, ToolHandler>();

  onModuleInit() {
    this.logger.log(
      `Tool Handler Registry initialized with ${this.handlers.size} handlers`
    );
  }

  /**
   * Register a tool handler
   */
  registerHandler(handler: ToolHandler): void {
    if (this.handlers.has(handler.name)) {
      this.logger.warn(
        `Handler for tool ${handler.name} already registered, overwriting`
      );
    }

    this.handlers.set(handler.name, handler);
    this.logger.debug(`Registered handler for tool: ${handler.name}`);
  }

  /**
   * Register multiple handlers at once
   */
  registerHandlers(handlers: ToolHandler[]): void {
    handlers.forEach((handler) => this.registerHandler(handler));
    this.logger.log(`Registered ${handlers.length} tool handlers`);
  }

  /**
   * Get handler for a specific tool
   */
  getHandler(toolName: ToolName): ToolHandler | undefined {
    return this.handlers.get(toolName);
  }

  /**
   * Get handler or throw error if not found
   */
  getHandlerOrThrow(toolName: ToolName): ToolHandler {
    const handler = this.getHandler(toolName);
    if (!handler) {
      throw new Error(`No handler registered for tool: ${toolName}`);
    }
    return handler;
  }

  /**
   * Check if a handler is registered for a tool
   */
  hasHandler(toolName: ToolName): boolean {
    return this.handlers.has(toolName);
  }

  /**
   * Get all registered handlers
   */
  getAllHandlers(): ToolHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Get all registered tool names
   */
  getRegisteredToolNames(): ToolName[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get count of registered handlers
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }

  /**
   * Clear all registered handlers (mainly for testing)
   */
  clearAll(): void {
    this.handlers.clear();
    this.logger.warn('All handlers cleared from registry');
  }
}
