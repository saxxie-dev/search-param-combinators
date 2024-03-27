import { ErrorResult, Result, SuccessResult, WarningResult } from "./Result";
import { Params, SearchParamMapping } from "./SearchParamMapping";

/**
 * You should (probably) not use this - try StringParam instead.
 * Primitive param stores a raw string in the search parameter, [key].
 * No safety checks are in place, so it is possible to generate weird URLs.
 */
export function PrimitiveParam(key: string): SearchParamMapping<string> {
  return {
    parse: (params: Params) => {
      const val = params.get(key);
      if (val) { return [params, SuccessResult(val)]; }
      return [params, ErrorResult(`Required search parameter [${key}] was not found.`)];
    },
    serialize: (value: string, params: Params) => {
      params.append(key, value);
      return params;
    }
  };
}

/**
 * StringParam stores a string in the search parameter, [key].
 * Will properly encode/decode uri components to avoid parsing/generating
 * unsafe or malformed URLs
 */
export function StringParam(key: string): SearchParamMapping<string> {
  return SearchParamMapping.map(
    decodeURIComponent,
    encodeURIComponent,
    PrimitiveParam(key));
}

/**
 * IntegerParam attempts to store an integer in the search parameter, [key]. 
 * Throws warning if it *can* read an integer, but the value contains additional non-integral data.
 * (e.g. if key = 123a, or 123.1)
 */
export function IntegerParam(key: string): SearchParamMapping<number> {
  return SearchParamMapping.bindResult(
    (value): Result<number> => {
      const n = parseInt(value);
      if (isNaN(n)) {
        return ErrorResult(`An integer search parameter [${key}=${value}] could not be read as an integer.`)
      } else if (n.toString() !== value) {
        return WarningResult(n, `An integer search parameter [${key}=${value}] could only partially be read as an integer.`);
      }
      return SuccessResult(n);
    },
    n => n.toString(),
    StringParam(key),
  )
}

/**
 * NumberParam attempts to store a number in the search parameter, [key]. 
 * Throws warning if it *can* read a number, the value contains additional non-numerical data.
 * (e.g. if key = 123a)
 */
export function NumberParam(key: string): SearchParamMapping<number> {
  return SearchParamMapping.bindResult(
    (value): Result<number> => {
      const n = parseFloat(value);
      if (isNaN(n)) {
        return ErrorResult(`A numerical search parameter [${key}=${value}] could not be read as a number.`)
      } else if (n.toString() !== value) {
        return WarningResult(n, `A numerical search parameter [${key}=${value}] could only partially be read as a number.`);
      }
      return SuccessResult(n);
    },
    n => n.toString(),
    StringParam(key),
  )
}

/**
 * EnumParam(key, ...values) attempts to store an enum value of the search parameter, [key].
 * Will succeed iff the value at [key] is one of the string values named in the constructor.
 */
export function EnumParam<ES extends readonly string[]>(key: string, ...values: ES): SearchParamMapping<ES[number]> {
  return SearchParamMapping.bindResult(
    value => {
      if (values.indexOf(value) > -1) { return SuccessResult(value) }
      return ErrorResult(`An enum search parameter [${key}=${value}] could not be interpreted. Expected a value in the range ...${values.join(", ")}...`);
    },
    (x: ES[number]) => x,
    StringParam(key),
  );
}

/**
 * ConstantParam is a constant. Will always return the same value, without fail, and never serialize anything. 
 * Could be useful in some particularly elaborate situations.
 */
export function ConstParam<T>(value: T): SearchParamMapping<T> {
  return SearchParamMapping.pure(value);
}

/**
 * BooleanParam stores a boolean parameter in the search parameter, [key].
 * This is just a wrapper around a 2-value EnumParam.
 */
export function BooleanParam(key: string): SearchParamMapping<boolean> {
  return SearchParamMapping.map(
    value => value === "true" ? true : false,
    x => x ? "true" : "false",
    EnumParam(key, "true", "false")
  )
}


/**
 * OptionalParam takes a search parameter mapping and returns
 * a new parameter mapping which accepts undefined values
 * in addition to the original parameter type.
 */
export function OptionalParam<T>(mapping: SearchParamMapping<T>): SearchParamMapping<T | undefined> {
  return {
    parse: (params: Params) => {
      const [remainder, result] = mapping.parse(params);
      if (result.status === "error") {
        return [params, SuccessResult(undefined)];
      }
      return [remainder, result];
    },
    serialize: (value: T | undefined, params: Params) => {
      if (value === undefined) { // Default values don't need to be serialized
        return params;
      }
      return mapping.serialize(value, params);
    }
  }
}

/**
 * DefaultParam takes a search parameter mapping and returns a new mapping which 
 * mutes errors and treats undefined values as equaling defaultValue.
 */
export function DefaultParam<T>(mapping: SearchParamMapping<T>, defaultValue: T): SearchParamMapping<T> {
  return {
    parse: (params: Params) => {
      const [remainder, result] = mapping.parse(params);
      if (result.status === "error") {
        return [params, SuccessResult(defaultValue)];
      }
      return [remainder, result];
    },
    serialize: (value: T, params: Params) => {
      if (value === defaultValue) { // Default values don't need to be serialized
        return params;
      }
      return mapping.serialize(value, params);
    }
  }
}

// Set
// Object 
export type SearchParamObjectMapping<T extends {}> = {
  [k in keyof T]-?: SearchParamMapping<T[k]>
}
// export function ObjectParam<T extends {}>(fields: SearchParamObjectMapping<T>): SearchParamMapping<T> {
//   return {
//     parse: (params: Params) => {
//       let [params, value]
//       Object.keys(fields).forEach(key => {

//       })
//     }
//     serialize: 
//   }
// }

// TODO: DiscriminatedUnion
// export type SearchParamDiscriminatedUnionMapping<[]
// export function DiscriminatedUnion