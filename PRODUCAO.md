# Guia de Produção - StudioFlow

O StudioFlow foi refatorado para utilizar uma arquitetura baseada em nuvem, garantindo segurança, acesso de múltiplos dispositivos e sincronização em tempo real.

## Banco de Dados & Autenticação (Firebase)

Optamos por utilizar o Firebase (plataforma oficial integrada ao ambiente) para gerenciar a Nuvem:
- **Autenticação (Auth)**: Gerencia logins de administradores, recepcionistas, profissionais e gerentes.
- **Banco de Dados em Tempo Real (Firestore)**: Banco NoSQL escalável que garante o sincronismo imediato em todos os dispositivos.
- **Armazenamento (Storage)**: Para salvar imagens de perfil, logotipos e anexos.
- **Segurança (Security Rules)**: Validação em nível de banco de dados garantindo que usuários de um salão não acessem dados de outro salão (Multi-tenant).

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (como o `.env.example`) com as credenciais do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

## Hospedagem (Deploy)

Você pode publicar este projeto facilmente utilizando a Vercel, Netlify ou exportando pelo próprio AI Studio:

**Opção 1: Netlify / Vercel**
1. Faça upload do código para o GitHub.
2. Acesse a Netlify ou Vercel e importe o repositório.
3. Configure o comando de Build: `npm run build`
4. Configure o diretório de saída: `dist`
5. Cadastre todas as Variáveis de Ambiente (listadas acima) no painel da Netlify/Vercel.

**Opção 2: Exportar ZIP e hospedar via Hostinger / FTP**
1. Execute o comando `npm run build` na sua máquina ou no terminal do painel.
2. Uma pasta `dist` será gerada contendo os arquivos finais estáticos.
3. Faça o upload do conteúdo da pasta `dist` para a raiz do seu servidor FTP.

## Estrutura Multiempresa (Multi-Tenant)
O sistema está estruturado para suportar `salaoId`. 
Quando o Administrador cria a conta, um `salaoId` é gerado e as regras de segurança garantem que todos os profissionais, clientes, serviços e configurações operem isoladamente dentro desse mesmo identificador.

## Notificações e Lembretes
O sistema conta com um módulo de background local que verifica a cada 60 segundos os agendamentos futuros. 
Ele gera notificações virtuais e também exibe Notificações Push no navegador 20 minutos antes do atendimento.
Futuramente, Webhooks no Firestore poderão disparar integrações com a API Oficial do WhatsApp.

## Backups
Com a adoção do Firebase, o backup é gerido automaticamente pela nuvem do Google de forma redundante e segura. Nenhum dado é perdido caso o usuário desinstale o navegador ou acesse de outro computador.

### Regras de Segurança e Índices (Setup Manual)
Como você forneceu seu próprio projeto Firebase, é necessário aplicar as regras de segurança criadas no arquivo `firestore.rules` e `storage.rules`.
No console do Firebase (https://console.firebase.google.com/):
1. Vá em **Firestore Database** > **Rules** e cole o conteúdo de `firestore.rules`.
2. Vá em **Storage** > **Rules** e cole o conteúdo de `storage.rules`.
3. Os índices serão solicitados automaticamente pelo Firestore na primeira vez que uma consulta complexa for feita (você receberá o link no console do navegador para criá-lo em 1 clique).
