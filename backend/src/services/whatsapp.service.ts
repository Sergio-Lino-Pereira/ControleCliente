import { Client, RemoteAuth } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { SupabaseStore } from './supabase-store';

const store = new SupabaseStore();

class WhatsappServiceClass {
    private client: Client;
    private ready: boolean = false;
    private lastQR: string | null = null;

    constructor() {
        this.client = new Client({
            authStrategy: new RemoteAuth({
                clientId: 'controle-cliente',
                store: store,
                backupSyncIntervalMs: 300000 // Backup every 5 minutes
            }),
            puppeteer: {
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-software-rasterizer'
                ]
            }
        });

        this.client.on('qr', (qr: string) => {
            this.lastQR = qr;
            console.log('');
            console.log('=============================================================================');
            console.log('[WhatsappService] ⚠️ ESCANEIE O QR CODE ABAIXO NO SEU WHATSAPP (APARELHOS CONECTADOS) ⚠️');
            console.log('=============================================================================');
            // @ts-ignore
            qrcode.generate(qr, { small: true });
            console.log('=============================================================================');
            console.log('');
        });

        this.client.on('ready', () => {
            console.log('[WhatsappService] ✨ Cliente WhatsApp conectado e pronto para uso!');
            this.ready = true;
            this.lastQR = null; // Clear QR after success
        });

        this.client.on('authenticated', () => {
            console.log('[WhatsappService] ✅ Autenticado com sucesso! Gerando sessão para o Supabase...');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('[WhatsappService] ❌ Falha na autenticação:', msg);
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log(`[WhatsappService] ⏳ Carregando: ${percent}% - ${message}`);
        });

        this.client.on('disconnected', (reason: string) => {
            console.warn('[WhatsappService] 🔴 Cliente WhatsApp desconectado:', reason);
            this.ready = false;
        });
    }

    public async initialize() {
        console.log('[WhatsappService] Inicializando o robô do WhatsApp...');
        console.log(`[WhatsappService] Usando Chromium em: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'Padrão'}`);
        try {
            await this.client.initialize();
            console.log('[WhatsappService] Chamada de initialize() concluída.');
        } catch (error) {
            console.error('[WhatsappService] Erro fatal ao inicializar o WhatsApp:', error);
        }
    }

    public async disconnect() {
        if (this.ready) {
            await this.client.destroy();
        }
    }

    public getQRCode(): string | null {
        return this.lastQR;
    }

    public isReady(): boolean {
        return this.ready;
    }

    public getStatus(): string {
        if (this.ready) return 'CONNECTED';
        if (this.lastQR) return 'QR_READY';
        return 'INITIALIZING';
    }

    public async sendMessage(phone: string, message: string): Promise<boolean> {
        if (!this.ready) {
            console.warn(`[WhatsappService] O WhatsApp ainda não está conectado (escanear QR code). Mensagem não enviada para ${phone}`);
            return false;
        }

        try {
            // Clean the phone number
            const cleanPhone = phone.replace(/\D/g, '');
            // Assume 55 for Brazil if omitted
            const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

            // Fetch the correct Whatsapp ID (handles the Brazilian 9th digit automatically)
            const numberDetails = await this.client.getNumberId(finalPhone);

            if (!numberDetails) {
                console.warn(`[WhatsappService] O número ${finalPhone} não parece estar registrado no WhatsApp.`);
                return false;
            }

            await this.client.sendMessage(numberDetails._serialized, message);
            console.log(`[WhatsappService] Mensagem enviada com sucesso para ${finalPhone}`);
            return true;
        } catch (error: any) {
            console.error('[WhatsappService] Erro ao tentar enviar mensagem:', error?.message || error);
            return false;
        }
    }
}

// Export a single dedicated instance
export const whatsappProvider = new WhatsappServiceClass();

// To keep compatibility with existing files that do "new WhatsappService()":
export class WhatsappService {
    async sendMessage(phone: string, message: string) {
        return whatsappProvider.sendMessage(phone, message);
    }
}
