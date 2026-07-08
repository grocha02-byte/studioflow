import fs from "fs";

let content = fs.readFileSync("firestore.rules", "utf8");
content = content.replace("allow read: if isSignedIn() && isStaff() && isSameSalao(id);", "allow read: if isSignedIn() && isSameSalao(id);");
content = content.replace("allow read: if canReadOwn() && isStaff();", "allow read: if canReadOwn();");
fs.writeFileSync("firestore.rules", content);
