package com.smartotp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

/**
 * Receives the broadcast Google Play Services sends when an SMS matching the
 * app hash (Retriever) or sender filter (User Consent) arrives. Decodes the
 * status and forwards the outcome to its [listener].
 */
internal class SmsBroadcastReceiver(
  private val listener: Listener
) : BroadcastReceiver() {

  interface Listener {
    /** Retriever flow: the full message body is available immediately. */
    fun onSmsRetrieved(message: String?)

    /** User Consent flow: launch [consentIntent] to show the consent dialog. */
    fun onConsentRequired(consentIntent: Intent?)

    /** No matching SMS arrived within the 5-minute window. */
    fun onSmsTimeout()

    /** Play Services returned an unexpected status. */
    fun onSmsError(message: String)
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != SmsRetriever.SMS_RETRIEVED_ACTION) {
      return
    }
    val extras: Bundle = intent.extras ?: run {
      listener.onSmsError("Missing SMS retriever extras")
      return
    }

    val status: Status? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      extras.getParcelable(SmsRetriever.EXTRA_STATUS, Status::class.java)
    } else {
      @Suppress("DEPRECATION")
      extras.getParcelable(SmsRetriever.EXTRA_STATUS)
    }

    when (status?.statusCode) {
      CommonStatusCodes.SUCCESS -> {
        val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE)
        if (message != null) {
          // Automatic Retriever flow.
          listener.onSmsRetrieved(message)
        } else {
          // User Consent flow hands back an Intent to display the dialog.
          val consentIntent: Intent? =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
              extras.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT, Intent::class.java)
            } else {
              @Suppress("DEPRECATION")
              extras.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT)
            }
          listener.onConsentRequired(consentIntent)
        }
      }

      CommonStatusCodes.TIMEOUT -> listener.onSmsTimeout()

      else -> listener.onSmsError(
        "SMS retriever failed with status: ${status?.statusCode ?: "unknown"}"
      )
    }
  }
}
