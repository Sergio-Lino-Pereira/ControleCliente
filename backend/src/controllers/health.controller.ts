import { Request, Response } from 'express';
import { whatsappProvider } from '../services/whatsapp.service';

export class HealthController {
    async check(_req: Request, res: Response) {
        res.json({
            success: true,
            status: 'healthy',
            whatsappStatus: whatsappProvider.getStatus(),
            whatsappReady: whatsappProvider.isReady(),
            timestamp: new Date().toISOString(),
        });
    }
}
