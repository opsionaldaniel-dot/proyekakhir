import DicodingStoryApi from '../../data/api';
import HomePresenter from './home-presenter';
import { FavoriteStoryDb } from '../../data/db';
import L from 'leaflet';

L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

class HomePage {
  async render() {
    return `
      <section class="st-container">
        <div id="offline-banner" class="st-offline-banner" style="display: none;">
          ⚓ Kapal keluar dari jangkauan sinyal. Menampilkan peta harta karun dari kompas lokal.
        </div>

        <div class="st-feed-header">
          <h1 style="font-size:2.2rem; font-weight:800; color: var(--st-primary);">Peta Penjelajahan</h1>
          <div>
            <!-- LABEL WAJIB DARI REVIEWER -->
            <label for="home-search" class="sr-only">Cari log pelayaran</label>
            <input type="text" id="home-search" class="st-search" placeholder="Cari jejak pelayaran..." aria-label="Search stories">
          </div>
        </div>

        <div class="st-layout">
          <div class="st-map-box">
            <div id="map" class="st-map"></div>
          </div>
          <div class="st-grid" id="stories-list"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new HomePresenter({ view: this, api: DicodingStoryApi });

    this._checkOnlineStatus();
    window.addEventListener('online', () => this._checkOnlineStatus());
    window.addEventListener('offline', () => this._checkOnlineStatus());

    await this.presenter.loadStories();
  }

  _checkOnlineStatus() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
      banner.style.display = navigator.onLine ? 'none' : 'block';
    }
  }

  showLoading() {
    const storiesListDiv = document.getElementById('stories-list');
    if (storiesListDiv) storiesListDiv.innerHTML = '<p class="st-title" style="grid-column: 1/-1;">Membuka Gulungan Peta...</p>';
  }

  showEmpty() {
    const storiesListDiv = document.getElementById('stories-list');
    if (storiesListDiv) storiesListDiv.innerHTML = '<p class="st-title" style="grid-column: 1/-1;">Lautan Kosong. Belum ada jejak.</p>';
  }

  showError(message) {
    const storiesListDiv = document.getElementById('stories-list');
    if (storiesListDiv) storiesListDiv.innerHTML = `<p class="st-alert st-alert-error" style="grid-column: 1/-1;">${message}</p>`;
  }

  async showStories(stories) {
    this._allStories = stories;
    this._renderMap(stories);
    await this._renderList(stories);

    const searchInput = document.getElementById('home-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = this._allStories.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query)
        );
        this._renderList(filtered);
      });
    }
  }

  _renderMap(stories) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    const map = L.map('map').setView([-6.200000, 106.816666], 5);

    // MENGGUNAKAN TILE PETA GELAP UNTUK TEMA BAJAK LAUT
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    });

    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenTopoMap contributors',
    });

    darkLayer.addTo(map);

    const baseMaps = {
      'Peta Malam (Dark)': darkLayer,
      'Peta Topografi': topoLayer,
    };

    L.control.layers(baseMaps).addTo(map);

    this.markers = {};

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(map);
        marker.bindPopup(`<b>${story.name}</b><br>${story.description.substring(0, 30)}...<br><a href="#/detail/${story.id}" style="color:#D4AF37; font-weight:bold;">Inspeksi Jejak</a>`);
        this.markers[story.id] = marker;
      }
    });

    this.map = map;
  }

  async _renderList(stories) {
    const storiesListDiv = document.getElementById('stories-list');
    if (!storiesListDiv) return;
    storiesListDiv.innerHTML = '';

    const favoritesList = await FavoriteStoryDb.getAllFavorites();
    const favSet = new Set(favoritesList.map((f) => f.id));

    stories.forEach((story) => {
      const isFav = favSet.has(story.id);
      const storyElement = document.createElement('article');
      storyElement.classList.add('st-card');
      storyElement.tabIndex = 0;

      storyElement.innerHTML = `
        <img src="${story.photoUrl}" alt="Photo by ${story.name}" class="st-card-img">
        <div class="st-card-body">
          <div class="st-card-row">
            <h2 class="st-card-title">${story.name}</h2>
            <button class="st-fav-btn ${isFav ? 'active' : ''} fav-btn" data-id="${story.id}" aria-label="Bookmark ${story.name}">
              ★
            </button>
          </div>
          <p class="st-card-date">Berlabuh: ${new Date(story.createdAt).toLocaleDateString()}</p>
          <p class="st-card-desc">${story.description}</p>
          <a href="#/detail/${story.id}" class="st-btn st-btn-outline detail-link" style="margin-top:auto;">Buka Log</a>
        </div>
      `;

      storyElement.addEventListener('click', (e) => {
        if (!e.target.closest('.fav-btn') && !e.target.closest('.detail-link')) {
          this._focusMapOnStory(story);
        }
      });

      storyElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.target.closest('.fav-btn')) {
          this._focusMapOnStory(story);
        }
      });

      const favBtn = storyElement.querySelector('.fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.presenter.toggleFavorite(story, favBtn);
      });

      storiesListDiv.appendChild(storyElement);
    });
  }

  _focusMapOnStory(story) {
    if (story.lat && story.lon && this.map && this.markers[story.id]) {
      this.map.flyTo([story.lat, story.lon], 12);
      this.markers[story.id].openPopup();
      // Smooth scroll ke atas agar peta terlihat di layar HP
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

export default HomePage;