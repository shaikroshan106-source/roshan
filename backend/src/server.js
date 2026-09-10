import app from './app.js';
import { env } from './config/env.js';
import { seedDatabase } from './seeds/seedData.js';

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Seed initial data if necessary
    await seedDatabase();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 AGRIDIRECT Backend Server is running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌾 Environment: ${env.NODE_ENV}`);
      console.log(`🛡️ CORS Enabled for: ${env.CLIENT_URL}`);
      console.log(`====================================================`);
    });

    const shutdown = () => {
      console.log('Stopping server gracefully...');
      server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Fatal Server Start Error:', err);
    process.exit(1);
  }
}

startServer();
