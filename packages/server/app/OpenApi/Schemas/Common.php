<?php

namespace App\OpenApi\Schemas;

use OpenApi\Attributes as OA;

/**
 * @OA\Schema(
 *     schema="MetaObject",
 *     type="object",
 *     description="Standard metadata included in every API response",
 *     required={"timestamp", "request_id"},
 *     @OA\Property(
 *         property="timestamp",
 *         type="string",
 *         format="date-time",
 *         example="2024-01-15T10:30:00.000000Z",
 *         description="ISO 8601 UTC timestamp of the response"
 *     ),
 *     @OA\Property(
 *         property="request_id",
 *         type="string",
 *         example="65a5b3c2e4b0a",
 *         description="Unique identifier for the request, echoed from X-Request-ID header or auto-generated"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="PaginationObject",
 *     type="object",
 *     description="Pagination metadata for paginated list responses",
 *     required={"current_page", "last_page", "per_page", "total"},
 *     @OA\Property(
 *         property="current_page",
 *         type="integer",
 *         example=1,
 *         description="The current page number (1-indexed)"
 *     ),
 *     @OA\Property(
 *         property="last_page",
 *         type="integer",
 *         example=5,
 *         description="The total number of pages available"
 *     ),
 *     @OA\Property(
 *         property="per_page",
 *         type="integer",
 *         example=15,
 *         description="The number of items returned per page"
 *     ),
 *     @OA\Property(
 *         property="total",
 *         type="integer",
 *         example=73,
 *         description="The total number of items across all pages"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="SuccessResponse",
 *     type="object",
 *     description="Abstract base shape shared by all successful API responses",
 *     required={"success", "meta"},
 *     @OA\Property(
 *         property="success",
 *         type="boolean",
 *         example=true,
 *         description="Indicates the request completed successfully"
 *     ),
 *     @OA\Property(
 *         property="meta",
 *         ref="#/components/schemas/MetaObject"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="ErrorResponse",
 *     type="object",
 *     description="Standard envelope for all error responses",
 *     required={"success", "error", "meta"},
 *     @OA\Property(
 *         property="success",
 *         type="boolean",
 *         example=false,
 *         description="Always false for error responses"
 *     ),
 *     @OA\Property(
 *         property="error",
 *         type="object",
 *         required={"code", "message"},
 *         description="Error details",
 *         @OA\Property(
 *             property="code",
 *             type="string",
 *             example="MACHINE_NOT_FOUND",
 *             description="Machine-readable error code"
 *         ),
 *         @OA\Property(
 *             property="message",
 *             type="string",
 *             example="The requested resource was not found.",
 *             description="Human-readable error message"
 *         )
 *     ),
 *     @OA\Property(
 *         property="meta",
 *         ref="#/components/schemas/MetaObject"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="DeletedResponse",
 *     type="object",
 *     description="Response returned after a successful DELETE operation",
 *     required={"success", "data", "meta"},
 *     @OA\Property(
 *         property="success",
 *         type="boolean",
 *         example=true,
 *         description="Indicates the resource was deleted successfully"
 *     ),
 *     @OA\Property(
 *         property="data",
 *         nullable=true,
 *         example=null,
 *         description="Always null for delete operations"
 *     ),
 *     @OA\Property(
 *         property="meta",
 *         ref="#/components/schemas/MetaObject"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="PaginatedResponse",
 *     type="object",
 *     description="Standard envelope for paginated list responses",
 *     required={"success", "data", "meta"},
 *     @OA\Property(
 *         property="success",
 *         type="boolean",
 *         example=true,
 *         description="Indicates the request completed successfully"
 *     ),
 *     @OA\Property(
 *         property="data",
 *         type="array",
 *         description="Array of resource objects for the current page",
 *         @OA\Items(type="object")
 *     ),
 *     @OA\Property(
 *         property="meta",
 *         type="object",
 *         description="Response metadata including request info and pagination state",
 *         required={"timestamp", "request_id", "pagination"},
 *         @OA\Property(
 *             property="timestamp",
 *             type="string",
 *             format="date-time",
 *             example="2024-01-15T10:30:00.000000Z",
 *             description="ISO 8601 UTC timestamp of the response"
 *         ),
 *         @OA\Property(
 *             property="request_id",
 *             type="string",
 *             example="65a5b3c2e4b0a",
 *             description="Unique identifier for the request"
 *         ),
 *         @OA\Property(
 *             property="pagination",
 *             ref="#/components/schemas/PaginationObject"
 *         )
 *     )
 * )
 */
class Common {}
