/*
 * GhostCord, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2023 Vendicated and GhostCord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect, useReducer } from "@vencord/types/webpack/common";
import { SettingsStore } from "shared/utils/SettingsStore";

import { GhostCordLogger } from "./logger";
import { localStorage } from "./utils";

export const Settings = new SettingsStore(GhostCordNative.settings.get());
Settings.addGlobalChangeListener((o, p) => GhostCordNative.settings.set(o, p));

export function useSettings() {
    const [, update] = useReducer(x => x + 1, 0);

    useEffect(() => {
        Settings.addGlobalChangeListener(update);

        return () => Settings.removeGlobalChangeListener(update);
    }, []);

    return Settings.store;
}

export function getValueAndOnChange(key: keyof typeof Settings.store) {
    return {
        value: Settings.store[key] as any,
        onChange: (value: any) => (Settings.store[key] = value)
    };
}

interface TState {
    screenshareQuality?: {
        resolution: string;
        frameRate: string;
    };
}

const stateKey = "GhostCordState";

const currentState: TState = (() => {
    const stored = localStorage.getItem(stateKey);
    if (!stored) return {};
    try {
        return JSON.parse(stored);
    } catch (e) {
        GhostCordLogger.error("Failed to parse stored state", e);
        return {};
    }
})();

export const State = new SettingsStore<TState>(currentState);
State.addGlobalChangeListener((o, p) => localStorage.setItem(stateKey, JSON.stringify(o)));

export function useGhostCordState() {
    const [, update] = useReducer(x => x + 1, 0);

    useEffect(() => {
        State.addGlobalChangeListener(update);

        return () => State.removeGlobalChangeListener(update);
    }, []);

    return State.store;
}
