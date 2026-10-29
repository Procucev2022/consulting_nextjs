import type {
  PCBIBenchmarkMaster, PCBIBenchmarkComponent, PCBIWeeklyIndex, PCBIUNSPSCMapping
} from './pcbi';

export interface PcbiReferenceData {
  benchmarks: PCBIBenchmarkMaster[];
  components: PCBIBenchmarkComponent[];
  indices: PCBIWeeklyIndex[];
  mappings: PCBIUNSPSCMapping[];
}

export type PcbiDatabaseRow = Record<string, unknown>;
