/**
 * Clase que maneja la lógica de backup y restore de tabs.
 */
class TabManager {
  constructor() {
    this.backupBtn = document.getElementById('backupBtn');
    this.fileInput = document.getElementById('fileInput');
    this.addEventListeners();
  }
  
  /**
   * Registra los eventos de clic y cambio para los botones.
   */
  addEventListeners() {
    this.backupBtn.addEventListener('click', () => this.backupTabs());
    this.fileInput.addEventListener('change', (event) => this.restoreTabs(event));
  }
  
  /**
   * Realiza el respaldo de los tabs abiertos:
   *  - Consulta todos los tabs de la ventana actual.
   *  - Crea un objeto JSON con la información de cada tab (título y URL).
   *  - Genera un Blob y dispara la descarga del archivo JSON.
   */
  async backupTabs() {
    // Consulta las pestañas abiertas en la ventana actual
    chrome.tabs.query({currentWindow: true}, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        alert("No hay tabs abiertos para respaldar.");
        return;
      }
      
      // Build backup object with tab information
      const backupData = {
        tabs: tabs.map(tab => ({
          title: tab.title,
          url: tab.url
        }))
      };
      
      // Convierte el objeto a una cadena JSON con formato
      const jsonStr = JSON.stringify(backupData, null, 2);
      
      // Crea un Blob con el contenido JSON
      const blob = new Blob([jsonStr], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      
      // Usa la API de descargas para iniciar la descarga del archivo
      chrome.downloads.download({
        url: url,
        filename: "tabs_backup.json",
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          alert("Error al iniciar la descarga.");
        } else {
          console.log("Backup iniciado, id descarga:", downloadId);
        }
      });
    });
  }
  
  /**
   * Restaura los tabs a partir de un archivo JSON.
   *  - Lee el archivo seleccionado por el usuario.
   *  - Valida que el JSON contenga la propiedad 'tabs'.
   *  - Abre cada URL válida en una nueva pestaña.
   *
   * @param {Event} event Evento del input file.
   */
  restoreTabs(event) {
    const file = event.target.files[0];
    if (!file) {
      alert("No se seleccionó ningún archivo.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.tabs || !Array.isArray(data.tabs)) {
          alert("Archivo JSON inválido.");
          return;
        }
        // Abre cada tab validando que la URL empiece por http o https
        data.tabs.forEach(tabInfo => {
          if (tabInfo.url && (tabInfo.url.startsWith("http://") || tabInfo.url.startsWith("https://"))) {
            chrome.tabs.create({ url: tabInfo.url });
          }
        });
      } catch (error) {
        console.error("Error al parsear el JSON:", error);
        alert("Error al parsear el JSON.");
      }
    };
    reader.readAsText(file);
  }
}

// Inicializa la extensión una vez que se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  new TabManager();
});

