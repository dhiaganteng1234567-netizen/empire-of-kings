/* =====================================
   EMPIRE OF KINGS
   SUPABASE CONFIGURATION
===================================== */

const SUPABASE_URL =
  "https://htujheimwwkaoirebfon.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_N2-MFHhtbzfTkI0HbfM67g_ylTdMTbV";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
