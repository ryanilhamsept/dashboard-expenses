export class AppState {
  constructor() {
    this.listeners = [];
    this.rows = [];
    this.sheetDataUrl = "";
    this.transactionPage = 1;
    this.currentView = "dashboard";
    this.goals = [];
    this.activeGoalId = "";

    this.loadState();
  }

  loadState() {
    let url = localStorage.getItem("expenseDashboardSheetUrl") || "";
    if (!url.startsWith("https://script.google.com")) {
      url = "https://script.google.com/macros/s/AKfycby3wCtf8Inf4DQ49N2EdudHWhJTo1PYp00oJxqHR6OMQRBf8W1chYWM6ow-JwriYuxUAw/exec";
    }
    this.sheetDataUrl = url;
    this.transactionPage = 1;
    this.currentView = (window.location.hash || "#dashboard").replace("#", "");

    // Load goals from local storage
    const storedGoals = JSON.parse(localStorage.getItem("expenseDashboardGoals") || "null");
    const legacyGoal = JSON.parse(localStorage.getItem("expenseDashboardGoal") || "null");

    this.goals = (
      storedGoals?.length
        ? storedGoals
        : [legacyGoal || { name: "Apple iPhone 17 Pro", required: 145000, collected: 75000 }]
    ).map(this.createGoal);

    this.activeGoalId = localStorage.getItem("expenseDashboardActiveGoal") || (this.goals[0] ? this.goals[0].id : "");

    // Load local edits and deletes for expenses
    this.editedRows = JSON.parse(localStorage.getItem("expenseDashboardEditedRows") || "{}");
    this.deletedRowIds = JSON.parse(localStorage.getItem("expenseDashboardDeletedRowIds") || "[]");
  }

  createGoal(goal) {
    return {
      id: goal.id || `goal-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      name: goal.name || "Untitled Goal",
      required: Number(goal.required) || 1,
      collected: Number(goal.collected) || 0
    };
  }

  saveGoals() {
    localStorage.setItem("expenseDashboardGoals", JSON.stringify(this.goals));
    localStorage.setItem("expenseDashboardActiveGoal", this.activeGoalId);
  }

  saveSheetUrl(url) {
    this.sheetDataUrl = url;
    localStorage.setItem("expenseDashboardSheetUrl", url);
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("Error in state subscriber callback:", err);
      }
    });
  }

  setRows(newRows) {
    // Apply local edits and filter out deleted rows
    const mergedRows = newRows.map((row) => {
      if (this.editedRows[row.id]) {
        return { ...row, ...this.editedRows[row.id] };
      }
      return row;
    });

    const activeRows = mergedRows.filter((row) => !this.deletedRowIds.includes(row.id));

    this.rows = activeRows;
    this.notify();
  }

  updateExpense(id, updatedFields) {
    this.editedRows[id] = { ...this.editedRows[id], ...updatedFields };
    localStorage.setItem("expenseDashboardEditedRows", JSON.stringify(this.editedRows));

    this.rows = this.rows.map((row) => {
      if (row.id === id) {
        return { ...row, ...updatedFields };
      }
      return row;
    });
    this.notify();
  }

  deleteExpense(id) {
    if (!this.deletedRowIds.includes(id)) {
      this.deletedRowIds.push(id);
      localStorage.setItem("expenseDashboardDeletedRowIds", JSON.stringify(this.deletedRowIds));
    }

    this.rows = this.rows.filter((row) => row.id !== id);
    this.notify();
  }

  setView(view) {
    this.currentView = view;
    this.notify();
  }
}
