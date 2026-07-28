export function register() {
  // This build does not ship a service-worker.js. Keeping this function as a
  // compatibility no-op prevents old callers from producing a failed request.
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
      .catch(() => undefined);
  }
}
