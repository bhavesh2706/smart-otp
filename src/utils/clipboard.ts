/**
 * Optional clipboard access.
 *
 * `@react-native-clipboard/clipboard` is an **optional peer dependency**. The
 * library never imports it statically, so apps that do not need clipboard
 * auto-fill are not forced to install a native module. When the package is
 * present we use it; when it is absent every clipboard feature degrades to a
 * no-op. Consumers may also inject their own reader for full control or testing.
 *
 * @packageDocumentation
 */

/** A function that resolves the current clipboard contents as a string. */
export type ClipboardReader = () => Promise<string>;

interface ClipboardModule {
  readonly getString: () => Promise<string>;
}

/**
 * Resolve the optional clipboard module exactly once. Returns `null` when
 * `@react-native-clipboard/clipboard` is not installed (e.g. Expo Go, or apps
 * that opted out), allowing callers to degrade gracefully.
 */
let resolved = false;
let cachedModule: ClipboardModule | null = null;

function loadClipboardModule(): ClipboardModule | null {
  if (resolved) {
    return cachedModule;
  }
  resolved = true;
  try {
    // Indirected through a variable so bundlers don't treat this as a hard
    // dependency and Metro doesn't fail when the package is absent.
    const moduleName = '@react-native-clipboard/clipboard';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(moduleName) as
      { default?: ClipboardModule } | ClipboardModule;
    const candidate = 'default' in mod && mod.default ? mod.default : mod;
    cachedModule =
      typeof (candidate as ClipboardModule).getString === 'function'
        ? (candidate as ClipboardModule)
        : null;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

/**
 * Whether clipboard access is available in this runtime (the optional module is
 * installed). Useful for hiding paste affordances when unsupported.
 */
export function isClipboardSupported(): boolean {
  return loadClipboardModule() !== null;
}

/**
 * The default {@link ClipboardReader}, backed by the optional clipboard module.
 * Resolves to `''` when clipboard access is unavailable so callers need no
 * special-casing.
 */
export const defaultClipboardReader: ClipboardReader = async () => {
  const mod = loadClipboardModule();
  if (mod === null) {
    return '';
  }
  return mod.getString();
};
