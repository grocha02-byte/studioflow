import fs from "fs";

let content = fs.readFileSync("src/App.tsx", "utf8");

content = content.replace("import Relatorios from './components/Relatorios';",
  "import Relatorios from './components/Relatorios';\nimport ContasReceber from './components/ContasReceber';");

content = content.replace("import { \n  LayoutDashboard, ", "import { \n  LayoutDashboard, FileText, ");

content = content.replace("{ id: 'estoque', label: 'Estoque', icon: Package },",
  "{ id: 'estoque', label: 'Estoque', icon: Package },\n    { id: 'contas_receber', label: 'A Receber', icon: FileText },");

content = content.replace("if (isRecepcao) return ['dashboard', 'agenda', 'clientes', 'profissionais', 'servicos', 'estoque'].includes(item.id);",
  "if (isRecepcao) return ['dashboard', 'agenda', 'clientes', 'profissionais', 'servicos', 'estoque', 'contas_receber'].includes(item.id);");

content = content.replace(/case 'relatorios':\n\s+return \(\n\s+<Relatorios/m,
  `case 'contas_receber':
        return (
          <ContasReceber
            contas={dbStore.contasReceber || []}
            clientes={clientes}
            onUpdateConta={async (conta) => {
              await updateDocData('contas_receber', conta.id, conta);
            }}
            onAddCaixaTransacao={handleAddCaixaTransacao}
            onNavigateToClient={(clienteId) => {
              setGlobalSearch(clienteId);
              setActiveTab('clientes');
            }}
          />
        );
      case 'relatorios':
        return (
          <Relatorios`);

fs.writeFileSync("src/App.tsx", content);
