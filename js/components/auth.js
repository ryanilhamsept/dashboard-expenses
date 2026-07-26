export class LockScreen {
  constructor(state, supabaseService) {
    this.state = state;
    this.supabaseService = supabaseService;
    this.isSignUpMode = false;
  }

  init() {
    this.overlayEl = document.querySelector("#lockScreen");
    this.titleEl = document.querySelector("#lockTitle");
    this.subtitleEl = document.querySelector("#lockSubtitle");
    this.errorEl = document.querySelector("#lockError");

    this.loginForm = document.querySelector("#loginForm");
    this.usernameInput = document.querySelector("#loginUsername");
    this.passwordInput = document.querySelector("#loginPassword");
    this.submitBtn = document.querySelector("#loginSubmitBtn");
    this.toggleText = document.querySelector("#toggleText");
    this.toggleBtn = document.querySelector("#toggleAuthModeBtn");

    if (!this.overlayEl) return;

    this.setupListeners();
    this.checkSession();
  }

  async checkSession() {
    try {
      const session = await this.supabaseService.getSession();
      console.log("[LockScreen] Active Supabase session:", session);
      if (session) {
        this.state.setUser(session.user);
        this.unlock();
      } else {
        this.show();
      }
    } catch (e) {
      console.error("[LockScreen] Check session error:", e);
      this.show();
    }
  }

  setupListeners() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", () => {
        this.isSignUpMode = !this.isSignUpMode;
        this.updateMode();
      });
    }

    if (this.loginForm) {
      this.loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        if (!username || !password) return;

        this.setLoading(true);
        this.setError("");

        try {
          let user;
          if (this.isSignUpMode) {
            user = await this.supabaseService.signUp(username, password);
          } else {
            user = await this.supabaseService.signIn(username, password);
          }

          this.state.setUser(user);
          this.unlock();
        } catch (error) {
          console.error("[LockScreen] Authentication error:", error);
          this.setError(error.message || "Gagal melakukan autentikasi.");
          this.shakeCard();
        } finally {
          this.setLoading(false);
        }
      });
    }
  }

  updateMode() {
    if (this.isSignUpMode) {
      if (this.titleEl) this.titleEl.textContent = "Sign Up";
      if (this.subtitleEl) this.subtitleEl.textContent = "Buat akun baru menggunakan username unik.";
      if (this.submitBtn) this.submitBtn.textContent = "Daftar";
      if (this.toggleText) this.toggleText.textContent = "Sudah memiliki akun?";
      if (this.toggleBtn) this.toggleBtn.textContent = "Masuk";
    } else {
      if (this.titleEl) this.titleEl.textContent = "Sign In";
      if (this.subtitleEl) this.subtitleEl.textContent = "Masuk menggunakan username dan password Anda.";
      if (this.submitBtn) this.submitBtn.textContent = "Masuk";
      if (this.toggleText) this.toggleText.textContent = "Belum memiliki akun?";
      if (this.toggleBtn) this.toggleBtn.textContent = "Buat Akun Baru";
    }
    this.setError("");
  }

  setLoading(isLoading) {
    if (this.submitBtn) {
      this.submitBtn.disabled = isLoading;
      this.submitBtn.textContent = isLoading ? "Loading..." : (this.isSignUpMode ? "Daftar" : "Masuk");
    }
  }

  setError(msg) {
    if (this.errorEl) {
      if (msg) {
        this.errorEl.textContent = msg;
        this.errorEl.classList.remove("is-hidden");
      } else {
        this.errorEl.classList.add("is-hidden");
      }
    }
  }

  shakeCard() {
    const card = document.querySelector(".lock-card");
    if (card) {
      card.classList.remove("shake-anim");
      void card.offsetWidth; // trigger reflow
      card.classList.add("shake-anim");
    }
  }

  unlock() {
    if (this.overlayEl) {
      this.overlayEl.classList.add("is-hidden");
    }
    if (this.usernameInput) this.usernameInput.value = "";
    if (this.passwordInput) this.passwordInput.value = "";
  }

  show() {
    if (this.overlayEl) {
      this.overlayEl.classList.remove("is-hidden");
    }
  }
}
