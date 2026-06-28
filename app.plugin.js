/**
 * Expo config plugin for react-native-smart-otp.
 *
 * The native Android SMS module is picked up automatically by React Native
 * autolinking in Expo Development Builds — no native project changes are
 * required, because the SMS Retriever and SMS User Consent APIs need **no**
 * Android permissions (no RECEIVE_SMS / READ_SMS).
 *
 * This plugin therefore performs no manifest or Info.plist mutations today. It
 * exists as the documented, stable entry point so apps can add
 * `"plugins": ["react-native-smart-otp"]` and remain forward-compatible if a
 * future native feature requires config changes.
 *
 * It is intentionally dependency-free (a config plugin is just a
 * `(config) => config` function) so it loads correctly even when resolved from
 * a symlinked/local install where `@expo/config-plugins` is not on the package's
 * own resolution path.
 *
 * @param {object} config - The Expo config.
 * @returns {object} The unmodified Expo config.
 */
const withSmartOtp = (config) => config;

module.exports = withSmartOtp;
