import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data } = await api.post('/api/auth/register', { name, email, password });
            if (data.success) {
                // Registrarte no te loguea automáticamente, mandamos al login para que el contexto auth se sincronice mejor
                navigate('/login');
            } else {
                 setError(data.message);
            }
        } catch(error) {
            setError(error.response?.data?.message || 'Error de conexión');
        }
        
        setIsLoading(false);
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg ring-1 ring-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Crear Cuenta</h2>
                <p className="text-gray-500">Únete a la mejor comunidad de recetas</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                    <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition"
                        placeholder="Chef Gusteau"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                    <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition"
                        placeholder="tu@email.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                    <input 
                        type="password" 
                        required 
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-black shadow-sm transition disabled:opacity-70 flex justify-center items-center"
                >
                    {isLoading ? 'Registrando...' : 'Registrarse'}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-bold tracking-wide text-gray-900 hover:text-gray-500 uppercase text-xs">
                    Inicia Sesión
                </Link>
            </div>
        </div>
    );
}
