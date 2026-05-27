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
      url = "https://script.google.com/macros/s/AKfycbwqU7YTDyvaXT8cW9cbWGYhVzxFR65g1eBT7Sej7L8u7mgAbrxT2G8DiCeoW46_4BbAuw/exec";
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
    this.rows = newRows;
    this.notify();
  }

  setView(view) {
    this.currentView = view;
    this.notify();
  }
}
