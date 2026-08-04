import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

window.addEventListener('vite:preloadError', () => {
  const reloadKey = 'pravaah.preload-reloaded';
  if (sessionStorage.getItem(reloadKey) === 'true') return;
  sessionStorage.setItem(reloadKey, 'true');
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  let serviceWorkerRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (serviceWorkerRefreshing) return;
    serviceWorkerRefreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update().catch(() => undefined);
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
}
