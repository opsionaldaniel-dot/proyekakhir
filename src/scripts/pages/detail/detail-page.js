import DicodingStoryApi from '../../data/api';
import DetailPresenter from './detail-presenter';
import UrlParser from '../../routes/url-parser';
import L from 'leaflet';

class DetailPage {
  async render() {
    return `
      <section class="detail-section st-container">
        <a href="#/" class="st-btn st-btn-outline" style="margin-bottom: 1.5rem; display: inline-block; width: auto;">
          &larr; Kembali ke Kemudi
        </a>
        <div id="pirate-detail-viewport"></div>
      </section>
    `;
  }

  async afterRender() {
    const url = UrlParser.parseActiveUrlWithoutCombiner();
    this.storyId = url.id;

    this.presenter = new DetailPresenter({
      view: this,
      api: DicodingStoryApi,
      storyId: this.storyId,
    });

    await this.presenter.loadDetail();
  }

  showLoading() {
    const content = document.getElementById('pirate-detail-viewport');
    if (content) content.innerHTML = '<div class="st-alert">Membaca gulungan perkamen...</div>';
  }

  showError(message) {
    const content = document.getElementById('pirate-detail-viewport');
    if (content) content.innerHTML = `<div class="st-alert st-alert-error">${message}</div>`;
  }

  showStoryDetail(story, isFavorited) {
    this.story = story;
    const content = document.getElementById('pirate-detail-viewport');
    if (!content) return;

    content.innerHTML = `
      <article class="detail-card">
        <img src="${story.photoUrl}" alt="Tangkapan visual oleh ${story.name}" class="detail-image">
        <div class="detail-body">
          <div class="detail-header">
            <div>
              <h1 class="detail-title">${story.name}</h1>
              <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-muted);">
                Berlabuh pada: ${new Date(story.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
            <button id="btn-pirate-mark" class="st-btn ${isFavorited ? 'st-btn-danger' : 'st-btn-primary'}" style="width: auto;" aria-label="${isFavorited ? 'Hapus dari catatan' : 'Simpan catatan'}">
              ${isFavorited ? '☠️ Ditandai' : '🏴 Tandai Jejak'}
            </button>
          </div>
          <p class="detail-desc">${story.description}</p>
          ${
            story.lat && story.lon
              ? `<div class="detail-map-wrapper" style="margin-top: 2.5rem;">
                  <h3 style="color: var(--neon-cyan); margin-bottom: 1rem; font-family: 'Cinzel', serif;">Koordinat Penemuan</h3>
                  <div id="pirate-detail-map" class="st-map-box" style="height: 350px;"></div>
                 </div>`
              : ''
          }
        </div>
      </article>
    `;

    const favBtn = document.getElementById('btn-pirate-mark');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        this.presenter.toggleFavorite(this.story);
      });
    }

    if (story.lat && story.lon) {
      setTimeout(() => {
        const map = L.map('pirate-detail-map').setView([story.lat, story.lon], 13);
        
        // Peta Gelap agar sesuai dengan Tema Kapal Malam
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        
        L.marker([story.lat, story.lon])
          .addTo(map)
          .bindPopup(`<b style="color: #0a0f18;">${story.name}</b><br>${story.description.substring(0, 40)}...`)
          .openPopup();
      }, 100);
    }
  }

  updateFavoriteState(isFavorited) {
    const favBtn = document.getElementById('btn-pirate-mark');
    if (favBtn) {
      favBtn.className = `st-btn ${isFavorited ? 'st-btn-danger' : 'st-btn-primary'}`;
      favBtn.textContent = isFavorited ? '☠️ Ditandai' : '🏴 Tandai Jejak';
      favBtn.setAttribute('aria-label', isFavorited ? 'Hapus dari catatan' : 'Simpan catatan');
    }
  }
}

export default DetailPage;