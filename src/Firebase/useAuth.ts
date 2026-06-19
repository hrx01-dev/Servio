import { useContext } from 'react';
import { AuthContext } from './AuthContextObject'

export function useAuth() {
    return useContext(AuthContext);
}