/*
 * GhostCord, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and GhostCord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app } from "electron";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";

const ghostcordDir = dirname(process.execPath);

export const PORTABLE =
    process.platform === "win32" &&
    !process.execPath.toLowerCase().endsWith("electron.exe") &&
    !existsSync(join(ghostcordDir, "Uninstall GhostCord.exe"));

export const DATA_DIR =
    process.env.GHOSTCORD_USER_DATA_DIR || (PORTABLE ? join(ghostcordDir, "Data") : join(app.getPath("userData")));

mkdirSync(DATA_DIR, { recursive: true });

const SESSION_DATA_DIR = join(DATA_DIR, "sessionData");
app.setPath("sessionData", SESSION_DATA_DIR);

export const GHOSTCORD_SETTINGS_DIR = join(DATA_DIR, "settings");
export const GHOSTCORD_QUICKCSS_FILE = join(GHOSTCORD_SETTINGS_DIR, "quickCss.css");
export const GHOSTCORD_SETTINGS_FILE = join(GHOSTCORD_SETTINGS_DIR, "settings.json");
export const GHOSTCORD_THEMES_DIR = join(DATA_DIR, "themes");

// needs to be inline require because of circular dependency
// as otherwise "DATA_DIR" (which is used by ./settings) will be uninitialised
export const GHOSTCORD_FILES_DIR =
    (require("./settings") as typeof import("./settings")).State.store.ghostcordDir ||
    join(SESSION_DATA_DIR, "ghostcordFiles");

export const USER_AGENT = `GhostCord/${app.getVersion()} (https://github.com/GhostCord/GhostCord)`;

// dimensions shamelessly stolen from Discord Desktop :3
export const MIN_WIDTH = 940;
export const MIN_HEIGHT = 500;
export const DEFAULT_WIDTH = 1280;
export const DEFAULT_HEIGHT = 720;

export const DISCORD_HOSTNAMES = ["discord.com", "canary.discord.com", "ptb.discord.com"];

const VersionString = `AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome.split(".")[0]}.0.0.0 Safari/537.36`;
const BrowserUserAgents = {
    darwin: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ${VersionString}`,
    linux: `Mozilla/5.0 (X11; Linux x86_64) ${VersionString}`,
    windows: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${VersionString}`
};

export const BrowserUserAgent = BrowserUserAgents[process.platform] || BrowserUserAgents.windows;

export const enum MessageBoxChoice {
    Default,
    Cancel
}
