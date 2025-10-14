// Netflix API integration using uNoGS
class NetflixAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://unogs-unogs-v1.p.rapidapi.com';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  async searchTitles(query, type = 'movie,series', orderBy = 'relevance') {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    const cacheKey = `search_${query}_${type}_${orderBy}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const url = new URL(`${this.baseURL}/search/titles`);
      url.searchParams.append('query', query);
      url.searchParams.append('type', type);
      url.searchParams.append('order_by', orderBy);
      url.searchParams.append('limit', '50');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'unogs-unogs-v1.p.rapidapi.com',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const results = this.processSearchResults(data.results || []);
      
      this.setCachedData(cacheKey, results);
      return results;

    } catch (error) {
      console.error('Search API error:', error);
      throw new Error(`Failed to search titles: ${error.message}`);
    }
  }

  async getTitleDetails(netflixId) {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    const cacheKey = `details_${netflixId}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseURL}/search/titles/${netflixId}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'unogs-unogs-v1.p.rapidapi.com',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const result = this.processTitleDetails(data);
      
      this.setCachedData(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Title details API error:', error);
      throw new Error(`Failed to get title details: ${error.message}`);
    }
  }

  async getCountriesByTitle(netflixId) {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    const cacheKey = `countries_${netflixId}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseURL}/search/countries`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'unogs-unogs-v1.p.rapidapi.com',
          'Accept': 'application/json'
        },
        params: {
          netflixid: netflixId
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const countries = this.processCountriesData(data.results || []);
      
      this.setCachedData(cacheKey, countries);
      return countries;

    } catch (error) {
      console.error('Countries API error:', error);
      throw new Error(`Failed to get countries: ${error.message}`);
    }
  }

  async getPopularTitles(country = 'US', type = 'movie,series') {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    const cacheKey = `popular_${country}_${type}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const url = new URL(`${this.baseURL}/search/popular`);
      url.searchParams.append('country', country);
      url.searchParams.append('type', type);
      url.searchParams.append('limit', '20');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'unogs-unogs-v1.p.rapidapi.com',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const results = this.processSearchResults(data.results || []);
      
      this.setCachedData(cacheKey, results);
      return results;

    } catch (error) {
      console.error('Popular titles API error:', error);
      throw new Error(`Failed to get popular titles: ${error.message}`);
    }
  }

  processSearchResults(results) {
    return results.map(item => ({
      id: item.netflixid,
      title: item.title,
      year: item.year,
      type: item.type,
      poster: item.img,
      synopsis: item.synopsis,
      imdbRating: item.imdbrating,
      runtime: item.runtime,
      genre: item.genre,
      countries: this.parseCountryList(item.clist || ''),
      releaseDate: item.releasedate
    }));
  }

  processTitleDetails(data) {
    return {
      id: data.netflixid,
      title: data.title,
      year: data.year,
      type: data.type,
      poster: data.img,
      synopsis: data.synopsis,
      imdbRating: data.imdbrating,
      runtime: data.runtime,
      genre: data.genre,
      countries: this.parseCountryList(data.clist || ''),
      releaseDate: data.releasedate,
      directors: data.directors,
      cast: data.cast,
      rating: data.rating,
      seasons: data.seasons
    };
  }

  processCountriesData(countries) {
    return countries
      .filter(country => country.available === '1')
      .map(country => ({
        code: country.countrycode,
        name: this.getCountryName(country.countrycode),
        flag: this.getCountryFlag(country.countrycode),
        available: true
      }));
  }

  parseCountryList(clist) {
    if (!clist) return [];

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
      'se': { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
      'no': { code: 'NO', name: 'Norway', flag: '🇳🇴' },
      'dk': { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
      'fi': { code: 'FI', name: 'Finland', flag: '🇫🇮' },
      'pl': { code: 'PL', name: 'Poland', flag: '🇵🇱' },
      'cz': { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
      'hu': { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
      'ro': { code: 'RO', name: 'Romania', flag: '🇷🇴' },
      'bg': { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
      'hr': { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
      'si': { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
      'sk': { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
      'ee': { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
      'lv': { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
      'lt': { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
      'pt': { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
      'gr': { code: 'GR', name: 'Greece', flag: '🇬🇷' },
      'cy': { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
      'mt': { code: 'MT', name: 'Malta', flag: '🇲🇹' },
      'ie': { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
      'lu': { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
      'be': { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
      'at': { code: 'AT', name: 'Austria', flag: '🇦🇹' },
      'ch': { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
      'li': { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
      'is': { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
      'sg': { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
      'hk': { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
      'tw': { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
      'th': { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
      'my': { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
      'ph': { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
      'id': { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
      'vn': { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
      'nz': { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
      'za': { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
      'eg': { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
      'ng': { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
      'ke': { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
      'gh': { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
      'ma': { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
      'tn': { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
      'dz': { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
      'ly': { code: 'LY', name: 'Libya', flag: '🇱🇾' },
      'sd': { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
      'et': { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
      'ug': { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
      'tz': { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
      'zm': { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
      'zw': { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
      'bw': { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
      'na': { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
      'sz': { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
      'ls': { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
      'mw': { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
      'mz': { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
      'mg': { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
      'mu': { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
      'sc': { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
      'km': { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
      'dj': { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
      'so': { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
      'er': { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
      'ss': { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
      'cf': { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
      'td': { code: 'TD', name: 'Chad', flag: '🇹🇩' },
      'ne': { code: 'NE', name: 'Niger', flag: '🇳🇪' },
      'ml': { code: 'ML', name: 'Mali', flag: '🇲🇱' },
      'bf': { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
      'ci': { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
      'lr': { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
      'sl': { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
      'gn': { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
      'gw': { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
      'gm': { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
      'sn': { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
      'mr': { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
      'cv': { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
      'st': { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
      'ao': { code: 'AO', name: 'Angola', flag: '🇦🇴' },
      'cg': { code: 'CG', name: 'Republic of the Congo', flag: '🇨🇬' },
      'cd': { code: 'CD', name: 'Democratic Republic of the Congo', flag: '🇨🇩' },
      'ga': { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
      'gq': { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
      'cm': { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
      'bi': { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
      'rw': { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
      'ar': { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
      'bo': { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
      'cl': { code: 'CL', name: 'Chile', flag: '🇨🇱' },
      'co': { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
      'ec': { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
      'fk': { code: 'FK', name: 'Falkland Islands', flag: '🇫🇰' },
      'gf': { code: 'GF', name: 'French Guiana', flag: '🇬🇫' },
      'gy': { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
      'py': { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
      'pe': { code: 'PE', name: 'Peru', flag: '🇵🇪' },
      'sr': { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
      'uy': { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
      've': { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
      'bs': { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
      'bb': { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
      'bz': { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
      'cr': { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
      'cu': { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
      'dm': { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
      'do': { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
      'sv': { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
      'gd': { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
      'gt': { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
      'ht': { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
      'hn': { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
      'jm': { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
      'ni': { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
      'pa': { code: 'PA', name: 'Panama', flag: '🇵🇦' },
      'kn': { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
      'lc': { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
      'vc': { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
      'tt': { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
      'ag': { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
      'aw': { code: 'AW', name: 'Aruba', flag: '🇦🇼' },
      'ky': { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾' },
      'cw': { code: 'CW', name: 'Curaçao', flag: '🇨🇼' },
      'gp': { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
      'mq': { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
      'pr': { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
      'bl': { code: 'BL', name: 'Saint Barthélemy', flag: '🇧🇱' },
      'mf': { code: 'MF', name: 'Saint Martin', flag: '🇲🇫' },
      'sx': { code: 'SX', name: 'Sint Maarten', flag: '🇸🇽' },
      'tc': { code: 'TC', name: 'Turks and Caicos Islands', flag: '🇹🇨' },
      'vg': { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬' },
      'vi': { code: 'VI', name: 'U.S. Virgin Islands', flag: '🇻🇮' }
    };

    const availableCountries = [];
    for (const [code, country] of Object.entries(countryMap)) {
      if (clist.toLowerCase().includes(code)) {
        availableCountries.push(country);
      }
    }

    return availableCountries;
  }

  getCountryName(code) {
    const countryNames = {
      'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 
      'AU': 'Australia', 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan',
      'KR': 'South Korea', 'BR': 'Brazil', 'MX': 'Mexico', 'IN': 'India',
      'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands', 'SE': 'Sweden'
    };
    return countryNames[code] || code;
  }

  getCountryFlag(code) {
    const flags = {
      'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
      'FR': '🇫🇷', 'JP': '🇯🇵', 'KR': '🇰🇷', 'BR': '🇧🇷', 'MX': '🇲🇽',
      'IN': '🇮🇳', 'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱', 'SE': '🇸🇪'
    };
    return flags[code] || '🌍';
  }

  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}
