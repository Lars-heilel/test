import { Inject, Injectable } from '@nestjs/common';
import { BenchmarkService } from '../benchmark/benchmark.service';
import { CLI_OUTPUT, CliOutput } from './cli.output';
import { parseCliArgs, USAGE } from './cli.parser';
import { formatReport } from './report.formatter';

@Injectable()
export class CliService {
  constructor(
    private readonly benchmarkService: BenchmarkService,
    @Inject(CLI_OUTPUT) private readonly output: CliOutput,
  ) {}

  async run(argv: readonly string[]): Promise<number> {
    const command = parseCliArgs(argv);

    if (command.kind === 'help') {
      this.output.log(USAGE);
      return 0;
    }

    if (command.kind === 'error') {
      this.output.error(command.message);
      if (command.showUsage) {
        this.output.error(`\n${USAGE}`);
      }
      return 1;
    }

    const result = await this.benchmarkService.run(command.url);
    this.output.log(formatReport(result));

    if (result.summary.okCount === 0) {
      return 1;
    }

    if (result.summary.failCount > 0) {
      this.output.error(
        `Предупреждение: ${result.summary.failCount} из ${result.attempts.length} запросов завершились ошибкой; метрики посчитаны по успешным.`,
      );
    }

    return 0;
  }
}
