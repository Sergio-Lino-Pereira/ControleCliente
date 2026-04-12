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
router.get('/whatsapp/qr', async (_req, res) => {
    const { whatsappProvider } = require('../services/whatsapp.service');
    const qr = whatsappProvider.getQRCode();
    const pairingCode = whatsappProvider.getPairingCode();
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

    // Estilos CSS comuns
    const commonStyles = `
        body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 450px; width: 100%; }
        .spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #25D366; animation: spin 1s linear infinite; margin: 15px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #eee; font-size: 0.8rem; margin-bottom: 1rem; }
        .pairing-code { font-size: 2.5rem; font-weight: bold; letter-spacing: 5px; color: #128C7E; background: #e7f3ff; padding: 1rem; border-radius: 10px; margin: 1rem 0; font-family: monospace; border: 2px dashed #25D366; }
        input[type="text"] { padding: 12px; border: 1px solid #ddd; border-radius: 8px; width: 100%; box-sizing: border-box; margin-bottom: 15px; font-size: 1rem; }
        button { background: #25D366; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; font-size: 1rem; transition: background 0.3s; }
        button:hover { background: #128C7E; }
        .divider { margin: 2rem 0; border-top: 1px solid #eee; position: relative; }
        .divider span { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; color: #999; font-size: 0.8rem; }
    `;

    if (pairingCode) {
        return res.send(`
            <html>
                <head>
                    <title>WhatsApp Código de Pareamento</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>${commonStyles}</style>
                </head>
                <body>
                    <div class="card">
                        <div class="status-badge">Método: Código de Pareamento</div>
                        <h2>Seu Código:</h2>
                        <div class="pairing-code">${pairingCode}</div>
                        <p style="text-align: left; color: #666; font-size: 0.9rem;">
                            1. Abra o WhatsApp no seu celular.<br>
                            2. Vá em <b>Aparelhos Conectados</b>.<br>
                            3. Toque em <b>Conectar um aparelho</b>.<br>
                            4. Toque em <b>Conectar com número de telefone</b>.<br>
                            5. Digite o código acima.
                        </p>
                        <button onclick="window.location.href='/api/whatsapp/qr'" style="margin-top: 1rem; background: #f0f2f5; color: #666;">Cancelar e voltar para o QR Code</button>
                    </div>
                    <script>setTimeout(() => window.location.reload(), 15000);</script>
                </body>
            </html>
        `);
    }

    if (!qr) {
        let statusMessage = 'Aguardando inicialização...';
        let subMessage = 'O servidor está iniciando o serviço (Baileys). Isso deve ser rápido.';

        if (status === 'INITIALIZING') {
            statusMessage = 'Iniciando Robô...';
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
                    <style>${commonStyles}</style>
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

    // Página Principal: QR Code + Opção de Código de Pareamento
    return res.send(`
        <html>
            <head>
                <title>Conectar WhatsApp</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>${commonStyles}</style>
            </head>
            <body>
                <div class="card">
                    <div class="status-badge">Status: Pronto para Conectar</div>
                    <h2>Escaneie o QR Code</h2>
                    <div style="margin: 1.5rem 0; border: 10px solid white; display: inline-block; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <img src="${qr}" width="300" height="300" alt="QR Code" />
                    </div>
                    
                    <div class="divider"><span>OU</span></div>
                    
                    <h3>Conectar via Código</h3>
                    <p style="color: #666; font-size: 0.85rem; margin-bottom: 1.5rem;">
                        <b>IMPORTANTE:</b> Use o formato internacional (com 55 para Brasil).<br>
                        Exemplo: 55 + DDD + Numero
                    </p>
                    
                    <form action="/api/whatsapp/pairing-code" method="POST">
                        <input type="text" name="phone" placeholder="Ex: 5511999999999" required pattern="^[0-9]+$" />
                        <button type="submit">Gerar Código de Pareamento</button>
                    </form>
                    
                    <p style="font-size: 0.8rem; color: #999; margin-top: 1.5rem;">A página irá atualizar automaticamente.</p>
                </div>
                <script>
                    setTimeout(() => window.location.reload(), 45000);
                </script>
            </body>
        </html>
    `);
});

// Rota de teste para enviar mensagens
router.get('/whatsapp/test', (_req, res) => {
    res.send(`
        <html>
            <head>
                <title>Teste de Envio - WhatsApp</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #f0f2f5; margin: 0; }
                    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
                    input, textarea { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
                    button { width: 100%; padding: 10px; background: #25D366; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
                    button:hover { background: #128C7E; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Enviar Mensagem de Teste</h2>
                    <form action="/api/whatsapp/send-test" method="POST">
                        <input type="text" name="phone" placeholder="Número (ex: 5567999999999)" required />
                        <textarea name="message" placeholder="Sua mensagem de teste aqui..." rows="4" required></textarea>
                        <button type="submit">Enviar Agora</button>
                    </form>
                    <a href="/api/whatsapp/qr" style="display: block; text-align: center; margin-top: 10px; color: #666; font-size: 0.8rem;">Voltar para Status</a>
                </div>
            </body>
        </html>
    `);
});

router.post('/whatsapp/send-test', async (req, res) => {
    const { phone, message } = req.body;
    try {
        const { whatsappProvider } = require('../services/whatsapp.service');
        const success = await whatsappProvider.sendMessage(phone, message);
        if (success) {
            res.send('✅ Mensagem enviada com sucesso! Verifique seu WhatsApp.');
        } else {
            res.status(500).send('❌ O robô não conseguiu enviar a mensagem. Verifique se ele está conectado no console.');
        }
    } catch (error: any) {
        res.status(500).send(`❌ Erro: ${error.message}`);
    }
});

export default router;
