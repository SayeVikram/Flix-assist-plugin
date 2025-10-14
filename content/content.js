// Content script for Flix Assist Chrome Extension
// This script runs in the context of web pages and can interact with Netflix

class FlixAssistContentScript {
  constructor() {
    this.isNetflixPage = this.detectNetflixPage();
    this.initialized = false;
    
    if (this.isNetflixPage) {
      this.init();
    }
  }

  detectNetflixPage() {
    const hostname = window.location.hostname.toLowerCase();
    return hostname.includes('netflix.com');
  }

  init() {
    if (this.initialized) return;
    
    this.initialized = true;
    this.setupEventListeners();
    this.injectNetflixEnhancements();
  }

  setupEventListeners() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Listen for page navigation (Netflix is a SPA)
    this.observeNavigation();
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getCurrentContent':
          const content = await this.getCurrentContent();
          sendResponse({ success: true, data: content });
          break;

        case 'highlightAvailableCountries':
          await this.highlightAvailableCountries(request.countries);
          sendResponse({ success: true });
          break;

        case 'showCountryIndicator':
          await this.showCountryIndicator(request.country);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  observeNavigation() {
    // Netflix uses a single-page application, so we need to observe URL changes
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.onPageChange();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      this.onPageChange();
    });
  }

  onPageChange() {
    // Remove any existing enhancements
    this.removeNetflixEnhancements();
    
    // Wait a bit for the page to load, then re-inject
    setTimeout(() => {
      this.injectNetflixEnhancements();
    }, 1000);
  }

  injectNetflixEnhancements() {
    if (!this.isNetflixPage) return;

    // Add extension indicator to Netflix interface
    this.addExtensionIndicator();
    
    // Add quick access buttons to movie/show cards
    this.addQuickAccessButtons();
  }

  removeNetflixEnhancements() {
    // Remove extension indicator
    const indicator = document.getElementById('flix-assist-indicator');
    if (indicator) {
      indicator.remove();
    }

    // Remove quick access buttons
    const buttons = document.querySelectorAll('.flix-assist-quick-btn');
    buttons.forEach(button => button.remove());
  }

  addExtensionIndicator() {
    // Don't add if already exists
    if (document.getElementById('flix-assist-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'flix-assist-indicator';
    indicator.innerHTML = `
      <div class="flix-assist-indicator-content">
        <span class="flix-assist-logo">🎬</span>
        <span class="flix-assist-text">Flix Assist Active</span>
      </div>
    `;

    // Style the indicator
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(229, 9, 20, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      z-index: 9999;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;

    indicator.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });

    document.body.appendChild(indicator);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (indicator && indicator.parentNode) {
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator && indicator.parentNode) {
            indicator.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  addQuickAccessButtons() {
    // Find movie/show cards on Netflix
    const cards = document.querySelectorAll('[data-uia="title-card"]');
    
    cards.forEach((card, index) => {
      // Don't add button if already exists
      if (card.querySelector('.flix-assist-quick-btn')) return;

      const button = document.createElement('button');
      button.className = 'flix-assist-quick-btn';
      button.innerHTML = '🌍';
      button.title = 'Check availability in other countries';
      
      // Style the button
      button.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.7);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        color: white;
        font-size: 16px;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(229, 9, 20, 0.9)';
        button.style.transform = 'scale(1.1)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(0,0,0,0.7)';
        button.style.transform = 'scale(1)';
      });

      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.handleQuickAccess(card, button);
      });

      // Make card position relative if it isn't already
      if (getComputedStyle(card).position === 'static') {
        card.style.position = 'relative';
      }

      card.appendChild(button);
    });
  }

  async handleQuickAccess(card, button) {
    try {
      // Show loading state
      button.innerHTML = '⏳';
      button.disabled = true;

      // Try to extract title information from the card
      const titleElement = card.querySelector('[data-uia="title-card-title"]') || 
                          card.querySelector('.title-card-title') ||
                          card.querySelector('h3') ||
                          card.querySelector('.bob-title');

      if (!titleElement) {
        throw new Error('Could not find title information');
      }

      const title = titleElement.textContent.trim();
      
      // Send message to background script to search for this title
      const response = await this.sendMessageToBackground({
        action: 'searchContent',
        query: title
      });

      if (response.success && response.data.length > 0) {
        const result = response.data[0];
        this.showCountryModal(result);
      } else {
        this.showError('Title not found in database');
      }

    } catch (error) {
      console.error('Quick access error:', error);
      this.showError('Failed to check availability');
    } finally {
      // Reset button
      button.innerHTML = '🌍';
      button.disabled = false;
    }
  }

  showCountryModal(result) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'flix-assist-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'flix-assist-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    `;

    modal.innerHTML = `
      <div class="flix-assist-modal-header">
        <h3 style="margin: 0 0 16px 0; color: #333;">${result.title}</h3>
        <button class="flix-assist-close-btn" style="
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        ">&times;</button>
      </div>
      
      <div class="flix-assist-modal-body">
        ${result.poster ? `
          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <img src="${result.poster}" alt="${result.title}" style="
              width: 80px;
              height: 120px;
              object-fit: cover;
              border-radius: 4px;
            ">
            <div>
              <p style="margin: 0 0 8px 0; color: #666;">${result.year || 'N/A'}</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.4; color: #333;">
                ${result.synopsis || 'No description available.'}
              </p>
            </div>
          </div>
        ` : ''}
        
        <div class="flix-assist-countries">
          <h4 style="margin: 0 0 12px 0; color: #333;">Available in:</h4>
          <div class="flix-assist-country-list" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
          ">
            ${result.countries.map(country => `
              <button class="flix-assist-country-btn" data-country="${country.code}" style="
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: #f8f9fa;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
              ">
                <span>${country.flag}</span>
                <span>${country.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = modal.querySelector('.flix-assist-close-btn');
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Add country button event listeners
    const countryBtns = modal.querySelectorAll('.flix-assist-country-btn');
    countryBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const countryCode = e.currentTarget.dataset.country;
        await this.connectToCountry(countryCode, result.title);
      });

      btn.addEventListener('mouseenter', (e) => {
        e.currentTarget.style.background = '#e50914';
        e.currentTarget.style.color = 'white';
        e.currentTarget.style.borderColor = '#e50914';
      });

      btn.addEventListener('mouseleave', (e) => {
        e.currentTarget.style.background = '#f8f9fa';
        e.currentTarget.style.color = '#333';
        e.currentTarget.style.borderColor = '#e0e0e0';
      });
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  async connectToCountry(countryCode, title) {
    try {
      // Send message to background script to connect VPN
      const response = await this.sendMessageToBackground({
        action: 'connectVPN',
        countryCode: countryCode
      });

      if (response.success) {
        this.showSuccess(`Connected to ${this.getCountryName(countryCode)}!`);
      } else {
        throw new Error(response.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('VPN connection error:', error);
      this.showError('Failed to connect to VPN');
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `flix-assist-notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideDown 0.3s ease;
    `;

    // Add CSS animation
    if (!document.getElementById('flix-assist-styles')) {
      const style = document.createElement('style');
      style.id = 'flix-assist-styles';
      style.textContent = `
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => {
          if (notification && notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  async getCurrentContent() {
    // Try to extract current content information from Netflix page
    const titleElement = document.querySelector('[data-uia="hero-title"]') ||
                        document.querySelector('.hero-title') ||
                        document.querySelector('.title-card-title');
    
    if (!titleElement) {
      return null;
    }

    return {
      title: titleElement.textContent.trim(),
      url: window.location.href,
      timestamp: Date.now()
    };
  }

  async highlightAvailableCountries(countries) {
    // This could highlight available countries on the current page
    // Implementation depends on Netflix's current DOM structure
    console.log('Highlighting countries:', countries);
  }

  async showCountryIndicator(country) {
    // Show which country the user is currently connected to
    console.log('Showing country indicator:', country);
  }

  async sendMessageToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response || { success: false, error: 'No response' });
      });
    });
  }

  getCountryName(code) {
    const countries = {
      'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 
      'AU': 'Australia', 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan',
      'KR': 'South Korea', 'BR': 'Brazil', 'MX': 'Mexico', 'IN': 'India',
      'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands', 'SE': 'Sweden'
    };
    return countries[code] || code;
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FlixAssistContentScript();
  });
} else {
  new FlixAssistContentScript();
}
