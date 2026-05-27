import { AppState } from './js/state.js';
import { SheetService } from './js/services/sheetService.js';
import { Navigation } from './js/components/navigation.js';
import { DashboardPage } from './js/pages/dashboard.js';
import { ExpensesPage } from './js/pages/expenses.js';
import { AnalyticsPage } from './js/pages/analytics.js';
import { BillsPage } from './js/pages/bills.js';
import { GoalsPage } from './js/pages/goals.js';
import { LockScreen } from './js/components/auth.js';

class App {
  constructor() {
    this.state = new AppState();
    this.sheetService = new SheetService(this.state);
    
    // Instantiate pages & navigation
    this.navigation = new Navigation(this.state);
    this.dashboardPage = new DashboardPage(this.state);
    this.expensesPage = new ExpensesPage(this.state, this.sheetService);
    this.analyticsPage = new AnalyticsPage(this.state);
    this.billsPage = new BillsPage(this.state);
    this.goalsPage = new GoalsPage(this.state, this.sheetService);
    this.lockScreen = new LockScreen();
    
    // Connect sheetService to expensesPage to allow status updates
    this.sheetService.setExpensesPage(this.expensesPage);
  }

  init() {
    // Initialize Lock Screen first to block visual access if locked
    this.lockScreen.init();

    // Initialize components & pages
    this.navigation.init();
    this.dashboardPage.init();
    this.expensesPage.init();
    this.analyticsPage.init();
    this.billsPage.init();
    this.goalsPage.init();

    // Subscribe pages to state changes
    this.state.subscribe(() => this.render());

    // Clock ticker setup
    this.initClock();

    // Start sync on load with a slight delay to ensure browser readiness
    window.setTimeout(() => {
      this.sheetService.syncSheet();
    }, 300);
    if (this.state.sheetDataUrl) {
      window.setInterval(() => this.sheetService.syncSheet(), 60_000);
    }
    
    // Initial render
    this.render();
  }

  initClock() {
    const clockEl = document.querySelector("#clock");
    if (!clockEl) return;
    
    const tick = () => {
      clockEl.textContent = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(new Date());
    };
    
    tick();
    setInterval(tick, 30_000);
  }

  render() {
    const { currentView } = this.state;
    const isAllExpensesView = currentView === "expenses";

    // Global layout toggles
    document.querySelectorAll(".dashboard-only").forEach((item) => {
      item.classList.toggle("is-hidden", isAllExpensesView);
    });
    document.querySelectorAll(".expenses-only").forEach((item) => {
      item.classList.toggle("is-hidden", !isAllExpensesView);
    });
    
    const expensesEl = document.querySelector("#expenses");
    const insightEl = document.querySelector("#insight");
    const metricsEl = document.querySelector("#dashboard");
    const gridEl = document.querySelector("#dashboardGrid");

    if (metricsEl) {
      metricsEl.classList.toggle("is-hidden", currentView === "goals");
    }

    if (isAllExpensesView) {
      if (metricsEl && insightEl && insightEl.parentElement !== metricsEl) {
        metricsEl.appendChild(insightEl);
      }
      if (insightEl) {
        insightEl.style.gridColumn = "auto";
      }
    } else {
      if (gridEl && insightEl && insightEl.parentElement !== gridEl) {
        gridEl.insertBefore(insightEl, expensesEl);
      }
      if (insightEl) {
        insightEl.style.gridColumn = "";
      }
    }

    // Call render on individual pages/components
    this.dashboardPage.render();
    this.expensesPage.render();
    this.analyticsPage.render();
    this.billsPage.render();
    this.goalsPage.render();
  }
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
