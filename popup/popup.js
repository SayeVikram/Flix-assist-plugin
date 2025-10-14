// Main popup script
class FlixAssistPopup {
  constructor() {
    this.currentTab = 'search';
    this.searchResults = [];
    this.favorites = [];
    this.history = [];
    this.settings = {};
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadFavorites();
    await this.loadHistory();
    
    this.setupEventListeners();
    this.updateUI();
    this.checkVPNStatus();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });
    
    searchBtn.addEventListener('click', () => {
      this.performSearch();
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Settings
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('testConnection').addEventListener('click', () => {
      this.testVPNConnection();
    });

    // Theme toggle
    document.getElementById('darkMode').addEventListener('change', (e) => {
      this.toggleDarkMode(e.target.checked);
    });
  }

  async performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
      this.showToast('Please enter a search term', 'warning');
      return;
    }

    if (!this.settings.apiKey) {
      this.showToast('Please configure your API key in Settings', 'error');
      this.switchTab('settings');
      return;
    }

    this.showLoading(true);
    
    try {
      const results = await this.searchContent(query);
      this.searchResults = results;
      this.addToHistory(query);
      this.displayResults(results);
    } catch (error) {
      console.error('Search error:', error);
      this.showToast('Search failed. Please try again.', 'error');
      this.showNoResults();
    } finally {
      this.showLoading(false);
    }
  }

  async searchContent(query) {
    // This will be implemented in the API utility
    const api = new NetflixAPI(this.settings.apiKey);
    return await api.searchTitles(query);
  }

  displayResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    
    if (results.length === 0) {
      this.showNoResults();
      return;
    }

    noResults.style.display = 'none';
    resultsContainer.innerHTML = '';

    results.forEach(result => {
      const resultElement = this.createResultElement(result);
      resultsContainer.appendChild(resultElement);
    });
  }

  createResultElement(result) {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    div.innerHTML = `
      <div class="result-header">
        <img src="${result.poster || 'assets/icons/no-poster.png'}" 
             alt="${result.title}" 
             class="result-poster"
             onerror="this.src='assets/icons/no-poster.png'">
        <div class="result-info">
          <h3>${result.title}</h3>
          <div class="year">${result.year || 'N/A'}</div>
          <div class="synopsis">${result.synopsis || 'No description available.'}</div>
        </div>
      </div>
      <div class="countries-section">
        <div class="countries-title">Available in:</div>
        <div class="countries-list">
          ${result.countries.map(country => 
            `<button class="country-btn" data-country="${country.code}" data-title="${result.title}">
              <span>${country.flag}</span>
              <span>${country.name}</span>
            </button>`
          ).join('')}
        </div>
      </div>
    `;

    // Add event listeners to country buttons
    div.querySelectorAll('.country-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const countryCode = e.currentTarget.dataset.country;
        const title = e.currentTarget.dataset.title;
        this.connectToCountry(countryCode, title);
      });
    });

    return div;
  }

  async connectToCountry(countryCode, title) {
    const btn = document.querySelector(`[data-country="${countryCode}"]`);
    
    if (btn.classList.contains('connecting')) {
      return;
    }

    btn.classList.add('connecting');
    btn.innerHTML = '<span>⏳</span><span>Opening Surfshark...</span>';

    try {
      const vpn = new VPNController();
      const success = await vpn.connectToCountry(countryCode);
      
      if (success) {
        this.showToast(`Surfshark extension opened! Please connect to ${this.getCountryName(countryCode)}.`, 'success');
        this.updateVPNStatus(true);
        this.addToFavorites(title, countryCode);
      } else {
        throw new Error('Failed to open Surfshark extension');
      }
    } catch (error) {
      console.error('VPN connection error:', error);
      this.showToast(error.message || 'Failed to connect to VPN', 'error');
    } finally {
      btn.classList.remove('connecting');
      btn.innerHTML = `
        <span>${this.getCountryFlag(countryCode)}</span>
        <span>${this.getCountryName(countryCode)}</span>
      `;
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });

    this.currentTab = tabName;
    
    // Load tab-specific content
    switch (tabName) {
      case 'favorites':
        this.displayFavorites();
        break;
      case 'history':
        this.displayHistory();
        break;
      case 'settings':
        this.loadSettingsForm();
        break;
    }
  }

  displayFavorites() {
    const container = document.getElementById('favoritesList');
    const emptyState = document.getElementById('emptyFavorites');
    
    if (this.favorites.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'block';
    container.innerHTML = '';

    this.favorites.forEach(fav => {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.innerHTML = `
        <div class="result-header">
          <img src="${fav.poster || 'assets/icons/no-poster.png'}" 
               alt="${fav.title}" 
               class="result-poster"
               onerror="this.src='assets/icons/no-poster.png'">
          <div class="result-info">
            <h3>${fav.title}</h3>
            <div class="year">${fav.year || 'N/A'}</div>
          </div>
        </div>
        <div class="countries-section">
          <div class="countries-title">Quick Connect:</div>
          <div class="countries-list">
            <button class="country-btn" data-country="${fav.countryCode}" data-title="${fav.title}">
              <span>${this.getCountryFlag(fav.countryCode)}</span>
              <span>${this.getCountryName(fav.countryCode)}</span>
            </button>
          </div>
        </div>
      `;

      // Add event listener
      div.querySelector('.country-btn').addEventListener('click', (e) => {
        const countryCode = e.currentTarget.dataset.country;
        const title = e.currentTarget.dataset.title;
        this.connectToCountry(countryCode, title);
      });

      container.appendChild(div);
    });
  }

  displayHistory() {
    const container = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyHistory');
    
    if (this.history.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'block';
    container.innerHTML = '';

    this.history.slice(0, 20).forEach(item => {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.innerHTML = `
        <div class="result-info">
          <h3>${item.query}</h3>
          <div class="year">${new Date(item.timestamp).toLocaleDateString()}</div>
        </div>
      `;

      div.addEventListener('click', () => {
        document.getElementById('searchInput').value = item.query;
        this.switchTab('search');
        this.performSearch();
      });

      container.appendChild(div);
    });
  }

  async loadSettingsForm() {
    document.getElementById('apiKey').value = this.settings.apiKey || '';
    document.getElementById('autoConnect').checked = this.settings.autoConnect || false;
    document.getElementById('darkMode').checked = this.settings.darkMode || false;
    
    // Check Surfshark extension status
    await this.checkSurfsharkExtensionStatus();
  }

  async saveSettings() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const autoConnect = document.getElementById('autoConnect').checked;
    const darkMode = document.getElementById('darkMode').checked;

    this.settings = {
      ...this.settings,
      apiKey,
      autoConnect,
      darkMode
    };

    await this.saveSettingsToStorage();
    this.toggleDarkMode(darkMode);
    this.showToast('Settings saved successfully!', 'success');
  }

  async testVPNConnection() {
    try {
      const vpn = new VPNController();
      const status = await vpn.getStatus();
      this.showToast(`VPN Status: ${status}`, status === 'connected' ? 'success' : 'warning');
    } catch (error) {
      this.showToast('Failed to connect to VPN service', 'error');
    }
  }

  async checkSurfsharkExtensionStatus() {
    try {
      const vpn = new VPNController();
      const isInstalled = await vpn.checkSurfsharkExtension();
      
      const statusElement = document.getElementById('surfsharkStatus');
      const statusDot = statusElement.querySelector('.status-dot');
      const statusText = statusElement.querySelector('.status-text');
      
      if (isInstalled) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Surfshark extension installed';
      } else {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Surfshark extension not found';
      }
    } catch (error) {
      console.error('Error checking Surfshark extension:', error);
      const statusElement = document.getElementById('surfsharkStatus');
      const statusDot = statusElement.querySelector('.status-dot');
      const statusText = statusElement.querySelector('.status-text');
      
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = 'Error checking extension';
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    const results = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    
    loading.style.display = show ? 'flex' : 'none';
    results.style.display = show ? 'none' : 'block';
    noResults.style.display = 'none';
  }

  showNoResults() {
    const noResults = document.getElementById('noResults');
    const results = document.getElementById('searchResults');
    
    noResults.style.display = 'block';
    results.style.display = 'none';
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  toggleDarkMode(enabled) {
    document.body.classList.toggle('dark', enabled);
  }

  async checkVPNStatus() {
    try {
      const vpn = new VPNController();
      const status = await vpn.getStatus();
      this.updateVPNStatus(status === 'connected');
    } catch (error) {
      this.updateVPNStatus(false);
    }
  }

  updateVPNStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
    statusText.textContent = connected ? 'Connected' : 'Disconnected';
  }

  // Utility methods
  getCountryFlag(code) {
    // Simple flag emoji mapping - in production, use a proper flag library
    const flags = {
      'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
      'FR': '🇫🇷', 'JP': '🇯🇵', 'KR': '🇰🇷', 'BR': '🇧🇷', 'MX': '🇲🇽',
      'IN': '🇮🇳', 'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱', 'SE': '🇸🇪'
    };
    return flags[code] || '🌍';
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

  // Storage methods
  async loadSettings() {
    this.settings = await StorageManager.get('settings') || {};
  }

  async saveSettingsToStorage() {
    await StorageManager.set('settings', this.settings);
  }

  async loadFavorites() {
    this.favorites = await StorageManager.get('favorites') || [];
  }

  async saveFavorites() {
    await StorageManager.set('favorites', this.favorites);
  }

  async loadHistory() {
    this.history = await StorageManager.get('history') || [];
  }

  async saveHistory() {
    await StorageManager.set('history', this.history);
  }

  async addToHistory(query) {
    const historyItem = {
      query,
      timestamp: Date.now()
    };
    
    this.history.unshift(historyItem);
    this.history = this.history.slice(0, 50); // Keep last 50 searches
    await this.saveHistory();
  }

  async addToFavorites(title, countryCode) {
    const favorite = {
      title,
      countryCode,
      timestamp: Date.now()
    };
    
    // Check if already exists
    const exists = this.favorites.find(fav => 
      fav.title === title && fav.countryCode === countryCode
    );
    
    if (!exists) {
      this.favorites.unshift(favorite);
      this.favorites = this.favorites.slice(0, 20); // Keep last 20 favorites
      await this.saveFavorites();
    }
  }

  updateUI() {
    // Initialize UI based on loaded data
    this.toggleDarkMode(this.settings.darkMode || false);
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FlixAssistPopup();
});
