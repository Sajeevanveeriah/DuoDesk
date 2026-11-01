package com.twindesk.android

import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.IOException

class WritebackTest {
    @get:Rule val folder = TemporaryFolder()

    @Test fun failedHttpRetainsEdit() {
        val file = Writeback.create(folder.root, "notes.txt").apply { writeText("unsaved work") }
        assertTrue(Writeback.complete(file) { 503 }.isFailure)
        assertEquals("unsaved work", file.readText())
    }
    @Test fun networkFailureRetainsEdit() {
        val file = Writeback.create(folder.root).apply { writeText("keep") }
        assertTrue(Writeback.complete(file) { throw IOException("offline") }.isFailure)
        assertEquals("keep", file.readText())
    }
    @Test fun acknowledgedSaveRemovesRecoveryCopy() {
        val file = Writeback.create(folder.root).apply { writeText("saved") }
        assertTrue(Writeback.complete(file) { 204 }.isSuccess)
        assertFalse(file.exists())
    }
    @Test fun recoveryFilesAreUniqueAndInsideFolder() {
        val a = Writeback.create(folder.root, "../../notes.txt")
        val b = Writeback.create(folder.root, "../../notes.txt")
        assertNotEquals(a, b)
        assertEquals(folder.root.canonicalFile, a.parentFile.canonicalFile)
        assertTrue(a.name.endsWith("notes.txt"))
    }
}
