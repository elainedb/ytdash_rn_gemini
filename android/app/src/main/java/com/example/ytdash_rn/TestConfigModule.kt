package com.example.ytdash_rn

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments

class TestConfigModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "TestConfig"

    @ReactMethod
    fun getTestConfig(promise: Promise) {
        val e = reactApplicationContext.currentActivity?.intent?.extras
        val map = Arguments.createMap().apply {
            putBoolean("uiTestMode", e?.getBoolean("uiTestMode") ?: false)
            putString("mockAuthEmail", e?.getString("mockAuthEmail"))
            putString("apiBaseUrl", e?.getString("apiBaseUrl"))
            putString("authorizedEmails", e?.getString("authorizedEmails"))
            putBoolean("captureExternalLinks", e?.getBoolean("captureExternalLinks") ?: false)
            putString("apiKey", e?.getString("apiKey"))
        }
        promise.resolve(map)
    }
}
