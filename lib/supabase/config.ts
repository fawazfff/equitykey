// These values identify the public Supabase API and are safe to ship to browsers.
// Database permissions are enforced by RLS; protected content is returned only by
// the server function after wallet and onchain verification.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ajqukplphetzavnfcxio.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_p7M3OA6dClrOTRM5sKHM2A_c8kjIPvu";
