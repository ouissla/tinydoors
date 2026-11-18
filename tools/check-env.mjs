import { validateEnvironment } from '../server/config.js';
try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const missing = validateEnvironment(process.env);
if (missing.length) {
  console.error('Replace missing or placeholder settings in .env: ' + missing.join(', '));
  process.exitCode = 1;
} else {
  console.log('Required integration settings are present. This does not test credentials or complete the backend integration.');
}
