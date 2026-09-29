# Na Quadra - Descrição Geral do Projeto

Plataforma mobile-first para a comunidade de basquete, voltada ao agendamento de partidas, gestão de quadras e organização de jogos (rachões, campeonatos, ligas e torneios).

## Estrutura de Janelas (Telas) Desenvolvidas

### 1. Tela de Autenticação (Login / Cadastro / Recuperação)
Localizada em `index.html` (Grupo 1) e controlada por `js/app.js`.

- **Login**: campos de e-mail e senha, opção "Lembrar de mim", link "Esqueceu a senha?", atalho para criar conta e botão de acesso direto (Modo Demonstração).
- **Cadastro Inicial**: criação de conta com e-mail, senha (mín. 6 dígitos) e confirmação de senha.
- **Recuperação de Senha**: duas etapas — envio de código para o e-mail e inserção do código para definir uma nova senha.
- **Logout**: encerra a sessão e retorna à tela de login.

### 2. Dashboard (Pós-Login)
Localizado em `index.html` (Grupo 2), com `js/app.js` para navegação e `js/api.js` para comunicação com o backend.

- **Sidebar de Navegação**: marca "Na Quadra", menu com duas etapas (1. Complete seu Cadastro, 2. Cadastro de Atleta) e badges de status (Pendente, Bloqueado, Liberado, Concluído, Ativo), além do perfil do usuário e botão de logout.
- **Topbar**: título da página atual, botão para abrir/fechar menu no mobile, relógio em tempo real com indicador "Conectado".
- **Etapa 1 — Complete seu Cadastro (Aba USERS)**: banner de orientação, upload de foto de perfil (arquivo ou URL), campos de nome completo, tipo de conta (Atleta, Organizador, Técnico, Torcedor), data de nascimento, telefone, endereço, número, bairro, cidade e UF. Botão "Salvar e Concluir Cadastro".
- **Etapa 2 — Cadastro de Atleta (Aba ATLETAS)**: bloqueada até a conclusão da Etapa 1. Inclui foto de atleta (com opção de copiar a foto da Etapa 1), nome, posição de jogo (Armador, Ala-Armador, Ala, Ala-Pivô, Pivô), altura, peso, gênero, data de nascimento, idade calculada automaticamente e telefone. Possui prévia em tempo real de um "card de atleta" (estilo trading card) com foto, nome, posição, altura, peso e idade.

## Camadas do Projeto

- **`index.html`**: estrutura de todas as janelas e formulários.
- **`css/styles.css`**: design system (tema dark, paleta `#ff6b35`, layout responsivo mobile-first).
- **`js/app.js`**: lógica das telas, navegação, validações, sessões (localStorage) e autenticação.
- **`js/api.js`**: camada de comunicação com o backend (Google Apps Script via proxy Vercel, com fallback direto).
- **`api/auth.js`**: Serverless Function da Vercel que faz proxy seguro para o Apps Script, contornando bloqueios de CORS.
- **`legacy_appsscript/`**: backend em Google Apps Script que persiste os dados nas abas USERS e ATLETAS do Google Sheets.
