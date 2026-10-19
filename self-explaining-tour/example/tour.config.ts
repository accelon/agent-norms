import { defineTourConfig } from '../compiler';

export default defineTourConfig({
  tourDir: './tours',
  outFile: './tour-data.ts',
  templateFile: './template.html',
  formatImport: '../format',
  appName: 'Demo',
  setKeys: ['theme'],
  callNames: ['openSettings'],
  tabNames: ['main', 'help'],
  apiKeys: ['ready', 'tab'],
  dynamicIds: ['toast'],
});
