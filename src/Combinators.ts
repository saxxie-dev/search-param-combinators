import { PartialResult } from "./PartialResult";
import { ErrorResult, Result, SuccessResult, WarningResult } from "./Result";
import { SearchParamContext } from "./SearchParamContext";
import { Params, SearchParamMapping } from "./SearchParamMapping";

/**
 * You should (probably) not use this - try StringParam instead.
 * Primitive param stores a raw string in the search parameter, [key].
 * No safety checks are in place, so it is possible to generate weird URLs.
 */
export function prim(key: string): SearchParamMapping<string> {
  return {
    parse: (params: Params) => params.get(key),
    serialize: (value: string, params: URLSearchParams) => {
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
export function string(key: string): SearchParamMapping<string> {
  return SearchParamMapping.map(
    decodeURIComponent,
    encodeURIComponent,
    prim(key));
}

/**
 * IntegerParam attempts to store an integer in the search parameter, [key]. 
 * Throws warning if it *can* read an integer, but the value contains additional non-integral data.
 * (e.g. if key = 123a, or 123.1)
 */
export function integer(key: string): SearchParamMapping<number> {
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
    string(key),
  )
}

/**
 * NumberParam attempts to store a number in the search parameter, [key]. 
 * Throws warning if it *can* read a number, the value contains additional non-numerical data.
 * (e.g. if key = 123a)
 */
export function number(key: string): SearchParamMapping<number> {
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
    string(key),
  )
}

/**
 * EnumParam(key, ...values) attempts to store an enum value of the search parameter, [key].
 * Will succeed iff the value at [key] is one of the string values named in the constructor.
 */
export function makeEnum<ES extends readonly string[]>(...values: ES): (key: string) => SearchParamMapping<ES[number]> {
  return (key: string) => SearchParamMapping.bindResult(
    value => {
      if (values.indexOf(value) > -1) { return SuccessResult(value) }
      return ErrorResult(`An enum search parameter [${key}=${value}] could not be interpreted. Expected a value in the range ...${values.join(", ")}...`);
    },
    (x: ES[number]) => x,
    string(key),
  );
}

/**
 * ConstantParam is a constant. Will always return the same value, without fail, and never serialize anything. 
 * Could be useful in some particularly elaborate situations.
 */
export function makeConst<T>(value: T): SearchParamMapping<T> {
  return SearchParamMapping.pure(value);
}

/**
 * BooleanParam stores a boolean parameter in the search parameter, [key].
 * This is just a wrapper around a 2-value EnumParam.
 */
export function boolean(key: string): SearchParamMapping<boolean> {
  return SearchParamMapping.map(
    value => value === "true" ? true : false,
    x => x ? "true" : "false",
    makeEnum("true", "false")(key)
  )
}


/**
 * OptionalParam takes a search parameter mapping and returns
 * a new parameter mapping which accepts undefined values
 * in addition to the original parameter type.
 */
export function optional<T>(mapping: SearchParamMapping<T>): SearchParamMapping<T | undefined> {
  return {
    parse: (params: Params) => {
      const [remainder, result] = mapping.parse(params);
      if (result.status === "error") {
        return [params, SuccessResult(undefined)];
      }
      return [remainder, result];
    },
    serialize: (value: T | undefined, params: URLSearchParams) => {
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
export function withDefault<T>(mapping: SearchParamMapping<T>, defaultValue: T): SearchParamMapping<T> {
  return {
    parse: (params: Params) => {
      const [remainder, result] = mapping.parse(params);
      if (result.status === "error") {
        return [params, SuccessResult(defaultValue)];
      }
      return [remainder, result];
    },
    serialize: (value: T, params: URLSearchParams) => {
      if (value === defaultValue) { // Default values don't need to be serialized
        return params;
      }
      return mapping.serialize(value, params);
    }
  }
}

export function array<T>(mapping: SearchParamMapping<T>): SearchParamMapping<T[]> {
  const ret: SearchParamMapping<T[]> = {
    parse: (params: Params) => {
      const [remainder, head] = mapping.parse(params)
      if (head.status === "error") {
        return [params, SuccessResult([])]
      }
      const [remainder2, tail] = ret.parse(remainder);
      return [remainder2, Result.map2((x, y) => [x, ...y], head, tail)];
    },
    serialize: (value: T[], params: URLSearchParams) => {
      const [head, ...tail] = value;
      if (head === undefined) {
        return params;
      }
      return ret.serialize(tail, mapping.serialize(head, params))
    }
  }

  return ret;
}

export type ObjectMappings<T extends {}> = {
  [k in keyof T]-?: SearchParamMapping<T[k]>
}

/**
 * ObjectParam takes an object of parameters, and returns a mapping for objects of data
 * Will collect and aggregate all errors from the constituent parts.
 * Serialization order depends on the order of the keys in the mapping, not on the
 * order of keys in data being serialized. 
 */
export function object<T extends {}>(mappings: ObjectMappings<T>): SearchParamMapping<T> {
  const fieldNames = Object.keys(mappings) as (keyof T)[];
  return {
    parse: (initialParams: Params) => {
      let params = initialParams;
      let val: Result<Partial<T>> = SuccessResult({});
      fieldNames.forEach(key => {
        [params, val] = PartialResult.bind(
          (pt: Partial<T>) => {
            return PartialResult.map((tk: any): Partial<T> => {
              pt[key] = tk;
              return pt;
            }, mappings[key].parse(params))
          }, [params, val]);
      })
      return [params, val as Result<T>];
    },
    serialize: (value: T, params: URLSearchParams) => {
      fieldNames.forEach(key => {
        params = mappings[key].serialize(value[key], params);
      });
      return params;
    }
  }
}


export type TaggedUnionMappings<T extends {}> = {
  [k in keyof T]-?: SearchParamMapping<T[k]>
}
export type IntersectionToUnion<T extends {}> = {
  [k in keyof T]: { type: k } & T[k];
}[keyof T]

/**
 * TaggedUnionParam takes an enum tag, an object of object parameters, and returns a mapping 
 * for unions of objects for objects of data
 * Will collect and aggregate all errors from the constituent parts.
 * Serialization order depends on the order of the keys in the mapping, not on the
 * order of keys in data being serialized. 
 */
export function taggedUnion<T extends {}>(
  tag: SearchParamMapping<keyof T>,
  mappings: TaggedUnionMappings<T>): SearchParamMapping<IntersectionToUnion<T>> {
  return {
    parse: (params: Params) => {
      const [remainder, rd] = tag.parse(params);
      return PartialResult.bind(d => {
        return PartialResult.map(value => ({ ...value, type: d }), mappings[d].parse(remainder))
      }, [remainder, rd])
    },
    serialize: (value, params) => {
      tag.serialize(value.type, params);
      mappings[value.type].serialize(value, params);
      return params;
    }
  }
}

/**
 * Helper type to pull out the type from inside a SearchParamMapping
 */
export type Infer<T> = T extends SearchParamMapping<infer U> ? U : never;

/**
 * Parse a set of URLSearchParams using a give SearchParamMapping. 
 * Will run extra validation on global outputs to counter common potential issues.
 */
export function runParse<T>(mapping: SearchParamMapping<T>, params: URLSearchParams) {
  const ctx = SearchParamContext.fromUrlSearchParams(params);
  const [remainder, result] = mapping.parse(ctx);
  const remainingKeys = remainder.remainingKeys()
  return Result.addWarnings(result, ...remainingKeys.map(key => `Key ${key} has remaining unparsed instances`));
}