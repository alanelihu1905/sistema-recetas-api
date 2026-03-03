#  Frontend | Sistema de Recetas (React + Vite)

Este es el cliente web que consume la API del Sistema de Recetas (`backend-recetas`). Ha sido diseñado bajo un estricto principio minimalista monocromático, priorizando la claridad visual, los espacios en blanco y una experiencia de usuario sumamente pulida.

---

##  Stack Tecnológico

- **Librería Principal:** React JS 18.
- **Empaquetador y Build Server:** Vite.
- **Enrutador:** React Router DOM (v6).
- **Peticiones HTTP:** Axios (con interceptor automático para Inyección JWT).
- **Estilización (CSS):** TailwindCSS v3.
- **Íconos:** HeroIcons.

---

##  Cómo Instalar y Ejecutar (Entorno Local)

Si usted (como profesor o evaluador) está descargando el proyecto por primera vez, siga estos pasos:

1. **Abra una terminal en esta misma carpeta** (`/frontend-recetas`).
2. **Instale las dependencias de NodeJS:**
   ```bash
   npm install
   ```
3. **Configure la variable de entorno:**
   Por defecto, React necesita saber dónde vive el BackEnd. Genere (si no existe) un archivo llamado `.env` en donde escriba:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
4. **Inicie el Servidor de Desarrollo Rápido:**
   ```bash
   npm run dev
   ```
5. Esto levantará una ruta usualmente en `http://localhost:5173`. Ábrala en su navegador.

---

##  Arquitectura Frontend (Carpetas Clave)

Todos los desarrollos se encuentran aislados dentro de la subcarpeta `src/`.

### 1. `/context/AuthContext.jsx`

Es el cerebro del esquema "Stateless". Maneja el estado global del usuario (si está autenticado o no).

- Al hacer **login**, captura el JWT que envía el Backend PHP y lo almacena en el caché local (`localStorage`).
- Al salir o desconectarse, depura de golpe esa llave, "desconectando" instantáneamente el acceso a funciones protegidas.
- Si la sesión expira o el backend banea el Token, fuerza un cierre limpio para proteger la UI.

### 2. `/services/api.js`

Es la configuración centralizada de **Axios**. Se diseñó como un cliente global mediante _interceptors_:

```javascript
// interceptor de peticiones
api.interceptors.request.use((config) => {
  // Busca y agarra el token guardado...
  const token = localStorage.getItem("token");
  if (token) {
    // Y lo pega obligatoriamente a la Cabecera Authorization
    config.headers.Authorization = `Bearer ${token}`;
  }
});
```

### 3. `/components` y `/pages`

- **Componentes Reutilizables:** Piezas atómicas como `Navbar.jsx`, `RecipeCard.jsx` e insignias que construyen el puzzle gráfico.
- **Vistas Principales (`pages`):**
  - `Home.jsx` (Listado y Buscador unificado).
  - `RecipeDetail.jsx` (La receta estirada visualmente, sus ingredientes, pasos dinámicos, botones de guardado).
  - `UserProfile.jsx` (Red social minimalista).
  - `CreateRecipe.jsx` (Formulario estilo wizard).

---

##  Motor de Subidas de Imágenes (Base64)

Este Frontend ha erradicado la tradicional -y costosa- carga de binarios pesados (FormData Multipart) para simplificarse y asegurar compatibilidad perpetua. Todas las imágenes subidas por el File Picker en el Frontend se capturan, **se compilan en cadena Base64**, y así viajan directo el BackEnd sin colapsar el File System local del alumno o maestro.

---

### Alumnos a cargo del diseño Frontend:

- JIMENEZ PREGO STANLEY ROMAN
- FLORES DENEGRI ALAN ELIHU
- RUIZ TILLIT KEVIN JAVIER

© 2026 - Universidad / Proyecto Académico.
