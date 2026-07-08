import fs from "fs";
let content = fs.readFileSync("src/hooks/useDatabase.ts", "utf8");
content = content.replace("await updateDoc(doc(db, col, id), data);", "await setDoc(doc(db, col, id), data, { merge: true });");
fs.writeFileSync("src/hooks/useDatabase.ts", content);
