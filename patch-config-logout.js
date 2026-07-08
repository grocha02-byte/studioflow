import fs from "fs";

let content = fs.readFileSync("src/components/Configuracoes.tsx", "utf8");

const logoutSection = `
      {/* Minha Conta / Sair */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-red-50 bg-red-50/30 text-red-700 font-serif font-semibold">
          Minha Conta
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-900">Encerrar Sessão</h5>
              <p className="text-xs text-gray-500 mt-1">Deseja sair da sua conta? Você precisará fazer login novamente para acessar o painel.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                import('../lib/firebase').then(({ auth }) => {
                  auth.signOut();
                });
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </div>
`;

content = content.replace('{/* Sobre o Sistema */}', logoutSection + '\n      {/* Sobre o Sistema */}');

fs.writeFileSync("src/components/Configuracoes.tsx", content);
