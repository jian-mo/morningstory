import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

// Minimal app module for demo
import { Module, Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Morning Story API is running!' 
    };
  }

  @Get('api')
  getApiInfo() {
    return {
      name: 'Morning Story API',
      version: '1.0.0',
      description: 'Intelligent standup generation API',
      endpoints: {
        health: '/health',
        docs: '/api'
      }
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class SimpleAppModule {}

async function bootstrap() {
  const app = await NestFactory.create(SimpleAppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3001'],
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API Server running on http://localhost:${port}`);
  console.log(`📖 API Documentation: http://localhost:${port}/api`);
  console.log(`❤️  Health Check: http://localhost:${port}/health`);
}

bootstrap();