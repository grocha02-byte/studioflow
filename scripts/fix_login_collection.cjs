const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');
code = code.replace("setDoc(doc(db, 'users', userCredential.user.uid), newUser)", "setDoc(doc(db, 'usuarios', userCredential.user.uid), newUser)");
fs.writeFileSync('src/components/Login.tsx', code);
