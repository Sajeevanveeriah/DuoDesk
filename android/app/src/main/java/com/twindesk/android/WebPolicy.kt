// DuoDesk modifications. GPL-3.0, see LICENSE.
package com.twindesk.android

/** Bundled pages have independent, minimal protocol capabilities. */
object WebPolicy {
    val pages = setOf("viewer.html", "audio.html", "remote.html")
    private val messages = mapOf(
        "viewer.html" to setOf("rtc.answer", "rtc.ice", "in.mm", "in.md", "in.mu", "in.wh", "in.kd", "in.ku"),
        "audio.html" to setOf("audio.answer", "audio.ice"),
        "remote.html" to setOf("remote.mm", "remote.md", "remote.mu", "remote.wh", "remote.kd", "remote.ku", "remote.text", "remote.pad", "pair.sync"),
    )
    fun canSend(page: String, type: String) = messages[page]?.contains(type) == true
}
