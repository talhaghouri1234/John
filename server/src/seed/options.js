export function parseSeedOptions(args, nodeEnv) {
  if (nodeEnv === 'production') throw new Error('Demo seed is disabled in production');
  if (args.some((arg) => arg !== '--destroy') || args.length > 1) throw new Error('Usage: seed [--destroy]');
  return { destroy: args.includes('--destroy') };
}
