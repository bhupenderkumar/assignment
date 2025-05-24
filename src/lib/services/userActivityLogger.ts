// src/lib/services/userActivityLogger.ts
import { getSupabase } from '../supabase';
import { User } from '@supabase/supabase-js';

export enum ActivityType {
  PAGE_VIEW = 'PAGE_VIEW',
  AUTH_EVENT = 'AUTH_EVENT',
  USER_ACTION = 'USER_ACTION',
  ERROR = 'ERROR'
}

export interface ActivityLogEntry {
  user_id?: string | null;
  activity_type: ActivityType;
  activity_description: string;
  page_url?: string;
  component?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

class UserActivityLogger {
  private static instance: UserActivityLogger;
  private isEnabled: boolean = true;
  private pendingLogs: ActivityLogEntry[] = [];
  private flushInterval: number = 10000; // 10 seconds
  private intervalId: number | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
    this.setupFlushInterval();
  }

  public static getInstance(): UserActivityLogger {
    if (!UserActivityLogger.instance) {
      UserActivityLogger.instance = new UserActivityLogger();
    }
    return UserActivityLogger.instance;
  }

  private setupFlushInterval(): void {
    if (this.intervalId === null) {
      this.intervalId = window.setInterval(() => {
        this.flushLogs();
      }, this.flushInterval);
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if the user_activity_log table exists
      const supabase = await getSupabase();
      const { error } = await supabase.from('user_activity_log').select('id').limit(1);

      // If there's an error, the table might not exist
      if (error) {
        console.warn('User activity logging is disabled: table might not exist', error);
        this.isEnabled = false;
      } else {
        this.isEnabled = true;
      }
    } catch (error) {
      console.error('Error initializing user activity logger:', error);
      this.isEnabled = false;
    }

    this.isInitialized = true;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public async logPageView(
    page: string,
    url: string,
    user: User | null = null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logActivity({
      user_id: user?.id,
      activity_type: ActivityType.PAGE_VIEW,
      activity_description: `Viewed ${page}`,
      page_url: url,
      component: page,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  public async logAuthEvent(
    event: string,
    user: User | null = null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logActivity({
      user_id: user?.id,
      activity_type: ActivityType.AUTH_EVENT,
      activity_description: event,
      page_url: window.location.href,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  public async logUserAction(
    action: string,
    component: string,
    user: User | null = null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logActivity({
      user_id: user?.id,
      activity_type: ActivityType.USER_ACTION,
      activity_description: action,
      page_url: window.location.href,
      component,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  public async logError(
    error: Error | string,
    component: string,
    user: User | null = null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    await this.logActivity({
      user_id: user?.id,
      activity_type: ActivityType.ERROR,
      activity_description: errorMessage,
      page_url: window.location.href,
      component,
      metadata: { ...metadata, stack: errorStack },
      timestamp: new Date().toISOString()
    });
  }

  private async logActivity(entry: ActivityLogEntry): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isEnabled) {
      // Log to console if database logging is disabled
      console.log('Activity Log:', entry);
      return;
    }

    // Add to pending logs
    this.pendingLogs.push(entry);

    // If we have too many pending logs, flush immediately
    if (this.pendingLogs.length >= 10) {
      this.flushLogs();
    }
  }

  private async flushLogs(): Promise<void> {
    if (!this.isEnabled || this.pendingLogs.length === 0) {
      return;
    }

    const logsToFlush = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      const supabase = await getSupabase();
      const { error } = await supabase.from('user_activity_log').insert(logsToFlush);

      if (error) {
        console.error('Error logging user activity:', error);
        // Put the logs back in the queue
        this.pendingLogs = [...logsToFlush, ...this.pendingLogs];
      }
    } catch (error) {
      console.error('Error flushing activity logs:', error);
      // Put the logs back in the queue
      this.pendingLogs = [...logsToFlush, ...this.pendingLogs];
    }
  }

  public dispose(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.flushLogs();
  }
}

export const getUserActivityLogger = (): UserActivityLogger => {
  return UserActivityLogger.getInstance();
};
