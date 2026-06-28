package com.smartotp

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Base64
import android.util.Log
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException

/**
 * Computes the 11-character app signature hashes required by the SMS Retriever
 * API. The hash is appended to the OTP SMS so Google Play Services can route the
 * message to this app.
 *
 * Implementation follows Google's documented AppSignatureHelper sample:
 * https://developers.google.com/identity/sms-retriever/verify#computing_your_apps_hash_string
 */
internal class AppSignatureHelper(private val context: Context) {

  /** Returns one hash per signing certificate (typically a single entry). */
  fun getAppSignatures(): List<String> {
    val signatures = mutableListOf<String>()
    try {
      val packageName = context.packageName
      val packageManager = context.packageManager

      val signaturesArray = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val info = packageManager.getPackageInfo(
          packageName,
          PackageManager.GET_SIGNING_CERTIFICATES
        )
        info.signingInfo?.apkContentsSigners
      } else {
        @Suppress("DEPRECATION", "PackageManagerGetSignatures")
        val info = packageManager.getPackageInfo(
          packageName,
          PackageManager.GET_SIGNATURES
        )
        @Suppress("DEPRECATION")
        info.signatures
      }

      signaturesArray?.forEach { signature ->
        val hash = hash(packageName, signature.toCharsString())
        if (hash != null) {
          signatures.add(hash)
        }
      }
    } catch (e: PackageManager.NameNotFoundException) {
      Log.e(TAG, "Unable to find package to obtain hash.", e)
    }
    return signatures
  }

  private fun hash(packageName: String, signature: String): String? {
    val appInfo = "$packageName $signature"
    return try {
      val messageDigest = MessageDigest.getInstance("SHA-256")
      messageDigest.update(appInfo.toByteArray(StandardCharsets.UTF_8))
      var hashSignature = messageDigest.digest()

      // Truncate to NUM_HASHED_BYTES, then Base64-encode and take NUM_BASE64_CHAR.
      hashSignature = hashSignature.copyOfRange(0, NUM_HASHED_BYTES)
      var base64Hash = Base64.encodeToString(
        hashSignature,
        Base64.NO_PADDING or Base64.NO_WRAP
      )
      base64Hash = base64Hash.substring(0, NUM_BASE64_CHAR)
      base64Hash
    } catch (e: NoSuchAlgorithmException) {
      Log.e(TAG, "hash:NoSuchAlgorithm", e)
      null
    }
  }

  companion object {
    private const val TAG = "AppSignatureHelper"
    private const val NUM_HASHED_BYTES = 9
    private const val NUM_BASE64_CHAR = 11
  }
}
