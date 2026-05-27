export class LockScreen {
  constructor() {
    this.pin = "";
    this.correctPin = localStorage.getItem("expenseDashboardPin") || "1209";
    this.sessionUnlocked = sessionStorage.getItem("expenseDashboardUnlocked") === "true";
  }

  init() {
    this.overlayEl = document.querySelector("#lockScreen");
    this.titleEl = document.querySelector("#lockTitle");
    this.subtitleEl = document.querySelector("#lockSubtitle");
    this.errorEl = document.querySelector("#lockError");
    this.dots = document.querySelectorAll(".pin-dot");
    this.keys = document.querySelectorAll(".key");

    if (!this.overlayEl) return;

    // Check if session is already unlocked
    if (this.sessionUnlocked) {
      this.overlayEl.classList.add("is-hidden");
      return;
    }

    // Set title based on whether PIN exists
    if (!this.correctPin) {
      if (this.titleEl) this.titleEl.textContent = "Setup Passcode";
      if (this.subtitleEl) this.subtitleEl.textContent = "Buat 4-digit PIN baru untuk mengunci dashboard Anda.";
    }

    this.setupListeners();
  }

  setupListeners() {
    this.keys.forEach((key) => {
      key.addEventListener("click", () => {
        const val = key.dataset.value;
        this.handleKey(val);
      });
    });

    // Keyboard support
    document.addEventListener("keydown", (e) => {
      if (!this.overlayEl || this.overlayEl.classList.contains("is-hidden")) return;

      if (e.key >= "0" && e.key <= "9") {
        this.handleKey(e.key);
      } else if (e.key === "Backspace") {
        this.handleKey("back");
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        this.handleKey("clear");
      }
    });
  }

  handleKey(val) {
    if (this.errorEl) this.errorEl.classList.add("is-hidden");

    if (val === "clear") {
      this.pin = "";
    } else if (val === "back") {
      this.pin = this.pin.slice(0, -1);
    } else if (this.pin.length < 4) {
      this.pin += val;
    }

    this.updateDots();

    if (this.pin.length === 4) {
      window.setTimeout(() => this.checkPin(), 180);
    }
  }

  updateDots() {
    this.dots.forEach((dot, idx) => {
      dot.classList.toggle("filled", idx < this.pin.length);
    });
  }

  checkPin() {
    if (!this.correctPin) {
      // First-time setup
      localStorage.setItem("expenseDashboardPin", this.pin);
      this.correctPin = this.pin;
      sessionStorage.setItem("expenseDashboardUnlocked", "true");
      
      // Animate unlock
      this.unlock();
      alert("PIN Keamanan berhasil dibuat! Dashboard Anda sekarang aman. 🔐");
    } else if (this.pin === this.correctPin) {
      // Correct PIN
      sessionStorage.setItem("expenseDashboardUnlocked", "true");
      this.unlock();
    } else {
      // Incorrect PIN
      this.pin = "";
      this.updateDots();
      if (this.errorEl) {
        this.errorEl.classList.remove("is-hidden");
        // Trigger shake animation
        const card = document.querySelector(".lock-card");
        if (card) {
          card.classList.remove("shake-anim");
          void card.offsetWidth; // trigger reflow
          card.classList.add("shake-anim");
        }
      }
    }
  }

  unlock() {
    if (this.overlayEl) {
      this.overlayEl.classList.add("is-hidden");
    }
  }
}
