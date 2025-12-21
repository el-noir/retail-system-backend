import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.enableCors(
    { origin: '*' }
  );

    const config = new DocumentBuilder()
    .setTitle('Retail Store API')
    .setDescription('The Retail Store API description')
    .setVersion('1.0')
    .addTag('retail-store')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.useGlobalPipes(new ValidationPipe)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
