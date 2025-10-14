# Flix Assist Chrome Extension

A Chrome extension that helps you find Netflix content availability across different countries and automatically opens the Surfshark VPN extension to access region-locked content.

## Features

- 🔍 Search Netflix movies and TV shows
- 🌍 View availability across different countries
- 🔒 Auto-open Surfshark extension for region-locked content
- ⭐ Save favorites for quick access
- 📚 Search history tracking
- 🎨 Modern, responsive UI with dark mode support

## Prerequisites

Before using this extension, you'll need:

1. **uNoGS API Key** - Sign up at [RapidAPI](https://rapidapi.com/unogs/api/unogs-unogs-v1)
2. **Surfshark Chrome Extension** - Install from [Chrome Web Store](https://chrome.google.com/webstore/detail/surfshark-vpn-extension/ailoabdmgclmfmhdagmlohpjlbpffblp)
3. **Chrome Browser** - Version 88 or later

## Installation

### Development Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/flix-assist.git
   cd flix-assist
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the `flix-assist` directory

5. The extension should now appear in your extensions list

### Production Installation

1. Install from Chrome Web Store (coming soon)
2. Or download the packaged extension from releases

## Setup

### 1. Install Surfshark Extension

1. Visit the [Surfshark Chrome Extension](https://chrome.google.com/webstore/detail/surfshark-vpn-extension/ailoabdmgclmfmhdagmlohpjlbpffblp)
2. Click "Add to Chrome"
3. Log in with your Surfshark account

### 2. Configure API Key

1. Open the Flix Assist extension popup
2. Go to the "Settings" tab
3. Enter your uNoGS API key from RapidAPI
4. Click "Save Settings"

## Usage

### Searching Content

1. Click the extension icon in your browser toolbar
2. Enter a movie or TV show title in the search box
3. View results with country availability
4. Click on a country flag to open Surfshark extension for that region

### Using Favorites

1. After clicking on a country, it's automatically added to favorites
2. Go to the "Favorites" tab to see your saved content
3. Click on favorites for quick reconnection

### Viewing History

1. Go to the "History" tab to see your search history
2. Click on any previous search to repeat it

## How It Works

1. **Search**: Uses uNoGS API to find Netflix content and country availability
2. **Country Selection**: When you click a country, it opens the Surfshark extension
3. **VPN Connection**: You manually connect to the selected country in Surfshark
4. **Access Content**: Refresh Netflix to see content available in that region

## API Integration

This extension uses the uNoGS API to fetch Netflix content data:

- **Search Endpoint**: Find movies and TV shows by title
- **Countries Endpoint**: Get availability information
- **Popular Endpoint**: Browse popular content by country

## VPN Integration

The extension integrates with the Surfshark Chrome extension by:

- **Detection**: Checking if Surfshark extension is installed
- **Opening**: Automatically opening the Surfshark extension popup
- **Guidance**: Providing instructions to connect to specific countries
- **Status**: Monitoring extension availability

## Development

### Project Structure

```
flix-assist/
├── manifest.json              # Extension manifest
├── popup/                     # Popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/                # Background scripts
│   └── service-worker.js
├── content/                   # Content scripts
│   └── content.js
├── utils/                     # Utility modules
│   ├── api.js                # uNoGS API integration
│   ├── vpn.js                # Surfshark extension integration
│   └── storage.js            # Chrome storage utilities
├── assets/                    # Static assets
│   └── icons/
├── config.js                 # Configuration
└── README.md
```

### Building

1. Install dependencies (if any):
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

### Testing

1. Load the extension in Chrome developer mode
2. Install the Surfshark Chrome extension
3. Test API integration with valid API key
4. Test Surfshark extension integration
5. Verify all UI interactions work correctly

## Troubleshooting

### Common Issues

**Extension not loading:**
- Check that all files are present
- Verify manifest.json syntax
- Check Chrome developer console for errors

**API errors:**
- Verify your RapidAPI key is correct
- Check your API subscription is active
- Ensure you haven't exceeded rate limits

**Surfshark extension not found:**
- Install the Surfshark Chrome extension
- Make sure it's enabled in Chrome extensions
- Check that you're logged into your Surfshark account

**Icons not showing:**
- Replace placeholder icon files in `assets/icons/`
- Ensure all required icon sizes are present

### Debug Mode

Enable debug mode in `config.js`:
```javascript
DEV: {
  DEBUG: true,
  MOCK_API: false,
  MOCK_VPN: false,
  LOG_LEVEL: 'debug'
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This extension is for educational and personal use only. Users are responsible for complying with Netflix's Terms of Service and applicable laws in their jurisdiction.

## Support

- Create an issue on GitHub for bug reports
- Check the troubleshooting section first
- Provide detailed information about your setup

## Roadmap

- [ ] Chrome Web Store publication
- [ ] Enhanced content recommendations
- [ ] Mobile app companion
- [ ] Advanced filtering options
- [ ] User reviews and ratings integration
- [ ] Support for other VPN providers
