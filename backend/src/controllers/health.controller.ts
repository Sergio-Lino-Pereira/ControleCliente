import { Request, Response } from 'express';

export class HealthController {
    async check(_req: Request, res: Response) {
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
        });
    }
}
