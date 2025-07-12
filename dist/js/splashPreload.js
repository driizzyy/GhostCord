"use strict";var e=require("electron");e.contextBridge.exposeInMainWorld("GhostCordSplashNative",{onUpdateMessage(s){e.ipcRenderer.on("update-splash-message",(a,o)=>s(o))}});
//# sourceMappingURL=splashPreload.js.map
