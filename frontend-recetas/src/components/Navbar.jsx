import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link 
                        to="/" 
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            window.dispatchEvent(new CustomEvent('reset-home'));
                        }}
                        className="flex items-center gap-3"
                    >
                        <span className="text-gray-900 text-xl font-bold tracking-widest uppercase">
                            RecetarioLaravel
                        </span>
                    </Link>

                    <div className="flex items-center space-x-8">
                        {user ? (
                            <>
                                <Link to="/crear-receta" className="text-xs text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors">
                                    + Crear Receta
                                </Link>
                                <Link to="/mis-recetas" className="text-xs text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors">
                                    Mis Recetas
                                </Link>
                                <div className="flex items-center space-x-6 border-l border-gray-200 pl-6 ml-2">
                                    <Link to={`/user/${user.id}`} className="text-xs font-bold text-gray-900 uppercase tracking-widest hover:text-gray-500 transition-colors">
                                        {user.name}
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="text-xs font-semibold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                                    >
                                        Salir
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-xs font-semibold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors">
                                    Entrar
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-gray-900 text-white text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-black transition-colors"
                                >
                                    Registro
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
