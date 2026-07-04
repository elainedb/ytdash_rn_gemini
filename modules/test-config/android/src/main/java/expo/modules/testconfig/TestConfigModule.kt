package expo.modules.testconfig

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.os.Bundle

class TestConfigModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TestConfig")

    Function("getTestConfig") {
      val e = appContext.currentActivity?.intent?.extras
      mapOf(
        "uiTestMode" to getBoolExtra(e, "uiTestMode"),
        "mockAuthEmail" to getStringExtra(e, "mockAuthEmail"),
        "apiBaseUrl" to getStringExtra(e, "apiBaseUrl"),
        "apiKey" to getStringExtra(e, "apiKey"),
        "authorizedEmails" to getStringExtra(e, "authorizedEmails"),
        "captureExternalLinks" to getBoolExtra(e, "captureExternalLinks")
      )
    }
  }

  private fun getBoolExtra(e: Bundle?, key: String): Boolean {
    if (e == null) return false
    val value = e.get(key)
    if (value is Boolean) return value
    if (value is String) return value.lowercase() == "true" || value == "1"
    return false
  }

  private fun getStringExtra(e: Bundle?, key: String): String? {
    if (e == null) return null
    val value = e.get(key)
    if (value is String) return value
    if (value != null) return value.toString()
    return null
  }
}

