import { useState, useEffect } from 'react';
import api from '../services/api';
import RecipeCard from '../components/RecipeCard';

/**
 * Componente: Home (Página Principal)
 * -----------------------------------
 * Renderiza el feed público de RecetarioLaravel. 
 * Efectúa peticiones múltiples en paralelo (Promise.all) al montar el componente para:
 * 1. Cargar "Trending" (Recetas Aleatorias/Populares).
 * 2. Cargar "Categorías" para hacer los filtros de botones circulares (Pills).
 * 3. Ejecutar la búsqueda paginada general del catálogo.
 */
export default function Home() {
    const [recipes, setRecipes] = useState([]);
    const [trending, setTrending] = useState([]);
    const [dailyPick, setDailyPick] = useState(null);
    const [categories, setCategories] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtros
    const [category, setCategory] = useState('');
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [catRes, trendRes, pickRes] = await Promise.all([
                    api.get('/api/categories'),
                    api.get('/api/recipes?sort=trending&limit=4'),
                    api.get('/api/recipes/recommended')
                ]);

                if (catRes.data.success) setCategories(catRes.data.data);
                if (trendRes.data.success) setTrending(trendRes.data.data.slice(0, 4));
                if (pickRes.data.success && pickRes.data.data.length > 0) {
                    setDailyPick(pickRes.data.data[0]);
                }
            } catch (err) {
                console.error("Error initial data", err);
                setError('Error al cargar la plataforma. Servidor inalcanzable.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const fetchRecipes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page });
            if (category) params.append('category', category);
            if (keyword) params.append('keyword', keyword);

            const res = await Promise.all([
                api.get(`/api/recipes?${params.toString()}`)
            ]);
            
            if (res[0].data.success) {
                setRecipes(res[0].data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, category, refreshKey]); // Agregamos refreshKey para forzar recargas sin cambiar filtros

    useEffect(() => {
        const handleReset = () => {
            setKeyword('');
            setCategory('');
            setPage(1);
            setRefreshKey(k => k + 1); // Forzar que fetchRecipes se vuelva a ejecutar
        };
        window.addEventListener('reset-home', handleReset);
        return () => window.removeEventListener('reset-home', handleReset);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setCategory(''); // Limpiar categoría para que la búsqueda sea global o mantenerla, en este caso la limpiamos 
        fetchRecipes();
    };

    const handleCategoryClick = (catId) => {
        setKeyword(''); // Limpiar keyword al clickear categoría
        if (category === catId) {
            setCategory(''); // toggle off
        } else {
            setCategory(catId);
        }
        setPage(1);
    };

    if (error) {
        return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-red-500 font-light">{error}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            
            {/* Cabecera Tipo Notion / Modern Strict */}
            <div className="mb-12 text-center animate-fade-in-up">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                    Descubre. Cocina. Disfruta.
                </h1>
                <p className="text-gray-500 text-lg md:text-xl font-light max-w-2xl mx-auto mb-10">
                    Explora una colección curada de platillos minimalistas para tu día a día.
                </p>
                
                {/* Buscador Simple */}
                <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group">
                    <input 
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Buscar por nombre, ingrediente o cocinero..."
                        className="w-full pl-6 pr-14 py-4 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:ring-4 focus:ring-gray-50 focus:border-gray-300 outline-none transition-all text-gray-700 placeholder:text-gray-400 font-medium"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-black transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-gray-900">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                </form>
            </div>

            {/* Categorías (Pills Dinámicas Minimalistas) */}
            <div className="flex overflow-x-auto pb-4 mb-12 gap-3 hide-scrollbar justify-center md:flex-wrap animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <button
                    onClick={() => handleCategoryClick('')}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                        category === '' 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    TODO
                </button>
                {categories.map(c => (
                    <button
                        key={c.id}
                        onClick={() => handleCategoryClick(c.id.toString())}
                        className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            category === c.id.toString() 
                            ? 'bg-gray-900 text-white border-gray-900' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Si no hay filtro ni búsqueda, mostrar For You y Trending */}
            {category === '' && keyword === '' && page === 1 && (
                <>
                    {/* For You Section */}
                    {dailyPick && (
                        <div className="mb-16 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-green-500 rounded-sm inline-block"></span>
                                For You
                            </h2>
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row group transition-all hover:shadow-md">
                                <div className="md:w-1/2 relative bg-gray-100 min-h-[350px]">
                                    {dailyPick.main_image ? (
                                        <img src={dailyPick.main_image} alt={dailyPick.title} className="w-full h-full object-cover absolute inset-0" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full absolute inset-0 text-gray-300">Sin imagen</div>
                                    )}
                                </div>
                                <div className="md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Recomendación del Chef</div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{dailyPick.title}</h3>
                                    <p className="text-gray-600 mb-8 line-clamp-3 text-lg font-light leading-relaxed">
                                        {dailyPick.description}
                                    </p>
                                    <div className="mt-auto">
                                        <a href={`/receta/${dailyPick.id}`} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gray-900 hover:bg-black transition-colors">
                                            Ver Receta Completa
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trending Section */}
                    {trending.length > 0 && (
                        <div className="mb-16 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-rose-500 rounded-sm inline-block"></span>
                                Trending
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {trending.map(recipe => (
                                    <RecipeCard key={recipe.id} recipe={recipe} layout="compact" />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Catálogo Feed */}
            <div className="mb-8 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
                        {keyword ? `Resultados para "${keyword}"` : category !== '' ? 'Resultados de Categoría' : 'Catálogo Completo'}
                    </h2>
                    {keyword && (
                        <button onClick={() => {setKeyword(''); fetchRecipes();}} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            Limpiar Búsqueda
                        </button>
                    )}
                </div>
                
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-pulse flex space-x-4 justify-center">
                            <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                            <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                            <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                        </div>
                    </div>
                ) : recipes.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-500 text-lg font-light mb-4">No encontramos recetas con estos filtros.</p>
                        <button onClick={() => setCategory('')} className="text-green-700 font-medium hover:underline">
                            Mostrar todas las recetas
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {recipes.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Paginación */}
            {!loading && recipes.length > 0 && (
                <div className="flex justify-center items-center mt-12 gap-4">
                    <button 
                        disabled={page === 1} 
                        onClick={() => setPage(p => p - 1)}
                        className="px-6 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors font-medium"
                    >
                        Anterior
                    </button>
                    <span className="text-gray-400 font-medium">Página {page}</span>
                    <button 
                        disabled={recipes.length < 8}
                        onClick={() => setPage(p => p + 1)}
                        className="px-6 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors font-medium"
                    >
                        Siguiente
                    </button>
                </div>
            )}
            
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
