# Règles Backend - Laravel

## Stack Technique
- Laravel 11 (PHP 8.3+)
- PostgreSQL 16 + pgvector
- Redis 7
- Laravel Reverb (WebSocket)
- Laravel Sanctum (Auth)

## Standards de Code

### Controllers
```php
// Toujours utiliser Form Requests pour la validation
public function store(StoreMachineRequest $request): JsonResponse
{
    $validated = $request->validated();
    
    $machine = Machine::create([
        'user_id' => auth()->id(),
        ...$validated,
    ]);
    
    return response()->json([
        'success' => true,
        'data' => new MachineResource($machine),
    ], 201);
}
```

### Models
- Toujours utiliser `HasUuids` pour les IDs
- Toujours définir `$fillable` explicitement
- Utiliser des casts pour les JSON
- Relations typées avec return type

### Migrations
- Toujours UUID pour les clés primaires
- Index sur les colonnes de recherche fréquente
- Clés étrangères avec `onDelete('cascade')` pour les données utilisateur

### API Response Format
```php
return response()->json([
    'success' => true,
    'data' => $data,
    'meta' => [
        'timestamp' => now()->toIso8601String(),
        'request_id' => $request->header('X-Request-ID'),
    ],
]);
```

## Patterns Interdits
- ❌ Pas de requêtes N+1 (toujours eager load)
- ❌ Pas de logique métier dans les controllers
- ❌ Pas de `DB::raw()` sans validation
- ❌ Pas de `eval()` ou `exec()`

## Sécurité
- Rate limiting sur toutes les routes API
- Validation stricte des entrées
- CSRF protection sur les routes web
- SQL injection prevention via Eloquent
