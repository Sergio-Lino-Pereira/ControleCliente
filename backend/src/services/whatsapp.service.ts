import path from 'path';
import fs from 'fs-extra';
import { Client, RemoteAuth } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { SupabaseStore } from './supabase-store';

const store = new SupabaseStore();

class WhatsappServiceClass {
    private client: Client;
    private ready: boolean = false;
    private lastQR: string | null = null;
    private internalStatus: string = 'OFFLINE';
    private isInitializing: boolean = false;

    constructor() {
        this.client = new Client({
            authStrategy: new RemoteAuth({
                clientId: 'controle-cliente',
                store: store,
                backupSyncIntervalMs: 600000 // Aumentado para 10 minutos para reduzir picos de carga
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
                    '--disable-software-rasterizer',
                    '--disable-features=Translate,BackForwardCache,AcceptCHFrame,AvoidUnnecessaryBeforeUnloadCheckAtStop',
                    '--js-flags="--max-old-space-size=300"', // Reduzido para dar margem à RAM total do sistema
                    '--memory-pressure-thresholds=1',
                    '--no-default-browser-check',
                    '--no-pings',
                    '--password-store=basic',
                    '--use-gl=swiftshader',
                    '--disable-cloud-import',
                    '--disable-infobars',
                    '--disable-notifications',
                    '--disable-background-networking',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-breakpad',
                    '--disable-client-side-phishing-detection',
                    '--disable-default-apps',
                    '--disable-device-discovery-notifications',
                    '--disable-ipc-flooding-protection',
                    '--disable-popup-blocking',
                    '--disable-print-preview',
                    '--disable-prompt-on-repost',
                    '--disable-renderer-backgrounding',
                    '--disable-sync'
                ],
                handleSIGINT: false,
                handleSIGTERM: false,
                handleSIGHUP: false
            }
        });

        this.client.on('qr', (qr: string) => {
            this.lastQR = qr;
            this.internalStatus = 'QR_READY';
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
            const memory = process.memoryUsage();
            const rss = Math.round(memory.rss / 1024 / 1024);
            console.log(`[WhatsappService] ✨ Cliente conectado! RAM RSS: ${rss}MB`);
            this.ready = true;
            this.lastQR = null;
            this.internalStatus = 'CONNECTED';
        });

        this.client.on('authenticated', () => {
            console.log('[WhatsappService] ✅ Autenticado com sucesso!');
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
            this.lastQR = null;
            this.internalStatus = 'DISCONNECTED';
        });
    }

    private startMemoryMonitor() {
        const interval = setInterval(() => {
            if (!this.isInitializing && !this.ready) {
                clearInterval(interval);
                return;
            }
            const memory = process.memoryUsage();
            const rss = Math.round(memory.rss / 1024 / 1024);
            const heap = Math.round(memory.heapUsed / 1024 / 1024);
            console.log(`[Monitor] 🧠 RAM: RSS ${rss}MB | Heap ${heap}MB (Limite Render: 512MB)`);

            if (rss > 450) {
                console.warn('[Monitor] ⚠️ ALERTA: Memória muito alta! O sistema pode cair em breve.');
            }
        }, 15000); // Check every 15 seconds
    }

    private async cleanCache() {
        try {
            const cacheDir = path.join(process.cwd(), '.wwebjs_cache');
            if (await fs.pathExists(cacheDir)) {
                console.log('[WhatsappService] 🧹 Limpando cache do navegador para liberar espaço...');
                await fs.emptyDir(cacheDir);
            }
        } catch (err) {
            console.warn('[WhatsappService] Falha ao limpar cache:', err);
        }
    }

    public async initialize() {
        if (this.isInitializing || this.ready) {
            console.log('[WhatsappService] Inicialização já em curso ou pronto.');
            return;
        }

        console.log('[WhatsappService] 🚀 Iniciando robô...');
        await this.cleanCache();

        this.isInitializing = true;
        this.internalStatus = 'INITIALIZING';
        this.startMemoryMonitor();

        try {
            console.log('[WhatsappService] ⏳ Chamando client.initialize()...');
            await this.client.initialize();
            console.log('[WhatsappService] ✅ client.initialize() concluído.');
        } catch (error) {
            this.internalStatus = 'ERROR';
            console.error('[WhatsappService] ❌ Erro fatal:', error);
            this.isInitializing = false;
        } finally {
            this.isInitializing = false;
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
        return this.internalStatus;
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
