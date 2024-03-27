import { Result } from "./Result";
import { Params } from "./SearchParamMapping";

export type PartialResult<T> = readonly [Params, Result<T>];

export namespace PartialResult {
  export function map<U, V>(f: (u: U) => V, pr: PartialResult<U>): PartialResult<V> {
    const [params, result] = pr;
    return [params, Result.map(f, result)];
  };

  export function flatten<U>(prpru: PartialResult<PartialResult<U>>): PartialResult<U> {
    const [outerParams, outerResult] = prpru;
    return semiExtract(outerResult, outerParams);
  }

  export function semiExtract<U>(rpru: Result<PartialResult<U>>, fallbackParams: Params): PartialResult<U> {
    if (rpru.status === "error") {
      return [fallbackParams, rpru];
    }
    return [rpru.data[0], Result.bind(x => x[1], rpru)];
  }

  export function bind<U, V>(f: (u: U) => PartialResult<V>, ru: PartialResult<U>): PartialResult<V> {
    return flatten(map(f, ru));
  }

  export function either<U>([ap, ar]: PartialResult<U>, [bp, br]: PartialResult<U>): PartialResult<U> {
    const entangled = Result.either(
      Result.map(x => [ap, x] as const, ar),
      Result.map(x => [bp, x] as const, br));
    const [rp, rr] = Result.split(entangled);
    return [Result.withDefault(rp, bp), rr]
  }


}