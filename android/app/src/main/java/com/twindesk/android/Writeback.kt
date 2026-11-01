// DuoDesk modifications. GPL-3.0, see LICENSE.
package com.twindesk.android

import java.io.File
import java.io.IOException

/** A saved edit is discarded only after the computer acknowledges a successful write. */
object Writeback {
    fun complete(file: File, upload: () -> Int): Result<Unit> = runCatching {
        val status = upload()
        if (status !in 200..299) throw IOException("Computer refused the save (HTTP $status)")
        if (!file.delete()) throw IOException("Saved on the computer; local recovery copy remains")
    }

    fun create(directory: File, name: String = "edit.bin"): File {
        check(directory.isDirectory || directory.mkdirs()) { "Cannot create the recovery folder" }
        val safe = name.substringAfterLast('/').substringAfterLast('\\').replace(Regex("[\\u0000-\\u001f]"), "_").take(100).ifBlank { "edit.bin" }
        return File.createTempFile("duodesk-", "-$safe", directory)
    }
}
