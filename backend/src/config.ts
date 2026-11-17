export function clientOrigins() {
  const origins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://localhost')
    .split(',').map(value => value.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_ORIGIN) {
    throw new Error('CLIENT_ORIGIN is required in production');
  }
  return origins;
}
