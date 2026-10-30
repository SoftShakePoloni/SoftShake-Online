// Test-only, in-memory transport. No credentials, network or production mutations.
export const supabase: any = {
  from(table: string) {
    let single = false;
    const query: any = new Proxy({}, { get(_, key) {
      if (key === 'then') return (resolve: any) => resolve({ data: single ? (window as any).__tables[table]?.[0] || null : (window as any).__tables[table] || [], error: null });
      return () => { if (key === 'single' || key === 'maybeSingle') single = true; return query; };
    }});
    return query;
  },
  channel() { const channel: any = { on() { return channel; }, subscribe() { return channel; }, unsubscribe() {} }; return channel; },
  removeChannel() {},
  auth: { signOut: async () => {}, getSession: async () => ({data: {session: null}}) },
};
export const createClient = () => supabase;
