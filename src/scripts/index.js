import 'regenerator-runtime';
import '../styles/styles.css';
import ApplicationCoordinator from './pages/app';
import { registerServiceWorker } from './helpers/worker-initializer';
import { activateBackgroundSyncMonitor } from './helpers/background-dispatcher';

const appCoordinatorInstance = new ApplicationCoordinator({
  menuTrigger: document.querySelector('#drawer-button'),
  navigationDrawer: document.querySelector('#navigation-drawer'),
  contentArea: document.querySelector('#main-content'),
  navContainer: document.querySelector('#nav-list'),
});

// Hanya merender ulang ketika hash URL benar-benar berubah
window.addEventListener('hashchange', () => {
  appCoordinatorInstance.renderActiveScreen();
});

// Menjalankan inisialisasi pada saat website pertama kali dimuat
window.addEventListener('DOMContentLoaded', async () => {
  await appCoordinatorInstance.renderActiveScreen();
  await registerServiceWorker();
  activateBackgroundSyncMonitor();
});

// Aksesibilitas Skip Link
const accessibilitySkip = document.querySelector('.skip-link');
const mainLandmark = document.querySelector('#main-content');
if (accessibilitySkip && mainLandmark) {
  accessibilitySkip.addEventListener('click', (event) => {
    event.preventDefault();
    mainLandmark.focus();
  });
}