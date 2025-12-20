// scripts/replace-debug-fetch.js
// Script to replace debug fetch calls with debugLog utility
const fs = require('fs');
const path = require('path');

const files = [
  'app/reading.tsx',
  'src/contexts/ProfileContext.tsx',
  'src/features/auth/screens/LoginScreen.tsx',
  'src/shared/components/DailyCardDraw.tsx',
  'src/screens/HomeScreen.tsx',
];

// Pattern to match debug fetch calls
const fetchPattern = /fetch\('http:\/\/127\.0\.0\.1:7242\/ingest\/428b75af-757e-429a-aaa1-d11d73a7516d',\{method:'POST',headers:\{'Content-Type':'application\/json'\},body:JSON\.stringify\(\{location:'([^']+)',message:'([^']+)',data:(\{[^}]+\}),timestamp:Date\.now\(\),sessionId:'debug-session',runId:'run1',hypothesisId:'([^']+)'\}\)\}\)\.catch\(\(\)=>\{\}\);/g;

function replaceFetchCalls(content) {
  return content.replace(fetchPattern, (match, location, message, data, hypothesisId) => {
    return `debugLog('${location}', '${message}', ${data}, '${hypothesisId}');`;
  });
}

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`Processing ${file}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    content = replaceFetchCalls(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Updated ${file}`);
    } else {
      console.log(`  - No changes needed in ${file}`);
    }
  } else {
    console.log(`  ✗ File not found: ${file}`);
  }
});

console.log('\nDone!');

