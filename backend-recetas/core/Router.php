<?php

namespace Core;

/**
 * Enrutador Nativo (Router)
 * ------------------------
 * Simula el comportamiento de un framework avanzado como Laravel en PHP Puro.
 * Almacena las rutas registradas (GET, POST, PUT, DELETE) y usa expresiones regulares (Regex)
 * para capturar variables en la URL (ej: /api/recipes/5) y despacharlas al Controlador indicado.
 */
class Router
{
    private $routes = [];

    public function add($method, $uri, $action)
    {
        // Convertir variables en la URL (ej: /receta/{id} a Regex)
        $uri = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([^/]+)', $uri);
        
        $this->routes[] = [
            'method' => $method,
            'uri' => '#^' . $uri . '$#',
            'action' => $action
        ];
    }

    public function get($uri, $action) { $this->add('GET', $uri, $action); }
    public function post($uri, $action) { $this->add('POST', $uri, $action); }
    public function put($uri, $action) { $this->add('PUT', $uri, $action); }
    public function delete($uri, $action) { $this->add('DELETE', $uri, $action); }

    public function dispatch(Request $request)
    {
        foreach ($this->routes as $route) {
            if ($route['method'] === $request->method && preg_match($route['uri'], $request->uri, $matches)) {
                
                array_shift($matches); // Quitar el match completo
                $request->params = $matches; // Guardar los parámetros extraídos
                
                if (is_callable($route['action'])) {
                    return call_user_func($route['action'], $request);
                }

                if (is_array($route['action'])) {
                    $controllerName = $route['action'][0];
                    $methodName = $route['action'][1];
                    $controller = new $controllerName();
                    
                    if (method_exists($controller, $methodName)) {
                        return $controller->$methodName($request);
                    }
                }
            }
        }

        self::json(['success' => false, 'message' => 'Ruta no encontrada - 404'], 404);
    }

    public static function json($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
