import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState, 
    ConnectionState, 
    WASocket,
    fetchLatestBaileysVersion,
    Browsers
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

    constructor() {}

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
            // 0. Deixar o baileys buscar a versão recomendada
            const { version } = await fetchLatestBaileysVersion();
            console.log(`[WhatsappService] Protocolo WA: ${version.join('.')}`);
            
            // 1. Tentar restaurar do Supabase ou limpar local
            const exists = await store.sessionExists({ session: 'controle-cliente' });
            if (exists) {
                console.log('[WhatsappService] 📥 Restaurando sessão do Supabase...');
                await store.extract({ session: 'controle-cliente' });
            } else {
                await this.cleanupAuthDir();
            }

            // 2. Configurar o estado de autenticação
            const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

            // 3. Criar o Socket com parâmetros padrão estáveis
            this.sock = makeWASocket({
                version,
                auth: state,
                logger: pino({ level: 'error' }), 
                browser: Browsers.macOS('Desktop'), 
                syncFullHistory: false, 
                shouldSyncHistoryMessage: () => false,
                connectTimeoutMs: 120000, 
                defaultQueryTimeoutMs: 60000, 
                keepAliveIntervalMs: 15000,
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

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    console.error(`[WhatsappService] 🔴 Conexão encerrada (Status: ${statusCode}). Reconectando: ${shouldReconnect}`);
                    
                    this.ready = false;
                    this.internalStatus = 'DISCONNECTED';
                    this.isInitializing = false;

                    // Erros que exigem reset imediato para evitar loop infinito de 515/408/etc
                    const criticalErrors = [
                        DisconnectReason.connectionLost,
                        DisconnectReason.connectionClosed,
                        DisconnectReason.connectionReplaced,
                        DisconnectReason.timedOut,
                        515, 403, 401, 428, 440, 408
                    ];

                    if (criticalErrors.includes(statusCode || 0)) {
                        console.warn(`[WhatsappService] ⚠️ Falha crítica (${statusCode}). Limpando sessão para nova tentativa limpa...`);
                        await store.delete({ session: 'controle-cliente' });
                        await this.cleanupAuthDir();
                    }

                    if (shouldReconnect) {
                        setTimeout(() => this.initialize(), 10000);
                    } else {
                        console.warn('[WhatsappService] ⚠️ Logout confirmado pelo usuário ou sistema.');
                        await store.delete({ session: 'controle-cliente' });
                        await this.cleanupAuthDir();
                        setTimeout(() => this.initialize(), 15000);
                    }
                } else if (connection === 'open') {
                    console.log('[WhatsappService] ✨ CONEXÃO ESTABELECIDA COM SUCESSO!');
                    this.ready = true;
                    this.lastQR = null;
                    this.internalStatus = 'CONNECTED';
                    this.isInitializing = false;
                    
                    // Salvar imediatamente após conectar com sucesso
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
        if (!this.ready || !this.sock) {
            console.warn(`[WhatsappService] Não conectado. Mensagem não enviada para ${phone}`);
            return false;
        }

        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const jid = cleanPhone.startsWith('55') ? `${cleanPhone}@s.whatsapp.net` : `55${cleanPhone}@s.whatsapp.net`;
            
            await this.sock.sendMessage(jid, { text: message });
            console.log(`[WhatsappService] Mensagem enviada para ${jid}`);
            return true;
        } catch (error: any) {
            console.error('[WhatsappService] Erro ao enviar mensagem:', error?.message || error);
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
