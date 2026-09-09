import { describe, expect, it } from "vitest";
import { isOfficialStock, STOCKS } from "../lib/stocks";
describe("official stock registry", () => {
  it("contains unique address-first entries", () => { const addresses = STOCKS.map((stock) => stock.address.toLowerCase()); expect(new Set(addresses).size).toBe(addresses.length); });
  it("rejects ticker-like and unknown identifiers", () => { expect(isOfficialStock("AAPLc")).toBe(false); expect(isOfficialStock("0x0000000000000000000000000000000000000000")).toBe(false); });
  it("accepts the documented AAPLc address", () => { expect(isOfficialStock("0xb200000000000000000000C2e324d24d7eEcd1fb")).toBe(true); });
});
