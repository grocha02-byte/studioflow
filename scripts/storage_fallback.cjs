const fs = require('fs');
let code = fs.readFileSync('src/components/Configuracoes.tsx', 'utf8');

if (!code.includes("FALLBACK PARA BASE64")) {
  code = code.replace(
    'console.error("Erro ao fazer upload da imagem:", error);\n                          alert("Erro ao fazer upload da imagem.");',
    `console.error("Erro ao fazer upload da imagem no Storage, usando fallback local:", error);
                          // FALLBACK PARA BASE64 se o Storage falhar
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormState(prev => ({ ...prev, logoUrl: reader.result as string }));
                          };
                          reader.readAsDataURL(file);`
  );
  fs.writeFileSync('src/components/Configuracoes.tsx', code);
}
