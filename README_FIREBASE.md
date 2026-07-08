# Configuração Pendente no Firebase

O código do StudioFlow já está 100% integrado com o seu projeto Firebase (`studioflow-8969e`). No entanto, nossos testes de conexão identificaram que os serviços ainda não estão ativados no console do Google. 

Para que o sistema grave e leia dados reais, siga os passos abaixo no [Console do Firebase](https://console.firebase.google.com/project/studioflow-8969e/overview):

1. **Ativar Firestore Database:**
   - Acesse **Build > Firestore Database**.
   - Clique em **Create database**.
   - Copie o conteúdo do arquivo `firestore.rules` (já criado no projeto) e cole na aba **Rules**.

2. **Ativar Authentication:**
   - Acesse **Build > Authentication**.
   - Clique em **Get Started**.
   - Vá na aba **Sign-in method**, clique em **Email/Password** e ative.

3. **Ativar Cloud Storage:**
   - Acesse **Build > Storage**.
   - Clique em **Get Started**.
   - Copie o conteúdo do arquivo `storage.rules` (já criado no projeto) e cole na aba **Rules**.

Após realizar essas ativações no console, o sistema começará a persistir dados instantaneamente em tempo real.
