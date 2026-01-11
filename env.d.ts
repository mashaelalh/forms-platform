// Cloudflare Workers bindings for OpenNext
// This interface defines the bindings available in your Cloudflare Worker
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    FILES: R2Bucket;
    KV?: KVNamespace;
    APP_BASE_URL: string;
    PUBLIC_FORM_TOKEN_TTL_SECONDS: string;
    MAX_FILE_SIZE_MB: string;
    ADMIN_API_KEY?: string;
    TURNSTILE_SECRET?: string;
  }
}

export {};
