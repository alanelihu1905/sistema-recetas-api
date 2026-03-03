const fs = require('fs');

const bgColors = ['#Ef4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16'];

// Pequeños placeholders Base64 reales de comida para darle realismo a la BD
// Por ser un seeder enorme usaremos pequeños GIFs de 1x1 coloridos o Base64 ultra comprimidos para categorias clave
const realFoodBase64 = {
    "Pizza": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=", // Placeholder simulado para no romper el IDE
    "Asado": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
    "Sushi": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
    "Ensalada": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
};

function getSvgBase64(text, isAvatar = false, recipeType = "") {
    // Si la receta tiene un tipo especial con foto y no es avatar, intentar mandarle algo que no sea SVG.
    // OJO: Como las verdaderas fotos pesan megabytes y harían crashear este JS al iterar 200 veces, 
    // seguiremos con la estrategia de los Posters SVG dinámicos o bien una imagen simulada real si tuviéramos el string a mano.
    
    // Para motivos de evaluación académica masiva (200 registros):
    const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
    const width = isAvatar ? 300 : 800;
    const height = isAvatar ? 300 : 600;
    const fontSize = isAvatar ? 100 : 45;
    
    let displayText = text;
    if (!isAvatar && displayText.length > 25) {
        displayText = displayText.substring(0, 25) + '...';
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="50%" y="50%" font-family="sans-serif" font-size="${fontSize}" fill="white" dominant-baseline="middle" text-anchor="middle" font-weight="bold">${displayText}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const adjetivos = ["Delicioso", "Crujiente", "Esponjoso", "Picante", "Dulce", "Salado", "Gourmet", "Casero", "Rapido", "Saludable", "Tradicional", "Exotico"];
const platillos = ["Pastel", "Taco", "Sushi", "Ensalada", "Sopa", "Pasta", "Pizza", "Ceviche", "Hamburguesa", "Asado", "Batido", "Galleta"];
const complementos = ["de Chocolate", "al Pastor", "con Salmón", "Mediterránea", "de Tomate", "Bolognesa", "Margarita", "Peruano", "con Queso", "de Res", "de Fresa", "de Avena"];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const users = [];
for (let i = 1; i <= 20; i++) {
    const name = `Chef Produccion ${i}`;
    const initials = `CP${i}`;
    users.push({
        id: i,
        name: name,
        email: `chef${i}@recetario.com`,
        password: 'password123',
        bio: 'Amante de la gastronomía y creador de recetas increíbles generadas masivamente.',
        avatar_url: getSvgBase64(initials, true),
    });
}

const categories = ["Desayuno", "Almuerzo", "Cena", "Postre", "Bebida", "Snack", "Vegetariano", "Vegano", "Gluten-Free", "Rápido", "Fiestas", "Sopas"];

const recipes = [];
for (let i = 1; i <= 200; i++) {
    const title = `${getRandomItem(adjetivos)} ${getRandomItem(platillos)} ${getRandomItem(complementos)}`;
    const numCats = Math.floor(Math.random() * 3) + 1;
    const recipeCats = [];
    for(let j=0; j<numCats; j++){
       recipeCats.push(getRandomItem(categories));
    }

    recipes.push({
        user_id: Math.floor(Math.random() * 20) + 1,
        title: title,
        description: `Esta es una receta increíble de ${title}. Perfecta para sorprender a tu familia o disfrutar en una tarde tranquila. Preparada paso a paso.`,
        prep_time: `${Math.floor(Math.random() * 90) + 10} min`,
        ingredients: JSON.stringify([
            `200g de ${getRandomItem(["Harina", "Arroz", "Pollo", "Carne", "Pescado", "Fideos"])}`,
            `1 pizca de ${getRandomItem(["Sal", "Pimienta", "Orégano", "Comino"])}`,
            `1 taza de ${getRandomItem(["Agua", "Leche", "Caldo", "Crema"])}`,
            `2 cucharadas de ${getRandomItem(["Aceite de oliva", "Mantequilla", "Salsa de Soya"])}`
        ]),
        steps: JSON.stringify([
            "Preparar todos los ingredientes sobre la mesa de trabajo asegurando frescura.",
            "Mezclar vigorosamente los ingredientes secos con los líquidos hasta obtener consistencia.",
            "Cocinar a fuego medio durante el tiempo especificado cuidando no quemar los bordes.",
            "Dejar reposar 5 minutos antes de emplatar. Servir caliente."
        ]),
        main_image: getSvgBase64(title, false),
        status: 'Publicada',
        categories_assigned: [...new Set(recipeCats)],
    });
}

const seederData = { users, categories, recipes };
fs.writeFileSync('/Users/alanflores/Documents/sistema-recetas-api/backend-recetas/seeder_payload.json', JSON.stringify(seederData, null, 2));
console.log(`Generado seeder_payload.json con ${recipes.length} recetas en formato BASE64 SVG Estético.`);
