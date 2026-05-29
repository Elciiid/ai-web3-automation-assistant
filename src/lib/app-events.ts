export const monitoringRunCompletedEvent = "unitflow:monitoring-run-completed";

export function emitMonitoringRunCompleted() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(monitoringRunCompletedEvent));
}

export function subscribeToMonitoringRunCompleted(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(monitoringRunCompletedEvent, callback);
  return () => window.removeEventListener(monitoringRunCompletedEvent, callback);
}
