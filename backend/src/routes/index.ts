import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import contactRoutes from './contact.routes';
import scheduleRoutes from './schedule.routes';
import bookingRoutes from './booking.routes';
import adminRoutes from './admin.routes';
import professionRoutes from './profession.routes';

const router = Router();
const healthController = new HealthController();

// Health check
router.get('/health', healthController.check.bind(healthController));

// API routes
router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/public/booking', bookingRoutes);
router.use('/admin', adminRoutes);
router.use('/professions', professionRoutes);

// WhatsApp QR Code for easy scanning
router.get('/whatsapp/qr', (_req, res) => {
    const { whatsappProvider } = require('../services/whatsapp.service');
    const qr = whatsappProvider.getQRCode();
    const status = whatsappProvider.getStatus();
    const isReady = whatsappProvider.isReady();

    if (isReady) {
        return res.send(`
            <html>
                <head>
                    <title>WhatsApp Conectado</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #e7f3ff; color: #1c1e21; }
                        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; border-top: 5px solid #25D366; }
                        .icon { font-size: 3rem; margin-bottom: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="icon">✅</div>
                        <h2>WhatsApp já está conectado!</h2>
                        <p>O robô está pronto para enviar mensagens.</p>
                        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer; border-radius: 5px; border: 1px solid #ccc;">Verificar Status Atual</button>
                    </div>
                </body>
            </html>
        `);
    }

    if (!qr) {
        let statusMessage = 'Aguardando inicialização...';
        let subMessage = 'O servidor está iniciando o navegador (Puppeteer). Isso pode levar até 30 segundos no Render.';

        if (status === 'INITIALIZING') {
            statusMessage = 'Iniciando Navegador...';
        } else if (status === 'AUTHENTICATING') {
            statusMessage = 'Autenticando sessão...';
            subMessage = 'Estamos tentando recuperar sua sessão anterior do Supabase.';
        } else if (status === 'ERROR') {
            statusMessage = 'Erro na inicialização';
            subMessage = 'Houve um problema ao iniciar o WhatsApp. Verifique os logs do Render.';
        }

        return res.send(`
            <html>
                <head>
                    <title>WhatsApp Status</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f2f5; }
                        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
                        .spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #25D366; animation: spin 1s linear infinite; margin: 15px auto; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #eee; font-size: 0.8rem; margin-bottom: 1rem; }
                    </style>
                    <script>setTimeout(() => window.location.reload(), 5000);</script>
                </head>
                <body>
                    <div class="card">
                        <div class="status-badge">Status: ${status}</div>
                        <h2>${statusMessage}</h2>
                        <div class="spinner"></div>
                        <p style="color: #666;">${subMessage}</p>
                        <p style="font-size: 0.8rem; color: #999;">A página irá atualizar automaticamente...</p>
                    </div>
                </body>
            </html>
        `);
    }

    return res.send(`
        <html>
            <head>
                <title>WhatsApp QR Code</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f2f5; }
                    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                    #qrcode { margin: 1.5rem 0; border: 10px solid white; display: inline-block; }
                    .status { color: #666; margin-top: 1rem; }
                    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #e7f3ff; color: #1877f2; font-size: 0.8rem; margin-bottom: 0.5rem; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="status-badge">Status: QR Disponível</div>
                    <h2>Escaneie para conectar</h2>
                    <div id="qrcode">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qr)}" width="256" height="256" alt="QR Code" />
                    </div>
                    <div class="status">Aguardando leitura pelo WhatsApp...</div>
                    <p style="font-size: 0.8rem; color: #999; margin-top: 1rem;">O QR expira em breve. Atualize se necessário.</p>
                </div>
                <script>
                    // Refresh every 45 seconds to get new QR if it expires
                    setTimeout(() => window.location.reload(), 45000);
                </script>
            </body>
        </html>
    `);
});

export default router;
