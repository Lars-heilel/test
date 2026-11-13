import { Module } from '@nestjs/common';
import {
  FETCH_CLIENT,
  FetchClient,
  REQUEST_COUNT,
} from './benchmark.constants';
import { BenchmarkService } from './benchmark.service';

export { REQUEST_COUNT };

@Module({
  providers: [
    BenchmarkService,
    {
      provide: FETCH_CLIENT,
      useValue: globalThis.fetch.bind(globalThis) as FetchClient,
    },
  ],
  exports: [BenchmarkService],
})
export class BenchmarkModule {}
