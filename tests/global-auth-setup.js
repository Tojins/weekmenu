import { setupAuth } from './helpers/auth-persistent.js';

async function globalSetup() {
  console.log('Running global auth setup...');
  await setupAuth();
  console.log('Global auth setup complete');
}

export default globalSetup;