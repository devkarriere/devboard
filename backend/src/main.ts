import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS aktivieren, damit das Frontend zugreifen kann
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend läuft auf http://localhost:${port}`);
}
bootstrap();
