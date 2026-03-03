import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateRecipe from './pages/CreateRecipe';
import MyRecipes from './pages/MyRecipes';
import EditRecipe from './pages/EditRecipe';
import RecipeDetail from './pages/RecipeDetail';
import UserProfile from './pages/UserProfile';

/**
 * Componente Principal (App.jsx)
 * -----------------------------
 * Intercepta y coordina todo el SPA (Single Page Application).
 * Integra tres capas estructurales:
 * 1. El Router (Navegación general sin recargar la página web).
 * 2. AuthProvider (Envuelve todos los componentes proveyéndoles estado de autenticación JWT vivo).
 * 3. Las Rutas Individuales donde cruzan componentes como `UserProfile`, `RecipeDetail` o `Home`.
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/crear-receta" element={<CreateRecipe />} />
              <Route path="/mis-recetas" element={<MyRecipes />} />
              <Route path="/editar-receta/:id" element={<EditRecipe />} />
              <Route path="/receta/:id" element={<RecipeDetail />} />
              <Route path="/user/:id" element={<UserProfile />} />
            </Routes>
          </main>
          
          <footer className="bg-white border-t border-gray-100 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400 font-medium tracking-widest uppercase flex flex-col items-center gap-2">
              <p>JIMENEZ PREGO STANLEY ROMAN</p>
              <p>FLORES DENEGRI ALAN ELIHU</p>
              <p>RUIZ TILLIT KEVIN JAVIER</p>
              <p className="mt-4 text-gray-300">© {new Date().getFullYear()} Sistema de Recetas Laravel</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
