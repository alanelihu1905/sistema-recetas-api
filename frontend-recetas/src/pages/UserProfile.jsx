import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function UserProfile() {
    const { id } = useParams();
    const { user } = useContext(AuthContext); // To check if viewing own profile
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', bio: '', avatar_url: '', avatarFile: null });
    const [editStatus, setEditStatus] = useState({ loading: false, error: null, success: false });

    // Pestaña activa: 'published' o 'saved' o 'rated'
    const [activeTab, setActiveTab] = useState('published');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/api/users/${id}`);
                if (data.success) {
                    setProfile(data.data);
                    setEditData({
                        name: data.data.name || '',
                        bio: data.data.bio || '',
                        avatar_url: data.data.avatar_url || '',
                        avatarFile: null
                    });
                } else {
                    setError(data.message);
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar el perfil del usuario');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        window.scrollTo(0, 0);
    }, [id]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditStatus({ loading: true, error: null, success: false });
        try {
            const payload = {
                name: editData.name,
                bio: editData.bio,
                avatar_url: editData.avatar_url
            };

            const { data } = await api.post('/api/users/profile', payload);
            
            if (data.success) {
                setProfile(prev => ({ 
                    ...prev, 
                    ...editData
                }));
                setEditStatus({ loading: false, error: null, success: true });
                setTimeout(() => {
                    setIsEditing(false);
                    setEditStatus(prev => ({ ...prev, success: false }));
                }, 1500);
            } else {
                setEditStatus({ loading: false, error: data.message, success: false });
            }
        } catch (err) {
            setEditStatus({ 
                loading: false, 
                error: err.response?.data?.message || 'Error al actualizar', 
                success: false 
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-pulse flex space-x-3">
                    <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                    <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                    <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return <div className="max-w-xl mx-auto mt-20 p-12 bg-gray-50 rounded-3xl text-center border border-gray-100 shadow-sm">{error || 'Usuario no encontrado'}</div>;
    }

    let currentGrid = [];
    if (activeTab === 'published') currentGrid = profile.recipes_grid || [];
    else if (activeTab === 'saved') currentGrid = profile.saved_recipes_grid || [];
    else if (activeTab === 'rated') currentGrid = profile.rated_recipes_grid || [];

    return (
        <div className="max-w-5xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 pb-20">
            {/* Header Profiler - Estilo Apple/Notion */}
            <div className="bg-white rounded-[2rem] p-8 md:p-12 mb-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-10">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden shadow-inner border-4 border-white">
                    {profile.avatar_url ? (
                        <img 
                            src={profile.avatar_url} 
                            alt={profile.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl font-light text-gray-400">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                
                <div className="flex-grow text-center md:text-left w-full">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 tracking-tight">{profile.name}</h1>
                            <p className="text-sm text-gray-400 font-medium tracking-widest uppercase">
                                Cocinando desde {new Date(profile.created_at).getFullYear()}
                            </p>
                        </div>
                        {user && user.id === parseInt(id) ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2 border border-gray-900 text-gray-900 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-gray-900 hover:text-white transition-colors mx-auto md:mx-0"
                            >
                                Editar Perfil
                            </button>
                        ) : null}
                    </div>
                    
                    {profile.bio && (
                        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-2xl font-light leading-relaxed">
                            {profile.bio}
                        </p>
                    )}
                    
                    <div className="flex justify-center md:justify-start gap-10 pt-6 border-t border-gray-100">
                        <div className="text-center md:text-left">
                            <span className="block text-2xl font-bold text-gray-900">{profile.total_recipes}</span>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Publicaciones</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="block text-2xl font-bold text-gray-900">{profile.total_likes}</span>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Me Gusta</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pestañas (Tabs) */}
            <div className="flex justify-center gap-8 border-b border-gray-200 mb-10">
                <button 
                    onClick={() => setActiveTab('published')}
                    className={`pb-4 px-2 text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === 'published' 
                        ? 'text-gray-900 border-b-2 border-gray-900' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Aportes
                </button>
                <button 
                    onClick={() => setActiveTab('saved')}
                    className={`pb-4 px-2 text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === 'saved' 
                        ? 'text-gray-900 border-b-2 border-gray-900' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Guardados
                </button>
                <button 
                    onClick={() => setActiveTab('rated')}
                    className={`pb-4 px-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${
                        activeTab === 'rated' 
                        ? 'text-gray-900 border-b-2 border-gray-900' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Calificadas
                </button>
            </div>
            
            {/* Grid de Recetas */}
            {currentGrid && currentGrid.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {currentGrid.map(recipe => (
                        <Link 
                            key={recipe.id} 
                            to={`/receta/${recipe.id}`}
                            className="group relative aspect-square bg-gray-100 rounded-2xl overflow-hidden block shadow-sm border border-gray-100"
                        >
                            {recipe.main_image ? (
                                <img src={recipe.main_image} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center p-6 text-center bg-gray-50">
                                    <span className="text-sm font-medium text-gray-400">{recipe.title}</span>
                                </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <h3 className="text-white font-bold text-lg leading-tight mb-1">{recipe.title}</h3>
                                {activeTab === 'saved' && (
                                    <span className="text-gray-300 text-xs font-medium uppercase tracking-wider">Guardada</span>
                                )}
                                {activeTab === 'rated' && recipe.score && (
                                    <span className="text-yellow-400 text-xs font-bold tracking-wider flex items-center gap-1">
                                        ★ {recipe.score} Estrellas
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
                    <div className="text-4xl mb-4 opacity-50">🍱</div>
                    <p className="text-gray-500 font-medium">
                        {activeTab === 'published' && 'Aún no ha publicado recetas.'}
                        {activeTab === 'saved' && 'No hay recetas guardadas en su colección.'}
                        {activeTab === 'rated' && 'Aún no ha calificado ninguna receta.'}
                    </p>
                </div>
            )}

            {/* Modal de Edición */}
            {isEditing && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Perfil</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {editStatus.error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                                {editStatus.error}
                            </div>
                        )}

                        {editStatus.success && (
                            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Perfil actualizado!
                            </div>
                        )}

                        <form onSubmit={handleEditSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Nombre</label>
                                <input 
                                    type="text" 
                                    required
                                    value={editData.name}
                                    onChange={e => setEditData({...editData, name: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Biografía</label>
                                <textarea 
                                    rows="3"
                                    value={editData.bio}
                                    onChange={e => setEditData({...editData, bio: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all resize-none"
                                    placeholder="Cuéntanos un poco sobre ti..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Foto de Perfil (Opcional)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setEditData({...editData, avatar_url: reader.result, avatarFile: file});
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-black file:cursor-pointer"
                                />
                                {editData.avatar_url && !editData.avatarFile && (
                                    <p className="mt-2 text-xs text-gray-400">Ya tienes una imagen de perfil configurada. Puedes subir otra para reemplazarla.</p>
                                )}
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={editStatus.loading}
                                    className="px-8 py-2.5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors disabled:opacity-50"
                                >
                                    {editStatus.loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
