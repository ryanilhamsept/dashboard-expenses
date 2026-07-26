import { createClient } from "@supabase/supabase-js";

export class SupabaseService {
  constructor(state) {
    this.state = state;
    this.expensesPage = null;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Main client — handles auth (login/logout/session)
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Reader client — no auth persistence, used for data queries
    // This avoids RLS filtering when transactions have no user_id
    this.reader = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  setExpensesPage(expensesPage) {
    this.expensesPage = expensesPage;
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  async signIn(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    const email = `${cleanUsername}@moneytracker.com`;
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data.user;
  }

  async signUp(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    const email = `${cleanUsername}@moneytracker.com`;

    // 1. Sign up user in Supabase Auth
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;

    if (data?.user) {
      // 2. Hash password client-side using SHA-256 (matches money-tracker)
      const hashedPassword = await this.hashPassword(password);

      // 3. Save username in public.users table
      const { error: dbError } = await this.supabase
        .from("users")
        .insert([
          {
            id: data.user.id,
            username: cleanUsername,
            password: hashedPassword
          }
        ]);
      if (dbError) {
        console.error("[SupabaseService] Failed to insert into users table:", dbError);
      }
    }
    return data.user;
  }

  async hashPassword(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async syncData() {
    try {
      this.expensesPage?.setLoading(true);
      this.expensesPage?.setSyncStatus("Fetching transactions from Supabase...");
      console.log("[SupabaseService] Fetching ALL transactions from Supabase...");

      // Supabase default limit = 1000 rows. Paginate to get everything.
      const PAGE_SIZE = 1000;
      let allData = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await this.reader
          .from("transactions")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        allData = allData.concat(data);
        console.log(`[SupabaseService] Fetched batch: ${data.length} rows (total so far: ${allData.length})`);

        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          from += PAGE_SIZE;
        }
      }

      console.log("[SupabaseService] Fetch complete. Total rows:", allData.length);

      // Map data from DB to frontend format
      const rows = allData.map((t, idx) => {
        const category = t.category || "Uncategorized";
        const inferredType =
          (String(category).toLowerCase().includes("income") ? "income" : "") ||
          (String(category).toLowerCase().includes("investment") ? "investment" : "") ||
          (String(category).toLowerCase().includes("subscription") ? "bill" : "expense");

        return {
          id: t.id,
          rowNumber: idx + 1,
          date: t.date || new Date().toISOString().slice(0, 10),
          amount: Number(t.amount) || 0,
          category: category,
          subcategory: t.title || "-",
          ambil: t.dana_dipakai || "-",
          mode: t.source || "-",
          type: inferredType
        };
      });

      this.state.transactionPage = 1;
      this.state.setRows(rows);

      this.expensesPage?.setSyncStatus(`Loaded ${rows.length} transactions from Supabase.`);
    } catch (error) {
      console.error("[SupabaseService] Sync data from Supabase failed:", error);
      this.expensesPage?.setSyncStatus(`Sync gagal: ${error.message}`, true);
    } finally {
      this.expensesPage?.setLoading(false);
    }
  }

  async updateExpense(transaction) {
    try {
      const dbPayload = {
        id: transaction.id,
        date: transaction.date,
        title: transaction.subcategory,
        category: transaction.category,
        amount: Number(transaction.amount),
        source: transaction.mode,
        dana_dipakai: transaction.ambil
      };

      const { error } = await this.supabase
        .from("transactions")
        .update(dbPayload)
        .eq("id", transaction.id);

      if (error) throw error;

      // Mirror to Google Sheets in background if configured
      void this.mirrorToGoogleSheets({
        action: "update",
        id: transaction.id,
        date: transaction.date,
        notes: transaction.subcategory,
        category: transaction.category,
        nominal: String(transaction.amount),
        ambil: transaction.ambil,
        sof: transaction.mode
      });
    } catch (error) {
      console.error("[SupabaseService] Failed to update transaction in Supabase:", error);
    }
  }

  async deleteExpense(id) {
    try {
      const { error } = await this.supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Mirror to Google Sheets in background if configured
      void this.mirrorToGoogleSheets({
        action: "delete",
        id: id
      });
    } catch (error) {
      console.error("[SupabaseService] Failed to delete transaction in Supabase:", error);
    }
  }

  async syncGoals(goals) {
    // Mirror to Google Sheets in background if configured
    void this.mirrorToGoogleSheets({
      action: "saveGoals",
      goals: JSON.stringify(goals)
    });
  }

  async mirrorToGoogleSheets(paramsObj) {
    const { sheetDataUrl } = this.state;
    if (!sheetDataUrl) return;

    try {
      const params = new URLSearchParams(paramsObj);
      const syncUrl = `${sheetDataUrl}${sheetDataUrl.includes("?") ? "&" : "?"}${params.toString()}`;
      const response = await fetch(syncUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      console.log("[SupabaseService] Background Google Sheets sync response:", text);
    } catch (error) {
      console.error("[SupabaseService] Google Sheets mirroring failed:", error);
    }
  }

  async importFromGoogleSheets(sheetUrl) {
    try {
      this.expensesPage?.setLoading(true);
      this.expensesPage?.setSyncStatus("Fetching data from Google Sheets...");

      const response = await fetch(sheetUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const text = await response.text();
      const { parseCSV, normalizeRows } = await import("../utils.js");
      const contentType = response.headers.get("content-type") || "";

      let rawRows = [];
      if (contentType.includes("json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
        const parsed = JSON.parse(text);
        rawRows = Array.isArray(parsed) ? parsed : parsed.rows || parsed.data || [];
      } else {
        rawRows = parseCSV(text);
      }

      const normalized = normalizeRows(rawRows);
      if (!normalized.length) {
        throw new Error("No valid transactions found in Google Sheets.");
      }

      this.expensesPage?.setSyncStatus(`Importing ${normalized.length} transactions to Supabase...`);

      // Upload to Supabase in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < normalized.length; i += chunkSize) {
        const chunk = normalized.slice(i, i + chunkSize);
        const dbPayloads = chunk.map(r => ({
          id: r.id,
          date: r.date,
          title: r.subcategory,
          category: r.category,
          amount: Number(r.amount),
          source: r.mode,
          dana_dipakai: r.ambil
        }));

        const { error } = await this.supabase
          .from("transactions")
          .upsert(dbPayloads);

        if (error) throw error;
      }

      this.expensesPage?.setSyncStatus(`Successfully imported ${normalized.length} transactions to Supabase!`);
      await this.syncData();
    } catch (error) {
      console.error("[SupabaseService] Import from Google Sheets failed:", error);
      this.expensesPage?.setSyncStatus(`Import gagal: ${error.message}`, true);
    } finally {
      this.expensesPage?.setLoading(false);
    }
  }
}
