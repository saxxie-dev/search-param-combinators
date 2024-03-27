import { Result, SuccessResult } from "./Result";

export type Params = URLSearchParams;

export type SearchParamParse<T> = (params: Params) => [Params, Result<T>];
export type SearchParamSerialize<T> = (value: T, params: Params) => Params;

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
      serialize: (value: V, params: Params) => {
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
      serialize: (value: V, params: Params) => {
        const serializable = serialize(value);
        return mapping.serialize(serializable, params);
      }
    }
  }

  export function pure<U>(value: U): SearchParamMapping<U> {
    return {
      parse: (params: Params) => [params, SuccessResult(value)],
      serialize: (_: U, params: Params) => params,
    }
  }

}
