package com.twindesk.android

import org.junit.Assert.*
import org.junit.Test

class WebPolicyTest {
    @Test fun audioCannotInjectInputOrSendFiles() {
        assertTrue(WebPolicy.canSend("audio.html", "audio.answer"))
        assertFalse(WebPolicy.canSend("audio.html", "in.kd"))
        assertFalse(WebPolicy.canSend("audio.html", "file.offer"))
    }
    @Test fun viewerCannotControlPhoneCallsOrPairing() {
        assertTrue(WebPolicy.canSend("viewer.html", "rtc.answer"))
        assertTrue(WebPolicy.canSend("viewer.html", "in.kd"))
        assertFalse(WebPolicy.canSend("viewer.html", "call.do"))
        assertFalse(WebPolicy.canSend("viewer.html", "pair.start"))
    }
    @Test fun unknownPageAndUnknownMessageFailClosed() {
        assertFalse(WebPolicy.canSend("https://example.com", "remote.kd"))
        assertFalse(WebPolicy.canSend("remote.html", "dev.do"))
    }
}
