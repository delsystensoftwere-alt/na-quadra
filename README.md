# Na Quadra

> Gerenciamento de jogos de basquete, campeonatos, ligas, torneios e peladas (rachão).

Plataforma mobile-first para a comunidade de basquete: agendamento de horários, gestão de quadras e organização de partidas.

## 🚀 Tecnologias

- **HTML5** semântico e responsivo (Mobile-first app shell).
- **CSS3 Puro** com design system moderno (tema dark, paleta esportiva `#ff6b35`, microinterações e suporte a notch/safe-areas).
- **JavaScript Moderno (ES6+)** nativo sem frameworks pesados para carregamento instantâneo.
- **Serverless API (Vercel)** em `/api/auth.js` atuando como proxy seguro para o banco de dados (Google Apps Script / Sheets), eliminando bloqueios de CORS e redirects 302.

## 📁 Estrutura do Projeto

```text
├── index.html        # Página principal (Login, Cadastro, Recuperação de Senha)
├── css/
│   └── styles.css    # Design system e folhas de estilo
├── js/
│   ├── api.js        # Camada de comunicação com a API (fetch / proxy Vercel)
│   └── app.js        # Lógica de interface, telas e validações
├── api/
│   └── auth.js       # Vercel Serverless Function (proxy para o backend Apps Script)
├── vercel.json       # Configuração de rotas para deploy na Vercel
└── .gitignore
```

## 🌐 Publicação na Vercel

1. Conecte este repositório do GitHub à sua conta na [Vercel](https://vercel.com).
2. O framework preset pode ser definido como **Other** (HTML/CSS estático com Serverless Functions).
3. O deploy será feito automaticamente a cada novo `git push`.
