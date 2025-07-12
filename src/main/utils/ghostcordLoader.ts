/*
 * GhostCord, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and GhostCord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { mkdirSync } from "fs";
import { access, constants as FsConstants, writeFile } from "fs/promises";
import { join } from "path";

import { GHOSTCORD_FILES_DIR, USER_AGENT } from "../constants";
import { downloadFile, fetchie } from "./http";

const API_BASE = "https://api.github.com";

export const FILES_TO_DOWNLOAD = [
    "ghostcordDesktopMain.js",
    "ghostcordDesktopPreload.js",
    "ghostcordDesktopRenderer.js",
    "ghostcordDesktopRenderer.css"
];

export interface ReleaseData {
    name: string;
    tag_name: string;
    html_url: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
    }>;
}

export async function githubGet(endpoint: string) {
    const opts: RequestInit = {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": USER_AGENT
        }
    };

    if (process.env.GITHUB_TOKEN) (opts.headers! as any).Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    return fetchie(API_BASE + endpoint, opts, { retryOnNetworkError: true });
}

export async function downloadGhostCordFiles() {
    const release = await githubGet("/repos/driizzyy/GhostCord/releases/latest");

    const { assets }: ReleaseData = await release.json();

    await Promise.all(
        assets
            .filter(({ name }) => FILES_TO_DOWNLOAD.some(f => name.startsWith(f)))
            .map(({ name, browser_download_url }) =>
                downloadFile(browser_download_url, join(GHOSTCORD_FILES_DIR, name), {}, { retryOnNetworkError: true })
            )
    );
}

const existsAsync = (path: string) =>
    access(path, FsConstants.F_OK)
        .then(() => true)
        .catch(() => false);

export async function isValidGhostCordInstall(dir: string) {
    const results = await Promise.all(["package.json", ...FILES_TO_DOWNLOAD].map(f => existsAsync(join(dir, f))));
    return !results.includes(false);
}

export async function ensureGhostCordFiles() {
    if (await isValidGhostCordInstall(GHOSTCORD_FILES_DIR)) return;

    mkdirSync(GHOSTCORD_FILES_DIR, { recursive: true });

    await Promise.all([downloadGhostCordFiles(), writeFile(join(GHOSTCORD_FILES_DIR, "package.json"), "{}")]);
}
