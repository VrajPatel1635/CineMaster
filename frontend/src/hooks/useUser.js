// src/hooks/useUser.js
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../context/AuthContext';

export default function useUser() {
    const { user, isAuthenticated, authLoading } = useAuth();
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        if (user && user._id) {
            setUserId(user._id);
        } else {
            setUserId(null);
        }
    }, [user]);

    return { userId, isAuthenticated, isLoading: authLoading };
}
