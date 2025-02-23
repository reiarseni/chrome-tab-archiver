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
   * Restores tabs from a JSON file:
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
  loadSavedTable();
});

// New functions for persisting and rendering the saved tabs table

/**
 * Saves the provided tabs array to chrome storage.
 * @param {Array} tabsArray - Array of tab objects.
 */
function saveTableData(tabsArray) {
  chrome.storage.local.set({ tabsData: tabsArray }, () => {
    console.log("Table data saved to storage.");
  });
}

/**
 * Loads saved table data from chrome storage and renders the table.
 */
function loadSavedTable() {
  chrome.storage.local.get("tabsData", (result) => {
    if (result.tabsData && Array.isArray(result.tabsData)) {
      renderTable(result.tabsData);
    }
  });
}

/**
 * Deletes the saved table data from chrome storage.
 */
function deleteTableData() {
  chrome.storage.local.remove("tabsData", () => {
    console.log("Table data removed from storage.");
  });
}

/**
 * Renders a table of tabs in the #tabsTableContainer.
 * Each row contains a clickable link that opens in a new tab and shows the tab title on hover.
 * A delete button ("X") is added at the top-right to remove the table.
 * @param {Array} tabsArray - Array of tab objects.
 */
function renderTable(tabsArray) {
  const container = document.getElementById("tabsTableContainer");
  container.innerHTML = ""; // Clear existing content

  // Create delete button positioned at the top-right of the container
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "X";
  deleteBtn.className = "deleteBtn";
  deleteBtn.addEventListener("click", () => {
    container.innerHTML = "";
    deleteTableData();
  });
  container.appendChild(deleteBtn);

  // Create table element
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  tabsArray.forEach(tab => {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    const a = document.createElement("a");
    a.href = "#"; // Prevent default navigation
    a.textContent = tab.url;
    a.title = tab.title; // Tooltip shows the tab's title on hover
    a.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: tab.url });
    });
    td.appendChild(a);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

// New code to handle loading a table from a file and persisting it

const loadTabsBtn = document.getElementById('loadTabsBtn');
const tableFileInput = document.getElementById('tableFileInput');

loadTabsBtn.addEventListener('click', () => {
  tableFileInput.click();
});

tableFileInput.addEventListener('change', (event) => {
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
      // Render the table and persist the data
      renderTable(data.tabs);
      saveTableData(data.tabs);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert(chrome.i18n.getMessage("parseError"));
    }
  };
  reader.readAsText(file);
});

