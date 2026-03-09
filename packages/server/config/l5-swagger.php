<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Edit to set the Swagger UI asset path in the config directory.
    |--------------------------------------------------------------------------
    |
    | Supported settings: "legacy" (SwaggerUI v2),
    | "latest" (SwaggerUI v5)
    |
    */
    'default' => 'default',

    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'ClaudeNest API',
            ],

            'routes' => [
                /*
                 * Route for accessing api documentation interface
                 */
                'api' => 'api/documentation',

                /*
                 * Route for accessing api docs (json/yaml)
                 */
                'docs' => 'api/docs',

                /*
                 * Route for Oauth2 authentication callback.
                 */
                'oauth2_callback' => 'api/oauth2-callback',

                /*
                 * Middleware allows to prevent unexpected access to API documentation
                 */
                'middleware' => [
                    'api' => [],
                    'asset' => [],
                    'docs' => [],
                    'oauth2_callback' => [],
                ],

                /*
                 * Route Group options
                 */
                'group_options' => [],
            ],

            'paths' => [
                /*
                 * Absolute path to location where parsed annotations will be stored
                 */
                'docs' => storage_path('api-docs'),

                /*
                 * Absolute path to directory where to export views
                 */
                'views' => base_path('resources/views/vendor/l5-swagger'),

                /*
                 * Edit to set the api's base path
                 */
                'base' => env('L5_SWAGGER_BASE_PATH', null),

                /*
                 * Absolute path to directories that should be excluded from scanning
                 */
                'excludes' => [],

                /*
                 * Absolute paths to php files or directories that should be scanned for the
                 * temporary files
                 */
                'annotations' => [
                    app_path(),
                ],

                /*
                 * Absolute path to the docs file, either yaml or json
                 */
                'docs_json' => 'api-docs.json',

                /*
                 * Absolute path to the docs yaml file
                 */
                'docs_yaml' => 'api-docs.yaml',

                /*
                 * Set this to `json` or `yaml` to determine which documentation file to use in UI
                 */
                'format_to_use_for_docs' => env('L5_FORMAT_TO_USE_FOR_DOCS', 'json'),
            ],

            'security' => [
                /*
                 * Optional security definitions that will be made available to the UI.
                 *
                 * Note: these will be made available via the query string, not via cookies.
                 *
                 * Examples:
                 * [
                 *   [
                 *     'api_key' => []
                 *   ],
                 *   [
                 *     'oauth2_security_example' => [
                 *       'write:pets',
                 *       'read:pets'
                 *     ]
                 *   ]
                 * ]
                 */
                'bearerAuth' => [],
            ],
        ],
    ],

    'defaults' => [
        'routes' => [
            /*
             * Route for accessing api documentation interface
             */
            'api' => 'api/documentation',

            /*
             * Route for accessing api docs (json/yaml)
             */
            'docs' => 'api/docs',

            /*
             * Route for Oauth2 authentication callback.
             */
            'oauth2_callback' => 'api/oauth2-callback',

            /*
             * Middleware allows to prevent unexpected access to API documentation
             */
            'middleware' => [
                'api' => [],
                'asset' => [],
                'docs' => [],
                'oauth2_callback' => [],
            ],

            /*
             * Route Group options
             */
            'group_options' => [],
        ],

        'paths' => [
            /*
             * Absolute path to location where parsed annotations will be stored
             */
            'docs' => storage_path('api-docs'),

            /*
             * Absolute path to directory where to export views
             */
            'views' => base_path('resources/views/vendor/l5-swagger'),

            /*
             * Edit to set the api's base path
             */
            'base' => env('L5_SWAGGER_BASE_PATH', null),

            /*
             * Absolute path to directories that should be excluded from scanning
             */
            'excludes' => [],

            /*
             * Absolute paths to php files or directories that should be scanned for the
             * temporary files
             */
            'annotations' => [
                app_path(),
            ],

            /*
             * Absolute path to the docs file, either yaml or json
             */
            'docs_json' => 'api-docs.json',

            /*
             * Absolute path to the docs yaml file
             */
            'docs_yaml' => 'api-docs.yaml',

            /*
             * Set this to `json` or `yaml` to determine which documentation file to use in UI
             */
            'format_to_use_for_docs' => env('L5_FORMAT_TO_USE_FOR_DOCS', 'json'),
        ],

        'scanners' => [
            'analyser' => env('L5_SWAGGER_ANALYSER', 'GlobPatterns'),
        ],

        'generate_always' => env('L5_SWAGGER_GENERATE_ALWAYS', false),

        'generate_yaml_copy' => env('L5_SWAGGER_GENERATE_YAML_COPY', false),

        /*
         * Edit to trust the proxy headers
         */
        'proxy' => false,

        /*
         * Configs plugin allows to fetch external configs instead of passing them to SwaggerUIBundle.
         * See more at: https://github.com/swagger-api/swagger-ui#configs-plugin
         */
        'additional_config_url' => null,

        /*
         * Apply a sort to the operation list of each API. It can be 'alpha' (sort by paths alphanumerically),
         * 'method' (sort by HTTP method).
         * Default is the order returned by the server unchanged.
         */
        'operations_sort' => env('L5_SWAGGER_OPERATIONS_SORT', null),

        /*
         * Pass the validatorUrl parameter to SwaggerUi init on the JS side.
         * A null value here disables validation.
         */
        'validator_url' => null,

        /*
         * Uncomment to add constants which can be used in annotations
         */
        'constants' => [
            'L5_SWAGGER_CONST_HOST' => env('L5_SWAGGER_CONST_HOST', 'https://claudenest.io'),
        ],

        'security' => [
            /*
             * Examples of Security schemas
             */
            /*
            'bearer_token' => [ // Unique name of security
                'type' => 'http', // Valid values are "basic", "apiKey" or "oauth2".
                'scheme' => 'bearer',
                'bearerFormat' => 'JWT',
            ],
            */
        ],

        'ui' => [
            'display' => [
                /*
                 * Controls the default expansion setting for the operations and tags.
                 * It can be 'list' (expands only the tags),
                 * 'full' (expands the tags and operations) or 'none' (expands nothing).
                 */
                'doc_expansion' => env('L5_SWAGGER_UI_DOC_EXPANSION', 'none'),

                /*
                 * If set, enables filtering. The top bar will show an edit box that
                 * you can use to filter the tagged operations that are shown.
                 */
                'filter' => env('L5_SWAGGER_UI_FILTERS', true),

                /*
                 * If set, all the operations will have the 'Try it out' option enabled by default.
                 */
                'try_it_out_enabled' => env('L5_SWAGGER_UI_TRY_IT_OUT_ENABLED', false),
            ],

            'authorization' => [
                /*
                 * If set to true, it persists authorization data and it would not be lost on browser close/refresh
                 */
                'persist_authorization' => env('L5_SWAGGER_UI_PERSIST_AUTHORIZATION', true),

                'oauth2' => [
                    /*
                     * If set to true, adds PKCE with S256 as challenge method to oAuth2.0 flows.
                     */
                    'use_pkce_with_authorization_code_grant' => false,
                ],
            ],
        ],

        /*
         * Constants which can be used in annotations
         */
        'servers' => [
            [
                'url' => 'https://claudenest.io',
                'description' => 'Production',
            ],
            [
                'url' => 'http://localhost',
                'description' => 'Development',
            ],
        ],
    ],
];
