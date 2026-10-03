const { execSync } = require('child_process');

try {
  execSync('prisma db push --skip-generate', { stdio: 'inherit' });
} catch (err) {
  console.warn('⚠️  PostgreSQL server is not reachable at localhost:5432. Database operations will use active in-memory/mock fallback stores.');
}
