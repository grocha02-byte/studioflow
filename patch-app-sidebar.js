import fs from "fs";

let content = fs.readFileSync("src/App.tsx", "utf8");

const userInfoBlockMobile = `
            {/* Informações do Usuário */}
            <div className="pt-4 border-t border-gold-50 mt-4">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center shrink-0 font-bold text-sm">
                  {usuarioData?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{usuarioData?.nome}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                  <p className="text-[9px] text-gold-600 font-semibold uppercase mt-0.5">{usuarioData?.role}</p>
                </div>
              </div>
              <button
                onClick={() => auth.signOut()}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sair do Sistema</span>
              </button>
            </div>
`;

const userInfoBlockDesktop = `
        {/* Informações do Usuário */}
        <div className="pt-4 border-t border-gold-100 mt-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center shrink-0 font-bold text-sm">
              {usuarioData?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{usuarioData?.nome}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              <p className="text-[9px] text-gold-600 font-semibold uppercase mt-0.5">{usuarioData?.role}</p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sair do Sistema</span>
          </button>
        </div>
`;

content = content.replace('{/* Rodapé do Menu */}', userInfoBlockMobile + '\n            {/* Rodapé do Menu */}');
// Need to only replace the first one for mobile, and the second one for desktop
content = content.replace('{/* Rodapé do Menu */}', '{/* Rodapé do Menu MOBILE */}');
content = content.replace('{/* Rodapé do Menu */}', userInfoBlockDesktop + '\n        {/* Rodapé do Menu */}');
content = content.replace('{/* Rodapé do Menu MOBILE */}', '{/* Rodapé do Menu */}');

fs.writeFileSync("src/App.tsx", content);
