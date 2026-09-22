import FavoritePresenter from './favorite-presenter';

class FavoritePage {
  async render() {
    return `
      <section class="st-container" style="padding: 2rem 0;">
        <h1 class="st-title" style="text-align: left; margin-bottom: 1.5rem;">Peti Harta Karun (Tersimpan)</h1>

        <!-- Kontrol Interaktif (Filter, Search, Sort) -->
        <div class="control-panel-bar">
          <div class="control-item">
            <label for="pirate-search-vault">Cari Catatan Pelayaran:</label>
            <input type="text" id="pirate-search-vault" class="st-input" placeholder="Cari nama kapten atau isi catatan..." aria-label="Cari cerita">
          </div>
          <div class="control-item">
            <label for="pirate-sort-vault">Urutan Navigasi:</label>
            <select id="pirate-sort-vault" class="st-input" aria-label="Urutkan cerita">
              <option value="newest">Tangkapan Terbaru</option>
              <option value="oldest">Tangkapan Terlama</option>
              <option value="name-asc">Nama Kapten (A-Z)</option>
              <option value="name-desc">Nama Kapten (Z-A)</option>
            </select>
          </div>
        </div>

        <div id="pirate-vault-list" class="st-grid st-mt"></div>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new FavoritePresenter({ view: this });

    const searchInput = document.getElementById('pirate-search-vault');
    const sortSelect = document.getElementById('pirate-sort-vault');

    const updateList = () => {
      this.presenter.loadFavorites({
        searchQuery: searchInput.value,
        sortBy: sortSelect.value,
      });
    };

    searchInput.addEventListener('input', updateList);
    sortSelect.addEventListener('change', updateList);

    await this.presenter.loadFavorites();
  }

  showLoading() {
    const listDiv = document.getElementById('pirate-vault-list');
    if (listDiv) listDiv.innerHTML = '<div class="st-alert">Membongkar isi peti harta karun...</div>';
  }

  showEmpty(message = 'Peti penyimpanan masih kosong. Belum ada catatan yang ditandai.') {
    const listDiv = document.getElementById('pirate-vault-list');
    if (listDiv) listDiv.innerHTML = `<div class="st-alert" style="border-color: var(--st-text-muted); color: var(--st-text-muted);">${message}</div>`;
  }

  showError(message) {
    const listDiv = document.getElementById('pirate-vault-list');
    if (listDiv) listDiv.innerHTML = `<div class="st-alert st-alert-error">${message}</div>`;
  }

  showFavorites(stories) {
    const listDiv = document.getElementById('pirate-vault-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    stories.forEach((story) => {
      const article = document.createElement('article');
      article.classList.add('st-card');
      article.tabIndex = 0;

      article.innerHTML = `
        <img src="${story.photoUrl}" alt="Visual oleh ${story.name}" class="st-card-img">
        <div class="st-card-body">
          <h2 class="st-card-title" style="margin-bottom: 0.5rem;">${story.name}</h2>
          <p class="st-card-date">Berlabuh: ${new Date(story.createdAt).toLocaleDateString()}</p>
          <p class="st-card-desc">${story.description}</p>
          
          <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 15px; border-top: 1px solid var(--st-border);">
            <a href="#/detail/${story.id}" class="st-btn st-btn-outline" style="flex:1; text-align:center; padding: 8px 10px; font-size: 0.85rem;" aria-label="Buka log ${story.name}">Buka Log</a>
            <button class="st-btn st-btn-danger btn-remove-vault" data-id="${story.id}" style="flex:1; padding: 8px 10px; font-size: 0.85rem;" aria-label="Buang ${story.name}">
              ☠️ Buang
            </button>
          </div>
        </div>
      `;

      article.querySelector('.btn-remove-vault').addEventListener('click', (e) => {
        e.stopPropagation();
        this.presenter.removeFavorite(story.id);
      });

      listDiv.appendChild(article);
    });
  }

  onFavoriteRemoved() {
    const searchInput = document.getElementById('pirate-search-vault');
    const sortSelect = document.getElementById('pirate-sort-vault');
    this.presenter.loadFavorites({
      searchQuery: searchInput ? searchInput.value : '',
      sortBy: sortSelect ? sortSelect.value : 'newest',
    });
  }
}

export default FavoritePage;