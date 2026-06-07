import { parseCSV, normalizeRows } from '../utils.js';

export class SheetService {
  constructor(state) {
    this.state = state;
    this.expensesPage = null; // will be set after both are instantiated
  }

  setExpensesPage(expensesPage) {
    this.expensesPage = expensesPage;
  }

  loadFromCSV(text) {
    const parsed = parseCSV(text);
    const rowsWithAmount = parsed.filter((row) => row.amount > 0);
    if (!rowsWithAmount.length) {
      throw new Error("Kolom Amount kebaca, tapi nominalnya kosong/0 semua. Cek format nominal di sheet.");
    }
    this.state.transactionPage = 1;
    this.state.setRows(rowsWithAmount);
    return rowsWithAmount.length;
  }

  loadFromJSON(data) {
    const sourceRows = Array.isArray(data) ? data : data.rows || data.data || [];
    const rowsWithAmount = normalizeRows(sourceRows);
    if (!rowsWithAmount.length) {
      throw new Error("Data Apps Script kebaca, tapi kolom Amount kosong/tidak valid.");
    }
    this.state.transactionPage = 1;
    this.state.setRows(rowsWithAmount);

    // Sync Goals from Google Sheets response if available
    if (data.goals && Array.isArray(data.goals) && data.goals.length > 0) {
      console.log("[SheetService] Found goals in Google Sheets response, syncing...", data.goals);
      this.state.goals = data.goals.map((g) => this.state.createGoal(g));
      this.state.saveGoals();
    }

    return rowsWithAmount.length;
  }

  async syncSheet() {
    const { sheetDataUrl } = this.state;
    console.log("[SheetService] Starting sync... URL:", sheetDataUrl);
    if (!sheetDataUrl) {
      const configPanel = document.querySelector("#sheetConfig");
      const urlInput = document.querySelector("#sheetUrl");
      if (configPanel) configPanel.classList.remove("is-hidden");
      if (urlInput) urlInput.focus();
      this.expensesPage?.setSyncStatus("Paste Apps Script Web App URL dulu, lalu Save URL.", true);
      return;
    }

    try {
      this.expensesPage?.setLoading(true);
      this.expensesPage?.setSyncStatus("Loading latest sheet data...");
      
      console.log("[SheetService] Fetching data from Apps Script...");
      const response = await fetch(sheetDataUrl);
      console.log("[SheetService] HTTP Response received. Status:", response.status, "OK:", response.ok);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const text = await response.text();
      const contentType = response.headers.get("content-type") || "";
      console.log("[SheetService] Data fetched. Content-Type:", contentType, "Size:", text.length, "chars");
      
      const totalRows = (contentType.includes("json") || text.trim().startsWith("{") || text.trim().startsWith("["))
        ? this.loadFromJSON(JSON.parse(text))
        : this.loadFromCSV(text);
        
      console.log("[SheetService] Sync successful! Rows loaded:", totalRows);
      this.expensesPage?.setSyncStatus(`Auto-updated ${totalRows} rows from Apps Script.`);
    } catch (error) {
      console.error("[SheetService] Sync failed with error:", error);
      this.expensesPage?.setSyncStatus(`Auto update gagal: ${error.message}`, true);
    } finally {
      this.expensesPage?.setLoading(false);
    }
  }

  async syncGoals(goals) {
    const { sheetDataUrl } = this.state;
    if (!sheetDataUrl) return;

    try {
      console.log("[SheetService] Syncing goals back to Google Sheet in the background...");
      const payload = encodeURIComponent(JSON.stringify(goals));
      const syncUrl = `${sheetDataUrl}${sheetDataUrl.includes("?") ? "&" : "?"}action=saveGoals&goals=${payload}`;

      const response = await fetch(syncUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      console.log("[SheetService] Background Goals sync response:", text);
    } catch (error) {
      console.error("[SheetService] Failed to sync goals in background:", error);
    }
  }

  async updateExpense(transaction) {
    const { sheetDataUrl } = this.state;
    if (!sheetDataUrl) return;

    try {
      console.log("[SheetService] Syncing expense update to Google Sheet in the background...", transaction);
      const params = new URLSearchParams({
        action: "update",
        id: transaction.id,
        date: transaction.date,
        notes: transaction.subcategory,
        category: transaction.category,
        nominal: String(transaction.amount),
        ambil: transaction.ambil,
        sof: transaction.mode,
      });
      const syncUrl = `${sheetDataUrl}${sheetDataUrl.includes("?") ? "&" : "?"}${params.toString()}`;

      const response = await fetch(syncUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      console.log("[SheetService] Background Expense update response:", text);
    } catch (error) {
      console.error("[SheetService] Failed to update expense in background:", error);
    }
  }

  async deleteExpense(id) {
    const { sheetDataUrl } = this.state;
    if (!sheetDataUrl) return;

    try {
      console.log("[SheetService] Syncing expense deletion to Google Sheet in the background...", id);
      const syncUrl = `${sheetDataUrl}${sheetDataUrl.includes("?") ? "&" : "?"}action=delete&id=${encodeURIComponent(id)}`;

      const response = await fetch(syncUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      console.log("[SheetService] Background Expense deletion response:", text);
    } catch (error) {
      console.error("[SheetService] Failed to delete expense in background:", error);
    }
  }
}
