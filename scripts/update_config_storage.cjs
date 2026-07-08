const fs = require('fs');
let code = fs.readFileSync('src/components/Configuracoes.tsx', 'utf8');

if (!code.includes("import { storage } from '../lib/firebase';")) {
  code = code.replace(
    "import { Save, Image as ImageIcon, Sparkles, MonitorSmartphone, Palette } from 'lucide-react';",
    "import { Save, Image as ImageIcon, Sparkles, MonitorSmartphone, Palette, Loader2 } from 'lucide-react';\nimport { storage } from '../lib/firebase';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';"
  );
}

if (!code.includes("const [uploadingLogo, setUploadingLogo] = useState(false);")) {
  code = code.replace(
    "export default function Configuracoes({ configuracao, onSave }: ConfiguracoesProps) {",
    "export default function Configuracoes({ configuracao, onSave }: ConfiguracoesProps) {\n  const [uploadingLogo, setUploadingLogo] = useState(false);"
  );
}

code = code.replace(
  /onChange=\{\(e\) => \{[\s\S]*?\}\}/g,
  `onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingLogo(true);
                        try {
                          const storageRef = ref(storage, \`logos/\${configuracao.salaoId}_\${Date.now()}_\${file.name}\`);
                          await uploadBytes(storageRef, file);
                          const url = await getDownloadURL(storageRef);
                          setFormState(prev => ({ ...prev, logoUrl: url }));
                        } catch (error) {
                          console.error("Erro ao fazer upload da imagem:", error);
                          alert("Erro ao fazer upload da imagem.");
                        } finally {
                          setUploadingLogo(false);
                        }
                      }
                    }}`
);

code = code.replace(
  "O arquivo será salvo localmente.",
  "O arquivo será salvo na nuvem."
);

code = code.replace(
  "Selecionar Imagem (PNG, JPG, WEBP)",
  "{uploadingLogo ? <><Loader2 className=\"w-4 h-4 animate-spin\" /> Enviando...</> : 'Selecionar Imagem (PNG, JPG, WEBP)'}"
);

fs.writeFileSync('src/components/Configuracoes.tsx', code);
