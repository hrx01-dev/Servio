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
<<<<<<< HEAD
        let currentAuthId = 0;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            const authId = ++currentAuthId;
            if (user) {
                try {
                    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                    if (authId !== currentAuthId) return;
=======
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
>>>>>>> 07a4698abb1d7dea1060526dd1dee91a247dc343
                    if (adminDoc.exists() && adminDoc.data().disabled !== true) {
                        setUserRole('admin');
                    } else {
                        setUserRole('client');
                    }
                } catch {
<<<<<<< HEAD
                    if (authId !== currentAuthId) return;
                    await auth.signOut();
                    setUserRole(null);
                    setCurrentUser(null);
                    setLoading(false);
                    return;
=======
                    setUserRole('client');
>>>>>>> 07a4698abb1d7dea1060526dd1dee91a247dc343
                }
            } else {
                setUserRole(null);
            }
<<<<<<< HEAD
            if (authId !== currentAuthId) return;
=======
>>>>>>> 07a4698abb1d7dea1060526dd1dee91a247dc343
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