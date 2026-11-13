import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CliService } from './cli/cli.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  app.enableShutdownHooks();

  try {
    const cli = app.get(CliService);
    process.exitCode = await cli.run(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Непредвиденная ошибка: ${message}`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
