// import { Result } from "./Result";


// export type SearchParamMapping<U, V> = {
//   parse: (u: U) => Result<V>,
//   serialize: (v: V) => U,
// }

// export type RawParamValue = string;

// // export interface SearchParam<T> {
// //   parse: (params: URLSearchParams) => SearchParamParseResult<T>;
// //   serialize: (value: T) => URLSearchParams;
// // }

// export interface SearchParamImpl<T> {
//   parseImpl: (params: URLSearchParams, context: Record<string, number>) => T,
//   serialize: (value: T) => URLSearchParams,
// }

// export function parseURLSearchParams<T>(impl: SearchParamImpl<T>, params: URLSearchParams): void {
//   //: SearchParamParseResult<T> {
//   const context: Record<string, string[]> = {};
//   for (const [k, v] of params) {
//     if (!context[k]) { context[k] = []; }
//     context[k]?.push(v);
//   }
//   const _parseResult = impl?.parseImpl;
//   console.log(context, _parseResult)
// }

// export const one = <T>(mapping: SearchParamMapping<RawParamValue, T>): SearchParamImpl<T> => {
//   encodeURIComponent
//   decodeURICOmponetn
//   return null;
// };

// export const many = <T>(mapping: SearchParamMapping<RawParamValue, T>): SearchParamImpl<Set<T>> => {
//   return null;
// };

// export const optional = <T>(mapping: SearchParamMapping<RawParamValue, T>): SearchParamImpl<T | undefined> => {
//   return null;
// };

// export const string: SearchParamMapping<RawParamValue, string> = {
//   parse: (value: RawParamValue): Result<string> => {
//     return {
//       status: 'success',
//       data: value,
//     }
//   },
//   serialize: (value: string): RawParamValue => {
//     return value;
//   }
// }

// export const integer: SearchParamMapping<RawParamValue, number> = {
//   parse: (value: RawParamValue): Result<number> => {
//     const n = parseInt(value);
//     if (isNaN(n)) {
//       return {
//         status: 'error',
//         errors: ["... could not be read as an integer."], // TODO - include the name of the param
//       };
//     } else if (`${n}` !== value) {
//       return {
//         status: 'warning',
//         data: n,
//         warnings: ["... could only partially be read as an integer."], // TODO - include the name of the param
//       };
//     }
//     return {
//       status: 'success',
//       data: n,
//     };
//   },
//   serialize: (value: number): RawParamValue => {
//     return `${value}`;
//   }
// }

