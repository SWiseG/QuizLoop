import { Injectable, signal } from '@angular/core';

/**
 * AuthService wraps Firebase Authentication via Capacitor plugin.
 *
 * On web (dev), Firebase native auth is not available, so we fall back
 * to generating a local anonymous UID and logging to console.
 * On native builds, this calls the real Capacitor Firebase plugin.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    userId = signal<string | null>(null);
    isAnonymous = signal(true);
    isAuthenticated = signal(false);

    async initialize(): Promise<void> {
        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.getCurrentUser();
            if (result.user) {
                this.userId.set(result.user.uid);
                this.isAnonymous.set(result.user.isAnonymous ?? true);
                this.isAuthenticated.set(true);
            } else {
                await this.signInAnonymously();
            }
        } catch {
            // Web fallback — no native Firebase available
            console.log('[AuthService] Web fallback: generating local anonymous UID');
            this.userId.set('local-' + crypto.randomUUID());
            this.isAnonymous.set(true);
            this.isAuthenticated.set(true);
        }
    }

    async signInAnonymously(): Promise<void> {
        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.signInAnonymously();
            this.userId.set(result.user?.uid ?? null);
            this.isAnonymous.set(true);
            this.isAuthenticated.set(true);
        } catch {
            this.userId.set('local-' + crypto.randomUUID());
            this.isAnonymous.set(true);
            this.isAuthenticated.set(true);
        }
    }

    async signInWithGoogle(): Promise<void> {
        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.signInWithGoogle();
            this.userId.set(result.user?.uid ?? null);
            this.isAnonymous.set(false);
            this.isAuthenticated.set(true);
        } catch (err) {
            console.error('[AuthService] Google Sign-In failed:', err);
        }
    }

    async signOut(): Promise<void> {
        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            await FirebaseAuthentication.signOut();
        } catch { /* web fallback */ }
        this.userId.set(null);
        this.isAuthenticated.set(false);
        await this.signInAnonymously();
    }
}
