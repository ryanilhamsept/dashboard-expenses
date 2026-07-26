import { AppState } from './js/state.js';
import { SupabaseService } from './js/services/supabaseService.js';
import { Navigation } from './js/components/navigation.js';
import { DashboardPage } from './js/pages/dashboard.js';
import { ExpensesPage } from './js/pages/expenses.js';
import { AnalyticsPage } from './js/pages/analytics.js';
import { BillsPage } from './js/pages/bills.js';
import { GoalsPage } from './js/pages/goals.js';
import { SavingPage } from './js/pages/saving.js';
import { InvestmentPage } from './js/pages/investment.js';
import { LockScreen } from './js/components/auth.js';

class App {
  constructor() {
    this.state = new AppState();
    this.supabaseService = new SupabaseService(this.state);
    
    // Instantiate pages & navigation
    this.navigation = new Navigation(this.state);
    this.dashboardPage = new DashboardPage(this.state);
    this.expensesPage = new ExpensesPage(this.state, this.supabaseService);
    this.analyticsPage = new AnalyticsPage(this.state);
    this.billsPage = new BillsPage(this.state);
    this.goalsPage = new GoalsPage(this.state, this.supabaseService);
    this.savingPage = new SavingPage(this.state, this.supabaseService);
    this.investmentPage = new InvestmentPage(this.state);
    this.lockScreen = new LockScreen(this.state, this.supabaseService);
    
    // Connect supabaseService to expensesPage to allow status updates
    this.supabaseService.setExpensesPage(this.expensesPage);
    this.wasLoggedIn = false;
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
    this.savingPage.init();
    this.investmentPage.init();

    // Subscribe pages to state changes
    this.state.subscribe(() => this.render());

    // Sync trigger on login / clear on logout
    this.state.subscribe(() => {
      const user = this.state.user;
      console.log("[App] State updated. User active:", user ? user.email : "none", "wasLoggedIn:", this.wasLoggedIn);
      if (user && !this.wasLoggedIn) {
        this.wasLoggedIn = true;
        this.supabaseService.syncData();
        this.loadGoalsFromSupabase();
      } else if (!user) {
        this.wasLoggedIn = false;
        // Reset rows to clear UI on logout
        if (this.state.rows.length > 0) {
          console.log("[App] User logged out, clearing rows.");
          this.state.setRows([]);
        }
        this.lockScreen.show();
      }
    });

    // Sidebar logout button setup
    const logoutBtn = document.querySelector("#logoutSidebarBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin keluar?")) {
          try {
            await this.supabaseService.signOut();
          } catch (err) {
            console.error("Logout error:", err);
          } finally {
            this.state.setUser(null);
            this.lockScreen.show();
            // Optional: reset the URL hash to avoid being stuck on #logout
            window.location.hash = "";
          }
        }
      });
    }

    // Clock ticker setup
    this.initClock();

    // Start background polling
    window.setInterval(() => {
      if (this.state.user) {
        this.supabaseService.syncData();
      }
    }, 60_000);
    
    // Initial render
    this.render();
  }

  async loadGoalsFromSupabase() {
    const remoteGoals = await this.supabaseService.fetchGoals();
    if (remoteGoals === null) return; // fetch failed, keep local goals

    if (remoteGoals.length > 0) {
      this.state.goals = remoteGoals;
      this.state.activeGoalId = remoteGoals[0].id;
      this.state.saveGoals();
      this.state.notify();
    } else if (this.state.goals.length > 0) {
      // First-time migration: push existing local goals up to Supabase
      this.state.goals.forEach((goal) => this.supabaseService.upsertGoal(goal));
    }
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
    const isInvestmentView = currentView === "investment";
    const isGoalsView = currentView === "goals";
    const isSavingView = currentView === "saving";

    // Global layout toggles
    document.querySelectorAll(".dashboard-only").forEach((item) => {
      item.classList.toggle("is-hidden", isAllExpensesView || isInvestmentView || isGoalsView || isSavingView);
    });
    document.querySelectorAll(".expenses-only").forEach((item) => {
      item.classList.toggle("is-hidden", !isAllExpensesView);
    });
    
    const expensesEl = document.querySelector("#expenses");
    const insightEl = document.querySelector("#insight");
    const metricsEl = document.querySelector("#dashboard");
    const gridEl = document.querySelector("#dashboardGrid");

    if (metricsEl) {
      metricsEl.classList.toggle("is-hidden", isGoalsView || isInvestmentView || isSavingView);
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
    this.investmentPage.render();
    this.savingPage.render();

    // Centralized visibility overrides to ensure correct active page
    const goalWriterEl = document.querySelector("#goalWriter");
    const investmentPageEl = document.querySelector("#investmentPage");

    if (metricsEl) {
      metricsEl.classList.toggle("is-hidden", isGoalsView || isInvestmentView || isSavingView);
    }
    if (gridEl) {
      gridEl.classList.toggle("is-hidden", isGoalsView || isInvestmentView || isSavingView);
    }
    if (goalWriterEl) {
      goalWriterEl.classList.toggle("is-hidden", !isGoalsView);
    }
    if (investmentPageEl) {
      investmentPageEl.classList.toggle("is-hidden", !isInvestmentView);
    }
  }
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
