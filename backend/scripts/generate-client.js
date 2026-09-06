const { execSync } = require('child_process');

try {
  execSync('prisma generate', { stdio: 'inherit' });
} catch (err) {
  try {
    require('@prisma/client');
    console.warn('Prisma engine locked by active server, using existing generated client.');
  } catch (_clientErr) {
    console.error('Failed to generate Prisma client and no existing client found.', err);
    process.exit(1);
  }
}
