/**
 * Helper function to format a Date object in a user-friendly way.
 * Format: YYYY-MM-DD_HH-mm-ss
 * @param {Date} date 
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function truncateString(str, len) {
  if (str.length > len) {
    return str.slice(0, len) + '...';
  }
  return str;
}

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
   *  - Builds a JSON object with each tab's title and URL, including a timestamp.
   *  - Generates a Blob and triggers the JSON file download with the timestamp in the filename.
   */
  async backupTabs() {
    // Query the open tabs in the current window
    chrome.tabs.query({ currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        alert(chrome.i18n.getMessage("noTabsBackup"));
        return;
      }
      
      const now = new Date();
      const formattedDate = formatDate(now);
      
      // Build backup object with tab information and timestamp
      const backupData = {
        timestamp: now.toLocaleString(),
        tabs: tabs.map(tab => ({
          title: tab.title,
          url: tab.url
        }))
      };
      
      // Convert the object to a formatted JSON string
      const jsonStr = JSON.stringify(backupData, null, 2);
      
      // Create a Blob with the JSON content
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Use the downloads API to start the file download with timestamp in filename
      chrome.downloads.download({
        url: url,
        filename: `chrome_tabs_backup_${formattedDate}.json`,
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
        // Open each tab valid URL in a new tab
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

  // Toggle view between options and table with transitions
  const toggleViewBtn = document.getElementById("toggleViewBtn");
  toggleViewBtn.addEventListener("click", () => {
    const options = document.getElementById("optionsContainer");
    const tableContainer = document.getElementById("tabsTableContainer");
    if (options.classList.contains("visible")) {
      // Switch to table view
      options.classList.remove("visible");
      options.classList.add("hidden");
      tableContainer.classList.remove("hidden");
      tableContainer.classList.add("visible");
    } else {
      // Switch to options view
      tableContainer.classList.remove("visible");
      tableContainer.classList.add("hidden");
      options.classList.remove("hidden");
      options.classList.add("visible");
    }
  });
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
  chrome.storage.local.get(["tabsData", "tableTitle"], (result) => {
    const toggleViewBtn = document.getElementById("toggleViewBtn");
    if (result.tabsData && Array.isArray(result.tabsData) && result.tabsData.length > 0) {
      renderTable(result.tabsData, result.tableTitle);
      toggleViewBtn.style.display = "inline-block";
    } else {
      toggleViewBtn.style.display = "none";
    }
  });
}

/**
 * Deletes the saved table data from chrome storage.
 */
function deleteTableData() {
  chrome.storage.local.remove(["tabsData", "tableTitle"], () => {
    console.log("Table data removed from storage.");
  });
}

/**
 * Renders a table of tabs in the #tabsTableContainer.
 * Each row contains a clickable link that opens in a new tab and shows the tab title as a tooltip on hover.
 * A delete button ("X") is added at the top-right to remove the table.
 * @param {Array} tabsArray - Array of tab objects.
 * @param {string} fileTitle - Title of the loaded file.
 */
function renderTable(tabsArray, fileTitle) {
  const container = document.getElementById("tabsTableContainer");
  container.innerHTML = ""; // Clear existing content

  // If fileTitle is provided, create an h2 element for the title.
  if (fileTitle) {
    const titleEl = document.createElement("h2");
    titleEl.textContent = fileTitle;
    container.appendChild(titleEl);
  }

  // Create delete button positioned at the top-right of the container
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "X";
  deleteBtn.className = "deleteBtn";
  deleteBtn.addEventListener("click", () => {
    container.innerHTML = "";
    deleteTableData();

    // Switch to options view
    const options = document.getElementById("optionsContainer");
    const tableContainer = document.getElementById("tabsTableContainer");
    tableContainer.classList.remove("visible");
    tableContainer.classList.add("hidden");
    options.classList.remove("hidden");
    options.classList.add("visible");
    toggleViewBtn.style.display = "none";

  });
  container.appendChild(deleteBtn);

  // Create table element
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");
  tabsArray.forEach(tab => {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    const a = document.createElement("a");
    a.href = "#"; // Prevent default navigation; we'll open a new tab programmatically
    a.textContent = truncateString(tab.url, 100);
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

      e.preventDefault();
      e.stopPropagation();

      if (!data.tabs || !Array.isArray(data.tabs)) {
        alert(chrome.i18n.getMessage("invalidJSON"));
        return;
      }
      // Save the file name to storage as tableTitle
      chrome.storage.local.set({ tableTitle: file.name }, () => {
        console.log("Table title saved.");
      });
      // Render the table and persist the data
      //renderTable(data.tabs, file.name);
      saveTableData(data.tabs);
      // Automatically switch to table view
      const optionsContainer = document.getElementById("optionsContainer");
      const tableContainer = document.getElementById("tabsTableContainer");
      //optionsContainer.classList.remove("visible");
      //optionsContainer.classList.add("hidden");
      //tableContainer.classList.remove("hidden");
      //tableContainer.classList.add("visible");
      
      //document.getElementById("toggleViewBtn").style.display = "inline-block";
      
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert(chrome.i18n.getMessage("parseError"));
    }
  };
  reader.readAsText(file);
});
