import { LOG_TRANSLATE_TIME, logTimestamp } from "../logger";

describe("structured logger timestamp", () => {
  it("emits an unambiguous ISO-8601 UTC value", () => {
    const fragment = `{${logTimestamp().slice(1)}}`;
    const parsed = JSON.parse(fragment);
    expect(parsed.time).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
    expect(LOG_TRANSLATE_TIME).toBe("UTC:yyyy-mm-dd HH:MM:ss.l o");
  });
});
