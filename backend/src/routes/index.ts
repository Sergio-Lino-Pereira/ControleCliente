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
router.get('/whatsapp/qr', (req, res) => {
    const { whatsappProvider } = require('../services/whatsapp.service');
    const qr = whatsappProvider.getQRCode();

    if (whatsappProvider.isReady()) {
        return res.send('<h1>WhatsApp já está conectado!</h1>');
    }

    if (!qr) {
        return res.send('<h1>QR Code ainda não gerado. Aguarde alguns segundos e atualize a página.</h1>');
    }

    res.send(`
        <html>
            <head>
                <title>WhatsApp QR Code</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f2f5; }
                    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                    #qrcode { margin: 1.5rem 0; }
                    .status { color: #666; margin-top: 1rem; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Escaneie para conectar</h2>
                    <div id="qrcode"></div>
                    <div class="status">Aguardando leitura pelo WhatsApp...</div>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
                <script>
                    new QRCode(document.getElementById("qrcode"), {
                        text: "${qr}",
                        width: 256,
                        height: 256
                    });
                    // Refresh every 30 seconds to get new QR if it expires
                    setTimeout(() => window.location.reload(), 30000);
                </script>
            </body>
        </html>
    `);
});

export default router;
