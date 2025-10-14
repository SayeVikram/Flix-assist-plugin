// Background service worker for Chrome extension
class FlixAssistServiceWorker {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Handle messages from popup/content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle native messaging (VPN control)
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'vpn-control') {
        this.handleVPNConnection(port);
      }
    });
  }

  async handleInstallation(details) {
    if (details.reason === 'install') {
      // Set default settings
      const defaultSettings = {
        apiKey: '',
        vpnPath: '',
        autoConnect: true,
        darkMode: false,
        cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours
      };

      await chrome.storage.local.set({ settings: defaultSettings });
      
      // Open welcome page
      chrome.tabs.create({
        url: chrome.runtime.getURL('welcome.html')
      });
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'searchContent':
          const results = await this.searchContent(request.query, request.apiKey);
          sendResponse({ success: true, data: results });
          break;

        case 'getCountryAvailability':
          const countries = await this.getCountryAvailability(request.titleId, request.apiKey);
          sendResponse({ success: true, data: countries });
          break;

        case 'connectVPN':
          const vpnResult = await this.connectVPN(request.countryCode, request.vpnPath);
          sendResponse({ success: true, data: vpnResult });
          break;

        case 'getVPNStatus':
          const status = await this.getVPNStatus(request.vpnPath);
          sendResponse({ success: true, data: status });
          break;

        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ success: true, data: settings });
          break;

        case 'saveSettings':
          await this.saveSettings(request.settings);
          sendResponse({ success: true });
          break;

        case 'clearCache':
          await this.clearCache();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Service worker error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleVPNConnection(port) {
    port.onMessage.addListener(async (request) => {
      try {
        switch (request.action) {
          case 'connect':
            const result = await this.executeVPNCommand('connect', request.countryCode);
            port.postMessage({ success: true, data: result });
            break;

          case 'disconnect':
            const disconnectResult = await this.executeVPNCommand('disconnect');
            port.postMessage({ success: true, data: disconnectResult });
            break;

          case 'status':
            const status = await this.executeVPNCommand('status');
            port.postMessage({ success: true, data: status });
            break;
        }
      } catch (error) {
        port.postMessage({ success: false, error: error.message });
      }
    });
  }

  async searchContent(query, apiKey) {
    // Check cache first
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = await this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Make API request
    const response = await fetch('https://unogs-unogs-v1.p.rapidapi.com/search/titles', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'unogs-unogs-v1.p.rapidapi.com'
      },
      params: {
        query: query,
        order_by: 'relevance',
        type: 'movie,series'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Process and format results
    const results = this.processSearchResults(data.results || []);
    
    // Cache the results
    await this.setCachedData(cacheKey, results);
    
    return results;
  }

  async getCountryAvailability(titleId, apiKey) {
    const cacheKey = `countries_${titleId}`;
    const cached = await this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(`https://unogs-unogs-v1.p.rapidapi.com/search/countries`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'unogs-unogs-v1.p.rapidapi.com'
      },
      params: {
        netflixid: titleId
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Process country data
    const countries = this.processCountryData(data.results || []);
    
    // Cache the results
    await this.setCachedData(cacheKey, countries);
    
    return countries;
  }

  processSearchResults(results) {
    return results.map(item => ({
      id: item.netflixid,
      title: item.title,
      year: item.year,
      type: item.type,
      poster: item.img,
      synopsis: item.synopsis,
      countries: item.clist ? this.parseCountryList(item.clist) : []
    }));
  }

  processCountryData(countries) {
    return countries.map(country => ({
      code: country.countrycode,
      name: country.country,
      available: country.available === '1'
    })).filter(country => country.available);
  }

  parseCountryList(clist) {
    // Parse country list from API response
    // This is a simplified version - actual implementation depends on API format
    const countryMap = {
      'us': { code: 'US', name: 'United States', flag: '🇺🇸' },
      'gb': { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
      'ca': { code: 'CA', name: 'Canada', flag: '🇨🇦' },
      'au': { code: 'AU', name: 'Australia', flag: '🇦🇺' },
      'de': { code: 'DE', name: 'Germany', flag: '🇩🇪' },
      'fr': { code: 'FR', name: 'France', flag: '🇫🇷' },
      'jp': { code: 'JP', name: 'Japan', flag: '🇯🇵' },
      'kr': { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
      'br': { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
      'mx': { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
      'in': { code: 'IN', name: 'India', flag: '🇮🇳' },
      'es': { code: 'ES', name: 'Spain', flag: '🇪🇸' },
      'it': { code: 'IT', name: 'Italy', flag: '🇮🇹' },
      'nl': { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
      'se': { code: 'SE', name: 'Sweden', flag: '🇸🇪' }
    };

    // Parse the clist string and return available countries
    const availableCountries = [];
    for (const [code, country] of Object.entries(countryMap)) {
      if (clist.includes(code)) {
        availableCountries.push(country);
      }
    }

    return availableCountries;
  }

  async connectVPN(countryCode, vpnPath) {
    return await this.executeVPNCommand('connect', countryCode, vpnPath);
  }

  async getVPNStatus(vpnPath) {
    return await this.executeVPNCommand('status', null, vpnPath);
  }

  async executeVPNCommand(command, countryCode = null, vpnPath = null) {
    // This will be implemented through native messaging
    // For now, return a mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        switch (command) {
          case 'connect':
            resolve({ status: 'connected', country: countryCode });
            break;
          case 'disconnect':
            resolve({ status: 'disconnected' });
            break;
          case 'status':
            resolve({ status: 'connected', country: 'US' });
            break;
          default:
            resolve({ status: 'unknown' });
        }
      }, 1000);
    });
  }

  async getSettings() {
    const result = await chrome.storage.local.get(['settings']);
    return result.settings || {};
  }

  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  }

  async clearCache() {
    const keys = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(keys).filter(key => key.startsWith('cache_'));
    
    if (cacheKeys.length > 0) {
      await chrome.storage.local.remove(cacheKeys);
    }
  }

  async getCachedData(key) {
    const settings = await this.getSettings();
    const cacheKey = `cache_${key}`;
    const result = await chrome.storage.local.get([cacheKey]);
    
    if (result[cacheKey]) {
      const { data, timestamp } = result[cacheKey];
      const now = Date.now();
      const cacheExpiry = settings.cacheExpiry || (24 * 60 * 60 * 1000);
      
      if (now - timestamp < cacheExpiry) {
        return data;
      } else {
        // Remove expired cache
        await chrome.storage.local.remove([cacheKey]);
      }
    }
    
    return null;
  }

  async setCachedData(key, data) {
    const cacheKey = `cache_${key}`;
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    await chrome.storage.local.set({ [cacheKey]: cacheData });
  }
}

// Initialize the service worker
new FlixAssistServiceWorker();
