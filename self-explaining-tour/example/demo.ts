import { initTour, startTour } from '../player';
import { TOUR_BLOBS, TOUR_INDEX } from './tour-data';

const app = {
  set(key: string, value: string): boolean {
    return key === 'theme' ? !!value : false;
  },
  state(): Record<string, unknown> {
    return { ready: true, tab: 'main' };
  },
};

initTour(app, { index: TOUR_INDEX, blobs: TOUR_BLOBS }, {
  appName: 'Tour demo',
  modalIds: ['settingsBox'],
  storagePrefix: 'demo.tour',
});

// Auto-start so a headless load has something to inspect.
startTour();
