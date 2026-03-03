<?php

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/core/Database.php';

echo ">> Conectando a Base de Datos...\n";
$db = \Core\Database::getInstance();

echo ">> Vaciando e Inicializando Tablas...\n";
$db->exec("SET FOREIGN_KEY_CHECKS = 0;");
$db->exec("TRUNCATE TABLE saved_recipes;");
$db->exec("TRUNCATE TABLE ratings;");
$db->exec("TRUNCATE TABLE comments;");
$db->exec("TRUNCATE TABLE likes;");
$db->exec("TRUNCATE TABLE recipe_category;");
$db->exec("TRUNCATE TABLE categories;");
$db->exec("TRUNCATE TABLE recipes;");
$db->exec("TRUNCATE TABLE users;");
$db->exec("SET FOREIGN_KEY_CHECKS = 1;");

echo ">> Leyendo payload masivo...\n";
$jsonString = file_get_contents(__DIR__ . '/seeder_payload.json');
$data = json_decode($jsonString, true);

// 2. Sembrar Usuarios
echo ">> Sembrando " . count($data['users']) . " Usuarios...\n";
$stmtUser = $db->prepare("INSERT INTO users (id, name, email, password, bio, avatar_url) VALUES (:id, :name, :email, :password, :bio, :avatar_url)");

// Hashear una sola vez por rendimiento
$defaultPassword = password_hash('password123', PASSWORD_BCRYPT);

foreach ($data['users'] as $u) {
    try {
        echo " -> Insertando User " . $u['id'] . "\n";
        $stmtUser->execute([
            ':id' => $u['id'],
            ':name' => $u['name'],
            ':email' => $u['email'],
            ':password' => $defaultPassword,
            ':bio' => $u['bio'],
            ':avatar_url' => $u['avatar_url']
        ]);
        echo "    Ok User " . $u['id'] . "\n";
    } catch (\Throwable $e) {
        echo "Error Fatal Mapeado User: " . $e->getMessage() . "\n";
    }
}

// 3. Sembrar Categorías
echo ">> Sembrando Categorías...\n";
$stmtCat = $db->prepare("INSERT INTO categories (name) VALUES (:n)");
foreach ($data['categories'] as $c) {
    $stmtCat->execute([':n' => $c]);
}

// Precargar categorías para relacionarlas
$stmtGetCats = $db->query("SELECT id, name FROM categories");
$catsMap = [];
while ($row = $stmtGetCats->fetch(PDO::FETCH_ASSOC)) {
    $catsMap[$row['name']] = $row['id'];
}

// 4. Sembrar Recetas
echo ">> Sembrando " . count($data['recipes']) . " Recetas y Relaciones...\n";
$stmtRec = $db->prepare("INSERT INTO recipes (user_id, title, description, prep_time, ingredients, steps, main_image, status) VALUES (:user_id, :title, :description, :prep_time, :ingredients, :steps, :main_image, :status)");
$stmtPivot = $db->prepare("INSERT INTO recipe_category (recipe_id, category_id) VALUES (:rId, :cId)");

foreach ($data['recipes'] as $r) {
    try {
        $stmtRec->execute([
            ':user_id' => $r['user_id'],
            ':title' => $r['title'],
            ':description' => $r['description'],
            ':prep_time' => $r['prep_time'],
            ':ingredients' => $r['ingredients'],
            ':steps' => $r['steps'],
            ':main_image' => $r['main_image'],
            ':status' => $r['status']
        ]);
        
        $newRecipeId = $db->lastInsertId();
        
        // Relacionar categorías (pivot)
        if (isset($r['categories_assigned'])) {
            foreach ($r['categories_assigned'] as $catName) {
                if (isset($catsMap[$catName])) {
                    $stmtPivot->execute([
                        ':rId' => $newRecipeId,
                        ':cId' => $catsMap[$catName]
                    ]);
                }
            }
        }
    } catch (PDOException $e) {
        echo "Error Receta: " . $e->getMessage() . "\n";
    }
}

// 5. Autogenerar "Likes", "Comentarios" y "Ratings" aleatorios para darle vida
echo ">> Sembrando Ratings, Comentarios y Red Social...\n";
$recipeIdsStmt = $db->query("SELECT id FROM recipes");
$recipeIds = $recipeIdsStmt->fetchAll(PDO::FETCH_COLUMN);

$stmtComment = $db->prepare("INSERT INTO comments (recipe_id, user_id, content) VALUES (:rId, :uId, :c)");
$stmtRating = $db->prepare("INSERT INTO ratings (recipe_id, user_id, score) VALUES (:rId, :uId, :s)");
$stmtLike = $db->prepare("INSERT INTO likes (recipe_id, user_id) VALUES (:rId, :uId)");

$commentsText = ["Me encantó esta receta, súper fácil!", "La probé el fin de semana y quedó de maravilla", "Súper nutritiva, la recomiendo 10/10", "A mi familia le fascina", "Gracias por compartir"];

foreach ($recipeIds as $rId) {
    // 1 a 5 interacciones aleatorias por receta
    $numInteractions = rand(1, 5);
    for ($i = 0; $i < $numInteractions; $i++) {
        $randUser = rand(1, 20); // Usuarios que insertamos del 1 al 20
        
        // A veces dan like
        if (rand(1, 100) > 30) {
            try { $stmtLike->execute([':rId' => $rId, ':uId' => $randUser]); } catch(PDOException $e) {}
        }
        
        // A veces comentan y califican
        if (rand(1, 100) > 50) {
            try { 
                $stmtComment->execute([':rId' => $rId, ':uId' => $randUser, ':c' => $commentsText[array_rand($commentsText)]]); 
                $stmtRating->execute([':rId' => $rId, ':uId' => $randUser, ':s' => rand(3, 5)]); // Calificaciones de 3 a 5
            } catch(PDOException $e) {}
        }
    }
}

echo "=================================================\n";
echo ">> Sembrado Exitoso. Base de datos poblada en modo RESTRICTO BASE64.\n";
echo "=================================================\n";
