export class SearchParamContext {
  private readonly progress: Record<string, number> = {};
  private readonly valueMap: Record<string, readonly string[]> = {};
  public constructor(params: URLSearchParams) {
    [...params.keys()].forEach(key => {
      this.valueMap[key] = params.getAll(key);
      this.progress[key] = 0;
    });
  }

  public get(key: string): string | undefined {
    const progress = this.progress[key];
    if (progress === undefined) { return; }
    this.progress[key]++;
    return this.valueMap[key]?.[progress];
  }

  public getAll(key: string): string[] | undefined {
    const progress = this.progress[key];
    if (progress === undefined) { return; }
    this.progress[key]++;
    return this.valueMap[key]?.slice(progress);
  }

}