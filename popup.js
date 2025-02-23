/**
 * Class that handles the backup and restore logic for tabs.
 */
class TabManager {
  constructor() {
    this.backupBtn = document.getElementById('backupBtn');
    this.fileInput = document.getElementById('fileInput');
    this.addEventListeners();
  }
  
  /**
   * Registers click and change events for the buttons.
   */
  addEventListeners() {
    this.backupBtn.addEventListener('click', () => this.backupTabs());
    this.fileInput.addEventListener('change', (event) => this.restoreTabs(event));
  }
  
  /**
   * Backs up the currently open tabs:
   *  - Queries all tabs in the current window.
   *  - Builds a JSON object with each tab's title and URL.
   *  - Generates a Blob and triggers the JSON file download.
   */
  async backupTabs() {
    // Query the open tabs in the current window
    chrome.tabs.query({currentWindow: true}, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        alert(chrome.i18n.getMessage("noTabsBackup"));
        return;
      }
      
      // Build backup object with tab information
      const backupData = {
        tabs: tabs.map(tab => ({
          title: tab.title,
          url: tab.url
        }))
      };
      
      // Convert the object to a formatted JSON string
      const jsonStr = JSON.stringify(backupData, null, 2);
      
      // Create a Blob with the JSON content
      const blob = new Blob([jsonStr], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      
      // Use the downloads API to start the file download
      chrome.downloads.download({
        url: url,
        filename: "tabs_backup.json",
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          alert(chrome.i18n.getMessage("downloadError"));
        } else {
          console.log("Backup started, download id:", downloadId);
        }
      });
    });
  }
  
  /**
   * Restores tabs from a JSON file.
   *  - Reads the file selected by the user.
   *  - Validates that the JSON contains the 'tabs' property.
   *  - Opens each valid URL in a new tab.
   *
   * @param {Event} event File input event.
   */
  restoreTabs(event) {
    const file = event.target.files[0];
    if (!file) {
      alert(chrome.i18n.getMessage("noFileSelected"));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.tabs || !Array.isArray(data.tabs)) {
          alert(chrome.i18n.getMessage("invalidJSON"));
          return;
        }
        // Open each tab, ensuring the URL starts with http or https
        data.tabs.forEach(tabInfo => {
          if (tabInfo.url && (tabInfo.url.startsWith("http://") || tabInfo.url.startsWith("https://"))) {
            chrome.tabs.create({ url: tabInfo.url });
          }
        });
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert(chrome.i18n.getMessage("parseError"));
      }
    };
    reader.readAsText(file);
  }
}

// Initialize the extension once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new TabManager();
});

