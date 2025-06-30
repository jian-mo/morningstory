import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

// Minimal app module for demo
import { Module, Controller, Get, Post } from '@nestjs/common';

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
        docs: '/api',
        testLogin: '/auth/test-login'
      }
    };
  }
}

@Controller('auth')
export class AuthController {
  @Post('test-login')
  testLogin() {
    // Create a simple JWT-like token for testing
    const token = Buffer.from(JSON.stringify({
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');
    
    return {
      access_token: token,
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    };
  }

  @Get('me')
  getMe() {
    // Return the test user profile
    return {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

@Controller('integrations')
export class IntegrationsController {
  @Get()
  getIntegrations() {
    // Return empty integrations list for testing
    return [];
  }

  @Get('github/app/install')
  getGitHubAppInstall() {
    // Return that GitHub App is not configured
    return {
      configured: false,
      message: 'GitHub App integration is not set up yet. Please use Personal Access Token instead.'
    };
  }

  @Post('github/connect')
  connectGitHub() {
    // Mock GitHub token connection
    return {
      success: true,
      message: 'GitHub connected successfully',
      integration: {
        id: 'github-integration-123',
        type: 'GITHUB',
        isActive: true,
        createdAt: new Date().toISOString(),
        metadata: {
          username: 'test-user',
          repositories: ['repo1', 'repo2']
        }
      }
    };
  }
}

@Module({
  controllers: [HealthController, AuthController, IntegrationsController],
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