# 💚 Minhas Finanças - Controle Financeiro Pessoal

Aplicação web estática, limpa e moderna de **controle financeiro pessoal**, construída com **HTML5, CSS3 vanila e JavaScript (ES Modules)**, integrada ao **Firebase (Authentication + Cloud Firestore)** no plano gratuito (Spark). 

Desenvolvida com abordagem *mobile-first*, compatível com navegadores em computadores e WebViews em smartphones, e otimizada para publicação gratuita no **GitHub Pages**.

---

## 🚀 Funcionalidades Principais

- **Autenticação Real**: Login e cadastro com e-mail e senha via Firebase Auth.
- **Armazenamento na Nuvem**: Dados salvos no Cloud Firestore com sincronização automática e debounce para otimizar gravações.
- **Organização por Mês e Períodos**:
  - Abas navegáveis começando em **Setembro de 2026**.
  - **Período do Dia 15**: Para contas da primeira quinzena.
  - **Período do Dia 31**: Para contas de fim de mês.
- **Ajuste Automático de Finais de Semana**:
  - Vencimentos que caem em **Sábado** ou **Domingo** são ajustados automaticamente para a **Sexta-feira anterior**, exibindo a data já corrigida na interface.
- **Herança entre Meses**:
  - O valor definido no primeiro mês é reaproveitado como padrão nos meses seguintes para a mesma categoria.
- **Controle de Status Pago / Pendente**:
  - Toggles visuais rápidos (**Pago em Verde**, **Pendente em Vermelho**).
- **Cálculo em Tempo Real**:
  - Totais de Entradas, Saídas e Saldo do Período e do Mês (Verde para saldo positivo, Vermelho para saldo negativo).

---

## 📁 Estrutura de Arquivos

```text
minhas-financas/
├── index.html               # Interface estática HTML5 (Login e Dashboard)
├── css/
│   └── style.css            # Estilos responsivos, tema claro/branco e design moderno
├── js/
│   ├── firebase-config.js   # Configuração do Firebase (com placeholders)
│   ├── auth.js              # Módulo de Autenticação (Login, Cadastro, Logout)
│   ├── finance.js           # Lógica financeira, cálculo de datas e Firestore
│   └── app.js               # Controlador da interface e renderização de abas
└── README.md                # Guia completo de configuração e implantação
```

---

## 🛠️ Passo a Passo: Configuração no Firebase Console

### 1. Criar o Projeto no Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Clique em **Adicionar projeto** (ou "Criar um projeto").
3. Digite o nome do projeto (ex.: `minhas-financas-app`) e clique em **Continuar**.
4. Desative ou ative o Google Analytics (opcional) e conclua a criação.

### 2. Ativar a Autenticação (Email/Password)
1. No menu lateral esquerdo, clique em **Criação (Build)** > **Authentication**.
2. Clique em **Vamos começar**.
3. Na aba **Provedores de login**, selecione **E-mail/senha**.
4. Ative a primeira opção (**E-mail/senha**) e clique em **Salvar**.

### 3. Criar o Banco de Dados Cloud Firestore
1. No menu lateral esquerdo, clique em **Criação (Build)** > **Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Escolha a localização do servidor (ex.: `southamerica-east1` para São Paulo).
4. Selecione **Iniciar no modo de teste** ou **modo de produção** e clique em **Criar**.

### 4. Obter as Chaves do App Web
1. Na página inicial do projeto no Firebase Console, clique no ícone **Web (`</>`)** para adicionar um aplicativo.
2. Registre o app com o apelido `minhas-financas-web` (não precisa ativar o Firebase Hosting).
3. Copie o objeto `firebaseConfig` exibido na tela.

---

## 🔑 Onde Colar as Chaves do Firebase

Abra o arquivo [`js/firebase-config.js`](file:///Users/ismaelrojas/Library/CloudStorage/OneDrive-IBM/Documents/Projetos/minhas-financas/js/firebase-config.js) e substitua os valores dos *placeholders* pelas suas chaves obtidas no passo anterior:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

---

## 🔒 Regras de Segurança do Firestore

> [!IMPORTANT]
> As chaves da API do Firebase no código frontend são públicas por natureza. A **segurança real** do banco de dados na nuvem é garantida exclusivamente pelas **Regras de Segurança do Cloud Firestore**.

1. No Firebase Console, vá em **Firestore Database** > aba **Regras**.
2. Cole o seguinte código de regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Garante que cada usuário só pode ler e escrever seus próprios dados
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Clique em **Publicar**.

Com essa regra aplicada, mesmo que alguém veja suas chaves no código-fonte, o banco de dados só permitirá que cada usuário leia e modifique os **seus próprios documentos** (`users/{uid}/...`).

---

## 🌐 Publicação no GitHub Pages (Deploy)

Para versionar a aplicação no GitHub e torná-la acessível publicamente via web ou WebView:

### 1. Inicializar o Repositório Git
No terminal do seu computador, na pasta do projeto:

```bash
git init
git add .
git commit -m "feat: versão inicial do minhas-financas com Firebase Auth e Firestore"
```

### 2. Criar o Repositório no GitHub
1. Acesse o [GitHub](https://github.com/) e crie um **novo repositório público** chamado `minhas-financas`.
2. Vincule e envie os arquivos:

```bash
git remote add origin https://github.com/SEU_USUARIO/minhas-financas.git
git branch -M main
git push -u origin main
```

### 3. Ativar o GitHub Pages
1. No seu repositório no GitHub, vá em **Settings** > **Pages** (no menu lateral esquerdo).
2. Em **Build and deployment** > **Source**, selecione **Deploy from a branch**.
3. Em **Branch**, escolha `main` e a pasta `/ (root)`.
4. Clique em **Save**.
5. Em poucos instantes, a sua URL estará no ar (ex.: `https://SEU_USUARIO.github.io/minhas-financas/`).

---

## 📝 Licença

Este projeto é de uso livre sob a licença MIT. Sinta-se à vontade para utilizar e personalizar.
