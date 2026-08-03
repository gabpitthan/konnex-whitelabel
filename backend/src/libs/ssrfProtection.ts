import { lookup as systemLookup, LookupAddress, LookupAllOptions } from "dns";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import { BlockList, isIP, LookupFunction } from "net";

export const SSRF_BLOCKED_CODE = "ERR_SSRF_BLOCKED";

type ResolveAll = (
  hostname: string,
  options: LookupAllOptions,
  callback: (error: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void
) => void;

const blockedIpv4 = new BlockList();
[
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.31.196.0", 24],
  ["192.52.193.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["192.175.48.0", 24],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4]
].forEach(([network, prefix]) =>
  blockedIpv4.addSubnet(network as string, prefix as number, "ipv4")
);

const blockedIpv6 = new BlockList();
[
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20]
].forEach(([network, prefix]) =>
  blockedIpv6.addSubnet(network as string, prefix as number, "ipv6")
);

const blockedHostnames = ["localhost", "localhost.localdomain"];
const blockedHostnameSuffixes = [".localhost", ".local", ".internal", ".home.arpa"];

const blockedError = (): NodeJS.ErrnoException => {
  const error = new Error("External HTTP destination is not publicly routable") as NodeJS.ErrnoException;
  error.code = SSRF_BLOCKED_CODE;
  return error;
};

const normalizeIp = (address: string): string =>
  address.startsWith("[") && address.endsWith("]")
    ? address.slice(1, -1)
    : address;

export const isPublicIpAddress = (rawAddress: string): boolean => {
  const address = normalizeIp(rawAddress);
  const family = isIP(address);

  if (family === 4) {
    return !blockedIpv4.check(address, "ipv4");
  }

  if (family === 6) {
    const firstHextet = Number.parseInt(address.split(":", 1)[0] || "0", 16);
    const isGlobalUnicast =
      Number.isFinite(firstHextet) && (firstHextet & 0xe000) === 0x2000;
    return isGlobalUnicast && !blockedIpv6.check(address, "ipv6");
  }

  return false;
};

export const assertPublicHttpUrl = (rawUrl: string, baseUrl?: string): URL => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl, baseUrl);
  } catch {
    throw blockedError();
  }

  if (!["http:", "https:"].includes(parsed.protocol)) throw blockedError();
  if (parsed.username || parsed.password) throw blockedError();

  const hostname = normalizeIp(parsed.hostname).toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    blockedHostnames.includes(hostname) ||
    blockedHostnameSuffixes.some(suffix => hostname.endsWith(suffix))
  ) {
    throw blockedError();
  }

  if (isIP(hostname) && !isPublicIpAddress(hostname)) throw blockedError();
  return parsed;
};

export const createPublicLookup = (
  resolver: ResolveAll = systemLookup as ResolveAll
): LookupFunction => ((hostname, options, callback) => {
  resolver(
    hostname,
    { ...options, all: true, verbatim: true },
    (error, addresses) => {
      if (error) return callback(error, "", 0);
      if (!addresses.length || addresses.some(({ address }) => !isPublicIpAddress(address))) {
        return callback(blockedError(), "", 0);
      }

      if ((options as unknown as { all?: boolean }).all) {
        return (callback as unknown as (
          error: null,
          results: LookupAddress[]
        ) => void)(null, addresses);
      }

      const selected = addresses[0];
      return callback(null, selected.address, selected.family);
    }
  );
}) as LookupFunction;

const publicLookup = createPublicLookup();

export const restrictedHttpAgent = new HttpAgent({
  keepAlive: true,
  maxSockets: 32,
  maxFreeSockets: 4,
  lookup: publicLookup
});

export const restrictedHttpsAgent = new HttpsAgent({
  keepAlive: true,
  maxSockets: 32,
  maxFreeSockets: 4,
  lookup: publicLookup
});
