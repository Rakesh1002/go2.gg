import { describe, expect, it } from "vitest";
import { isAdultUrl } from "../src/lib/adult-hosts";

describe("isAdultUrl", () => {
  it.each([
    "https://onlyfans.com/someone",
    "https://www.onlyfans.com/someone",
    "https://ONLYFANS.com/someone",
    "https://onlyfans.com./someone",
    "https://onlyfans.com../someone",
    "https://onlyfan%73.com/someone",
    "https://ｏｎｌｙｆａｎｓ.com/someone",
    "https://evil.example@onlyfans.com/someone",
    "https:\\\\onlyfans.com/someone",
    "http://fansly.com/x",
    "https://justfor.fans/x",
    "https://de.pornhub.com/model/x",
  ])("matches %s", (url) => {
    expect(isAdultUrl(url)).toBe(true);
  });

  it.each([
    "https://notonlyfans.com/x",
    "https://onlyfans.com.evil.example/x",
    "https://onlyfans.com@evil.example/x",
    "https://example.com/onlyfans.com",
    "https://example.com/?u=https://onlyfans.com",
    "https://instagram.com/someone",
    "javascript:alert(1)",
    "not a url",
  ])("does not match %s", (url) => {
    expect(isAdultUrl(url)).toBe(false);
  });
});
