import test from "ava";
import { normalizeUrl } from "../src/helper";

test("normalizeUrl", async (t) => {
  const expectUrl = "http://test.com";

  {
    const data = "http://test.com/";
    const url = normalizeUrl(data);
    t.is(expectUrl, url);
  }

  {
    const data = "http://test.com///";
    const url = normalizeUrl(data);
    t.is(expectUrl, url);
  }
});
