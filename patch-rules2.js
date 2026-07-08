import fs from "fs";

let content = fs.readFileSync("firestore.rules", "utf8");
content = content.replace("function isOwnerAdmin() { return checkRole({'admin': true, 'proprietario': true}); }", 
  "function isOwnerAdmin() { let u = getUserData(); return u != null && (u.role == 'admin' || u.role == 'proprietario'); }");
content = content.replace("function isStaff() { return checkRole({'admin': true, 'proprietario': true, 'recepcionista': true}); }",
  "function isStaff() { let u = getUserData(); return u != null && (u.role == 'admin' || u.role == 'proprietario' || u.role == 'recepcionista'); }");
fs.writeFileSync("firestore.rules", content);
