export type Result<T> =
  | {
    status: 'success',
    data: T,
  }
  | {
    status: 'warning',
    data: T,
    warnings: string[],
  }
  | {
    status: 'error',
    errors: string[],
    warnings: string[],
  };

export function SuccessResult<T>(data: T): Result<T> {
  return {
    status: 'success',
    data,
  };
}

export function WarningResult<T>(data: T, warning0: string, ...warnings: string[]): Result<T> {
  return {
    status: 'warning',
    data,
    warnings: [warning0, ...warnings],
  };
}

export function ErrorResult<T>(error0: string, ...errors: string[]): Result<T> {
  return {
    status: 'error',
    errors: [error0, ...errors],
    warnings: [],
  };
}

export namespace Result {
  export function map<U, V>(f: (u: U) => V, ru: Result<U>): Result<V> {
    switch (ru.status) {
      case "error":
        return ru;
      case "warning":
      case "success":
        return { ...ru, data: f(ru.data) };
    }
  }

  export function flatten<U>(rru: Result<Result<U>>): Result<U> {
    switch (rru.status) {
      case "error":
        return rru;
      case "success":
        return rru.data;
      case "warning":
        switch (rru.data.status) {
          case "error":
            return {
              status: "error",
              errors: rru.data.errors,
              warnings: [...rru.warnings, ...rru.data.warnings],
            };
          case "warning":
            return {
              ...rru.data,
              warnings: [...rru.warnings, ...rru.data.warnings],
            };
          case "success":
            return {
              ...rru,
              data: rru.data.data,
            }
        }
    }
  }

  export function bind<U, V>(f: (u: U) => Result<V>, ru: Result<U>): Result<V> {
    return flatten(map(f, ru));
  }

  export function map2<U1, U2, V>(fn: (u1: U1, u2: U2) => V, ru1: Result<U1>, ru2: Result<U2>): Result<V> {
    return flatten(map(u2 => map((u1) => fn(u1, u2), ru1), ru2));
  }

  export function map3<U1, U2, U3, V>(fn: (u1: U1, u2: U2, u3: U3) => V, ru1: Result<U1>, ru2: Result<U2>, ru3: Result<U3>): Result<V> {
    return flatten(flatten(map(u3 => map(u2 => map((u1) => fn(u1, u2, u3), ru1), ru2), ru3)));
  }

  export function either<U>(a: Result<U>, b: Result<U>): Result<U> {
    switch (a.status) {
      case "error":
        if (b.status !== "error") {
          return b;
        }
        return {
          status: "error",
          errors: ["Both parse branches encountered errors.", ...a.errors, ...b.errors],
          warnings: [...a.warnings, ...b.warnings],
        };

      case "success":
        switch (b.status) {
          case "error":
            return a;
          case "warning":
            return {
              status: "warning",
              data: a.data,
              warnings: ["Both parse branches produced valid data, returned value with fewer warnings.", ...b.warnings],
            }
          case "success":
            return {
              status: "warning",
              data: a.data,
              warnings: ["Both parse branches produced valid data, returned value may be arbitrary."],
            }
        }
      case "warning":
        switch (b.status) {
          case "error":
            return a;
          case "success":
            return {
              status: "warning",
              data: b.data,
              warnings: ["Both parse branches produced valid data, returned value with fewer warnings.", ...a.warnings],
            }
          case "warning":
            return {
              status: "warning",
              data: a.data,
              warnings: ["Both parse branches produced valid datareturned value may be arbitrary.", ...a.warnings, ...b.warnings],
            }
        }
    }
  }

  export function split<U, V>(ruv: Result<readonly [U, V]>): [Result<U>, Result<V>] {
    return [map(x => x[0], ruv), map(x => x[1], ruv)];
  }

  export function withDefault<U>(ru: Result<U>, defaultValue: U): U {
    if (ru.status === "error") { return defaultValue; }
    return ru.data;
  }
}
