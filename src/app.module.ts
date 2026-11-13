import { Module } from '@nestjs/common';
import { BenchmarkModule } from './benchmark/benchmark.module';
import { CliModule } from './cli/cli.module';

@Module({
  imports: [BenchmarkModule, CliModule],
})
export class AppModule {}
