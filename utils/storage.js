// Chrome storage utilities
class StorageManager {
  static async get(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  static async set(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  static async remove(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  static async clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  static async getAll() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  static async getBytesInUse() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(bytesInUse);
        }
      });
    });
  }

  // Specific storage methods for the extension
  static async getSettings() {
    const settings = await this.get('settings');
    return settings || {
      apiKey: '',
      vpnPath: '',
      autoConnect: true,
      darkMode: false,
      cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  static async saveSettings(settings) {
    return await this.set('settings', settings);
  }

  static async getFavorites() {
    const favorites = await this.get('favorites');
    return favorites || [];
  }

  static async saveFavorites(favorites) {
    return await this.set('favorites', favorites);
  }

  static async addFavorite(title, countryCode, poster = null) {
    const favorites = await this.getFavorites();
    const favorite = {
      id: `${title}_${countryCode}`,
      title,
      countryCode,
      poster,
      timestamp: Date.now()
    };

    // Check if already exists
    const exists = favorites.find(fav => fav.id === favorite.id);
    if (!exists) {
      favorites.unshift(favorite);
      // Keep only last 50 favorites
      favorites.splice(50);
      await this.saveFavorites(favorites);
    }

    return favorite;
  }

  static async removeFavorite(favoriteId) {
    const favorites = await this.getFavorites();
    const filtered = favorites.filter(fav => fav.id !== favoriteId);
    return await this.saveFavorites(filtered);
  }

  static async getHistory() {
    const history = await this.get('history');
    return history || [];
  }

  static async saveHistory(history) {
    return await this.set('history', history);
  }

  static async addToHistory(query, results = null) {
    const history = await this.getHistory();
    const historyItem = {
      id: `search_${Date.now()}`,
      query,
      results: results ? results.slice(0, 5) : null, // Store only first 5 results
      timestamp: Date.now()
    };

    // Remove duplicate queries
    const filtered = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
    filtered.unshift(historyItem);
    
    // Keep only last 100 searches
    filtered.splice(100);
    
    return await this.saveHistory(filtered);
  }

  static async clearHistory() {
    return await this.set('history', []);
  }

  static async getCache() {
    const cache = await this.get('cache');
    return cache || {};
  }

  static async setCache(key, data, expiry = 24 * 60 * 60 * 1000) {
    const cache = await this.getCache();
    cache[key] = {
      data,
      timestamp: Date.now(),
      expiry
    };
    return await this.set('cache', cache);
  }

  static async getCachedData(key) {
    const cache = await this.getCache();
    const cached = cache[key];
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > cached.expiry) {
      // Remove expired cache
      delete cache[key];
      await this.set('cache', cache);
      return null;
    }

    return cached.data;
  }

  static async clearCache() {
    return await this.set('cache', {});
  }

  static async clearExpiredCache() {
    const cache = await this.getCache();
    const now = Date.now();
    let hasChanges = false;

    for (const [key, cached] of Object.entries(cache)) {
      if (now - cached.timestamp > cached.expiry) {
        delete cache[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      return await this.set('cache', cache);
    }
  }

  static async getStorageUsage() {
    const allData = await this.getAll();
    const usage = {
      total: 0,
      breakdown: {}
    };

    for (const [key, value] of Object.entries(allData)) {
      const size = JSON.stringify(value).length;
      usage.total += size;
      usage.breakdown[key] = size;
    }

    return usage;
  }

  static async cleanupStorage() {
    // Clear expired cache
    await this.clearExpiredCache();

    // Limit favorites to 50 items
    const favorites = await this.getFavorites();
    if (favorites.length > 50) {
      favorites.splice(50);
      await this.saveFavorites(favorites);
    }

    // Limit history to 100 items
    const history = await this.getHistory();
    if (history.length > 100) {
      history.splice(100);
      await this.saveHistory(history);
    }

    // Check total storage usage
    const usage = await this.getStorageUsage();
    if (usage.total > 5 * 1024 * 1024) { // 5MB limit
      // Clear oldest cache entries
      const cache = await this.getCache();
      const entries = Object.entries(cache);
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 25% of cache
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        delete cache[entries[i][0]];
      }
      
      await this.set('cache', cache);
    }
  }

  // Migration utilities
  static async migrateSettings() {
    const currentVersion = await this.get('version');
    const targetVersion = '1.0.0';

    if (currentVersion !== targetVersion) {
      // Migrate settings if needed
      const settings = await this.getSettings();
      
      // Add new default settings if they don't exist
      const defaultSettings = {
        apiKey: '',
        vpnPath: '',
        autoConnect: true,
        darkMode: false,
        cacheExpiry: 24 * 60 * 60 * 1000
      };

      const migratedSettings = { ...defaultSettings, ...settings };
      await this.saveSettings(migratedSettings);
      
      // Update version
      await this.set('version', targetVersion);
    }
  }

  // Backup and restore utilities
  static async exportData() {
    const data = await this.getAll();
    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        settings: data.settings,
        favorites: data.favorites,
        history: data.history
        // Exclude cache from export
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  static async importData(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.version !== '1.0.0') {
        throw new Error('Unsupported data format version');
      }

      // Import settings
      if (importData.data.settings) {
        await this.saveSettings(importData.data.settings);
      }

      // Import favorites
      if (importData.data.favorites) {
        await this.saveFavorites(importData.data.favorites);
      }

      // Import history
      if (importData.data.history) {
        await this.saveHistory(importData.data.history);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to import data: ${error.message}`);
    }
  }
}
