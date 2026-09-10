const DEV_FALLBACK_SECRET = 'neo-dev-secret';

/**
 * Fails fast when the app is about to run in production with no real
 * JWT_SECRET configured. Auth tokens signed with a missing/default secret
 * are trivially forgeable, so this is treated as a fatal startup error
 * rather than a warning.
 */
export function assertJwtSecret(env: {
  NODE_ENV?: string;
  JWT_SECRET?: string;
}): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  if (!env.JWT_SECRET || env.JWT_SECRET === DEV_FALLBACK_SECRET) {
    throw new Error(
      'JWT_SECRET is missing or set to the insecure development default ' +
        `("${DEV_FALLBACK_SECRET}") while NODE_ENV=production. Set a strong, ` +
        'unique JWT_SECRET environment variable before starting the server.',
    );
  }
}
