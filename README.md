# search-param-combinators
Strongly typed combinators for parsing and validating URL search parameters into arbitrary data types. Loosely based on the theory of reversible/bidirectional parsers, except applied to  [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) instead of strings.

## Usage
TBD

## Guarantees 
* Each search parameter available in the url will be used exactly once.
* Given any valid query string str, `parse(serialize(parse(str))) ≅ parse(str)`
* Given any valid value x, `parse(serialize(t)) ≅ t`
* If we try to parser a `SearchParam<T>` and have sufficient information to construct it, but break some invariant (e.g. using a parameter too much, or not at all), it will produce the valid T in addition to a series of warnings. In this case, serializing the resultant value will reset the search parameters to satisfying all invariants defined in the combinators. 
