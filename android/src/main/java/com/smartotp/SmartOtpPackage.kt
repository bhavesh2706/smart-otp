package com.smartotp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Auto-linked package exposing [SmartOtpModule]. On the New Architecture this is
 * bridged through the TurboModule interop layer; on the old architecture it is a
 * standard native module.
 */
class SmartOtpPackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext
  ): List<NativeModule> = listOf(SmartOtpModule(reactContext))

  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<*, *>> = emptyList()
}
