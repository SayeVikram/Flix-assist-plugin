// VPN controller for Surfshark Chrome extension integration
class VPNController {
  constructor() {
    this.connectionStatus = 'unknown';
    this.currentCountry = null;
    this.isConnecting = false;
    this.surfsharkExtensionId = 'ailoabdmgclmfmhdagmlohpjlbpffblp'; // Surfshark extension ID
  }

  async connectToCountry(countryCode) {
    if (this.isConnecting) {
      throw new Error('Already connecting to VPN');
    }

    this.isConnecting = true;

    try {
      // Check if Surfshark extension is installed and enabled
      const isInstalled = await this.checkSurfsharkExtension();
      if (!isInstalled) {
        throw new Error('Surfshark Chrome extension is not installed. Please install it from the Chrome Web Store.');
      }

      // Open Surfshark extension and guide user to connect
      const result = await this.guideUserToConnect(countryCode);
      
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
      // Check if Surfshark extension is installed
      const isInstalled = await this.checkSurfsharkExtension();
      if (!isInstalled) {
        throw new Error('Surfshark Chrome extension is not installed');
      }

      // Guide user to disconnect via Surfshark extension
      const result = await this.guideUserToDisconnect();
      
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
      // Check if Surfshark extension is installed
      const isInstalled = await this.checkSurfsharkExtension();
      if (!isInstalled) {
        this.connectionStatus = 'not_installed';
        return 'not_installed';
      }

      // For now, we'll assume connected if extension is installed
      // In a real implementation, you might poll the extension's state
      this.connectionStatus = 'connected';
      return 'connected';
    } catch (error) {
      console.error('VPN status error:', error);
      this.connectionStatus = 'unknown';
      return 'unknown';
    }
  }

  async checkSurfsharkExtension() {
    try {
      // Try multiple possible Surfshark extension IDs
      const possibleIds = [
        'ailoabdmgclmfmhdagmlohpjlbpffblp', // Official Surfshark extension ID
        'ailoabdmgclmfmhdagmlohpjlbpffblp', // Alternative ID
      ];

      // Also search by name in case the ID is different
      const allExtensions = await chrome.management.getAll();
      const surfsharkExtensions = allExtensions.filter(ext => 
        ext.name.toLowerCase().includes('surfshark') && ext.enabled
      );

      if (surfsharkExtensions.length > 0) {
        // Use the first found Surfshark extension
        this.surfsharkExtensionId = surfsharkExtensions[0].id;
        console.log('Found Surfshark extension:', surfsharkExtensions[0]);
        return true;
      }

      // Fallback: try the known ID
      try {
        const extension = await chrome.management.get(this.surfsharkExtensionId);
        return extension && extension.enabled;
      } catch (idError) {
        console.log('Known Surfshark ID not found, checking all extensions...');
        
        // Debug: log all installed extensions
        console.log('All installed extensions:');
        allExtensions.forEach(ext => {
          console.log(`- ${ext.name} (${ext.id}): ${ext.enabled ? 'enabled' : 'disabled'}`);
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error checking Surfshark extension:', error);
      return false;
    }
  }

  async guideUserToConnect(countryCode) {
    try {
      // Try to open Surfshark extension popup
      try {
        await chrome.management.launchApp(this.surfsharkExtensionId);
      } catch (launchError) {
        console.warn('Could not launch Surfshark extension:', launchError);
        // Fallback: provide manual instructions
      }
      
      // Show instructions to user
      const countryName = this.getCountryName(countryCode);
      const message = `Please open your Surfshark extension and connect to ${countryName}. Look for servers in ${countryName} and click connect.`;
      
      // Show notification
      this.showNotification(message, 'info');
      
      return { success: true, message };
    } catch (error) {
      console.error('Error guiding user to connect:', error);
      return { success: false, error: error.message };
    }
  }

  async guideUserToDisconnect() {
    try {
      // Open Surfshark extension popup
      await chrome.management.launchApp(this.surfsharkExtensionId);
      
      // Show instructions to user
      const message = 'Please disconnect from VPN in the Surfshark extension that just opened. Click the disconnect button.';
      
      // Show notification
      this.showNotification(message, 'info');
      
      return { success: true, message };
    } catch (error) {
      console.error('Error guiding user to disconnect:', error);
      return { success: false, error: error.message };
    }
  }

  showNotification(message, type = 'info') {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `flix-assist-vpn-notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      max-width: 300px;
      animation: slideInRight 0.3s ease;
    `;

    // Add CSS animation if not already added
    if (!document.getElementById('flix-assist-vpn-styles')) {
      const style = document.createElement('style');
      style.id = 'flix-assist-vpn-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
          if (notification && notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
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
