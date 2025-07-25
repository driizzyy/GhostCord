/*
 * GhostCord, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and GhostCord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Node } from "@ghostcord/venmic";
import { ipcRenderer } from "electron";
import { IpcMessage, IpcResponse } from "main/ipcCommands";
import type { Settings } from "shared/settings";

import { IpcEvents } from "../shared/IpcEvents";
import { invoke, sendSync } from "./typedIpc";

type SpellCheckerResultCallback = (word: string, suggestions: string[]) => void;

const spellCheckCallbacks = new Set<SpellCheckerResultCallback>();

ipcRenderer.on(IpcEvents.SPELLCHECK_RESULT, (_, w: string, s: string[]) => {
    spellCheckCallbacks.forEach(cb => cb(w, s));
});

let onDevtoolsOpen = () => {};
let onDevtoolsClose = () => {};

ipcRenderer.on(IpcEvents.DEVTOOLS_OPENED, () => onDevtoolsOpen());
ipcRenderer.on(IpcEvents.DEVTOOLS_CLOSED, () => onDevtoolsClose());

export const GhostCordNative = {
    app: {
        relaunch: () => invoke<void>(IpcEvents.RELAUNCH),
        getVersion: () => sendSync<void>(IpcEvents.GET_VERSION),
        setBadgeCount: (count: number) => invoke<void>(IpcEvents.SET_BADGE_COUNT, count),
        supportsWindowsTransparency: () => sendSync<boolean>(IpcEvents.SUPPORTS_WINDOWS_TRANSPARENCY),
        getEnableHardwareAcceleration: () => sendSync<boolean>(IpcEvents.GET_ENABLE_HARDWARE_ACCELERATION)
    },
    autostart: {
        isEnabled: () => sendSync<boolean>(IpcEvents.AUTOSTART_ENABLED),
        enable: () => invoke<void>(IpcEvents.ENABLE_AUTOSTART),
        disable: () => invoke<void>(IpcEvents.DISABLE_AUTOSTART)
    },
    fileManager: {
        showItemInFolder: (path: string) => invoke<void>(IpcEvents.SHOW_ITEM_IN_FOLDER, path),
        getGhostCordDir: () => sendSync<string | undefined>(IpcEvents.GET_GHOSTCORD_DIR),
        selectGhostCordDir: (value?: null) =>
            invoke<"cancelled" | "invalid" | "ok">(IpcEvents.SELECT_GHOSTCORD_DIR, value)
    },
    settings: {
        get: () => sendSync<Settings>(IpcEvents.GET_SETTINGS),
        set: (settings: Settings, path?: string) => invoke<void>(IpcEvents.SET_SETTINGS, settings, path)
    },
    spellcheck: {
        getAvailableLanguages: () => sendSync<string[]>(IpcEvents.SPELLCHECK_GET_AVAILABLE_LANGUAGES),
        onSpellcheckResult(cb: SpellCheckerResultCallback) {
            spellCheckCallbacks.add(cb);
        },
        offSpellcheckResult(cb: SpellCheckerResultCallback) {
            spellCheckCallbacks.delete(cb);
        },
        replaceMisspelling: (word: string) => invoke<void>(IpcEvents.SPELLCHECK_REPLACE_MISSPELLING, word),
        addToDictionary: (word: string) => invoke<void>(IpcEvents.SPELLCHECK_ADD_TO_DICTIONARY, word)
    },
    win: {
        focus: () => invoke<void>(IpcEvents.FOCUS),
        close: (key?: string) => invoke<void>(IpcEvents.CLOSE, key),
        minimize: (key?: string) => invoke<void>(IpcEvents.MINIMIZE, key),
        maximize: (key?: string) => invoke<void>(IpcEvents.MAXIMIZE, key),
        setDevtoolsCallbacks: (onOpen: () => void, onClose: () => void) => {
            onDevtoolsOpen = onOpen;
            onDevtoolsClose = onClose;
        }
    },
    capturer: {
        getLargeThumbnail: (id: string) => invoke<string>(IpcEvents.CAPTURER_GET_LARGE_THUMBNAIL, id)
    },
    /** only available on Linux. */
    virtmic: {
        list: () =>
            invoke<
                { ok: false; isGlibCxxOutdated: boolean } | { ok: true; targets: Node[]; hasPipewirePulse: boolean }
            >(IpcEvents.VIRT_MIC_LIST),
        start: (include: Node[]) => invoke<void>(IpcEvents.VIRT_MIC_START, include),
        startSystem: (exclude: Node[]) => invoke<void>(IpcEvents.VIRT_MIC_START_SYSTEM, exclude),
        stop: () => invoke<void>(IpcEvents.VIRT_MIC_STOP)
    },
    clipboard: {
        copyImage: (imageBuffer: Uint8Array, imageSrc: string) =>
            invoke<void>(IpcEvents.CLIPBOARD_COPY_IMAGE, imageBuffer, imageSrc)
    },
    debug: {
        launchGpu: () => invoke<void>(IpcEvents.DEBUG_LAUNCH_GPU),
        launchWebrtcInternals: () => invoke<void>(IpcEvents.DEBUG_LAUNCH_WEBRTC_INTERNALS)
    },
    commands: {
        onCommand(cb: (message: IpcMessage) => void) {
            ipcRenderer.on(IpcEvents.IPC_COMMAND, (_, message) => cb(message));
        },
        respond: (response: IpcResponse) => ipcRenderer.send(IpcEvents.IPC_COMMAND, response)
    }
};
