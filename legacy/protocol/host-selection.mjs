export function validateBenchmark(value) {
  if (
    !value ||
    !Number.isSafeInteger(value.ticks) ||
    value.ticks < 256 ||
    value.ticks > 10_000
  )
    return null;
  if (
    ![value.meanMs, value.p95Ms].every(
      (n) => Number.isFinite(n) && n > 0 && n < 1000,
    ) ||
    value.p95Ms < value.meanMs * 0.5
  )
    return null;
  return { ticks: value.ticks, meanMs: value.meanMs, p95Ms: value.p95Ms };
}
export function hostScore(value) {
  const benchmark = validateBenchmark(value);
  if (!benchmark) return Infinity;
  // A bad tail latency hurts the simulation more than a fast average helps it.
  return benchmark.p95Ms * 0.8 + benchmark.meanMs * 0.2;
}
export function selectHost(benchmarks) {
  if (benchmarks.length !== 2 || benchmarks.some((b) => !validateBenchmark(b)))
    throw new Error("Both machines must finish the host benchmark");
  const scores = benchmarks.map(hostScore);
  return scores[1] < scores[0] * 0.95 ? 1 : 0;
}
