import { createContext } from 'react';
import { User } from 'firebase/auth';

export interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });