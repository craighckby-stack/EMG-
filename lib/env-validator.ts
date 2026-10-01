/**
 * Environment variable validation module.
 * Validates required runtime environment variables and type configurations.
 */

export interface EnvConfig {
  readonly GEMINI_API_KEY: string;
  readonly APP_URL: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
}

export interface EnvValidationResult {
  readonly valid: boolean;
  readonly missing: readonly string[];
}

const REQUIRED_ENV_KEYS = Object.freeze([
  'GEMINI_API_KEY',
  'APP_URL',
] as const);

const VALID_NODE_ENVS: ReadonlySet<EnvConfig['NODE_ENV']> = new Set([
  'development',
  'production',
  'test',
]);

/**
 * Validates the presence of all required environment variables.
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];

  for (let i = 0; i < REQUIRED_ENV_KEYS.length; i++) {
    const key = REQUIRED_ENV_KEYS[i];
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Parses and returns validated environment configuration object.
 * Returns default NODE_ENV value of 'development' if not specified or invalid.
 */
export function getEnvConfig(): EnvConfig {
  const validation = validateEnv();
  if (!validation.valid) {
    throw new Error(
      `Environment validation failed. Missing required variables: ${validation.missing.join(', ')}`
    );
  }

  const rawNodeEnv = process.env.NODE_ENV as EnvConfig['NODE_ENV'] | undefined;
  const nodeEnv: EnvConfig['NODE_ENV'] =
    rawNodeEnv && VALID_NODE_ENVS.has(rawNodeEnv) ? rawNodeEnv : 'development';

  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
    APP_URL: process.env.APP_URL as string,
    NODE_ENV: nodeEnv,
  };
}