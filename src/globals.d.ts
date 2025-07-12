/*
 * GhostCord, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and GhostCord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

declare global {
    export var GhostCordNative: typeof import("preload/GhostCordNative").GhostCordNative;
    export var GhostCord: typeof import("renderer/index");
    export var GhostCordPatchGlobals: any;

    export var IS_DEV: boolean;
}

export {};
