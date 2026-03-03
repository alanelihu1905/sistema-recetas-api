#  Sistema de Recetas Laravel - Arquitectura Stateless (PHP + React)

**Universidad / Proyecto Académico 2026**

Bienvenido al directorio raíz del proyecto **Sistema de Recetas Laravel**.

Este repositorio contiene una aplicación web completa dividida en dos ecosistemas independientes (Frontend y Backend) que se comunican exclusivamente a través de una API REST protegida por **JSON Web Tokens (JWT)**. No se utilizan sesiones nativas de servidor (Stateless), asegurando una escalabilidad moderna.

---

##  Estructura del Proyecto

El proyecto está separado intencionalmente en dos carpetas principales para mantener una arquitectura limpia:

1. **`backend-recetas/`**:
   Contiene todo el núcleo del servidor. Desarrollado en **PHP Puro** (estilo PDO, MVC) sin frameworks pesados, exponiendo endpoints RESTful. Aquí se gestiona la conexión a MySQL, el enrutador customizado y la firma criptográfica de los JWT.
    _Para detalles técnicos de la API, lee su [README interno](backend-recetas/README.md)._

2. **`frontend-recetas/`**:
   Contiene la interfaz de usuario. Desarrollada con **React 18 + Vite** y estilizada con **TailwindCSS**. Consume la API del backend inyectando el token JWT en cada cabecera HTTP utilizando Axios.
    _Para detalles del diseño UI/UX, lee su [README interno](frontend-recetas/README.md)._

---

##  Despliegue Rápido (Modo Evaluación)

Pensando en la facilidad de revisión para docentes y evaluadores, hemos incluido un script de auto-arranque `start.sh` en la raíz del proyecto. Este script se encarga de todo el trabajo pesado.

### Requisitos Previos

- **PHP 8+** (Instalado y en el PATH del sistema).
- **Composer** (Para instalar dependencias de PHP como `firebase/php-jwt`).
- **Node.js y NPM** (Para instalar y correr React).
- **Servidor MySQL** (XAMPP, MAMP, DBeaver, etc.).

### Pasos para iniciar:

1. **Base de Datos:**
   Abre tu gestor MySQL y crea una base de datos vacía llamada `recetas_db`. Luego, importa el archivo `recetas_db.sql` que se encuentra en la raíz temporal del proyecto (o bien, corre el `seeder.php` del backend si tienes configurado el entorno).

2. **Ejecutar el Script Mágico:**
   Abre una terminal en esta carpeta raíz (donde estás leyendo esto) y ejecuta:
   ```bash
   ./start.sh
   ```

**¿Qué hace `start.sh` por ti?**

- Verifica si falta el archivo `.env` en el backend y lo crea a partir del `.example`.
- Verifica si falta el archivo `.env` en el frontend pre-configurándolo al puerto `8000`.
- Si detecta que faltan dependencias, ejecuta automáticamente `composer install` y `npm install` donde corresponda.
- Levanta el servidor Backend (PHP) en segundo plano (`http://127.0.0.1:8000`).
- Levanta el servidor Frontend (Vite) en primer plano para mostrar los logs de la interfaz (`http://localhost:5173`).

Todo quedará listo para usar con un solo comando. Presiona `Ctrl+C` en la terminal para apagar ambos servidores simultáneamente de manera limpia.

---

##  Créditos y Autores

Este desarrollo, desde el diseño de la base de datos hasta la estilización minimalista en React, fue construido por:

- **JIMENEZ PREGO STANLEY ROMAN**
- **FLORES DENEGRI ALAN ELIHU**
- **RUIZ TILLIT KEVIN JAVIER**
