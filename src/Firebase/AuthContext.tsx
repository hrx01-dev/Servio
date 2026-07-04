/** @refresh reset */

import { useEffect, useState, ReactNode } from 'react';
import { AuthContext, AuthContextType } from './AuthContextObject';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<AuthContextType['currentUser']>(null);
    const [loading, setLoading] = useState(true);

    // The Firebase Auth SDK is loaded dynamically after mount so it never sits
    // in the render-blocking bundle (issue #234). Consumers already handle the
    // brief `loading: true` window — it existed before, while
    // onAuthStateChanged resolved the persisted session.
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        let cancelled = false;

        import('./auth')
            .then(({ auth, onAuthStateChanged }) => {
                if (cancelled) return;
                unsubscribe = onAuthStateChanged(auth, (user) => {
                    setCurrentUser(user);
                    setLoading(false);
                });
            })
            .catch(() => {
                // SDK failed to load (offline, bad config) — settle as signed
                // out instead of leaving every consumer in a loading state.
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, []);

    const value = {
        currentUser,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
