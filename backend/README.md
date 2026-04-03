# ControleCliente - Backend API

Backend seguro para autenticação e gerenciamento de contatos, construído com Node.js, Express, TypeScript, Prisma e MySQL.

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Prisma** - ORM para MySQL
- **MySQL** - Banco de dados
- **bcrypt** - Hash de senhas (12 salt rounds)
- **jsonwebtoken** - Autenticação JWT
- **Zod** - Validação de dados
- **Helmet** - Segurança de headers HTTP
- **CORS** - Controle de acesso cross-origin
- **express-rate-limit** - Limitação de requisições

## 🔒 Recursos de Segurança

✅ Senhas com bcrypt (salt rounds: 12)  
✅ Autenticação JWT com httpOnly cookies  
✅ Refresh tokens (7 dias de validade)  
✅ Rate limiting em endpoints de autenticação (5 req/15min)  
✅ Helmet para headers de segurança  
✅ CORS configurado com credentials  
✅ Validação de entrada com Zod  
✅ Prevenção de SQL Injection via Prisma ORM  
✅ Logs de eventos de autenticação  

## 📋 Pré-requisitos

- Node.js >= 20.10.0
- MySQL >= 8.0
- npm ou yarn

## 🛠️ Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure suas variáveis:

```env
DATABASE_URL="mysql://root:password@localhost:3306/controle_cliente"
JWT_SECRET="seu-secret-jwt-super-seguro"
JWT_REFRESH_SECRET="seu-refresh-secret-super-seguro"
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

**⚠️ IMPORTANTE:** Altere os secrets JWT em produção!

### 3. Iniciar banco de dados MySQL

**Opção A: Com Docker (recomendado)**

```bash
docker-compose up -d
```

**Opção B: MySQL local**

Certifique-se de que o MySQL está rodando e crie o banco de dados:

```sql
CREATE DATABASE controle_cliente;
```

### 4. Executar migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. (Opcional) Popular banco com usuário de teste

```bash
npm run prisma:seed
```

Usuário de teste criado:
- **Email:** test@example.com
- **Senha:** Test123!

## 🏃 Executar

### Modo desenvolvimento (com hot reload)

```bash
npm run dev
```

### Modo produção

```bash
npm run build
npm start
```

O servidor estará disponível em: `http://localhost:3001`

## 📡 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/register` | Cadastrar novo usuário | Não |
| POST | `/api/auth/login` | Login | Não |
| POST | `/api/auth/logout` | Logout | Sim |
| GET | `/api/auth/me` | Dados do usuário logado | Sim |
| POST | `/api/auth/refresh` | Renovar access token | Não |

### Contato

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/contact` | Enviar mensagem de contato | Não |

### Saúde

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| GET | `/api/health` | Health check | Não |

## 📝 Exemplos de Requisições

### Cadastro

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "Senha123!"
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "Senha123!"
}
```

**Resposta:** Define cookies httpOnly (`accessToken` e `refreshToken`)

### Obter dados do usuário

```bash
GET /api/auth/me
Cookie: accessToken=<token>
```

### Enviar mensagem de contato

```bash
POST /api/contact
Content-Type: application/json

{
  "name": "Maria Santos",
  "email": "maria@example.com",
  "message": "Gostaria de mais informações sobre os serviços."
}
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: users

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| name | String | Nome do usuário |
| email | String | Email (único) |
| password_hash | String | Hash da senha (bcrypt) |
| created_at | DateTime | Data de criação |
| updated_at | DateTime | Data de atualização |

### Tabela: contact_messages

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| name | String | Nome do remetente |
| email | String | Email do remetente |
| message | Text | Mensagem |
| created_at | DateTime | Data de criação |

## 🔧 Scripts Disponíveis

```bash
npm run dev              # Desenvolvimento com hot reload
npm run build            # Build para produção
npm start                # Executar build de produção
npm run prisma:migrate   # Executar migrations
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:seed      # Popular banco com dados de teste
npm run prisma:studio    # Abrir Prisma Studio (GUI)
```

## 📦 Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.ts            # Dados de teste
├── src/
│   ├── controllers/       # Controladores
│   ├── middleware/        # Middlewares (auth, security, validation)
│   ├── routes/            # Rotas da API
│   ├── schemas/           # Schemas de validação (Zod)
│   ├── services/          # Lógica de negócio
│   ├── types/             # Tipos TypeScript
│   ├── utils/             # Utilitários (JWT, logger)
│   ├── app.ts             # Configuração do Express
│   └── server.ts          # Entry point
├── .env.example           # Exemplo de variáveis de ambiente
├── docker-compose.yml     # Configuração Docker
├── package.json
└── tsconfig.json
```

## 🔐 Autenticação

O sistema usa **JWT com httpOnly cookies** para maior segurança:

1. **Access Token**: Válido por 15 minutos, armazenado em cookie httpOnly
2. **Refresh Token**: Válido por 7 dias, armazenado em cookie httpOnly

### Fluxo de Autenticação

1. Usuário faz login → recebe access token e refresh token em cookies
2. Frontend faz requisições com cookies automaticamente
3. Quando access token expira → usar `/api/auth/refresh` para renovar
4. Logout limpa os cookies

## 🛡️ Rate Limiting

Endpoints de autenticação têm rate limiting configurado:
- **Limite**: 5 requisições por IP
- **Janela**: 15 minutos
- **Endpoints protegidos**: `/api/auth/register`, `/api/auth/login`

## 📊 Logs

O sistema registra eventos importantes:
- ✅ Login bem-sucedido
- ❌ Falha de login
- 📝 Cadastro de usuário
- 🔄 Renovação de token
- 🚪 Logout

## 🐛 Troubleshooting

### Erro de conexão com MySQL

Verifique se o MySQL está rodando:
```bash
docker-compose ps
```

### Erro de migrations

Resetar banco de dados (⚠️ apaga todos os dados):
```bash
npx prisma migrate reset
```

### Erro de CORS

Verifique se `FRONTEND_URL` no `.env` está correto.

## 📄 Licença

MIT
