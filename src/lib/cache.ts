import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'calora_cache_v1_';

/**
 * Reads cached JSON data instantly from local storage.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Writes data to local storage so it loads in 0ms next time the app opens.
 */
export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch {
    // Silently handle storage limits or web browser storage restrictions
  }
}

/**
 * Clears cache entry on user sign-out or cache invalidation.
 */
export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // Silently ignore
  }
}
