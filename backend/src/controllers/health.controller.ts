import { Request, Response } from 'express';

export class HealthController {
    async check(req: Request, res: Response) {
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
        });
    }
}
