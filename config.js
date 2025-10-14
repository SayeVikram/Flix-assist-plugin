// Configuration file for Flix Assist Chrome Extension

const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: 'https://unogs-unogs-v1.p.rapidapi.com',
    HOST: 'unogs-unogs-v1.p.rapidapi.com',
    ENDPOINTS: {
      SEARCH: '/search/titles',
      DETAILS: '/search/titles/{id}',
      COUNTRIES: '/search/countries',
      POPULAR: '/search/popular'
    },
    RATE_LIMIT: {
      REQUESTS_PER_MINUTE: 60,
      REQUESTS_PER_DAY: 1000
    }
  },

  // VPN Configuration
  VPN: {
    NATIVE_MESSAGING_HOST: 'com.flixassist.vpn',
    COMMANDS: {
      CONNECT: 'surfshark-vpn attack --country-code',
      DISCONNECT: 'surfshark-vpn down',
      STATUS: 'surfshark-vpn status'
    },
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
  },

  // Storage Configuration
  STORAGE: {
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    MAX_FAVORITES: 50,
    MAX_HISTORY: 100,
    MAX_CACHE_SIZE: 5 * 1024 * 1024, // 5MB
    CLEANUP_INTERVAL: 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  // UI Configuration
  UI: {
    POPUP: {
      WIDTH: 380,
      MIN_HEIGHT: 500,
      MAX_HEIGHT: 600
    },
    SEARCH: {
      MIN_QUERY_LENGTH: 2,
      MAX_RESULTS: 50,
      DEBOUNCE_DELAY: 300
    },
    ANIMATIONS: {
      DURATION: 300,
      EASING: 'ease-in-out'
    }
  },

  // Country Configuration
  COUNTRIES: {
    SUPPORTED: [
      { code: 'US', name: 'United States', flag: '🇺🇸' },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
      { code: 'CA', name: 'Canada', flag: '🇨🇦' },
      { code: 'AU', name: 'Australia', flag: '🇦🇺' },
      { code: 'DE', name: 'Germany', flag: '🇩🇪' },
      { code: 'FR', name: 'France', flag: '🇫🇷' },
      { code: 'JP', name: 'Japan', flag: '🇯🇵' },
      { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
      { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
      { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
      { code: 'IN', name: 'India', flag: '🇮🇳' },
      { code: 'ES', name: 'Spain', flag: '🇪🇸' },
      { code: 'IT', name: 'Italy', flag: '🇮🇹' },
      { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
      { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
      { code: 'NO', name: 'Norway', flag: '🇳🇴' },
      { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
      { code: 'FI', name: 'Finland', flag: '🇫🇮' },
      { code: 'PL', name: 'Poland', flag: '🇵🇱' },
      { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
      { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
      { code: 'RO', name: 'Romania', flag: '🇷🇴' },
      { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
      { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
      { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
      { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
      { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
      { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
      { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
      { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
      { code: 'GR', name: 'Greece', flag: '🇬🇷' },
      { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
      { code: 'MT', name: 'Malta', flag: '🇲🇹' },
      { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
      { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
      { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
      { code: 'AT', name: 'Austria', flag: '🇦🇹' },
      { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
      { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
      { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
      { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
      { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
      { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
      { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
      { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
      { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
      { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
      { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
      { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
      { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
      { code: 'EG', name: 'Egypt', flag: '🇪🇬' }
    ],
    DEFAULT: 'US'
  },

  // Error Messages
  ERRORS: {
    API_KEY_MISSING: 'API key is required. Please configure it in Settings.',
    API_KEY_INVALID: 'Invalid API key. Please check your RapidAPI subscription.',
    API_RATE_LIMIT: 'API rate limit exceeded. Please try again later.',
    API_ERROR: 'API request failed. Please try again.',
    VPN_NOT_INSTALLED: 'Surfshark VPN is not installed or not accessible.',
    VPN_CONNECTION_FAILED: 'Failed to connect to VPN. Please check your connection.',
    VPN_DISCONNECTION_FAILED: 'Failed to disconnect from VPN.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    STORAGE_ERROR: 'Failed to save data. Please try again.',
    UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
  },

  // Success Messages
  SUCCESS: {
    VPN_CONNECTED: 'Successfully connected to VPN!',
    VPN_DISCONNECTED: 'Successfully disconnected from VPN.',
    SETTINGS_SAVED: 'Settings saved successfully!',
    FAVORITE_ADDED: 'Added to favorites!',
    FAVORITE_REMOVED: 'Removed from favorites!',
    CACHE_CLEARED: 'Cache cleared successfully!'
  },

  // URLs
  URLS: {
    RAPIDAPI: 'https://rapidapi.com/unogs/api/unogs-unogs-v1',
    SURFSHARK: 'https://surfshark.com',
    GITHUB: 'https://github.com/your-username/flix-assist',
    SUPPORT: 'https://github.com/your-username/flix-assist/issues'
  },

  // Development Configuration
  DEV: {
    DEBUG: false,
    MOCK_API: false,
    MOCK_VPN: false,
    LOG_LEVEL: 'info' // debug, info, warn, error
  }
};

// Utility functions
const ConfigUtils = {
  getCountryByCode(code) {
    return CONFIG.COUNTRIES.SUPPORTED.find(country => country.code === code);
  },

  getCountryName(code) {
    const country = this.getCountryByCode(code);
    return country ? country.name : code;
  },

  getCountryFlag(code) {
    const country = this.getCountryByCode(code);
    return country ? country.flag : '🌍';
  },

  isCountrySupported(code) {
    return CONFIG.COUNTRIES.SUPPORTED.some(country => country.code === code);
  },

  getApiEndpoint(endpoint, params = {}) {
    let url = CONFIG.API.ENDPOINTS[endpoint];
    if (!url) {
      throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    // Replace path parameters
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`{${key}}`, value);
    }

    return CONFIG.API.BASE_URL + url;
  },

  getErrorMessage(errorType) {
    return CONFIG.ERRORS[errorType] || CONFIG.ERRORS.UNKNOWN_ERROR;
  },

  getSuccessMessage(successType) {
    return CONFIG.SUCCESS[successType] || 'Operation completed successfully!';
  },

  isDebugMode() {
    return CONFIG.DEV.DEBUG;
  },

  log(level, message, data = null) {
    if (!this.isDebugMode() && level === 'debug') {
      return;
    }

    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(CONFIG.DEV.LOG_LEVEL);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex >= currentLevelIndex) {
      console[level](`[FlixAssist] ${message}`, data || '');
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, ConfigUtils };
}
