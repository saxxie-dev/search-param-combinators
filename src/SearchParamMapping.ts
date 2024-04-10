import { Result, SuccessResult } from "./Result";
import { SearchParamContext } from "./SearchParamContext";

export type Params = SearchParamContext;

export type SearchParamParse<T> = (params: Params) => readonly [Params, Result<T>];
export type SearchParamSerialize<T> = (value: T, params: URLSearchParams) => URLSearchParams;

export type SearchParamMapping<T> = {
  parse: SearchParamParse<T>;
  serialize: SearchParamSerialize<T>;
}

export namespace SearchParamMapping {
  export function map<U, V>(parse: (u: U) => V, serialize: (v: V) => U, mapping: SearchParamMapping<U>): SearchParamMapping<V> {
    return {
      parse: (params: Params) => {
        const [remainder, result] = mapping.parse(params);
        return [remainder, Result.map(parse, result)];
      },
      serialize: (value: V, params: URLSearchParams) => {
        const serializable = serialize(value);
        return mapping.serialize(serializable, params);
      }
    }
  };

  export function bindResult<U, V>(parse: (u: U) => Result<V>, serialize: (v: V) => U, mapping: SearchParamMapping<U>): SearchParamMapping<V> {
    return {
      parse: (params: Params) => {
        const [remainder, result] = mapping.parse(params);
        return [remainder, Result.bind(parse, result)];
      },
      serialize: (value: V, params: URLSearchParams) => {
        const serializable = serialize(value);
        return mapping.serialize(serializable, params);
      }
    }
  }

  export function pure<U>(value: U): SearchParamMapping<U> {
    return {
      parse: (params: Params) => [params, SuccessResult(value)],
      serialize: (_: U, params: URLSearchParams) => params,
    }
  }

}
