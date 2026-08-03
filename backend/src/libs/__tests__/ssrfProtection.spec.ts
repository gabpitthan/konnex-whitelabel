import {
  assertPublicHttpUrl,
  createPublicLookup,
  isPublicIpAddress,
  restrictedHttpAgent,
  restrictedHttpsAgent,
  SSRF_BLOCKED_CODE
} from "../ssrfProtection";
import {
  externalRestrictedJsonClient,
  externalRestrictedMediaClient
} from "../httpClients";
import logger from "../../utils/logger";

const resolveWith = (addresses: Array<{ address: string; family: number }>) =>
  (_hostname, _options, callback) => callback(null, addresses);

const runLookup = (
  lookup: ReturnType<typeof createPublicLookup>,
  hostname = "example.test"
): Promise<{ address: string; family: number }> =>
  new Promise((resolve, reject) => {
    lookup(hostname, { family: 0, hints: 0 }, (error, address, family) => {
      if (error) return reject(error);
      return resolve({ address, family });
    });
  });

describe("SSRF-safe egress", () => {
  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.0.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "2001:db8::1"
  ])("rejects non-public address %s", address => {
    expect(isPublicIpAddress(address)).toBe(false);
  });

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "accepts globally routable address %s",
    address => {
      expect(isPublicIpAddress(address)).toBe(true);
    }
  );

  it.each([
    "http://localhost/admin",
    "http://service.internal/",
    "http://169.254.169.254/latest/meta-data/",
    "http://2130706433/",
    "http://0177.0.0.1/",
    "http://[::ffff:127.0.0.1]/",
    "file:///etc/passwd",
    "http://user:password@example.com/"
  ])("rejects unsafe URL form %s", url => {
    expect(() => assertPublicHttpUrl(url)).toThrow(
      expect.objectContaining({ code: SSRF_BLOCKED_CODE })
    );
  });

  it("accepts a normalized public HTTP URL", () => {
    expect(assertPublicHttpUrl("https://example.com/path").hostname).toBe(
      "example.com"
    );
  });

  it("fails closed when any DNS answer is private", async () => {
    const lookup = createPublicLookup(
      resolveWith([
        { address: "93.184.216.34", family: 4 },
        { address: "127.0.0.1", family: 4 }
      ])
    );

    await expect(runLookup(lookup)).rejects.toMatchObject({
      code: SSRF_BLOCKED_CODE
    });
  });

  it("passes the exact validated DNS address to the socket", async () => {
    const lookup = createPublicLookup(
      resolveWith([{ address: "93.184.216.34", family: 4 }])
    );

    await expect(runLookup(lookup)).resolves.toEqual({
      address: "93.184.216.34",
      family: 4
    });
  });

  it("returns all validated addresses when Node requests auto family selection", async () => {
    const lookup = createPublicLookup(
      resolveWith([
        { address: "93.184.216.34", family: 4 },
        { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 }
      ])
    );

    const results = await new Promise((resolve, reject) => {
      (lookup as any)(
        "example.test",
        { family: 0, hints: 0, all: true },
        (error, addresses) => (error ? reject(error) : resolve(addresses))
      );
    });

    expect(results).toEqual([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 }
    ]);
  });

  it("revalidates every DNS lookup and blocks rebinding", async () => {
    let calls = 0;
    const lookup = createPublicLookup((_hostname, _options, callback) => {
      calls += 1;
      callback(null, [
        calls === 1
          ? { address: "93.184.216.34", family: 4 }
          : { address: "127.0.0.1", family: 4 }
      ]);
    });

    await expect(runLookup(lookup)).resolves.toBeDefined();
    await expect(runLookup(lookup)).rejects.toMatchObject({
      code: SSRF_BLOCKED_CODE
    });
  });

  it("disables proxy, socket paths and redirects with bounded agents", () => {
    for (const client of [
      externalRestrictedJsonClient,
      externalRestrictedMediaClient
    ]) {
      expect(client.defaults.proxy).toBe(false);
      expect(client.defaults.maxRedirects).toBe(0);
      expect(client.defaults.allowedSocketPaths).toEqual([]);
      expect(client.defaults.httpAgent).toBe(restrictedHttpAgent);
      expect(client.defaults.httpsAgent).toBe(restrictedHttpsAgent);
    }
    expect(restrictedHttpAgent.maxSockets).toBe(32);
    expect(restrictedHttpsAgent.maxFreeSockets).toBe(4);
  });

  it("emits a safe observable event when a destination is blocked", async () => {
    const warning = jest.spyOn(logger, "warn").mockImplementation(() => undefined);

    await expect(
      externalRestrictedMediaClient.get("http://169.254.169.254/latest/meta-data")
    ).rejects.toMatchObject({ code: SSRF_BLOCKED_CODE });

    expect(warning).toHaveBeenCalledWith(
      {
        event: "external_http_request_failed",
        code: SSRF_BLOCKED_CODE,
        status: undefined,
        securityBlocked: true
      },
      "External HTTP request failed"
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain("169.254.169.254");
    warning.mockRestore();
  });
});
