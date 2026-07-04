const JWT_SECRET_MESSAGE =
  'JWT_SECRET environment variable is required. ' +
  'Set it in your hosting dashboard (Railway, Render, Fly.io, etc.) ' +
  'or copy .env.example to .env for local development. ' +
  'Generate a value with: openssl rand -base64 32';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(JWT_SECRET_MESSAGE);
  }
  return secret;
}
