async function globalTeardown() {
  console.log('Test run completed');
  // We keep Supabase running for development
  // If you want to stop it after tests, uncomment:
  // const { execSync } = require('child_process');
  // execSync('npm run supabase:stop');
}

export default globalTeardown;