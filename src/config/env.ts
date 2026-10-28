/**
 * Typed access to environment variables that are safe for the browser.
 * Server-only secrets must NOT be added here (see docs/ARCHITECTURE.md, "Environment variables").
 * NEXT_PUBLIC_* variables must be referenced literally so Next.js can inline them.
 */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhoifosfdzcmtczizzrb.supabase.co',
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2lmb3NmZHpjbXRjeml6enJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzk5MDUsImV4cCI6MjEwNzkxNTkwNX0.R-o3ibnlUkelWMYxk_XxdWmRVcRSrHVD2PiTXxIPIhQ',
} as const;
