/**
 * @deprecated Ce fichier est un shim de compatibilité.
 * Importer directement depuis `@/data/api` à la place.
 *
 * Ce re-export maintient la compatibilité des imports existants
 * pendant la migration vers la structure modulaire `data/api/`.
 */
export type { ApiParam, ApiEndpoint, ApiCategory, ErrorCode } from './api/types';

export {
  apiCategories,
  getCategoryById,
  getEndpointByPath,
  searchEndpoints,
  errorCodes,
  // categories individuelles
  authCategory,
  machinesCategory,
  sessionsCategory,
  projectsCategory,
  tasksCategory,
  contextCategory,
  locksCategory,
  skillsCategory,
  mcpCategory,
  commandsCategory,
  credentialsCategory,
  epicsCategory,
  sprintsCategory,
  planningCategory,
  runnerCategory,
  dashboardCategory,
  healthCategory,
} from './api';
