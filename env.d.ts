// Cloudflare Workers bindings
// Use declaration merging to extend the CloudflareEnv interface from @cloudflare/next-on-pages
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
