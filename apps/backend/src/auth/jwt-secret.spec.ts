import { assertJwtSecret } from './jwt-secret';

describe('assertJwtSecret', () => {
  it('throws in production when JWT_SECRET is missing', () => {
    expect(() => assertJwtSecret({ NODE_ENV: 'production' })).toThrow();
  });

  it('throws in production when JWT_SECRET is the dev fallback', () => {
    expect(() =>
      assertJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'neo-dev-secret' }),
    ).toThrow();
  });

  it('does not throw in production when JWT_SECRET is a real secret', () => {
    expect(() =>
      assertJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'a-real-strong-secret' }),
    ).not.toThrow();
  });

  it('does not throw outside production when JWT_SECRET is missing', () => {
    expect(() => assertJwtSecret({ NODE_ENV: 'development' })).not.toThrow();
  });
});
