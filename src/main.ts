import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    {
      logger: ['error', 'debug', 'log']
    }
  );

  await setupApp(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(error => console.log(error));
