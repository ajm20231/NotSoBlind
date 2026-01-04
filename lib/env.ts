type EnvOptions = {
  fallback?: string;
  optional?: boolean;
  description?: string;
};

function formatDescription(description?: string) {
  return description ? ` (${description})` : '';
}

/**
 * Retrieve an environment variable, optionally falling back to a default for local development.
 * Throws a descriptive error when a required variable is missing.
 */
export function getEnvVar(key: string, options: EnvOptions = {}): string | undefined {
  const { fallback, optional = false, description } = options;
  const value = process.env[key];

  if (value !== undefined && value !== '') {
    return value;
  }

  if (fallback !== undefined) {
    console.warn(
      `[env] ${key} is not set; using fallback value${formatDescription(description)}.`
    );
    return fallback;
  }

  if (optional) {
    return undefined;
  }

  throw new Error(
    `[env] Missing required environment variable: ${key}${formatDescription(description)}.`
  );
}

/**
 * Require an environment variable to be present (or to fall back), otherwise throw.
 */
export function requireEnvVar(key: string, options: Omit<EnvOptions, 'optional'> = {}): string {
  const value = getEnvVar(key, options);

  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${key}${formatDescription(options.description)}.`
    );
  }

  return value;
}
