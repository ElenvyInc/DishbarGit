// Runtime configuration
let runtimeConfig: {
  API_BASE_URL: string;
} | null = null;

// Configuration loading state
let configLoading = true;

// Local default is for development only. Production builds never use it.
const defaultConfig = {
  API_BASE_URL: 'http://127.0.0.1:8000',
};

function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url, 'http://localhost').hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';
  } catch {
    return true;
  }
}

// Function to load runtime configuration
export async function loadRuntimeConfig(): Promise<void> {
  try {
    console.log('🔧 DEBUG: Starting to load runtime config...');
    // Try to load configuration from a config endpoint
    const response = await fetch('/api/config');
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      // Only parse as JSON if the response is actually JSON
      if (contentType && contentType.includes('application/json')) {
        runtimeConfig = await response.json();
        console.log('Runtime config loaded successfully');
      } else {
        console.log(
          'Config endpoint returned non-JSON response, skipping runtime config'
        );
      }
    } else {
      console.log(
        '🔧 DEBUG: Config fetch failed with status:',
        response.status
      );
    }
  } catch (error) {
    console.log('Failed to load runtime config, using defaults:', error);
  } finally {
    configLoading = false;
    console.log(
      '🔧 DEBUG: Config loading finished, configLoading set to false'
    );
  }
}

// Get current configuration
export function getConfig() {
  const production = import.meta.env.PROD;

  if (production) {
    const runtimeUrl = runtimeConfig?.API_BASE_URL;
    if (runtimeUrl && !isLocalhostUrl(runtimeUrl)) {
      return { API_BASE_URL: runtimeUrl };
    }
    const viteUrl = import.meta.env.VITE_API_BASE_URL;
    if (viteUrl && !isLocalhostUrl(viteUrl)) {
      return { API_BASE_URL: viteUrl };
    }
    // Same-origin. Never fall back to localhost in a production build.
    return { API_BASE_URL: '' };
  }

  if (configLoading) {
    return defaultConfig;
  }

  if (runtimeConfig?.API_BASE_URL) {
    return runtimeConfig;
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return { API_BASE_URL: import.meta.env.VITE_API_BASE_URL };
  }

  return defaultConfig;
}

// Dynamic API_BASE_URL getter - this will always return the current config
export function getAPIBaseURL(): string {
  return getConfig().API_BASE_URL;
}

// For backward compatibility, but this should be avoided
// Removed static export to prevent using stale config values
// export const API_BASE_URL = getAPIBaseURL();

export const config = {
  get API_BASE_URL() {
    return getAPIBaseURL();
  },
};
