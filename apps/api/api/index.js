// Simplified Vercel serverless function
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/main');

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });

    // Enable CORS
    app.enableCors({
      origin: true,
      credentials: true,
    });

    await app.init();
  }

  const server = app.getHttpAdapter().getInstance();
  server(req, res);
};