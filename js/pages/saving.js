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

    // Form elements
    this.formEl = document.querySelector("#savingForm");
    this.inputId = document.querySelector("#savingEditingId");
    this.inputName = document.querySelector("#savingInputName");
    this.inputType = document.querySelector("#savingInputType");
    this.inputBalance = document.querySelector("#savingInputBalance");
    this.cancelBtn = document.querySelector("#savingCancelButton");

    this.setupEvents();
  }

  setupEvents() {
    if (this.formEl) {
      this.formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
          id: this.inputId.value || `acc-${Date.now()}`,
          name: this.inputName.value.trim(),
          type: this.inputType.value,
          starting_balance: Number(this.inputBalance.value) || 0,
          user_id: this.state.user.id
        };

        try {
          const { error } = await this.supabaseService.supabase
            .from("accounts")
            .upsert(payload);
          if (error) throw error;
          
          this.resetForm();
          await this.fetchAccounts();
          this.renderContent();
        } catch (err) {
          console.error("Failed to save account:", err);
          alert("Gagal menyimpan akun.");
        }
      });
    }

    if (this.cancelBtn) {
      this.cancelBtn.addEventListener("click", () => this.resetForm());
    }

    if (this.gridEl) {
      this.gridEl.addEventListener("click", async (e) => {
        const editBtn = e.target.closest(".edit-acc-btn");
        if (editBtn) {
          const accId = editBtn.dataset.id;
          const acc = this.accounts.find(a => a.id === accId);
          if (acc) {
            this.inputId.value = acc.id;
            this.inputName.value = acc.name;
            this.inputType.value = acc.type || "bank";
            this.inputBalance.value = acc.starting_balance;
            this.cancelBtn.classList.remove("is-hidden");
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          return;
        }

        const delBtn = e.target.closest(".delete-acc-btn");
        if (delBtn) {
          const accId = delBtn.dataset.id;
          if (confirm("Hapus akun ini? Transaksi yang menggunakan akun ini mungkin terpengaruh.")) {
            try {
              const { error } = await this.supabaseService.supabase
                .from("accounts")
                .delete()
                .eq("id", accId)
                .eq("user_id", this.state.user.id);
              if (error) throw error;
              await this.fetchAccounts();
              this.renderContent();
            } catch (err) {
              console.error("Failed to delete account:", err);
              alert("Gagal menghapus akun.");
            }
          }
        }
      });
    }
  }

  resetForm() {
    this.inputId.value = "";
    this.inputName.value = "";
    this.inputType.value = "bank";
    this.inputBalance.value = "";
    this.cancelBtn.classList.add("is-hidden");
  }

  async fetchAccounts() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from("accounts")
        .select("*")
        .eq("user_id", this.state.user.id)
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

    // Selalu fetch saat render agar akun sinkron jika user berubah
    this.fetchAccounts().then(() => this.renderContent());
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
      const currentBalance = Number(account.starting_balance) || 0;
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
          <div class="saving-card-meta" style="display: flex; justify-content: flex-end; align-items: center;">
            <div style="display: flex; gap: 0.5rem;">
              <button class="edit-acc-btn" data-id="${account.id}" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">Edit</button>
              <button class="delete-acc-btn" data-id="${account.id}" style="background: rgba(255,0,0,0.5); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
            </div>
          </div>
        </div>`;
    }).join("");

    this.gridEl.innerHTML = cardsHtml;
    this.totalEl.textContent = formatMoney(totalBalance);
    this.subtitleEl.textContent = `${this.accounts.length} akun terdaftar`;
  }
}
