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
  
  // Parse CORS_ORIGIN as comma-separated list
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3001'];
  
  // Enhanced CORS configuration for Railway
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      
      // Log rejected origins for debugging
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
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
  
  // Log startup info
  const port = process.env.PORT ?? 9000;
  console.log('🚀 CORS Origins:', allowedOrigins);
  console.log('🚀 Server starting on port:', port);
  
  await app.listen(port);
}
bootstrap();
