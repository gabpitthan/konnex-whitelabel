import packageInfo from "../../package.json";

const endpoint = `${process.env.REACT_APP_BACKEND_URL || ""}/client-errors`;
const sentErrors = new Set();
const chunkReloadKey = `kx-chunk-reload:${packageInfo.version}:${window.location.pathname}`;

const createErrorId = () => {
	const random = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `KX-${Date.now().toString(36).toUpperCase()}-${random}`;
};

const summarizeUserAgent = () => {
	const agent = navigator.userAgent || "";
	const browser =
		agent.match(/(CriOS|FxiOS|EdgiOS|Edg|Chrome|Firefox|Version)\/[\d.]+/)?.[0] ||
		"unknown";
	const platform = /iPhone|iPad|Android|Windows|Macintosh|Linux/.exec(agent)?.[0] || "unknown";
	return `${browser}; ${platform}`.slice(0, 100);
};

const safeMessage = value => {
	const message = typeof value === "string" ? value : "Unexpected client error";
	return message
		.replace(/Bearer\s+\S+/gi, "[redacted]")
		.replace(/https?:\/\/[^\s]+/gi, "[url]")
		.slice(0, 240);
};

export const reportClientError = (error, context = {}) => {
	const errorId = context.errorId || createErrorId();
	const fingerprint = `${safeMessage(error?.message || error)}:${window.location.pathname}`;

	if (sentErrors.has(fingerprint)) return errorId;
	sentErrors.add(fingerprint);
	if (sentErrors.size > 30) sentErrors.clear();

	const payload = {
		errorId,
		kind: String(context.kind || "runtime").slice(0, 30),
		message: safeMessage(error?.message || error),
		route: window.location.pathname.slice(0, 180),
		version: String(packageInfo.version).slice(0, 30),
		viewport: `${window.innerWidth}x${window.innerHeight}`,
		userAgent: summarizeUserAgent(),
		component: safeMessage(context.component || "").slice(0, 300),
	};

	try {
		const body = JSON.stringify(payload);
		if (navigator.sendBeacon) {
			navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
		} else {
			fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
				keepalive: true,
				credentials: "omit",
			}).catch(() => undefined);
		}
	} catch (_) {
		// Reporting must never create another application failure.
	}

	return errorId;
};

export const installGlobalErrorReporting = () => {
	const handlePossibleChunkError = (error, fallbackKind) => {
		const message = String(error?.message || error || "");
		const isChunkError = /ChunkLoadError|Loading chunk [\d]+ failed|dynamically imported module/i.test(message);
		const errorId = reportClientError(error, {
			kind: isChunkError ? "chunk-load" : fallbackKind,
		});

		if (isChunkError) {
			try {
				if (!sessionStorage.getItem(chunkReloadKey)) {
					sessionStorage.setItem(chunkReloadKey, errorId);
					window.location.reload();
				}
			} catch (_) {
				// Storage may be disabled; keep the recovery screen available.
			}
		}
	};

	window.addEventListener("error", event => {
		handlePossibleChunkError(event.error || event.message, "window-error");
	});

	window.addEventListener("unhandledrejection", event => {
		handlePossibleChunkError(event.reason, "unhandled-rejection");
	});
};
