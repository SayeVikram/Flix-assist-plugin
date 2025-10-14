// VPN controller for Surfshark integration
class VPNController {
  constructor() {
    this.connectionStatus = 'unknown';
    this.currentCountry = null;
    this.isConnecting = false;
    this.nativePort = null;
  }

  async connectToCountry(countryCode) {
    if (this.isConnecting) {
      throw new Error('Already connecting to VPN');
    }

    this.isConnecting = true;

    try {
      // Try native messaging first
      const nativeResult = await this.connectViaNativeMessaging(countryCode);
      if (nativeResult.success) {
        this.connectionStatus = 'connected';
        this.currentCountry = countryCode;
        return true;
      }
    } catch (error) {
      console.warn('Native messaging failed, trying alternative method:', error);
    }

    try {
      // Fallback to Chrome extension message passing
      const result = await this.sendMessageToBackground({
        action: 'connectVPN',
        countryCode: countryCode
      });

      if (result.success) {
        this.connectionStatus = 'connected';
        this.currentCountry = countryCode;
        return true;
      } else {
        throw new Error(result.error || 'Failed to connect to VPN');
      }
    } catch (error) {
      console.error('VPN connection error:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect() {
    try {
      // Try native messaging first
      const nativeResult = await this.disconnectViaNativeMessaging();
      if (nativeResult.success) {
        this.connectionStatus = 'disconnected';
        this.currentCountry = null;
        return true;
      }
    } catch (error) {
      console.warn('Native messaging failed, trying alternative method:', error);
    }

    try {
      // Fallback to Chrome extension message passing
      const result = await this.sendMessageToBackground({
        action: 'disconnectVPN'
      });

      if (result.success) {
        this.connectionStatus = 'disconnected';
        this.currentCountry = null;
        return true;
      } else {
        throw new Error(result.error || 'Failed to disconnect VPN');
      }
    } catch (error) {
      console.error('VPN disconnection error:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      // Try native messaging first
      const nativeResult = await this.getStatusViaNativeMessaging();
      if (nativeResult.success) {
        this.connectionStatus = nativeResult.data.status;
        this.currentCountry = nativeResult.data.country;
        return this.connectionStatus;
      }
    } catch (error) {
      console.warn('Native messaging failed, trying alternative method:', error);
    }

    try {
      // Fallback to Chrome extension message passing
      const result = await this.sendMessageToBackground({
        action: 'getVPNStatus'
      });

      if (result.success) {
        this.connectionStatus = result.data.status;
        this.currentCountry = result.data.country;
        return this.connectionStatus;
      } else {
        throw new Error(result.error || 'Failed to get VPN status');
      }
    } catch (error) {
      console.error('VPN status error:', error);
      this.connectionStatus = 'unknown';
      return 'unknown';
    }
  }

  async connectViaNativeMessaging(countryCode) {
    return new Promise((resolve, reject) => {
      try {
        // Connect to native messaging host
        const port = chrome.runtime.connectNative('com.flixassist.vpn');
        this.nativePort = port;

        // Set up message handler
        port.onMessage.addListener((response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
          port.disconnect();
        });

        // Set up error handler
        port.onDisconnect.addListener(() => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          }
        });

        // Send connect command
        port.postMessage({
          action: 'connect',
          countryCode: countryCode
        });

        // Set timeout
        setTimeout(() => {
          port.disconnect();
          reject(new Error('Connection timeout'));
        }, 30000);

      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnectViaNativeMessaging() {
    return new Promise((resolve, reject) => {
      try {
        if (!this.nativePort) {
          reject(new Error('No active connection'));
          return;
        }

        // Set up message handler
        this.nativePort.onMessage.addListener((response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
          this.nativePort.disconnect();
        });

        // Send disconnect command
        this.nativePort.postMessage({
          action: 'disconnect'
        });

        // Set timeout
        setTimeout(() => {
          this.nativePort.disconnect();
          reject(new Error('Disconnection timeout'));
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  async getStatusViaNativeMessaging() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to native messaging host
        const port = chrome.runtime.connectNative('com.flixassist.vpn');

        // Set up message handler
        port.onMessage.addListener((response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error));
          }
          port.disconnect();
        });

        // Set up error handler
        port.onDisconnect.addListener(() => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          }
        });

        // Send status command
        port.postMessage({
          action: 'status'
        });

        // Set timeout
        setTimeout(() => {
          port.disconnect();
          reject(new Error('Status check timeout'));
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  async sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      });
    });
  }

  async testConnection() {
    try {
      const status = await this.getStatus();
      return {
        success: true,
        status: status,
        country: this.currentCountry
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility methods for country handling
  getCountryName(code) {
    const countries = {
      'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 
      'AU': 'Australia', 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan',
      'KR': 'South Korea', 'BR': 'Brazil', 'MX': 'Mexico', 'IN': 'India',
      'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands', 'SE': 'Sweden',
      'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'PL': 'Poland',
      'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'BG': 'Bulgaria',
      'HR': 'Croatia', 'SI': 'Slovenia', 'SK': 'Slovakia', 'EE': 'Estonia',
      'LV': 'Latvia', 'LT': 'Lithuania', 'PT': 'Portugal', 'GR': 'Greece',
      'CY': 'Cyprus', 'MT': 'Malta', 'IE': 'Ireland', 'LU': 'Luxembourg',
      'BE': 'Belgium', 'AT': 'Austria', 'CH': 'Switzerland', 'LI': 'Liechtenstein',
      'IS': 'Iceland', 'SG': 'Singapore', 'HK': 'Hong Kong', 'TW': 'Taiwan',
      'TH': 'Thailand', 'MY': 'Malaysia', 'PH': 'Philippines', 'ID': 'Indonesia',
      'VN': 'Vietnam', 'NZ': 'New Zealand', 'ZA': 'South Africa', 'EG': 'Egypt'
    };
    return countries[code] || code;
  }

  getCountryFlag(code) {
    const flags = {
      'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
      'FR': '🇫🇷', 'JP': '🇯🇵', 'KR': '🇰🇷', 'BR': '🇧🇷', 'MX': '🇲🇽',
      'IN': '🇮🇳', 'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱', 'SE': '🇸🇪',
      'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱', 'CZ': '🇨🇿',
      'HU': '🇭🇺', 'RO': '🇷🇴', 'BG': '🇧🇬', 'HR': '🇭🇷', 'SI': '🇸🇮',
      'SK': '🇸🇰', 'EE': '🇪🇪', 'LV': '🇱🇻', 'LT': '🇱🇹', 'PT': '🇵🇹',
      'GR': '🇬🇷', 'CY': '🇨🇾', 'MT': '🇲🇹', 'IE': '🇮🇪', 'LU': '🇱🇺',
      'BE': '🇧🇪', 'AT': '🇦🇹', 'CH': '🇨🇭', 'LI': '🇱🇮', 'IS': '🇮🇸',
      'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'TH': '🇹🇭', 'MY': '🇲🇾',
      'PH': '🇵🇭', 'ID': '🇮🇩', 'VN': '🇻🇳', 'NZ': '🇳🇿', 'ZA': '🇿🇦',
      'EG': '🇪🇬'
    };
    return flags[code] || '🌍';
  }

  // Get available countries from Surfshark
  async getAvailableCountries() {
    try {
      const result = await this.sendMessageToBackground({
        action: 'getAvailableCountries'
      });

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get available countries');
      }
    } catch (error) {
      console.error('Failed to get available countries:', error);
      // Return default list if API fails
      return [
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
        { code: 'SE', name: 'Sweden', flag: '🇸🇪' }
      ];
    }
  }

  // Cleanup method
  disconnect() {
    if (this.nativePort) {
      this.nativePort.disconnect();
      this.nativePort = null;
    }
  }
}
