export class Miew {
  constructor(options?: any);
  init(): boolean;
  run(): void;
  load(source: string | File, opts: object): Promise<string | null>;
  setOptions(opts: string | object): void;
  exportCML(): string | null;
}

export default Miew;
