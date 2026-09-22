import DicodingStoryApi from '../../data/api';
import LoginPresenter from './login-presenter';

class LoginPage {
  async render() {
    return `
      <section class="st-form-wrapper">
        <h1 class="st-title">Naik ke Kapal</h1>
        <form id="form-pirate-login">
          <div class="st-group">
            <label for="pirate-email" class="st-label">Surat Elektronik (Email)</label>
            <input type="email" id="pirate-email" class="st-input" required autocomplete="email">
          </div>
          <div class="st-group">
            <label for="pirate-password" class="st-label">Kata Sandi Rahasia</label>
            <input type="password" id="pirate-password" class="st-input" required autocomplete="current-password" minlength="8">
          </div>
          <button type="submit" class="st-btn st-btn-primary st-mt">Mulai Pelayaran</button>
          
          <p style="text-align:center; margin-top:1.5rem; color: var(--st-text-muted);">
            Belum tergabung dalam kru? <a href="#/register">Daftar di sini</a>
          </p>
          
          <div id="pirate-login-error" class="st-alert st-alert-error" style="display:none;"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new LoginPresenter({ view: this, api: DicodingStoryApi });

    this.form = document.getElementById('form-pirate-login');
    this.errorDiv = document.getElementById('pirate-login-error');
    this.submitBtn = this.form.querySelector('button[type="submit"]');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('pirate-email').value;
      const password = document.getElementById('pirate-password').value;
      this.presenter.login(email, password);
    });
  }

  showLoading() {
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Membuka gerbang pelabuhan...';
    this.errorDiv.style.display = 'none';
  }

  showError(message) {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Mulai Pelayaran';
    this.errorDiv.textContent = message;
    this.errorDiv.style.display = 'block';
  }

  onLoginSuccess() {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Mulai Pelayaran';
    window.location.hash = '#/';
  }
}

export default LoginPage;