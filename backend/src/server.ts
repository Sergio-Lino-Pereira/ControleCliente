import dotenv from 'dotenv';
import app from './app';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger.util';
import { whatsappProvider } from './services/whatsapp.service';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Test database connection
async function startServer() {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✅ Database connected successfully');

        // Start server
        app.listen(PORT, async () => {
            logger.info(`🚀 Server running on http://localhost:${PORT}`);
            logger.info(`📝 API available at http://localhost:${PORT}/api`);
            logger.info(`💚 Health check: http://localhost:${PORT}/api/health`);
            
            // Initialize WhatsApp Bot
            await whatsappProvider.initialize();
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');
    await whatsappProvider.disconnect();
    await prisma.$disconnect();
    process.exit(0);
});

startServer();
