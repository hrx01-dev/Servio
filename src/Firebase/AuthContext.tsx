import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
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

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

// Export the hook as a property of the provider
AuthProvider.useAuth = function () {
    return useContext(AuthContext);
}