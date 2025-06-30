import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'https://your-app.vercel.app']
        : ['http://localhost:3001'],
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe());

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('Morning Story API')
      .setDescription('Intelligent standup generation API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await createApp();
  return app.getHttpAdapter().getInstance()(req, res);
}