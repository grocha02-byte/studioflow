const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
code = code.replace("doc(db, 'users', firebaseUser.uid)", "doc(db, 'usuarios', firebaseUser.uid)");
fs.writeFileSync('src/contexts/AuthContext.tsx', code);
