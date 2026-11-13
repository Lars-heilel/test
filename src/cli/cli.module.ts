import { Module } from '@nestjs/common';
import { BenchmarkModule } from '../benchmark/benchmark.module';
import { CLI_OUTPUT, CONSOLE_OUTPUT } from './cli.output';
import { CliService } from './cli.service';

@Module({
  imports: [BenchmarkModule],
  providers: [CliService, { provide: CLI_OUTPUT, useValue: CONSOLE_OUTPUT }],
})
export class CliModule {}
