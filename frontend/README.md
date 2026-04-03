# ControleCliente - Frontend

Interface moderna e responsiva construída com React, TypeScript, Vite e Tailwind CSS.

## 🚀 Tecnologias

- **React 18** + **TypeScript**
- **Vite** - Build tool e dev server
- **React Router** - Navegação e rotas
- **Tailwind CSS** - Estilização
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de dados
- **Axios** - Cliente HTTP

## ✨ Funcionalidades

✅ Autenticação completa (login, cadastro, logout)  
✅ Proteção de rotas (redirect automático)  
✅ Navbar com destaque de link ativo  
✅ Formulários com validação em tempo real  
✅ Mensagens de erro e sucesso  
✅ Loading states  
✅ Design responsivo  
✅ httpOnly cookies para segurança  

## 📋 Pré-requisitos

- Node.js >= 20.10.0
- npm ou yarn
- Backend rodando em http://localhost:3001

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

O arquivo `.env` deve conter:

```env
VITE_API_URL=http://localhost:3001/api
```

## 🏃 Executar

### Modo desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:5173`

### Build para produção

```bash
npm run build
```

### Preview do build

```bash
npm run preview
```

## 📱 Páginas

### Públicas

- **/** - Home (página inicial)
- **/servicos** - Lista de serviços
- **/contato** - Formulário de contato
- **/login** - Login
- **/cadastro** - Cadastro de novo usuário

### Protegidas (requer autenticação)

- **/restricted** - Dashboard do usuário

## 🔐 Autenticação

O sistema usa **httpOnly cookies** para armazenar tokens JWT de forma segura:

1. Usuário faz login → cookies são definidos automaticamente
2. Todas as requisições incluem cookies automaticamente
3. Token expira → sistema tenta renovar automaticamente
4. Renovação falha → usuário é redirecionado para login

### Fluxo de Proteção de Rotas

1. Usuário tenta acessar `/restricted`
2. `ProtectedRoute` verifica se está autenticado
3. Se não autenticado → redirect para `/login`
4. Se autenticado → renderiza a página

## 📝 Validação de Formulários

Todos os formulários usam **React Hook Form** + **Zod** para validação:

### Cadastro
- Nome: mínimo 2 caracteres
- Email: formato válido
- Senha: 
  - Mínimo 8 caracteres
  - Pelo menos 1 letra maiúscula
  - Pelo menos 1 letra minúscula
  - Pelo menos 1 número

### Login
- Email: formato válido
- Senha: obrigatória

### Contato
- Nome: mínimo 2 caracteres
- Email: formato válido
- Mensagem: 10-1000 caracteres

## 🎨 Componentes

### Layout
- `Layout` - Wrapper principal com Navbar
- `Navbar` - Navegação com links ativos
- `ProtectedRoute` - Guard para rotas protegidas

### Páginas
- `Home` - Página inicial
- `Servicos` - Lista de serviços
- `Contato` - Formulário de contato
- `Login` - Autenticação
- `Cadastro` - Registro
- `Restricted` - Dashboard protegido

## 🔧 Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/         # Contextos React
│   │   └── AuthContext.tsx
│   ├── pages/            # Páginas da aplicação
│   │   ├── Home.tsx
│   │   ├── Servicos.tsx
│   │   ├── Contato.tsx
│   │   ├── Login.tsx
│   │   ├── Cadastro.tsx
│   │   └── Restricted.tsx
│   ├── schemas/          # Schemas de validação (Zod)
│   │   ├── auth.schema.ts
│   │   └── contact.schema.ts
│   ├── services/         # Serviços de API
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── contact.service.ts
│   ├── types/            # Tipos TypeScript
│   │   └── user.ts
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globais
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## 🎨 Tailwind CSS

Classes utilitárias personalizadas disponíveis:

```css
.btn-primary      /* Botão primário azul */
.btn-secondary    /* Botão secundário cinza */
.input-field      /* Campo de input */
.card             /* Card com sombra */
.error-text       /* Texto de erro vermelho */
```

## 🔄 Auto-Refresh de Token

O sistema implementa refresh automático de tokens:

1. Requisição retorna 401 (não autorizado)
2. Sistema tenta renovar o token via `/api/auth/refresh`
3. Se sucesso → repete a requisição original
4. Se falha → redireciona para login

Implementado em `src/services/api.ts`

## 🌐 Proxy de API

O Vite está configurado para fazer proxy das requisições `/api` para o backend:

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

Isso evita problemas de CORS durante o desenvolvimento.

## 🐛 Troubleshooting

### Erro de conexão com API

Verifique se o backend está rodando em `http://localhost:3001`:

```bash
cd ../backend
npm run dev
```

### Erro de CORS

Certifique-se de que o backend tem `FRONTEND_URL=http://localhost:5173` no `.env`

### Cookies não estão sendo enviados

Verifique se `withCredentials: true` está configurado no axios (`src/services/api.ts`)

## 📄 Licença

MIT
