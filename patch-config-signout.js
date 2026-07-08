import fs from "fs";

let content = fs.readFileSync("src/components/Configuracoes.tsx", "utf8");
content = content.replace("auth.signOut();", "import('firebase/auth').then(({ signOut }) => signOut(auth));");
fs.writeFileSync("src/components/Configuracoes.tsx", content);
