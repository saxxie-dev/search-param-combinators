import { BooleanParam, EnumParam, IntegerParam, NumberParam, ObjectParam, OptionalParam, StringParam } from "./Combinators";
import { SearchParamContext } from "./SearchParamContext";

describe("Search Param Combinators", () => {
  let emptyParams: URLSearchParams;
  beforeEach(() => {
    emptyParams = new URLSearchParams();
  });
  describe("Nullary Combinators", () => {
    describe("StringParam", () => {
      it("should preserve special characters", () => {
        const mapping = StringParam("a");
        const value = "abc+def\nghi‽";
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      })
    });
    describe("EnumParam", () => {
      it("Should accept a member of the enum", () => {
        const mapping = EnumParam("foo", "bar", "baz")("a");
        const value = "bar";
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
      it("Should reject a nonmember of the enum", () => {
        const mapping = EnumParam("foo", "bar", "baz")("a");
        const value = "baR" as any;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("error");
      });
    });
    describe("BooleanParam", () => {
      it("Should work on true", () => {
        const mapping = BooleanParam("x");
        const value = true;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
      it("Should work on false", () => {
        const mapping = BooleanParam("x");
        const value = false;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
    });
    describe("IntegerParam", () => {
      it("Should accept a normal integer", () => {
        const mapping = IntegerParam("n");
        const value = 69;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
      it("Should warn for an inexact number", () => {
        const mapping = IntegerParam("n");
        const value = 42.1;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("warning");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(42);
      });
      it("Should fail for totally non-numeric values", () => {
        const mapping = IntegerParam("n");
        const value = "abcd" as any;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("error");
      });
    });
    describe("NumberParam", () => {
      it("Should accept a normal number", () => {
        const mapping = NumberParam("n");
        const value = 69;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
      it("Should warn for an inexact number", () => {
        const mapping = NumberParam("n");
        const value = "23abc" as any;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("warning");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(23);
      });
      it("Should work for a very big numbers", () => {
        const mapping = NumberParam("n");
        const value = 123e30;
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
    });
  });
  describe("Unary Combinators", () => {

  });
  describe("Higher Combinators", () => {
    describe("ObjectParam", () => {
      it("Should work for a simple object", () => {
        const mapping = ObjectParam({ num: NumberParam("abc") });
        const value = { num: 12 };
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        console.log(result);
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
      it("Should work for a malformed object, with duplicate keys", () => {
        const mapping = ObjectParam({ num: NumberParam("abc"), str: StringParam("abc") });
        const value = { num: 12, str: "qrs" };
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        console.log(result);
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
      it("Should work for a nested object", () => {
        const mapping = ObjectParam({
          num: NumberParam("abc"), str: StringParam("def"), obj: ObjectParam({
            maybe: OptionalParam(EnumParam("bar", "baz")("foo"))
          })
        });
        const value = { str: "qrs", num: 12, obj: { maybe: "baz" as const } };
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        console.log(result);
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
      it("Should work for an empty object", () => {
        const mapping = ObjectParam({});
        const value = {};
        const params = mapping.serialize(value, emptyParams);
        const [_, result] = mapping.parse(SearchParamContext.fromUrlSearchParams(params));
        console.log(result);
        expect(result.status).toEqual("success");
        if (result.status === "error") { return; }
        expect(result.data).toEqual(value);
      });
    })
  })
});