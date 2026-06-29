import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isOffline = !supabaseUrl || !supabaseAnonKey

if (isOffline) {
  console.warn('[Supabase] Missing env vars — running in offline/demo mode')
}

// Real client only when credentials are present
export const supabase: SupabaseClient = isOffline
  ? ({
      auth: {
        signUp: async (_opts: { email: string; password: string; options?: { data?: Record<string, unknown> } }) => {
          const meta = _opts?.options?.data ?? {}
          const fakeUser = {
            id: crypto.randomUUID(),
            email: _opts.email,
            user_metadata: meta,
            created_at: new Date().toISOString(),
          }
          return { data: { user: fakeUser, session: null }, error: null }
        },
        signInWithPassword: async (_opts: { email: string; password: string }) => {
          const fakeUser = {
            id: crypto.randomUUID(),
            email: _opts.email,
            user_metadata: {},
            created_at: new Date().toISOString(),
          }
          return { data: { user: fakeUser, session: null }, error: null }
        },
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (_cb: unknown) => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
      },
      from: (_table: string) => ({
        insert: async () => ({ data: null, error: null }),
        update: (_vals: unknown) => ({
          eq: async () => ({ data: null, error: null }),
        }),
        select: (_cols?: string) => ({
          eq: (_col: string, _val: unknown) => ({
            order: (_col2: string, _opts?: unknown) => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      }),
      storage: {
        from: (_bucket: string) => ({
          upload: async () => ({ data: null, error: { message: 'Offline mode' } }),
          download: async () => ({ data: null, error: { message: 'Offline mode' } }),
          getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
          remove: async () => ({ data: null, error: { message: 'Offline mode' } }),
          list: async () => ({ data: [], error: null }),
        }),
      },
    } as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey)

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const signUp = (email: string, password: string, meta: Record<string, unknown>) =>
  supabase.auth.signUp({ email, password, options: { data: meta } })

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

export const onAuthChange = (cb: Parameters<SupabaseClient['auth']['onAuthStateChange']>[0]) =>
  supabase.auth.onAuthStateChange(cb)

// ─── Storage helpers ───────────────────────────────────────────────────────────
export const STORAGE_BUCKET = 'safety-guard'

export async function uploadFile(
  path: string,
  file: File | Blob,
  contentType?: string
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType, upsert: true })

  if (error) return { url: null, error: error.message }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path)

  return { url: urlData.publicUrl, error: null }
}

export async function deleteFile(path: string): Promise<{ error: string | null }> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])
  return { error: error ? error.message : null }
}

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  return data.publicUrl
}

export async function listFiles(folder = ''): Promise<{ files: { name: string; id: string }[]; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder)
  if (error) return { files: [], error: error.message }
  return { files: (data ?? []) as { name: string; id: string }[], error: null }
}
