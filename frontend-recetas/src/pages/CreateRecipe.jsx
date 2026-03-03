import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Componente: CreateRecipe (Creador de Recetas)
 * ---------------------------------------------
 * Interfaz tipo "Wizard" para documentar paso a paso un nuevo platillo.
 * Transforma Arrays dinámicos incrementables (Ingredientes/Pasos) en Strings JSON.
 * Convierte el archivo de imagen adjunto a formato texto en crudo (`Base64`) para subirlo ligero a DB.
 */
export default function CreateRecipe() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [prepTime, setPrepTime] = useState('30 min');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('Publicada');
    
    // Arrays para ingredientes y pasos
    const [ingredients, setIngredients] = useState(['']);
    const [steps, setSteps] = useState(['']);
    
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [categories, setCategories] = useState([]);
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
             const res = await api.get('/api/categories');
             if (res.data.success) {
                 setCategories(res.data.data);
             }
        };
        fetchCategories();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('La imagen no puede pesar más de 2MB');
                setImage(null);
                setImagePreview(null);
                return;
            }
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIngredientChange = (index, value) => {
        const newIng = [...ingredients];
        newIng[index] = value;
        setIngredients(newIng);
    };

    const addIngredient = () => setIngredients([...ingredients, '']);
    const removeIngredient = (index) => {
        if (ingredients.length > 1) {
            setIngredients(ingredients.filter((_, i) => i !== index));
        }
    };

    const handleStepChange = (index, value) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };

    const addStep = () => setSteps([...steps, '']);
    const removeStep = (index) => {
        if (steps.length > 1) {
            setSteps(steps.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Clean empty strings
            const cleanIngredients = ingredients.filter(i => i.trim() !== '');
            const cleanSteps = steps.filter(s => s.trim() !== '');
            
            const payload = {
                title,
                description,
                prep_time: prepTime,
                status,
                ingredients: JSON.stringify(cleanIngredients),
                steps: JSON.stringify(cleanSteps),
                category_id: category || null,
                image: image || null
            };

            const { data } = await api.post('/api/recipes', payload);

            if (data.success) {
                navigate('/');
            } else {
                setError(data.message);
            }
        } catch(error) {
            setError(error.response?.data?.message || 'Error de conexión. Verifica que tengas el Token.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto my-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 animate-fade-in-up">
                <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Nueva Receta</h1>
                <p className="text-gray-500 font-light">Escribe, comparte e inspira a otros cocineros.</p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-medium shadow-sm animate-fade-in">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* Bloque 1: Información Básica */}
                <div className="bg-gray-50 p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">1</span>
                        Información Básica
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Título del Platillo</label>
                            <input 
                                type="text" 
                                required 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all placeholder:text-gray-300"
                                placeholder="Ej. Ensalada César Auténtica"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Breve Descripción</label>
                            <textarea 
                                required 
                                rows="2"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all placeholder:text-gray-300 resize-none"
                                placeholder="Un resumen apetitoso de esta receta..."
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiempo de Prep.</label>
                                <input 
                                    type="text" 
                                    value={prepTime}
                                    onChange={(e) => setPrepTime(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all placeholder:text-gray-300"
                                    placeholder="Ej. 45 min"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all"
                                >
                                    <option value="">Ninguna</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Visibilidad</label>
                                <select 
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all"
                                >
                                    <option value="Publicada">Pública</option>
                                    <option value="Borrador">Privada (Borrador)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bloque 2: Ingredientes */}
                <div className="bg-gray-50 p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                     <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">2</span>
                        Ingredientes
                    </h2>
                    
                    <div className="space-y-4">
                        {ingredients.map((ing, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-gray-400 w-6 shrink-0 text-center text-sm font-medium">{idx + 1}.</span>
                                <input 
                                    type="text"
                                    value={ing}
                                    onChange={(e) => handleIngredientChange(idx, e.target.value)}
                                    placeholder="Ej. 2 tazas de harina"
                                    className="flex-grow px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all placeholder:text-gray-300"
                                />
                                <button type="button" onClick={() => removeIngredient(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-2">✕</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addIngredient} className="mt-6 text-[length:var(--btn-text)] tracking-widest uppercase font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm">
                        <span>+</span> Agregar Ingrediente
                    </button>
                </div>

                {/* Bloque 3: Preparación */}
                <div className="bg-gray-50 p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                     <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">3</span>
                        Preparación
                    </h2>
                    
                    <div className="space-y-4">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3">
                                <span className="text-gray-400 w-6 shrink-0 text-center text-sm font-medium mt-3">{idx + 1}.</span>
                                <textarea 
                                    rows="2"
                                    value={step}
                                    onChange={(e) => handleStepChange(idx, e.target.value)}
                                    placeholder="Instrucciones para este paso..."
                                    className="flex-grow px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all placeholder:text-gray-300 resize-none"
                                />
                                <button type="button" onClick={() => removeStep(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-2 mt-2 self-start">✕</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addStep} className="mt-6 text-[length:var(--btn-text)] tracking-widest uppercase font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 text-sm">
                        <span>+</span> Agregar Paso
                    </button>
                </div>

                {/* Bloque 4: Imagen Principal */}
                <div className="bg-gray-50 p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                     <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">4</span>
                        Fotografía
                    </h2>
                    
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-gray-50 transition-colors relative overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover absolute inset-0 z-0" />
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <p className="mb-2 text-sm text-gray-500 font-medium tracking-wide">Haz clic o arrastra para subir una imagen</p>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">JPG, PNG o WEBP (Max. 2MB)</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange}
                            />
                            {imagePreview && (
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10 backdrop-blur-sm">
                                    <span className="text-white font-medium bg-black/60 px-6 py-2 rounded-full tracking-wider text-sm uppercase">Cambiar Imagen</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Submits */}
                <div className="flex justify-end gap-4 pt-4 pb-12 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                    <button 
                        type="button" 
                        onClick={() => navigate('/')}
                        className="px-8 py-4 font-semibold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-green-700 text-white font-semibold py-4 px-10 rounded-full hover:bg-green-800 transition-all shadow-md disabled:opacity-50"
                    >
                        {isLoading ? 'Publicando...' : 'Publicar Receta'}
                    </button>
                </div>
            </form>
        </div>
    );
}
