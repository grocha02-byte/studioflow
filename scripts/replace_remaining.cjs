const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

function replaceBlock(code, functionName, newBody) {
  const regex = new RegExp(`const ${functionName} = \\([\\s\\S]*?\\) => \\{[\\s\\S]*?\\n  \\};`, 'g');
  return code.replace(regex, `const ${functionName} = ${newBody}`);
}

code = replaceBlock(code, 'handleDeleteCaixaTransacao', `async (id: string) => {
    await deleteDocData('caixa_transacoes', id);
  };`);

code = replaceBlock(code, 'handleUpdateCaixaStatus', `async (status: CaixaStatus) => {
    await updateDocData('caixa_status', dbStore.configuracao.salaoId!, status);
  };`);

fs.writeFileSync('src/App.tsx', code);
