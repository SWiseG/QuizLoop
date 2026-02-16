import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LifeService {
    readonly maxLives = 5;
    readonly regenIntervalMs = 30 * 60 * 1000;

    readonly lives = signal<number>(this.maxLives);
    readonly timeUntilNextLife = signal<number>(0);
    readonly canPlay = computed(() => this.lives() > 0);

    private readonly livesStorageKey = 'ql_lives';
    private readonly regenStorageKey = 'ql_lives_last_regen';

    private lastRegenTimestamp = Date.now();
    private regenTimer?: ReturnType<typeof setInterval>;

    constructor() {
        this.loadState();
        this.applyRegeneration(Date.now());
        this.startRegenTimer();
    }

    useLife(): boolean {
        const current = this.lives();
        if (current <= 0) {
            return false;
        }

        if (current === this.maxLives) {
            this.lastRegenTimestamp = Date.now();
        }

        this.lives.set(current - 1);
        this.updateTimeUntilNext(Date.now());
        this.persistState();
        return true;
    }

    addLife(amount = 1): boolean {
        const current = this.lives();
        if (current >= this.maxLives) {
            return false;
        }

        const increment = Math.max(1, Math.floor(amount));
        const updated = Math.min(this.maxLives, current + increment);
        this.lives.set(updated);

        if (updated >= this.maxLives) {
            this.lastRegenTimestamp = Date.now();
        }

        this.updateTimeUntilNext(Date.now());
        this.persistState();
        return true;
    }

    private loadState() {
        const rawLives = localStorage.getItem(this.livesStorageKey);
        const rawTimestamp = localStorage.getItem(this.regenStorageKey);

        // If no saved data exists, start with maxLives (new user)
        if (rawLives === null) {
            this.lives.set(this.maxLives);
            this.lastRegenTimestamp = Date.now();
            this.persistState();
            return;
        }

        const parsedLives = Number(rawLives);
        const parsedTimestamp = Number(rawTimestamp);

        const initialLives = Number.isFinite(parsedLives)
            ? this.clampLives(Math.floor(parsedLives))
            : this.maxLives;

        this.lives.set(initialLives);

        this.lastRegenTimestamp = Number.isFinite(parsedTimestamp) && parsedTimestamp > 0
            ? parsedTimestamp
            : Date.now();

        if (initialLives >= this.maxLives) {
            this.lastRegenTimestamp = Date.now();
        }

        this.persistState();
    }

    private startRegenTimer() {
        this.regenTimer = setInterval(() => {
            this.applyRegeneration(Date.now());
        }, 1000);
    }

    private applyRegeneration(now: number) {
        const currentLives = this.lives();
        if (currentLives >= this.maxLives) {
            this.timeUntilNextLife.set(0);
            return;
        }

        const elapsed = Math.max(0, now - this.lastRegenTimestamp);
        const regenUnits = Math.floor(elapsed / this.regenIntervalMs);

        if (regenUnits > 0) {
            const nextLives = this.clampLives(currentLives + regenUnits);
            const gainedLives = nextLives - currentLives;
            this.lives.set(nextLives);
            this.lastRegenTimestamp += gainedLives * this.regenIntervalMs;

            if (nextLives >= this.maxLives) {
                this.lastRegenTimestamp = now;
            }

            this.persistState();
        }

        this.updateTimeUntilNext(now);
    }

    private updateTimeUntilNext(now: number) {
        if (this.lives() >= this.maxLives) {
            this.timeUntilNextLife.set(0);
            return;
        }

        const elapsed = Math.max(0, now - this.lastRegenTimestamp);
        const remainder = elapsed % this.regenIntervalMs;
        const remaining = this.regenIntervalMs - remainder;
        this.timeUntilNextLife.set(remaining);
    }

    private persistState() {
        localStorage.setItem(this.livesStorageKey, this.lives().toString());
        localStorage.setItem(this.regenStorageKey, this.lastRegenTimestamp.toString());
    }

    private clampLives(value: number): number {
        return Math.min(this.maxLives, Math.max(0, value));
    }
}
