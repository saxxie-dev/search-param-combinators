import { PartialResult } from "./PartialResult";
import { ErrorResult, SuccessResult } from "./Result";

export class SearchParamContext {

  public constructor(
    private readonly progress: Record<string, number>,
    private readonly valueMap: Record<string, readonly string[]>) { }

  public static fromUrlSearchParams(params: URLSearchParams): SearchParamContext {
    const valueMap: Record<string, readonly string[]> = {};
    const progress: Record<string, number> = {};
    [...params.keys()].forEach(key => {
      valueMap[key] = params.getAll(key);
      progress[key] = 0;
    });
    return new SearchParamContext(progress, valueMap);
  }

  public get(key: string): PartialResult<string> {
    const nextProgress = { ...this.progress };
    const nextIndex = nextProgress[key];
    const nextValues = this.valueMap[key];
    if (nextIndex === undefined || nextValues === undefined) {
      return [this, ErrorResult(`Required search parameter [${key}] was not found.`)]
    }
    const nextValue = nextValues[nextIndex]
    nextProgress[key]++;
    const nextContext = new SearchParamContext(nextProgress, this.valueMap)
    if (nextValue === undefined) {
      return [nextContext, ErrorResult(`Could not find #${nextProgress[key]} value of search parameter [${key}]. [${key}] only has ${nextValues.length} values.`)];
    }
    return [nextContext, SuccessResult(nextValue)];
  }

  public remainingKeys(): string[] {
    return Object.keys(this.valueMap).filter(key => this.progress[key]! < this.valueMap[key]!.length)
  }

}