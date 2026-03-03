import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';

/**
 * Componente: RecipeDetail (Detalle de Receta)
 * --------------------------------------------
 * Visualiza la página completa de un platillo específico usando su ID de la URL (`useParams`).
 * Renderiza dinámicamente:
 * - Listas parseadas de JSON para ingredientes y pasos.
 * - Una sección social unificada donde los usuarios envían Reseñas y Calificaciones (★).
 * - Componentes flotantes lógicos para "Like" y "Guardar".
 */
export default function RecipeDetail() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    
    const [recipe, setRecipe] = useState(null);
    const [relatedRecipes, setRelatedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [commentContent, setCommentContent] = useState('');
    const [guestName, setGuestName] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [hoverStar, setHoverStar] = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/api/recipes/${id}`);
                if (data.success) {
                    setRecipe(data.data);
                    
                    if (data.data.user_rating) {
                        setSelectedStar(Number(data.data.user_rating));
                    }

                    // Fetch related recipes from same category
                    if (data.data.category_id) {
                        const related = await api.get(`/api/recipes?category=${data.data.category_id}&limit=3`);
                        if (related.data.success) {
                            setRelatedRecipes(related.data.data.filter(r => r.id.toString() !== id).slice(0, 3));
                        }
                    }
                } else {
                    setError('Receta no encontrada');
                }
            } catch {
                setError('Error al cargar la receta');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, [id]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedStar > 0 && !user) {
            return alert('Debes iniciar sesión para poder calificar con estrellas.');
        }

        setSubmittingComment(true);
        try {
            if (editingCommentId) {
                // 1. Put Comment (Update)
                const commentRes = await api.put(`/api/comments/${editingCommentId}`, { content: commentContent });
                if (commentRes.data.success) {
                    if (selectedStar > 0 && user) {
                        try {
                            await api.post('/api/ratings', { recipe_id: id, score: selectedStar });
                        } catch (err) {
                            console.error('Error saving rating', err);
                        }
                    }
                    alert('¡Comentario y calificación actualizados!');
                    
                    const { data } = await api.get(`/api/recipes/${id}`);
                    if (data.success) setRecipe(data.data);

                    setCommentContent('');
                    setSelectedStar(0);
                    setEditingCommentId(null);
                } else {
                    alert(commentRes.data.message || 'Error al actualizar.');
                }
            } else {
                // 1. Post Comment (Create)
                const params = {
                    recipe_id: id,
                    content: commentContent,
                    guest_name: user ? undefined : guestName
                };
                
                const commentRes = await api.post('/api/comments', params);

                if (commentRes.data.success) {
                    // 2. Post Rating if selected
                    if (selectedStar > 0 && user) {
                        try {
                            await api.post('/api/ratings', { recipe_id: id, score: selectedStar });
                        } catch (err) {
                            if (err.response?.status !== 409) {
                                console.error('Error saving rating', err);
                            }
                        }
                    }
                    
                    alert('¡Comentario y calificación enviados con éxito!');
                    
                    // Refresh data manually
                    const { data } = await api.get(`/api/recipes/${id}`);
                    if (data.success) setRecipe(data.data);

                    setCommentContent('');
                    setGuestName('');
                    setSelectedStar(0);
                } else {
                    alert(commentRes.data.message || 'Error al enviar el comentario.');
                }
            }
        } catch {
            alert('Error de red al enviar.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleEditComment = (comment) => {
        setCommentContent(comment.content);
        if (comment.rating_score) setSelectedStar(Number(comment.rating_score));
        setEditingCommentId(comment.id);
        window.scrollTo({ top: document.getElementById('comment-form').offsetTop - 100, behavior: 'smooth' });
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('¿Seguro que deseas eliminar este comentario? Su calificación también será removida.')) return;
        try {
            const res = await api.delete(`/api/comments/${commentId}`);
            if (res.data.success) {
                // Opcionalmente borrar también el rating si el usuario quiere borrar todo
                await api.delete(`/api/ratings/${id}`).catch(() => {});
                
                alert('Comentario eliminado');
                if (editingCommentId === commentId) {
                    setEditingCommentId(null);
                    setCommentContent('');
                    setSelectedStar(0);
                }
                
                const { data } = await api.get(`/api/recipes/${id}`);
                if (data.success) {
                    setRecipe(data.data);
                    setSelectedStar(0);
                }
            } else {
                alert(res.data.message);
            }
        } catch {
            alert('Error al conectar con el servidor.');
        }
    };

    const handleRemoveRating = async () => {
        if (!user) return;
        if (!window.confirm('¿Seguro que deseas eliminar tu calificación?')) return;
        
        try {
            const res = await api.delete(`/api/ratings/${id}`);
            if (res.data.success) {
                alert('Calificación eliminada');
                setSelectedStar(0);
                
                // Refresh data manually
                const { data } = await api.get(`/api/recipes/${id}`);
                if (data.success) {
                    setRecipe(data.data);
                    setSelectedStar(0); // Asegurar que quite las estrellas localmente
                }
            } else {
                alert(res.data.message || 'Error al eliminar la calificación.');
            }
        } catch {
            alert('Error al conectar con el servidor.');
        }
    };

    const handleLike = async () => {
        if (!user) return alert('Debes iniciar sesión para dar like.');
        setIsLiking(true);
        try {
            const { data } = await api.post(`/api/recipes/${id}/like`);
            if (data.success) {
                setRecipe(prev => ({
                    ...prev,
                    is_liked: data.action === 'added' ? 1 : 0,
                    likes_count: data.likes_count
                }));
            }
        } catch {
            alert('Error al dar like. Verifica tu conexión.');
        } finally {
            setIsLiking(false);
        }
    };

    const handleSave = async () => {
        if (!user) return alert('Debes iniciar sesión para guardar recetas.');
        setIsSaving(true);
        try {
            const { data } = await api.post(`/api/recipes/${id}/save`);
            if (data.success) {
                setRecipe(prev => ({
                    ...prev,
                    is_saved: data.saved ? 1 : 0
                }));
            }
        } catch {
            alert('Error al guardar. Verifica tu conexión.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[70vh]">
            <div className="animate-pulse flex space-x-3">
                <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
            </div>
        </div>
    );

    if (error || !recipe) return (
        <div className="max-w-xl mx-auto mt-20 p-12 bg-gray-50 rounded-3xl text-center border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Platillo no disponible</h2>
            <p className="text-gray-500 mb-8">{error}</p>
            <Link to="/" className="inline-block px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors shadow-sm cursor-pointer">
                Volver al Inicio
            </Link>
        </div>
    );

    let parsedIngredients = [];
    let parsedSteps = [];
    try {
        if (recipe.ingredients) parsedIngredients = JSON.parse(recipe.ingredients);
        if (recipe.steps) parsedSteps = JSON.parse(recipe.steps);
    } catch (e) {
        // Fallback si no era JSON
        if (typeof recipe.ingredients === 'string') parsedIngredients = [recipe.ingredients];
        if (typeof recipe.steps === 'string') parsedSteps = [recipe.steps];
    }

    return (
        <article className="max-w-5xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 pb-20">
            {/* Header / Imagen grande */}
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-sm mb-12 bg-gray-100 group animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <img 
                    src={recipe.main_image || 'https://via.placeholder.com/1200x600?text=Plato'} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover grayscale opacity-90 transition-all duration-1000 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                />
            </div>

            <div className="max-w-3xl mx-auto text-center mb-16 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                {recipe.category_name && (
                    <span className="inline-block px-4 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium mb-6">
                        {recipe.category_name}
                    </span>
                )}
                
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                    {recipe.title}
                </h1>
                
                <p className="text-xl text-gray-500 font-light leading-relaxed mb-8">
                    {recipe.description}
                </p>

                <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600 mt-8 pt-8 border-t border-gray-100 font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden text-gray-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </div>
                        <span>Por <Link to={`/user/${recipe.user_id}`} className="text-gray-900 hover:underline">{recipe.author_name}</Link></span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{recipe.prep_time || '30 min'}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-auto">
                         <button 
                            onClick={handleLike}
                            disabled={isLiking}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all ${
                                recipe.is_liked 
                                ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <svg className="w-5 h-5" fill={recipe.is_liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            {recipe.likes_count || 0}
                        </button>
                        
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all ${
                                recipe.is_saved 
                                ? 'bg-gray-900 border-gray-900 text-white shadow-sm' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                             <svg className="w-5 h-5" fill={recipe.is_saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                             {recipe.is_saved ? 'Guardado' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout principal dividido en dos columnas en Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16 pt-16 border-t border-gray-100">
                
                {/* Ingredientes (Sidebar Izquierdo) */}
                <div className="lg:col-span-4 order-2 lg:order-1 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                    <div className="sticky top-8 bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            Ingredientes
                        </h3>
                        {parsedIngredients.length > 0 ? (
                            <ul className="space-y-4">
                                {parsedIngredients.map((ing, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-gray-700 leading-relaxed font-light">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></span>
                                        <span>{ing}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 italic font-light">No hay ingredientes listados.</p>
                        )}
                    </div>
                </div>

                {/* Pasos de Preparación (Columna Principal) */}
                <div className="lg:col-span-8 order-1 lg:order-2 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Preparación Paso a Paso</h2>
                    {parsedSteps.length > 0 ? (
                        <div className="space-y-10">
                            {parsedSteps.map((step, idx) => (
                                <div key={idx} className="flex gap-6">
                                    <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white font-bold text-lg shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="pt-1.5">
                                        <p className="text-lg text-gray-700 leading-relaxed font-light">
                                            {step}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed whitespace-pre-line">
                            {/* Fallback si los pasos no están en JSON sino en la pura descp */}
                            No hay pasos detallados.
                        </div>
                    )}

                    {/* Sección de Comentarios y Ratings */}
                    <div className="mt-20 pt-16 border-t border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <h3 className="text-xl font-bold text-gray-900">Comentarios y Calificación</h3>
                            
                            {/* Animated Star Rating UI */}
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-full border border-gray-100 shadow-sm">
                                    <span className="text-sm font-bold tracking-widest uppercase text-gray-900">
                                        {recipe.ratings_avg ? parseFloat(recipe.ratings_avg).toFixed(1) : 'Sin votos'}
                                    </span>
                                    <div className="flex items-center gap-1" onMouseLeave={() => setHoverStar(0)}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button 
                                                key={star} 
                                                type="button"
                                                onMouseEnter={() => setHoverStar(star)}
                                                onClick={() => {
                                                    if (!user) return alert('Debes iniciar sesión para calificar.');
                                                    setSelectedStar(star);
                                                }}
                                                className={`text-2xl leading-none focus:outline-none transition-all duration-300 transform ${
                                                    (hoverStar >= star || selectedStar >= star)
                                                    ? 'text-yellow-400 scale-125 drop-shadow-md' 
                                                    : 'text-gray-300 hover:text-yellow-300'
                                                }`}
                                                title={`Calificar con ${star} estrellas`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {recipe.user_rating > 0 && user && (
                                    <button 
                                        type="button" 
                                        onClick={handleRemoveRating} 
                                        className="text-xs text-red-500 font-medium hover:underline mr-4"
                                    >
                                        Quitar mi calificación
                                    </button>
                                )}
                            </div>
                        </div>

                        <div id="comment-form" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm mb-12">
                            <form onSubmit={handleCommentSubmit} className="space-y-4">
                                {editingCommentId && (
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                                            Modo Edición
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setEditingCommentId(null);
                                                setCommentContent('');
                                                setSelectedStar(0);
                                                if (recipe.user_rating) setSelectedStar(Number(recipe.user_rating));
                                            }}
                                            className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                                        >
                                            Cancelar edición
                                        </button>
                                    </div>
                                )}
                                {!user && (
                                    <div>
                                        <input 
                                            type="text" 
                                            required 
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            placeholder="Tu Nombre"
                                            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-base focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-50 outline-none transition-all"
                                        />
                                    </div>
                                )}
                                <div>
                                    <textarea 
                                        required 
                                        rows="3" 
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder={user ? "Escribe tu opinión de esta receta..." : "Comenta..."}
                                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-base focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-50 outline-none resize-y transition-all"
                                    ></textarea>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button 
                                        type="submit" 
                                        disabled={submittingComment}
                                        className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
                                    >
                                        {submittingComment ? 'Publicando...' : 'Publicar Comentario'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        {/* Lista de Comentarios Publicados */}
                        <div className="space-y-6">
                            {recipe.comments && recipe.comments.length > 0 ? (
                                recipe.comments.map(comment => (
                                    <div key={comment.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex gap-4 animate-fade-in">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                                            {comment.avatar_url ? (
                                                <img src={comment.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                (comment.user_name || comment.guest_name || 'A').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-baseline justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-900">{comment.user_name || comment.guest_name || 'Anónimo'}</h4>
                                                    {comment.rating_score && (
                                                        <span className="text-yellow-400 text-sm tracking-wider flex items-center font-bold">
                                                            ★ {comment.rating_score}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {user && user.id == comment.user_id && (
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => handleEditComment(comment)}
                                                                className="text-xs text-blue-500 font-medium hover:underline"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="text-xs text-red-500 font-medium hover:underline"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        {new Date(comment.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 font-light leading-relaxed">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 font-light text-center py-6">Aún no hay comentarios. ¡Sé el primero en opinar!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recetas Relacionadas */}
            {relatedRecipes.length > 0 && (
                <div className="mt-24 pt-16 border-t border-gray-100">
                     <h2 className="text-2xl font-bold text-gray-900 mb-8">Te Podría Gustar</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {relatedRecipes.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} layout="compact" />
                        ))}
                     </div>
                </div>
            )}
        </article>
    );
}
