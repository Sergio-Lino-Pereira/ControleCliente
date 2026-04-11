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
        console.log('[WhatsappService] 🚀 Iniciando processo de conexão (Modo Dinâmico)...');

        try {
            // 0. Buscar versão mais recente com timeout estendido
            let version: [number, number, number] = [2, 3000, 1015901307]; // Fallback
            try {
                const latest = await fetchLatestBaileysVersion();
                version = latest.version;
                console.log(`[WhatsappService] Versão WA detectada: ${version.join('.')}`);
            } catch (err) {
                console.warn('[WhatsappService] Não foi possível buscar versão atual, usando fallback.');
            }
            
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

            // 3. Criar o Socket com config de máxima compatibilidade
            this.sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true,
                logger: pino({ level: 'error' }), 
                browser: ['Windows', 'Chrome', '111.0.0.0'],
                syncFullHistory: false, 
                connectTimeoutMs: 120000, // Dobrado para 120s
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 30000,
                generateHighQualityLinkPreview: false,
                markOnlineOnConnect: false
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
                    
                    console.error(`[WhatsappService] 🔴 Conexão encerrada. Status: ${statusCode}. Reconectando: ${shouldReconnect}`);
                    
                    this.ready = false;
                    this.internalStatus = 'DISCONNECTED';
                    this.isInitializing = false;

                    if (shouldReconnect) {
                        setTimeout(() => this.initialize(), 10000);
                    } else {
                        console.warn('[WhatsappService] ⚠️ Logout/Credenciais Inválidas. Resetando...');
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
                }
            });

            // 5. Salvar credenciais quando atualizadas (Debounced)
            this.sock.ev.on('creds.update', async () => {
                await saveCreds();
                
                if (this.saveTimeout) clearTimeout(this.saveTimeout);
                this.saveTimeout = setTimeout(async () => {
                    console.log('[WhatsappService] 🔄 Sincronizando credenciais com Supabase...');
                    await store.save({ session: 'controle-cliente' });
                }, 15000); 
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
