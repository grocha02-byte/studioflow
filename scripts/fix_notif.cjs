const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationCenter.tsx', 'utf8');

code = code.replace(/\\`/g, '`');

fs.writeFileSync('src/components/NotificationCenter.tsx', code);
