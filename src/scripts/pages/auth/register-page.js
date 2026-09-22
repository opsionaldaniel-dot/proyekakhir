import DicodingStoryApi from '../../data/api';
import RegisterPresenter from './register-presenter';

class RegisterPage {
  async render() {
    return `
      <section class="st-form-wrapper">
        <h1 class="st-title">Bergabung dengan Kru</h1>
        <form id="form-pirate-register">
          <div class="st-group">
            <label for="pirate-name" class="st-label">Nama Panggilan</label>
            <input type="text" id="pirate-name" class="st-input" required autocomplete="name">
          </div>
          <div class="st-group">
            <label for="pirate-reg-email" class="st-label">Surat Elektronik (Email)</label>
            <input type="email" id="pirate-reg-email" class="st-input" required autocomplete="email">
          </div>
          <div class="st-group">
            <label for="pirate-reg-password" class="st-label">Kata Sandi Rahasia</label>
            <input type="password" id="pirate-reg-password" class="st-input" required autocomplete="new-password" minlength="8">
          </div>
          <button type="submit" class="st-btn st-btn-primary st-mt">Daftar Menjadi Pelaut</button>
          
          <p style="text-align:center; margin-top:1.5rem; color: var(--st-text-muted);">
            Sudah memiliki tanda pengenal? <a href="#/login">Masuk di sini</a>
          </p>
          
          <div id="pirate-register-msg" class="st-alert" style="display:none;"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new RegisterPresenter({ view: this, api: DicodingStoryApi });

    this.form = document.getElementById('form-pirate-register');
    this.messageDiv = document.getElementById('pirate-register-msg');
    this.submitBtn = this.form.querySelector('button[type="submit"]');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('pirate-name').value;
      const email = document.getElementById('pirate-reg-email').value;
      const password = document.getElementById('pirate-reg-password').value;
      this.presenter.register(name, email, password);
    });
  }

  showLoading() {
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Menyiapkan dokumen pelayaran...';
    this.messageDiv.style.display = 'none';
  }

  showError(message) {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Daftar Menjadi Pelaut';
    this.messageDiv.textContent = message;
    this.messageDiv.className = 'st-alert st-alert-error';
    this.messageDiv.style.display = 'block';
  }

  onRegisterSuccess() {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Daftar Menjadi Pelaut';
    this.messageDiv.textContent = 'Kontrak disetujui! Bersiaplah menaiki kapal...';
    this.messageDiv.className = 'st-alert st-alert-success';
    this.messageDiv.style.display = 'block';
    
    // Redirect ke halaman login setelah 2 detik
    setTimeout(() => {
      window.location.hash = '#/login';
    }, 2000);
  }
}

export default RegisterPage;