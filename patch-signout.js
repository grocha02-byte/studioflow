import fs from "fs";

let content = fs.readFileSync("src/App.tsx", "utf8");
content = content.replace(/auth\.signOut\(\)/g, "signOut(auth)");
fs.writeFileSync("src/App.tsx", content);
