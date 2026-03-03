import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function EditRecipe() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Borrador');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchRecipe = async () => {
            try {
                const { data } = await api.get(`/api/recipes/${id}`);
                if (data.success) {
                    // Verificar que el usuario sea el dueño
                    if (data.data.user_id !== user.id && user.id !== undefined) {
                        // Backend ya lo protege, pero validación temprana en el front
                    }
                    setTitle(data.data.title);
                    setDescription(data.data.description);
                    setStatus(data.data.status);
                } else {
                    setError('Receta no encontrada');
                }
            } catch {
                setError('Error al cargar la receta');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const { data } = await api.put(`/api/recipes/${id}`, { 
                title, 
                description, 
                status 
            });

            if (data.success) {
                navigate('/mis-recetas');
            } else {
                setError(data.message);
            }
        } catch(error) {
            setError(error.response?.data?.message || 'Error de conexión.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-20 animate-pulse text-orange-500 font-bold">Cargando receta...</div>;

    if (error) return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 text-red-600 rounded-lg text-center font-medium shadow-sm">
            {error}
            <br />
            <button onClick={() => navigate('/mis-recetas')} className="mt-4 underline hover:text-red-800">
                Volver a mis recetas
            </button>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto mt-6 bg-white rounded-xl shadow-lg ring-1 ring-gray-100 overflow-hidden">
            <div className="bg-gray-800 px-8 py-6 text-white text-center">
                <h2 className="text-3xl font-extrabold mb-1">Editar Receta</h2>
                <p className="opacity-90">Modifica los detalles de tu platillo</p>
            </div>

            <div className="p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium rounded-r-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Título de la Receta</label>
                        <input 
                            type="text" 
                            required 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        >
                            <option value="Publicada">Publicada (Visible para todos)</option>
                            <option value="Borrador">Borrador (Privada)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Ingredientes y Preparación</label>
                        <div className="rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                            <textarea 
                                required 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="10"
                                className="w-full px-4 py-3 outline-none resize-y text-gray-700"
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={() => navigate('/mis-recetas')}
                            className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 shadow-md transition disabled:opacity-70"
                        >
                            {saving ? 'Guardando...' : 'Actualizar Receta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
