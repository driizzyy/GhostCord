/*
 * GhostCord, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and GhostCord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

if (process.platform === "linux") import("./venmic");

import { execFile } from "child_process";
import {
    app,
    BrowserWindow,
    clipboard,
    dialog,
    IpcMainInvokeEvent,
    nativeImage,
    RelaunchOptions,
    session,
    shell
} from "electron";
import { mkdirSync, readFileSync, watch } from "fs";
import { open, readFile } from "fs/promises";
import { enableHardwareAcceleration } from "main";
import { release } from "os";
import { join } from "path";
import { debounce } from "shared/utils/debounce";

import { IpcEvents } from "../shared/IpcEvents";
import { setBadgeCount } from "./appBadge";
import { autoStart } from "./autoStart";
import { GHOSTCORD_FILES_DIR, GHOSTCORD_QUICKCSS_FILE, GHOSTCORD_THEMES_DIR } from "./constants";
import { mainWin } from "./mainWindow";
import { Settings, State } from "./settings";
import { isValidGhostCordInstall } from "./utils/ghostcordLoader";
import { handle, handleSync } from "./utils/ipcWrappers";
import { PopoutWindows } from "./utils/popout";
import { isDeckGameMode, showGamePage } from "./utils/steamOS";

handleSync(IpcEvents.GET_GHOSTCORD_PRELOAD_FILE, () => join(GHOSTCORD_FILES_DIR, "ghostcordDesktopPreload.js"));
handleSync(IpcEvents.GET_GHOSTCORD_RENDERER_SCRIPT, () =>
    readFileSync(join(GHOSTCORD_FILES_DIR, "ghostcordDesktopRenderer.js"), "utf-8")
);

handleSync(IpcEvents.GET_RENDERER_SCRIPT, () => readFileSync(join(__dirname, "renderer.js"), "utf-8"));
handleSync(IpcEvents.GET_RENDERER_CSS_FILE, () => join(__dirname, "renderer.css"));

handleSync(IpcEvents.GET_SETTINGS, () => Settings.plain);
handleSync(IpcEvents.GET_VERSION, () => app.getVersion());
handleSync(IpcEvents.GET_ENABLE_HARDWARE_ACCELERATION, () => enableHardwareAcceleration);

handleSync(
    IpcEvents.SUPPORTS_WINDOWS_TRANSPARENCY,
    () => process.platform === "win32" && Number(release().split(".").pop()) >= 22621
);

handleSync(IpcEvents.AUTOSTART_ENABLED, () => autoStart.isEnabled());
handle(IpcEvents.ENABLE_AUTOSTART, autoStart.enable);
handle(IpcEvents.DISABLE_AUTOSTART, autoStart.disable);

handle(IpcEvents.SET_SETTINGS, (_, settings: typeof Settings.store, path?: string) => {
    Settings.setData(settings, path);
});

handle(IpcEvents.RELAUNCH, async () => {
    const options: RelaunchOptions = {
        args: process.argv.slice(1).concat(["--relaunch"])
    };
    if (isDeckGameMode) {
        // We can't properly relaunch when running under gamescope, but we can at least navigate to our page in Steam.
        await showGamePage();
    } else if (app.isPackaged && process.env.APPIMAGE) {
        execFile(process.env.APPIMAGE, options.args);
    } else {
        app.relaunch(options);
    }
    app.exit();
});

handle(IpcEvents.SHOW_ITEM_IN_FOLDER, (_, path) => {
    shell.showItemInFolder(path);
});

function getWindow(e: IpcMainInvokeEvent, key?: string) {
    return key ? PopoutWindows.get(key)! : (BrowserWindow.fromWebContents(e.sender) ?? mainWin);
}

handle(IpcEvents.FOCUS, () => {
    mainWin.show();
    mainWin.setSkipTaskbar(false);
});

handle(IpcEvents.CLOSE, (e, key?: string) => {
    getWindow(e, key).close();
});

handle(IpcEvents.MINIMIZE, (e, key?: string) => {
    getWindow(e, key).minimize();
});

handle(IpcEvents.MAXIMIZE, (e, key?: string) => {
    const win = getWindow(e, key);
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

handleSync(IpcEvents.SPELLCHECK_GET_AVAILABLE_LANGUAGES, e => {
    e.returnValue = session.defaultSession.availableSpellCheckerLanguages;
});

handle(IpcEvents.SPELLCHECK_REPLACE_MISSPELLING, (e, word: string) => {
    e.sender.replaceMisspelling(word);
});

handle(IpcEvents.SPELLCHECK_ADD_TO_DICTIONARY, (e, word: string) => {
    e.sender.session.addWordToSpellCheckerDictionary(word);
});

handleSync(IpcEvents.GET_GHOSTCORD_DIR, e => (e.returnValue = State.store.ghostcordDir));

handle(IpcEvents.SELECT_GHOSTCORD_DIR, async (_e, value?: null) => {
    if (value === null) {
        delete State.store.ghostcordDir;
        return "ok";
    }

    const res = await dialog.showOpenDialog(mainWin!, {
        properties: ["openDirectory"]
    });
    if (!res.filePaths.length) return "cancelled";

    const dir = res.filePaths[0];
    if (!isValidGhostCordInstall(dir)) return "invalid";

    State.store.ghostcordDir = dir;

    return "ok";
});

handle(IpcEvents.SET_BADGE_COUNT, (_, count: number) => setBadgeCount(count));

handle(IpcEvents.CLIPBOARD_COPY_IMAGE, async (_, buf: ArrayBuffer, src: string) => {
    clipboard.write({
        html: `<img src="${src.replaceAll('"', '\\"')}">`,
        image: nativeImage.createFromBuffer(Buffer.from(buf))
    });
});

function openDebugPage(page: string) {
    const win = new BrowserWindow({
        autoHideMenuBar: true
    });

    win.loadURL(page);
}

handle(IpcEvents.DEBUG_LAUNCH_GPU, () => openDebugPage("chrome://gpu"));
handle(IpcEvents.DEBUG_LAUNCH_WEBRTC_INTERNALS, () => openDebugPage("chrome://webrtc-internals"));

function readCss() {
    return readFile(GHOSTCORD_QUICKCSS_FILE, "utf-8").catch(() => "");
}

open(GHOSTCORD_QUICKCSS_FILE, "a+").then(fd => {
    fd.close();
    watch(
        GHOSTCORD_QUICKCSS_FILE,
        { persistent: false },
        debounce(async () => {
            mainWin?.webContents.postMessage("GhostCordQuickCssUpdate", await readCss());
        }, 50)
    );
});

mkdirSync(GHOSTCORD_THEMES_DIR, { recursive: true });
watch(
    GHOSTCORD_THEMES_DIR,
    { persistent: false },
    debounce(() => {
        mainWin?.webContents.postMessage("GhostCordThemeUpdate", void 0);
    })
);
