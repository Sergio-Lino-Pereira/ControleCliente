import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

class WhatsappServiceClass {
    private client: Client;
    private ready: boolean = false;

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'controle-cliente'
            }),
            puppeteer: {
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            }
        });

        this.client.on('qr', (qr: string) => {
            console.log('');
            console.log('=============================================================================');
            console.log('[WhatsappService] ⚠️ ESCANEIE O QR CODE ABAIXO NO SEU WHATSAPP (APARELHOS CONECTADOS) ⚠️');
            console.log('=============================================================================');
            qrcode.generate(qr, { small: true });
            console.log('=============================================================================');
            console.log('');
        });

        this.client.on('ready', () => {
            console.log('[WhatsappService] ✨ Cliente WhatsApp conectado e pronto para uso!');
            this.ready = true;
        });

        this.client.on('disconnected', (reason: string) => {
            console.warn('[WhatsappService] 🔴 Cliente WhatsApp desconectado:', reason);
            this.ready = false;
        });
    }

    public async initialize() {
        console.log('[WhatsappService] Inicializando o robô do WhatsApp...');
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('[WhatsappService] Erro fatal ao inicializar o WhatsApp:', error);
        }
    }

    public async disconnect() {
        if (this.ready) {
            await this.client.destroy();
        }
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
