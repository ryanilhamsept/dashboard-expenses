import { formatMoney } from '../utils.js';

const ACCOUNT_COLORS = {
  'mandiri': { bg: 'linear-gradient(135deg, #003d79, #005baa)', icon: '🏦' },
  'bca': { bg: 'linear-gradient(135deg, #003b71, #0060a9)', icon: '🏦' },
  'bni': { bg: 'linear-gradient(135deg, #e35205, #ff7b3a)', icon: '🏦' },
  'blu': { bg: 'linear-gradient(135deg, #0066ff, #338aff)', icon: '💙' },
  'superbank': { bg: 'linear-gradient(135deg, #6c2bd9, #9b59b6)', icon: '⭐' },
  'credit card - bca': { bg: 'linear-gradient(135deg, #c0392b, #e74c3c)', icon: '💳' },
  'credit card - bni': { bg: 'linear-gradient(135deg, #d35400, #e67e22)', icon: '💳' },
  'default': { bg: 'linear-gradient(135deg, #2d3748, #4a5568)', icon: '💰' }
};

function getAccountStyle(name) {
  const key = (name || '').toLowerCase();
  return ACCOUNT_COLORS[key] || ACCOUNT_COLORS['default'];
}

export class SavingPage {
  constructor(state, supabaseService) {
    this.state = state;
    this.supabaseService = supabaseService;
    this.accounts = [];
  }

  init() {
    this.pageEl = document.querySelector("#savingPage");
    this.gridEl = document.querySelector("#savingAccountsGrid");
    this.emptyEl = document.querySelector("#savingEmpty");
    this.totalEl = document.querySelector("#savingTotalBalance");
    this.subtitleEl = document.querySelector("#savingSubtitle");
  }

  async fetchAccounts() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from("accounts")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      this.accounts = data || [];
      console.log("[SavingPage] Fetched accounts:", this.accounts.length);
    } catch (err) {
      console.error("[SavingPage] Error fetching accounts:", err);
      this.accounts = [];
    }
  }

  render() {
    if (!this.pageEl) return;

    const isSavingView = this.state.currentView === "saving";
    this.pageEl.classList.toggle("is-hidden", !isSavingView);

    if (!isSavingView) return;

    if (this.accounts.length === 0) {
      this.fetchAccounts().then(() => this.renderContent());
    } else {
      this.renderContent();
    }
  }

  renderContent() {
    const { rows } = this.state;

    if (this.accounts.length === 0) {
      this.gridEl.classList.add("is-hidden");
      this.emptyEl.classList.remove("is-hidden");
      this.totalEl.textContent = "Rp 0";
      return;
    }

    this.emptyEl.classList.add("is-hidden");
    this.gridEl.classList.remove("is-hidden");

    // Calculate net flow per account from transactions
    const flowByAccount = {};
    for (const row of rows) {
      const source = (row.mode || "").trim();
      if (!source || source === "-") continue;

      if (!flowByAccount[source]) {
        flowByAccount[source] = { income: 0, expense: 0 };
      }

      if (row.type === "income") {
        flowByAccount[source].income += row.amount;
      } else {
        flowByAccount[source].expense += row.amount;
      }
    }

    // Render account cards
    let totalBalance = 0;

    const cardsHtml = this.accounts.map(account => {
      const style = getAccountStyle(account.name);
      const startBal = Number(account.starting_balance) || 0;
      const flow = flowByAccount[account.name] || { income: 0, expense: 0 };
      const currentBalance = startBal + flow.income - flow.expense;
      totalBalance += currentBalance;

      const typeLabel = (account.type || "bank").charAt(0).toUpperCase() + (account.type || "bank").slice(1);

      return `
        <div class="saving-card" style="background: ${style.bg};">
          <div class="saving-card-header">
            <span class="saving-card-icon">${style.icon}</span>
            <span class="saving-card-type">${typeLabel}</span>
          </div>
          <h3 class="saving-card-name">${account.name}</h3>
          <div class="saving-card-balance">${formatMoney(currentBalance)}</div>
          <div class="saving-card-meta">
            <span>Saldo Awal: ${formatMoney(startBal)}</span>
          </div>
        </div>`;
    }).join("");

    this.gridEl.innerHTML = cardsHtml;
    this.totalEl.textContent = formatMoney(totalBalance);
    this.subtitleEl.textContent = `${this.accounts.length} akun terdaftar`;
  }
}
