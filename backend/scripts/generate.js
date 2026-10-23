const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const clientPath = path.resolve(__dirname, '../node_modules/.prisma/client/index.js');

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  if (fs.existsSync(clientPath)) {
    console.warn('⚠️  Prisma client query engine is currently in use by a running process. Existing generated Prisma client retained.');
  } else {
    console.error('❌ Prisma generate failed and client is not present.');
    throw err;
  }
}
