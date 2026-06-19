/** @refresh reset */

import { useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { AuthContext, AuthContextType } from './AuthContextObject';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<AuthContextType['currentUser']>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}