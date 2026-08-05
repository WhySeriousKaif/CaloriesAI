import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns a fully-qualified absolute URL for API endpoints.
 *
 * Relative URLs like `/api/profile` fail in standalone native React Native apps
 * because native fetch requires a protocol and host (e.g., `https://...`).
 */
export function getApiUrl(path: string): string {
  if (!path) return path;

  // 1. If already absolute (http:// or https://), return directly.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // 2. Explicit EXPO_PUBLIC_API_URL environment variable
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl && envApiUrl.trim().length > 0) {
    const baseUrl = envApiUrl.trim().replace(/\/+$/, '');
    return `${baseUrl}${normalizedPath}`;
  }

  // 3. On Web browser, relative URLs resolve automatically via window.location.origin
  if (Platform.OS === 'web') {
    return normalizedPath;
  }

  // 4. On Native during Expo CLI / Metro development mode
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2?.extra?.expoGo as { debuggerHost?: string } | undefined)?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8081${normalizedPath}`;
    }
  }

  // 5. Native fallback
  return normalizedPath;
}
