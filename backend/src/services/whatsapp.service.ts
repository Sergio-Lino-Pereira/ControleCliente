import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    ConnectionState,
    WASocket,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs-extra';
import path from 'path';
import { SupabaseStore } from './supabase-store';

const store = new SupabaseStore();
const AUTH_DIR = path.join(process.cwd(), '.baileys_auth');

class WhatsappServiceClass {
    private sock: WASocket | null = null;
    private ready: boolean = false;
    private lastQR: string | null = null; // Base64 image
    private pairingCode: string | null = null;
    private internalStatus: string = 'OFFLINE';
    private isInitializing: boolean = false;
    private saveTimeout: NodeJS.Timeout | null = null;

    constructor() { }

    private async cleanupAuthDir() {
        try {
            console.log('[WhatsappService] 🧹 Limpando diretório de autenticação local...');
            if (await fs.pathExists(AUTH_DIR)) {
                await fs.remove(AUTH_DIR);
            }
            await fs.ensureDir(AUTH_DIR);
        } catch (err) {
            console.error('[WhatsappService] Erro ao limpar pasta de autenticação:', err);
        }
    }

    public async initialize() {
        if (this.isInitializing || this.ready) return;

        this.isInitializing = true;
        this.internalStatus = 'INITIALIZING';
        console.log('[WhatsappService] 🚀 Iniciando processo de conexão (Versão Estável)...');

        try {
            // 0. Versão Automática
            const { version } = await fetchLatestBaileysVersion();
            console.log(`[WhatsappService] Protocolo WA: ${version.join('.')}`);

            // 0.1 Baixar sessão do Supabase (para persistência entre deploys/reboots)
            console.log('[WhatsappService] 📥 Tentando recuperar sessão do banco de dados...');
            await store.download({ session: 'controle-cliente' });

            // 1. Garantir que o diretório existe...
            // A limpeza agora é feita apenas em falhas críticas de autenticação (Status 401, 403, etc)
            await fs.ensureDir(AUTH_DIR);

            // 2. Configurar o estado de autenticação
            const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

            // 3. Criar o Socket com perfil Windows Desktop (Mais compatível)
            this.sock = makeWASocket({
                version,
                auth: state,
                logger: pino({ level: 'error' }),
                browser: ['Windows', 'Chrome', '123.0.6312.122'],
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                connectTimeoutMs: 120000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                generateHighQualityLinkPreview: false,
                markOnlineOnConnect: true
            });

            // 4. Escutar atualizações de conexão
            this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.internalStatus = 'QR_READY';
                    try {
                        this.lastQR = await QRCode.toDataURL(qr);
                        console.log('[WhatsappService] 📲 QR Code pronto.');
                    } catch (err) {
                        console.error('[WhatsappService] Erro ao gerar imagem do QR:', err);
                    }
                }

                if (connection === 'connecting') {
                    console.log('[WhatsappService] ⏳ Conectando ao WhatsApp...');
                    this.internalStatus = 'CONNECTING';
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    console.error(`[WhatsappService] 🔴 Conexão encerrada (Status: ${statusCode}). Reconectando: ${shouldReconnect}`);

                    this.ready = false;
                    this.internalStatus = 'DISCONNECTED';
                    this.isInitializing = false;

                    // Erros que exigem reset (Removido 515 daqui para permitir reconexão sem perder o código)
                    const criticalAuthErrors = [DisconnectReason.loggedOut, 401, 403, 428];

                    if (criticalAuthErrors.includes(statusCode || 0)) {
                        console.warn(`[WhatsappService] ⚠️ Falha de Autenticação (${statusCode}). Resetando sessão...`);
                        await store.delete({ session: 'controle-cliente' });
                        await this.cleanupAuthDir();
                    }

                    if (shouldReconnect) {
                        setTimeout(() => this.initialize(), 5000);
                    } else {
                        console.warn('[WhatsappService] ⚠️ Sessão encerrada permanentemente.');
                        await store.delete({ session: 'controle-cliente' });
                        await this.cleanupAuthDir();
                        setTimeout(() => this.initialize(), 10000);
                    }
                } else if (connection === 'open') {
                    console.log('[WhatsappService] ✨ CONEXÃO ESTABELECIDA COM SUCESSO!');
                    this.ready = true;
                    this.lastQR = null;
                    this.pairingCode = null;
                    this.internalStatus = 'CONNECTED';
                    this.isInitializing = false;

                    const user = this.sock?.user;
                    console.log(`[WhatsappService] 👤 Conectado como: ${user?.name || 'WhatsApp Robot'} (${user?.id})`);

                    // Manter a conexão ativa
                    setInterval(() => {
                        if (this.sock && this.ready) {
                            this.sock.sendPresenceUpdate('available');
                        }
                    }, 30000);

                    console.log('[WhatsappService] 💾 Salvando sessão estável no Supabase...');
                    await store.save({ session: 'controle-cliente' });
                }
            });

            // 5. Salvar credenciais quando atualizadas (Debounced e APENAS se estiver pronto)
            this.sock.ev.on('creds.update', async () => {
                await saveCreds();

                // Só salvamos no Supabase automaticamente se já tivermos passado pelo 'open' 
                // para evitar salvar estados parciais que causam erro 515
                if (this.ready) {
                    if (this.saveTimeout) clearTimeout(this.saveTimeout);
                    this.saveTimeout = setTimeout(async () => {
                        console.log('[WhatsappService] 🔄 Sincronizando credenciais estáveis...');
                        await store.save({ session: 'controle-cliente' });
                    }, 30000);
                }
            });

        } catch (error) {
            console.error('[WhatsappService] ❌ Erro fatal na inicialização:', error);
            this.internalStatus = 'ERROR';
            this.isInitializing = false;
        }
    }

    public async reset() {
        console.log('[WhatsappService] 🔄 Resetando serviço...');

        // 1. Limpar estados
        this.pairingCode = null;
        this.lastQR = null;
        this.ready = false;
        this.isInitializing = false;
        this.internalStatus = 'OFFLINE';

        if (this.sock) {
            try {
                // Remover listeners para evitar vazamento de memória e chamadas duplicadas
                this.sock.ev.removeAllListeners('connection.update');
                this.sock.ev.removeAllListeners('creds.update');
                // Fechar conexão
                this.sock.end(undefined);
                console.log('[WhatsappService] 🔌 Socket fechado com sucesso.');
            } catch (err) {
                console.warn('[WhatsappService] Erro ao fechar socket:', err);
            }
            this.sock = null;
        }

        // 2. Limpar cache local (força novo login se não houver persistência)
        try {
            await this.cleanupAuthDir();
            console.log('[WhatsappService] 🧹 Cache de autenticação limpo.');
        } catch (err) {
            console.error('[WhatsappService] Erro ao limpar cache durante reset:', err);
        }

        // 3. Reiniciar processo
        console.log('[WhatsappService] ♻️ Reiniciando serviço...');
        await this.initialize();
    }

    public async disconnect() {
        if (this.sock) {
            try {
                await this.sock.logout();
            } catch (err) {
                console.warn('[WhatsappService] Erro ao deslogar:', err);
            }
            this.ready = false;
            this.internalStatus = 'OFFLINE';
        }
    }

    public getQRCode(): string | null {
        return this.lastQR;
    }

    public isReady(): boolean {
        return this.ready;
    }

    public getStatus(): string {
        return this.internalStatus;
    }

    public getPairingCode(): string | null {
        return this.pairingCode;
    }

    public async requestPairingCode(phone: string): Promise<string | null> {
        console.log(`[WhatsappService] 🔑 Solicitando código de pareamento para ${phone}...`);

        // Resetar estados anteriores
        this.pairingCode = null;
        this.lastQR = null;

        // Se não estiver inicializado, inicia
        if (!this.sock) {
            await this.initialize();
        }

        // Aguardar um pouco para garantir que o socket está pronto para requisições
        let attempts = 0;
        while (!this.sock && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        if (!this.sock) {
            throw new Error('Não foi possível inicializar o socket para pareamento.');
        }

        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const code = await this.sock.requestPairingCode(cleanPhone);
            this.pairingCode = code;
            console.log(`[WhatsappService] ✅ Código gerado: ${code}`);
            return code;
        } catch (error) {
            console.error('[WhatsappService] Erro ao solicitar código de pareamento:', error);
            throw error;
        }
    }

    public async sendMessage(phone: string, message: string): Promise<boolean> {
        console.log(`[WhatsappService] 📨 Tentando enviar mensagem para ${phone}. Status: ${this.internalStatus}, Ready: ${this.ready}`);

        if (!this.ready || !this.sock) {
            console.warn(`[WhatsappService] ❌ Falha no envio: Serviço não está pronto (Ready: ${this.ready})`);
            return false;
        }

        try {
            let cleanPhone = phone.replace(/\D/g, '');

            // Normalização para números do Brasil (55)
            if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
                // Se tem 13 dígitos (55 + DDD + 9 + 8 dígitos), 
                // o WhatsApp muitas vezes espera o JID sem o nono dígito (55 + DDD + 8 dígitos)
                // Vamos remover o '9' que fica na posição [4] (ex: 55 67 [9] 9961...)
                const ddd = cleanPhone.substring(2, 4);
                const number = cleanPhone.substring(5);
                const normalized = `55${ddd}${number}`;
                console.log(`[WhatsappService] 🔁 Normalizando número brasileiro: ${cleanPhone} -> ${normalized}`);
                cleanPhone = normalized;
            }

            const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

            await this.sock.sendMessage(jid, { text: message });
            console.log(`[WhatsappService] ✅ Mensagem enviada com sucesso para ${jid}`);
            return true;
        } catch (error: any) {
            console.error('[WhatsappService] ❌ Erro ao enviar mensagem:', error?.message || error);
            return false;
        }
    }
}

export const whatsappProvider = new WhatsappServiceClass();

export class WhatsappService {
    async sendMessage(phone: string, message: string) {
        return whatsappProvider.sendMessage(phone, message);
    }
}
