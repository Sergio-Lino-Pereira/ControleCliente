# ControleCliente - Full-Stack Application

Sistema completo de gerenciamento de clientes com autenticação segura, construído com as melhores práticas de desenvolvimento.

## 🎯 Visão Geral

Aplicação full-stack moderna e segura com:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma + MySQL
- **Autenticação**: JWT com httpOnly cookies
- **Segurança**: bcrypt, rate limiting, helmet, CORS, validação Zod

## 📁 Estrutura do Projeto

```
ControleCliente/
├── backend/          # API Node.js + Express + Prisma
│   ├── prisma/       # Schema e migrations do banco
│   ├── src/          # Código fonte
│   └── README.md     # Documentação do backend
├── frontend/         # React + TypeScript + Vite
│   ├── src/          # Código fonte
│   └── README.md     # Documentação do frontend
└── README.md         # Este arquivo
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js >= 20.10.0
- MySQL >= 8.0
- npm ou yarn

### 1. Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Iniciar MySQL (com Docker)
docker-compose up -d

# Executar migrations
npm run prisma:generate
npm run prisma:migrate

# (Opcional) Popular com dados de teste
npm run prisma:seed

# Iniciar servidor
npm run dev
```

O backend estará rodando em: `http://localhost:3001`

### 2. Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# O padrão já aponta para http://localhost:3001/api

# Iniciar aplicação
npm run dev
```

O frontend estará rodando em: `http://localhost:5173`

## 🔐 Credenciais de Teste

Se você executou o seed do banco de dados:

- **Email**: test@example.com
- **Senha**: Test123!

## 📚 Documentação Completa

- [Backend README](./backend/README.md) - Documentação completa da API
- [Frontend README](./frontend/README.md) - Documentação completa do frontend

## ✨ Funcionalidades

### Autenticação e Segurança
- ✅ Cadastro de usuários com validação
- ✅ Login com JWT (httpOnly cookies)
- ✅ Logout seguro
- ✅ Proteção de rotas no frontend
- ✅ Middleware de autenticação no backend
- ✅ Refresh token automático
- ✅ Senhas com bcrypt (12 salt rounds)
- ✅ Rate limiting (5 req/15min em auth endpoints)
- ✅ Headers de segurança (Helmet)
- ✅ CORS configurado

### Páginas Frontend
- 🏠 **Home** - Página inicial
- 🛠️ **Serviços** - Lista de serviços
- 📧 **Contato** - Formulário funcional
- 🔑 **Login** - Autenticação
- 📝 **Cadastro** - Registro de usuário
- 🔒 **Área Restrita** - Dashboard protegido

### API Endpoints

#### Autenticação
- `POST /api/auth/register` - Cadastrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário logado
- `POST /api/auth/refresh` - Renovar token

#### Contato
- `POST /api/contact` - Enviar mensagem

#### Saúde
- `GET /api/health` - Health check

## 🗄️ Banco de Dados

### Tabelas

**users**
- id (UUID)
- name (String)
- email (String, unique)
- password_hash (String)
- created_at (DateTime)
- updated_at (DateTime)

**contact_messages**
- id (UUID)
- name (String)
- email (String)
- message (Text)
- created_at (DateTime)

## 🛡️ Segurança Implementada

1. **Senhas**: Hash com bcrypt (12 salt rounds)
2. **Tokens**: JWT com httpOnly cookies (não acessíveis via JavaScript)
3. **Validação**: Zod no backend e frontend
4. **SQL Injection**: Prevenido via Prisma ORM
5. **Rate Limiting**: 5 requisições por 15 minutos em endpoints de auth
6. **Headers**: Helmet para headers de segurança
7. **CORS**: Configurado com credentials
8. **Logs**: Eventos de autenticação registrados

## 🔧 Scripts Úteis

### Backend
```bash
npm run dev              # Desenvolvimento
npm run build            # Build para produção
npm start                # Executar build
npm run prisma:migrate   # Executar migrations
npm run prisma:studio    # Abrir Prisma Studio (GUI)
```

### Frontend
```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

## 🐛 Troubleshooting

### Backend não conecta ao MySQL

Verifique se o MySQL está rodando:
```bash
cd backend
docker-compose ps
```

### Frontend não conecta ao backend

1. Verifique se o backend está rodando em `http://localhost:3001`
2. Verifique o arquivo `frontend/.env`

### Erro de CORS

Certifique-se de que:
- Backend: `FRONTEND_URL=http://localhost:5173` no `.env`
- Frontend: `VITE_API_URL=http://localhost:3001/api` no `.env`

### Cookies não funcionam

Verifique se:
- Backend e frontend estão rodando (não podem estar parados)
- `withCredentials: true` está configurado no axios
- CORS está configurado com `credentials: true`

## 📦 Produção

### Backend

1. Configure variáveis de ambiente de produção
2. Altere `JWT_SECRET` e `JWT_REFRESH_SECRET` para valores seguros
3. Configure `NODE_ENV=production`
4. Execute migrations: `npm run prisma:migrate`
5. Build: `npm run build`
6. Start: `npm start`

### Frontend

1. Configure `VITE_API_URL` para a URL da API em produção
2. Build: `npm run build`
3. Deploy a pasta `dist/` para seu servidor/CDN

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT

## 👨‍💻 Autor

Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento full-stack.
