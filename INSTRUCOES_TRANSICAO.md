# 🚀 Resumo de Transição - Projeto ControleCliente

Este arquivo foi gerado para auxiliar na mudança de máquina, garantindo que o progresso da automação do WhatsApp seja mantido.

## 📍 Links Importantes
- **Backend (Render):** `https://controle-cliente-api.onrender.com`
- **Link do QR Code:** [Gerar QR Code WhatsApp](https://controle-cliente-api.onrender.com/api/whatsapp/qr)
- **Frontend (Vercel):** `https://controle-cliente.vercel.app`

## 🛠️ O que foi implementado hoje
1. **Persistência Completa:** O agendador agora usa `RemoteAuth` com **Supabase Storage**.
2. **Compactação Automática:** O sistema cria um ZIP da sessão e envia para o bucket `whatsapp-sessions`.
3. **Status Visual:** Adicionada uma bolinha indicadora no menu administrativo (apenas para Admins).
4. **Resiliência:** O processo de agendamento não trava mais se o WhatsApp estiver offline.
5. **Correção de Agenda:** Horários cancelados agora voltam a ficar disponíveis imediatamente.

## 📋 Variáveis de Ambiente Necessárias (Mova para o novo PC)
Você precisará configurar estas chaves no seu arquivo `.env` local no novo PC:

### Backend (.env)
- `DATABASE_URL`: (Sua URL do banco Supabase)
- `JWT_SECRET`: (Sua chave secreta JWT)
- `SUPABASE_URL`: `https://itwfxlbgnhahgkxilkdu.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: (Aquela chave secreta que começa com `sb_secret`)

### Frontend (.env)
- `VITE_API_URL`: `http://localhost:3001/api` (para testes locais)

## 🔄 Status Atual no Render
- **Configuração de Build:** `npm install && npm run build`
- **Configuração de Start:** `npm start`
- **Root Directory:** `backend`

**Próximo Passo:** Após o primeiro login via QR Code, verifique se o arquivo `controle-cliente.zip` apareceu no seu bucket do Supabase. A partir daí, o robô será "imortal".

---
*Gerado automaticamente para apoiar a transição de ambiente do usuário.*
