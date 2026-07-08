import fs from "fs";
let content = fs.readFileSync("firestore.rules", "utf8");
content = content.replace("match /caixa_transacoes/{id} { allow read: if canReadOwn(); allow create: if canCreateOwn() && isStaff(); allow update: if canUpdateOwn() && isStaff(); allow delete: if canDeleteOwn() && isStaff(); }",
  "match /caixa_transacoes/{id} { allow read: if canReadOwn(); allow create: if canCreateOwn() && isStaff(); allow update: if canUpdateOwn() && isStaff(); allow delete: if canDeleteOwn() && isStaff(); }\n    match /contas_receber/{id} { allow read: if canReadOwn(); allow create: if canCreateOwn() && isStaff(); allow update: if canUpdateOwn() && isStaff(); allow delete: if canDeleteOwn() && isStaff(); }");
fs.writeFileSync("firestore.rules", content);
