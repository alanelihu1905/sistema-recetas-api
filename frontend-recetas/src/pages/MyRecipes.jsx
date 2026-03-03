import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function MyRecipes() {
    const { user } = useContext(AuthContext);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchMyRecipes = async () => {
            try {
                // Obtenemos recetas filtradas por el autor logueado actual
                const { data } = await api.get(`/api/recipes?author=${user.id || ''}`);
                if (data.success) {
                    setRecipes(data.data);
                } else {
                    setError('Error al obtener tus recetas.');
                }
            } catch {
                setError('Error conectando al servidor.');
            } finally {
                setLoading(false);
            }
        };

        fetchMyRecipes();
    }, [user, navigate]);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta receta? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const { data } = await api.delete(`/api/recipes/${id}`);
            if (data.success) {
                setRecipes(recipes.filter(r => r.id !== id));
            } else {
                alert(data.message || 'Error al eliminar');
            }
        } catch {
            alert('Asegúrate de ser el dueño de la receta antes de eliminarla.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-400 text-sm tracking-widest uppercase">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto mt-4 px-4">
            <div className="flex justify-between items-center mb-12 pb-4 border-b border-gray-900">
                <h1 className="text-2xl font-light text-gray-900">Mis Recetas</h1>
                <Link 
                    to="/crear-receta" 
                    className="bg-gray-900 hover:bg-black text-white text-xs uppercase tracking-widest py-2 px-6 transition-colors"
                >
                    Nueva Receta
                </Link>
            </div>

            {error && <div className="text-red-500 text-sm mb-6 pb-4 border-b border-red-200">{error}</div>}

            {recipes.length === 0 ? (
                <div className="text-center py-24 border border-gray-200">
                    <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">No tienes recetas publicadas.</p>
                    <Link to="/crear-receta" className="text-gray-900 text-xs border-b border-gray-900 uppercase tracking-widest pb-1 hover:text-gray-500 transition-colors">
                        Publicar primera receta
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {recipes.map(recipe => (
                        <div key={recipe.id} className="group border border-gray-200 p-6 flex flex-col sm:flex-row gap-6 hover:border-gray-900 transition-colors duration-300">
                            <div className="w-full sm:w-48 aspect-square sm:aspect-auto bg-gray-100 relative">
                                {recipe.main_image ? (
                                    <img 
                                        src={recipe.main_image} 
                                        alt={recipe.title}
                                        className="w-full h-full object-cover absolute inset-0 grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 uppercase tracking-widest">Sin Imagen</div>
                                )}
                            </div>
                            
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-light text-gray-900 line-clamp-1 group-hover:underline decoration-1 underline-offset-4">
                                            {recipe.title}
                                        </h3>
                                        <span className={`text-[10px] uppercase tracking-widest ${recipe.status === 'Publicada' ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {recipe.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-6">{recipe.description}</p>
                                </div>
                                
                                <div className="flex gap-4 mt-auto pt-4 border-t border-gray-100">
                                    <Link 
                                        to={`/receta/${recipe.id}`}
                                        className="text-gray-400 hover:text-gray-900 text-[10px] uppercase tracking-widest transition-colors"
                                    >
                                        Ver
                                    </Link>
                                    <Link 
                                        to={`/editar-receta/${recipe.id}`}
                                        className="text-gray-400 hover:text-gray-900 text-[10px] uppercase tracking-widest transition-colors"
                                    >
                                        Editar
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(recipe.id)}
                                        className="text-gray-400 hover:text-red-600 text-[10px] uppercase tracking-widest transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
