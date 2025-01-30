const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
        // Wrestler Management
        getWrestlers: () => ipcRenderer.invoke('get-wrestlers'),
        addWrestler: (wrestler) => ipcRenderer.invoke('add-wrestler', wrestler),
        updateWrestler: (wrestler) => ipcRenderer.invoke('update-wrestler', wrestler),
        deleteWrestler: (id) => ipcRenderer.invoke('delete-wrestler', id),
        
        // Show Management
        getShows: () => ipcRenderer.invoke('get-shows'),
        addShow: (show) => ipcRenderer.invoke('add-show', show),
        deleteShow: (id) => ipcRenderer.invoke('delete-show', id),
        
        // Weight Classes
        getWeightClasses: () => ipcRenderer.invoke('get-weight-classes'),
        addWeightClass: (weightClass) => ipcRenderer.invoke('add-weight-class', weightClass),
        deleteWeightClass: (id) => ipcRenderer.invoke('delete-weight-class', id),
        
        // Wrestler Types
        getWrestlerTypes: () => ipcRenderer.invoke('get-wrestler-types'),
        addWrestlerType: (type) => ipcRenderer.invoke('add-wrestler-type', type),
        deleteWrestlerType: (id) => ipcRenderer.invoke('delete-wrestler-type', id),
        
        // Factions
        getFactions: () => ipcRenderer.invoke('get-factions'),
        
        // Championships
        getChampionships: () => ipcRenderer.invoke('get-championships'),
        addChampionship: (championship) => ipcRenderer.invoke('add-championship', championship),
        updateChampionshipHolder: (championshipId, wrestlerId) => 
            ipcRenderer.invoke('update-championship-holder', championshipId, wrestlerId),
        deleteChampionship: (id) => ipcRenderer.invoke('delete-championship', id)
    }
);
