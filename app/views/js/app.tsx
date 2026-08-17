import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from '@leafphp/vite-plugin/inertia-helpers';

import { initTheme } from '@/utils/theme';
import { loadRatesFromAPI } from '@/utils/currency';

initTheme();
loadRatesFromAPI();

const appName = import.meta.env.VITE_APP_NAME || 'Larnr';

createInertiaApp({
  title: (title) => (title ? `${title} · ${appName}` : appName),
  resolve: (name) =>
    resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx')
    ),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
  progress: {
    color: '#6366f1',
    showSpinner: false,
  },
});