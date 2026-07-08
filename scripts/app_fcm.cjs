const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('requestNotificationPermission')) {
  code = code.replace(
    "import { useDatabase } from './hooks/useDatabase';",
    "import { useDatabase } from './hooks/useDatabase';\nimport { requestNotificationPermission } from './lib/firebase';"
  );
  code = code.replace(
    "const { configuracao } = useDatabase();",
    "const { configuracao } = useDatabase();\n\n  useEffect(() => {\n    requestNotificationPermission();\n  }, []);"
  );
  fs.writeFileSync('src/App.tsx', code);
}
