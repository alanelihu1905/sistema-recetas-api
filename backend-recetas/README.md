#  Sistema de Recetas Stateless (JWT) - Arquitectura PHP/React

Bienvenido al Backend y API de **Sistema de Recetas**, un proyecto académico y profesional de arquitectura **Stateless** desarrollado con PHP crudo, PDO (MySQL) y ReactJS.

Este repositorio demuestra la separación completa entre frontend y backend, implementando mecanismos de seguridad modernos como JSON Web Tokens (JWT) para la sesión y peticiones asíncronas REST.

---

##  Tecnologías Empleadas

### Backend (Esta Carpeta)

- **Lenguaje:** PHP 8+ (Estilo PDO Puro, sin frameworks pesados).
- **Base de Datos:** MySQL (Relacional).
- **Enrutador:** Implementación Propia Estática (`core/Router.php`).
- **Seguridad y Sesiones:** `firebase/php-jwt` para autenticación verdaderamente Stateless.
- **Diseño:** MVC Simplificado (Models y Controllers separados).

### Frontend (Ubicado en `/frontend-recetas`)

- **Framework:** React 18 / Vite.
- **Estilos:** TailwindCSS.
- **Manejo de HTTP:** Axios interceptando inyecciones de tokens.
- **Ruteo:** React Router DOM (Manejo privado de rutas protegido por JWT).

---

##  Instrucciones de Instalación Rápida (Para Evaluadores)

Para correr este proyecto limpiamente y sin errores, por favor siga estos pasos al pie de la letra, o simplemente ejecute el comando `./start.sh` de la raíz del proyecto.

1.  **Copie el archivo de Entorno:**
    Duplique el archivo `.env.example` en esta misma carpeta y renómbrelo como `.env`.
    En sistemas Unix puede ejecutar: `cp .env.example .env`

2.  **Instale las Dependencias PHP (Composer):**
    Esta API depende de JWT (JSON Web Tokens). Deben descargarse las librerías utilizando Composer (Si no lo tiene, descárguelo de getcomposer.org):

    ```bash
    composer install
    ```

3.  **Prepare la Base de Datos MySQL:**
    Abra su cliente SQL favorito (ej: XAMPP, phpMyAdmin, DBeaver).
    - Cree una base de datos con el nombre: `recetas_db`.
    - Cargue el Backup SQL adjunto en el proyecto (`recetas_db.sql`) para importar la estructura de las tablas, o alternativamente corra el archivo `seeder.php` si la base ya existe y desea llenarla de cientos de datos ficticios Base64 súper estéticos.

4.  **Encienda la API REST PHP:**
    ```bash
    cd public
    php -S 127.0.0.1:8000 server.php
    ```
    _Nota: El servidor debe apuntar en el puerto 8000 porque el Frontend (React) está programado para conectarse allí._

---

##  Sistema de Tokens JWT (Stateless)

Este sistema **no utiliza** Variables de Sesión PHP (`$_SESSION`), Cookies clásicas, ni guarda estados de conexión en la memoria del servidor.
En cambio, al iniciar sesión (`Auth::login`), el servidor firma un **JSON Web Token (JWT)**, el cual cuenta con un período de expiración programado y viaja codificado en la estructura de red del usuario.

El Frontend de React aloja temporalmente ese Token protegido y lo anexa obligatoriamente a cada cabecera HTTP (Headers -> Authorization: Bearer <token>) siempre que solicita datos privados (Ej: Perfil, Likes, Guardar Receta).

Si el Token expira o fue manipulado (firma criptográfica no avalada), el sistema lo rechaza y exige relogueo automático, haciendo esto inmensamente escalable.

---

### Alumnos a cargo de este desarrollo:

- JIMENEZ PREGO STANLEY ROMAN
- FLORES DENEGRI ALAN ELIHU
- RUIZ TILLIT KEVIN JAVIER

© 2026 - Universidad / Proyecto Académico.
