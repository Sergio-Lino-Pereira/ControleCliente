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
    private internalStatus: string = 'OFFLINE';
    private isInitializing: boolean = false;
    private saveTimeout: NodeJS.Timeout | null = null;

    constructor() {
        // A inicialização agora acontece via método initialize()
    }

    private async cleanupAuthDir() {
        try {
            if (await fs.pathExists(AUTH_DIR)) {
                await fs.emptyDir(AUTH_DIR);
            } else {
                await fs.ensureDir(AUTH_DIR);
            }
        } catch (err) {
            console.error('[WhatsappService] Erro ao limpar pasta de autenticação:', err);
        }
    }

    public async initialize() {
        if (this.isInitializing || this.ready) return;

        console.log('[WhatsappService] 🚀 Iniciando robô via Baileys (Leve)...');
        this.isInitializing = true;
        this.internalStatus = 'INITIALIZING';

        try {
            // 0. Buscar versão mais recente do WA
            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`[WhatsappService] Usando WA v${version.join('.')}, isLatest: ${isLatest}`);

            // 1. Tentar baixar sessão existente do Supabase
            const exists = await store.sessionExists({ session: 'controle-cliente' });
            if (exists) {
                await store.extract({ session: 'controle-cliente' });
            } else {
                await this.cleanupAuthDir();
            }

            // 2. Configurar o estado de autenticação
            const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

            // 3. Criar o Socket
            this.sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true,
                logger: pino({ level: 'error' }),
                browser: ['Ubuntu', 'Chrome', '20.0.04'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                retryRequestDelayMs: 5000
            });

            // 4. Escutar atualizações de conexão
            this.sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.internalStatus = 'QR_READY';
                    // Transformar buffer do QR em Base64 para exibir no front
                    try {
                        this.lastQR = await QRCode.toDataURL(qr);
                        console.log('[WhatsappService] ⚠️ QR Code gerado. Pronto para leitura.');
                    } catch (err) {
                        console.error('[WhatsappService] Erro ao gerar Imagem do QR:', err);
                    }
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('[WhatsappService] 🔴 Conexão fechada devido a:', lastDisconnect?.error, ', reconectando:', shouldReconnect);
                    
                    this.ready = false;
                    this.internalStatus = 'DISCONNECTED';

                    if (shouldReconnect) {
                        this.isInitializing = false;
                        setTimeout(() => this.initialize(), 5000);
                    } else {
                        console.log('[WhatsappService] ⚠️ Logout detectado. Limpando sessão...');
                        await store.delete({ session: 'controle-cliente' });
                        await this.cleanupAuthDir();
                        this.isInitializing = false;
                        setTimeout(() => this.initialize(), 5000);
                    }
                } else if (connection === 'open') {
                    console.log('[WhatsappService] ✨ Cliente conectado e pronto!');
                    this.ready = true;
                    this.lastQR = null;
                    this.internalStatus = 'CONNECTED';
                    this.isInitializing = false;
                }
            });

            // 5. Salvar credenciais quando atualizadas (Debounced)
            this.sock.ev.on('creds.update', async () => {
                await saveCreds();
                
                // Debounce o upload para o Supabase para economizar recursos
                if (this.saveTimeout) clearTimeout(this.saveTimeout);
                this.saveTimeout = setTimeout(async () => {
                    console.log('[WhatsappService] 🔄 Sincronizando credenciais com Supabase...');
                    await store.save({ session: 'controle-cliente' });
                }, 10000); // Aguarda 10 segundos de inatividade de escrita antes de subir pro Supabase
            });

        } catch (error) {
            console.error('[WhatsappService] ❌ Erro fatal na inicialização Baileys:', error);
            this.internalStatus = 'ERROR';
            this.isInitializing = false;
        }
    }

    public async disconnect() {
        if (this.sock) {
            await this.sock.logout();
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
