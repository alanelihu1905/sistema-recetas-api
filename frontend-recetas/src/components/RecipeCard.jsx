import { Link, useNavigate } from 'react-router-dom';

export default function RecipeCard({ recipe }) {
    const navigate = useNavigate();
    // Si no hay imagen, usamos un placeholder genérico
    const placeholder = 'https://via.placeholder.com/400x300?text=Plato+Delicioso';
    const imageUrl = recipe.main_image || placeholder;

    const handleAuthorClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/user/${recipe.user_id}`);
    };

    return (
        <Link 
            to={`/receta/${recipe.id}`}
            className="group relative flex flex-col border border-gray-100 bg-white overflow-hidden hover:border-gray-900 transition-colors duration-300"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                <img 
                    src={imageUrl} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                />
                {recipe.category_name && (
                    <span className="absolute top-4 left-4 bg-white text-gray-900 text-[10px] uppercase tracking-widest px-3 py-1 font-bold">
                        {recipe.category_name}
                    </span>
                )}
            </div>
            
            <div className="p-5 flex flex-col h-full bg-white">
                <div className="mb-4">
                    <h3 className="text-lg font-light text-gray-900 line-clamp-1 group-hover:underline decoration-1 underline-offset-4">
                        {recipe.title}
                    </h3>
                    
                    <div className="mt-2 text-xs text-gray-400 uppercase tracking-widest">
                        Por <button type="button" onClick={handleAuthorClick} className="hover:text-gray-900 transition-colors cursor-pointer z-10 relative">{recipe.author_name}</button>
                    </div>
                </div>
                
                <div className="mt-auto flex justify-between items-center border-t border-gray-100 pt-4">
                    {recipe.ratings_avg && (
                        <span className="text-xs text-gray-500 tracking-widest">
                            {parseFloat(recipe.ratings_avg).toFixed(1)} *
                        </span>
                    )}
                    
                    <span className="text-gray-900 text-xs uppercase tracking-widest hover:text-gray-500 transition-colors">
                        Ver Detalle &rarr;
                    </span>
                </div>
            </div>
        </Link>
    );
}
