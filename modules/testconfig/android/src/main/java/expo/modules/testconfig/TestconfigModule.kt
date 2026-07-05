package expo.modules.testconfig

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TestconfigModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Testconfig")

    Function("getTestConfig") {
      val e = appContext.currentActivity?.intent?.extras
      mapOf(
        "uiTestMode" to (e?.getBoolean("uiTestMode") ?: false),
        "mockAuthEmail" to e?.getString("mockAuthEmail"),
        "apiBaseUrl" to e?.getString("apiBaseUrl"),
        "apiKey" to e?.getString("apiKey"),
        "authorizedEmails" to e?.getString("authorizedEmails"),
        "captureExternalLinks" to (e?.getBoolean("captureExternalLinks") ?: false)
      )
    }
  }
}
