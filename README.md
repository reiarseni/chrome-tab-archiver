# Chrome Tab Archiver

Chrome Tab Archiver is a Manifest V3 Chrome extension that enables users to backup and restore their open tabs using a JSON file. The extension saves the title and URL of each tab, making it easy to recover your session when needed.

## Features

- **Tab Backup:** Save all open tabs in the current window to a JSON file.
- **Tab Restore:** Reopen tabs from a compatible JSON file.
- **Intuitive Interface:** Responsive and visually appealing design suitable for both mobile and desktop devices.
- **Basic Validations:** Prevents backup when no tabs are open and validates the JSON file format during restore.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/reiarseni/chrome-tab-archiver.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** in the top-right corner.
4. Click on **Load unpacked** and select the project folder.

## Usage

1. Click the extension icon to open the interface.
2. **Backup:**  
   - Click the "Backup" button to save the current open tabs to a JSON file.
3. **Restore:**  
   - Click on "Restore" and select the previously saved JSON file to reopen the tabs.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request to improve the project.

## License

This project is licensed under the MIT License.
