/** @refresh reset */

import { useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { parseAdminProfile } from '../admin/lib/collections';
import { AuthContext, AuthContextType } from './AuthContextObject';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<AuthContextType['currentUser']>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<AuthContextType['userRole']>(null);

    useEffect(() => {
        let currentAuthId = 0;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            const authId = ++currentAuthId;
            if (user) {
                try {
                    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                    if (authId !== currentAuthId) return;
                    const parsed = adminDoc.exists() ? parseAdminProfile(user.uid, adminDoc.data()) : null;
                    if (parsed && parsed.disabled !== true) {
                        setUserRole('admin');
                    } else {
                        setUserRole('client');
                    }
                } catch {
                    if (authId !== currentAuthId) return;
                    await auth.signOut();
                    setUserRole(null);
                    setCurrentUser(null);
                    setLoading(false);
                    return;
                }
            } else {
                setUserRole(null);
            }
            if (authId !== currentAuthId) return;
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