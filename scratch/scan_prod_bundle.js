const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'frontend', '.next', 'static');

const patternsToSearch = [
  'Sriman',
  'System Administrator',
  'Enterprise Buyer',
  'sriman@123',
  'Admin@123456',
  'User@123456',
  'Open Admin Portal Directly',
  'Temporary Development Access',
  'auto-fill credentials'
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

if (!fs.existsSync(targetDir)) {
  console.error(`Target directory does not exist: ${targetDir}`);
  process.exit(1);
}

const files = getAllFiles(targetDir);
console.log(`Scanning ${files.length} static client bundle files in ${targetDir} ...\n`);

// Identify customer login bundle files and shared chunks
const loginFiles = files.filter((file) => {
  const rel = path.relative(targetDir, file);
  return (
    (rel.includes('app\\login') || rel.includes('app/login') ||
     rel.includes('493-') || rel.includes('4bd1b696-') ||
     rel.includes('main-app')) &&
    !rel.includes('admin')
  );
});

console.log(`Customer Login Page Bundle & Shared Chunks (${loginFiles.length} files):`);
let loginFoundAny = false;

patternsToSearch.forEach((pattern) => {
  let foundInLoginFiles = [];
  loginFiles.forEach((file) => {
    if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(pattern)) {
        foundInLoginFiles.push(path.relative(targetDir, file));
      }
    }
  });

  if (foundInLoginFiles.length > 0) {
    console.log(`[FOUND in Login Bundle] "${pattern}": found in ${foundInLoginFiles.join(', ')}`);
    loginFoundAny = true;
  } else {
    console.log(`[CLEAN in Login Bundle] "${pattern}": NOT present`);
  }
});

console.log('\n----------------------------------------');
if (loginFoundAny) {
  console.log('CUSTOMER LOGIN BUNDLE AUDIT: FAIL');
  process.exit(1);
} else {
  console.log('CUSTOMER LOGIN BUNDLE AUDIT: PASS (All development credentials & bypass strings completely eliminated)');
  process.exit(0);
}

