import { createContext, useState } from 'react';
import api from '../services/api';

/**
 * AuthContext (Stateless JWT Manager)
 * -----------------------------------
 * Gestiona la autenticación global de la app en React.
 * Al no usar cookies de sesión del servidor, este archivo persigue
 * y almacena localmente (Local Storage) el JWT firmado por PHP.
 */
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Inicialización perezosa (lazy) para evitar llamar a setState dentro del useEffect inicial
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        if (parsed && !parsed.id) {
            // Purga de seguridad si quedó algún token fantasma sin ID
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return null;
        }
        return parsed;
    });
    
    const [loading] = useState(false);

    /**
     * Función Login
     * Dispara la petición asíncrona hacia el Backend y captura el Token JWT.
     */
    const login = async (email, password) => {
        try {
            const { data } = await api.post('/api/auth/login', { email, password });
            
            if (data.success) {
                // Decode payload from JWT nativo en Javascript
                // Un JWT tiene 3 partes separadas por puntos (Header.Payload.Signature)
                const base64Url = data.token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/, '/');
                
                // Conversión de Base64 a JSON String literal
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const jwtData = JSON.parse(jsonPayload);
                const decodedUser = {
                    id: jwtData.sub,         // ID del Usuario
                    name: jwtData.name,      // Nombre
                    email: jwtData.email     // Correo
                };
                
                // Guardado Stateless en el lado del cliente
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(decodedUser));
                setUser(decodedUser);
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Error de conexión' };
        }
    };

    /**
     * Función Logout
     * Borra los rastros del token, obligando a re-login para endpoints bloqueados.
     */
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
