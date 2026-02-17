import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule, { 
    rawBody: true 
  });
  
  app.enableCors({
    origin: [
      process.env.CORS_ORIGIN || 'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600
  });

    const config = new DocumentBuilder()
    .setTitle('Retail Store API')
    .setDescription('The Retail Store API description')
    .setVersion('1.0')
    .addTag('retail-store')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.useGlobalPipes(new ValidationPipe)
  await app.listen(process.env.PORT ?? 9000);
}
bootstrap();
