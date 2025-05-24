// Global TypeScript declarations

// Extend the Window interface to include our custom properties
interface Window {
  _supabaseReady?: boolean;
  _checkedPayments?: Record<string, boolean>;
}