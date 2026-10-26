export { supabase } from './client';
export {
  getDbProducts,
  createDbProduct,
  updateDbProduct,
  deleteDbProduct,
  DEFAULT_DB_PRODUCTS,
  type DbProduct,
  type ProductSwatch,
} from './products';
export {
  getSiteSections,
  getCachedSiteSections,
  saveSiteSections,
  DEFAULT_SITE_SECTIONS,
  type SiteSectionsConfig,
  type HeroSectionData,
  type SpotlightItem,
  type JournalArticleData,
  type LookbookChapterData,
  type LookbookPageConfig,
} from './sections';
export {
  uploadFileToStorage,
  listUploadedFiles,
  deleteFileFromStorage,
  type StorageFile,
} from './storage';
