package com.smartotp

import android.app.Activity
import android.content.Intent
import android.content.IntentFilter
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.auth.api.phone.SmsRetrieverClient

/**
 * Android SMS auto-fill module backing `react-native-smart-otp`.
 *
 * Supports both the automatic SMS Retriever API and the SMS User Consent API.
 * Neither requires SMS permissions. The module emits raw SMS bodies to JS via
 * `RCTDeviceEventEmitter`; OTP extraction happens in JavaScript so it stays in
 * one tested place.
 *
 * The module is written against the legacy bridge surface so it compiles on both
 * the old and new architecture (the New Architecture's TurboModule interop layer
 * exposes it through the codegen spec `RNSmartOtpSpec`).
 */
@ReactModule(name = SmartOtpModule.NAME)
class SmartOtpModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext),
  ActivityEventListener,
  SmsBroadcastReceiver.Listener {

  private var receiver: SmsBroadcastReceiver? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun getAppHash(promise: Promise) {
    try {
      val hashes = AppSignatureHelper(reactApplicationContext).getAppSignatures()
      val array = Arguments.createArray()
      hashes.forEach { array.pushString(it) }
      promise.resolve(array)
    } catch (e: Exception) {
      promise.reject(ERROR_HASH, e.message, e)
    }
  }

  @ReactMethod
  fun startSmsRetriever(promise: Promise) {
    try {
      registerReceiver()
      val client: SmsRetrieverClient = SmsRetriever.getClient(reactApplicationContext)
      client.startSmsRetriever()
        .addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { e ->
          unregisterReceiver()
          promise.reject(ERROR_START, e.message, e)
        }
    } catch (e: Exception) {
      unregisterReceiver()
      promise.reject(ERROR_START, e.message, e)
    }
  }

  @ReactMethod
  fun startSmsUserConsent(senderPhoneNumber: String, promise: Promise) {
    try {
      registerReceiver()
      val sender = senderPhoneNumber.ifEmpty { null }
      val client: SmsRetrieverClient = SmsRetriever.getClient(reactApplicationContext)
      client.startSmsUserConsent(sender)
        .addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { e ->
          unregisterReceiver()
          promise.reject(ERROR_START, e.message, e)
        }
    } catch (e: Exception) {
      unregisterReceiver()
      promise.reject(ERROR_START, e.message, e)
    }
  }

  @ReactMethod
  fun stopSmsRetriever() {
    unregisterReceiver()
  }

  /** Required by NativeEventEmitter. Event registration is implicit. */
  @ReactMethod
  fun addListener(eventName: String) {
    // No-op: events are emitted via RCTDeviceEventEmitter.
  }

  /** Required by NativeEventEmitter. */
  @ReactMethod
  fun removeListeners(count: Double) {
    // No-op.
  }

  // region SmsBroadcastReceiver.Listener

  override fun onSmsRetrieved(message: String?) {
    emitReceived(message)
  }

  override fun onConsentRequired(consentIntent: Intent?) {
    val activity = reactApplicationContext.currentActivity
    if (consentIntent == null || activity == null) {
      emitError("Cannot show SMS consent dialog: no foreground activity")
      return
    }
    try {
      activity.startActivityForResult(consentIntent, SMS_CONSENT_REQUEST)
    } catch (e: Exception) {
      emitError(e.message ?: "Failed to start SMS consent activity")
    }
  }

  override fun onSmsTimeout() {
    emit(EVENT_TIMEOUT, null)
    unregisterReceiver()
  }

  override fun onSmsError(message: String) {
    emitError(message)
    unregisterReceiver()
  }

  // endregion

  // region ActivityEventListener

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    if (requestCode != SMS_CONSENT_REQUEST) {
      return
    }
    if (resultCode == Activity.RESULT_OK) {
      val message = data?.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE)
      emitReceived(message)
    } else {
      // User denied consent. Surface as a non-fatal error so callers can react.
      emitError("SMS consent denied")
    }
    unregisterReceiver()
  }

  override fun onNewIntent(intent: Intent) {
    // Unused.
  }

  // endregion

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext.removeActivityEventListener(this)
    unregisterReceiver()
  }

  // region helpers

  private fun registerReceiver() {
    if (receiver != null) {
      return
    }
    val newReceiver = SmsBroadcastReceiver(this)
    val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
    // The receiver must be exported and hold the GMS SEND permission so Play
    // Services can deliver the broadcast (required on API 33+).
    ContextCompat.registerReceiver(
      reactApplicationContext,
      newReceiver,
      filter,
      SmsRetriever.SEND_PERMISSION,
      null,
      ContextCompat.RECEIVER_EXPORTED
    )
    receiver = newReceiver
  }

  private fun unregisterReceiver() {
    receiver?.let {
      try {
        reactApplicationContext.unregisterReceiver(it)
      } catch (_: IllegalArgumentException) {
        // Already unregistered; ignore.
      }
    }
    receiver = null
  }

  private fun emitReceived(message: String?) {
    val params: WritableMap = Arguments.createMap()
    params.putString("message", message ?: "")
    emit(EVENT_RECEIVED, params)
    unregisterReceiver()
  }

  private fun emitError(message: String) {
    val params: WritableMap = Arguments.createMap()
    params.putString("error", message)
    emit(EVENT_ERROR, params)
  }

  private fun emit(eventName: String, params: WritableMap?) {
    if (!reactApplicationContext.hasActiveReactInstance()) {
      return
    }
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  // endregion

  companion object {
    const val NAME = "SmartOtp"
    private const val SMS_CONSENT_REQUEST = 0x4f54 // "OT"
    private const val EVENT_RECEIVED = "smartOtp:received"
    private const val EVENT_TIMEOUT = "smartOtp:timeout"
    private const val EVENT_ERROR = "smartOtp:error"
    private const val ERROR_HASH = "ERR_APP_HASH"
    private const val ERROR_START = "ERR_SMS_START"
  }
}
