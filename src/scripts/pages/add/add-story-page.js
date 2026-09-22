import DicodingStoryApi from '../../data/api';
import AddStoryPresenter from './add-story-presenter';
import L from 'leaflet';

class AddStoryPage {
  async render() {
    return `
      <section class="st-form-wrapper large">
        <h1 class="st-title">Catat Log Pelayaran Baru</h1>
        <form id="form-pirate-log">
          <div class="st-group">
            <label for="log-desc" class="st-label">Catatan Perjalanan</label>
            <textarea id="log-desc" class="st-input" rows="4" required placeholder="Ceritakan apa yang terjadi di perairan ini..."></textarea>
          </div>

          <div class="st-group">
            <label for="log-photo" class="st-label">Bukti Visual (Pilih Gambar / Kamera)</label>
            <input type="file" id="log-photo" accept="image/*" class="st-input" style="padding-left: 0; background: transparent; border: none; margin-bottom: 10px;">

            <!-- Kontrol Teropong (Kamera) -->
            <div style="display:flex; gap:10px; flex-wrap: wrap; margin-bottom: 10px;">
              <button type="button" id="btn-open-lens" class="st-btn st-btn-outline">Buka Teropong</button>
              <button type="button" id="btn-capture-lens" class="st-btn st-btn-primary" style="display:none;">Jepret Gambar</button>
              <button type="button" id="btn-close-lens" class="st-btn st-btn-danger" style="display:none;">Tutup Teropong</button>
            </div>
            
            <video id="lens-preview" autoplay style="display:none; width:100%; border-radius:var(--st-radius); border: 2px solid var(--st-primary);"></video>
            <canvas id="lens-canvas" style="display:none;"></canvas>
            <img id="result-preview" src="" alt="Pratinjau tangkapan" style="display:none; width:100%; margin-top: 10px; border-radius:var(--st-radius); border: 2px solid var(--st-primary);">
          </div>

          <div class="st-group">
            <label class="st-label">Titik Koordinat (Tandai di Peta)</label>
            <div id="pirate-map-picker" class="st-map-box" style="height: 250px; border-width: 1px; margin-bottom: 12px;"></div>
            <div style="display:flex; gap:10px;">
              <input type="number" id="coord-lat" class="st-input" step="any" placeholder="Garis Lintang (Latitude)" readonly>
              <input type="number" id="coord-lon" class="st-input" step="any" placeholder="Garis Bujur (Longitude)" readonly>
            </div>
          </div>

          <button type="submit" class="st-btn st-btn-primary st-mt">Kirim Log Pelayaran</button>
          <div id="log-status-msg" class="st-alert" style="display:none;"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new AddStoryPresenter({ view: this, api: DicodingStoryApi });

    this.photoFile = null;
    this.mediaStream = null;

    this.form = document.getElementById('form-pirate-log');
    this.messageDiv = document.getElementById('log-status-msg');
    this.submitBtn = this.form.querySelector('button[type="submit"]');

    this._initMap();
    this._initPhotoInputs();

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const description = document.getElementById('log-desc').value;
      const lat = document.getElementById('coord-lat').value;
      const lon = document.getElementById('coord-lon').value;
      this.presenter.addStory(description, this.photoFile, lat, lon);
    });

    window.addEventListener('hashchange', () => this._stopCamera(), { once: true });
  }

  showLoading() {
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Menyimpan Log...';
    this.messageDiv.style.display = 'none';
  }

  showError(message) {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Kirim Log Pelayaran';
    this.messageDiv.textContent = message;
    this.messageDiv.className = 'st-alert st-alert-error';
    this.messageDiv.style.display = 'block';
  }

  onSuccess(message = 'Log pelayaran berhasil dicatat ke dalam jurnal!') {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Kirim Log Pelayaran';
    this.messageDiv.textContent = message;
    this.messageDiv.className = 'st-alert st-alert-success';
    this.messageDiv.style.display = 'block';
    setTimeout(() => {
      window.location.hash = '#/';
    }, 1500);
  }

  onOfflineSuccess() {
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Kirim Log Pelayaran';
    this.messageDiv.textContent = '⚓ Kapal di luar jangkauan! Log disimpan di peti lokal dan akan dikirim saat jangkar berlabuh.';
    this.messageDiv.className = 'st-alert st-alert-success';
    this.messageDiv.style.display = 'block';
    setTimeout(() => {
      window.location.hash = '#/';
    }, 2000);
  }

  _initMap() {
    const map = L.map('pirate-map-picker').setView([-6.200000, 106.816666], 5);
    // Menggunakan peta gelap agar selaras dengan tema
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    let marker;

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById('coord-lat').value = lat;
      document.getElementById('coord-lon').value = lng;

      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(map);
      }
    });
  }

  _initPhotoInputs() {
    const photoInput = document.getElementById('log-photo');
    const photoPreview = document.getElementById('result-preview');

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.photoFile = file;
        this._stopCamera();
        photoPreview.src = URL.createObjectURL(file);
        photoPreview.style.display = 'block';
      }
    });

    const startCameraBtn = document.getElementById('btn-open-lens');
    const stopCameraBtn = document.getElementById('btn-close-lens');
    const captureBtn = document.getElementById('btn-capture-lens');
    const video = document.getElementById('lens-preview');
    const canvas = document.getElementById('lens-canvas');

    startCameraBtn.addEventListener('click', async () => {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = this.mediaStream;
        video.style.display = 'block';
        startCameraBtn.style.display = 'none';
        stopCameraBtn.style.display = 'inline-block';
        captureBtn.style.display = 'inline-block';
        photoPreview.style.display = 'none';
      } catch (err) {
        alert('Teropong kamera tidak dapat diakses atau ditolak oleh kapten.');
      }
    });

    stopCameraBtn.addEventListener('click', () => this._stopCamera());

    captureBtn.addEventListener('click', () => {
      if (this.mediaStream) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          this.photoFile = new File([blob], 'tangkapan-teropong.jpg', { type: 'image/jpeg' });
          photoPreview.src = URL.createObjectURL(this.photoFile);
          photoPreview.style.display = 'block';
          this._stopCamera();
        }, 'image/jpeg');
      }
    });
  }

  _stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    const video = document.getElementById('lens-preview');
    const startBtn = document.getElementById('btn-open-lens');
    const stopBtn = document.getElementById('btn-close-lens');
    const captureBtn = document.getElementById('btn-capture-lens');
    if (video) video.style.display = 'none';
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';
    if (captureBtn) captureBtn.style.display = 'none';
  }
}

export default AddStoryPage;