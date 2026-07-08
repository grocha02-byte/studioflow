const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

if (!code.includes('getMessaging')) {
  code = code.replace("import { getStorage } from 'firebase/storage';", "import { getStorage } from 'firebase/storage';\nimport { getMessaging } from 'firebase/messaging';");
  code = code + "\nexport const messaging = getMessaging(app);\n";
  fs.writeFileSync('src/lib/firebase.ts', code);
}
