/** @refresh reset */

import { useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AuthContext, AuthContextType } from './AuthContextObject';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<AuthContextType['currentUser']>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<AuthContextType['userRole']>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                    if (adminDoc.exists() && adminDoc.data().disabled !== true) {
                        setUserRole('admin');
                    } else {
                        setUserRole('client');
                    }
                } catch {
                    setUserRole('client');
                }
            } else {
                setUserRole(null);
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        userRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}