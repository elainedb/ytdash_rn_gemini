package expo.modules.testconfig

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TestConfigModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TestConfig")

    AsyncFunction("getTestConfig") {
      val e = appContext.currentActivity?.intent?.extras
      mapOf(
        "uiTestMode" to (e?.getBoolean("uiTestMode", false) ?: false),
        "mockAuthEmail" to e?.getString("mockAuthEmail"),
        "apiBaseUrl" to e?.getString("apiBaseUrl"),
        "authorizedEmails" to e?.getString("authorizedEmails"),
        "captureExternalLinks" to (e?.getBoolean("captureExternalLinks", false) ?: false),
        "apiKey" to e?.getString("apiKey")
      )
    }
  }
}
