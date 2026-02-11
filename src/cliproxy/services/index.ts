/**
 * CLIProxy Services
 * Central export point for cliproxy service layer
 */

// Variant management
export {
  validateProfileName,
  variantExists,
  listVariants,
  createVariant,
  createCompositeVariant,
  removeVariant,
  type VariantConfig,
  type VariantOperationResult,
  type CreateCompositeVariantOptions,
} from './variant-service';

// Proxy lifecycle
export {
  getProxyStatus,
  stopProxy,
  isProxyRunning,
  getActiveSessionCount,
  type ProxyStatusResult,
  type StopProxyResult,
} from './proxy-lifecycle-service';

// Binary management
export {
  getBinaryStatus,
  checkLatestVersion,
  isValidVersionFormat,
  installVersion,
  installLatest,
  isPinned,
  getPinned,
  clearPin,
  type BinaryStatusResult,
  type InstallResult,
  type LatestVersionResult,
} from './binary-service';
