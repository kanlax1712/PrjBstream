package com.bstream.app.android.ui.screens

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.UploadPartBuilder
import okhttp3.MultipartBody
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import androidx.lifecycle.ViewModel
import java.io.File
import java.io.FileOutputStream

data class UploadUiState(
    val title: String = "",
    val description: String = "",
    val videoUri: Uri? = null,
    val videoFileName: String? = null,
    val durationSeconds: Int = 0,
    val tags: String = "",
    val thumbnailUrl: String = "",
    val hasAds: Boolean = false,
    val videoQuality: String = "auto",
    val fileError: String = "",
    val message: String = "",
    val success: Boolean = false,
    val isUploading: Boolean = false,
)

class UploadViewModel : ViewModel() {
    private val _state = MutableStateFlow(UploadUiState())
    val state: StateFlow<UploadUiState> = _state.asStateFlow()

    fun setTitle(value: String) {
        _state.value = _state.value.copy(title = value)
    }

    fun setDescription(value: String) {
        _state.value = _state.value.copy(description = value)
    }

    fun setVideoUri(uri: Uri?, fileName: String?, context: Context) {
        _state.value = _state.value.copy(
            videoUri = uri,
            videoFileName = fileName,
            fileError = ""
        )
        if (uri != null) {
            extractDuration(uri, context)
        } else {
            _state.value = _state.value.copy(durationSeconds = 0)
        }
    }

    private fun extractDuration(uri: Uri, context: Context) {
        var duration = 0
        try {
            val retriever = MediaMetadataRetriever()
            retriever.setDataSource(context, uri)
            val dur = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            if (dur != null) {
                duration = (dur.toLongOrNull() ?: 0L).toInt() / 1000
            }
            retriever.release()
        } catch (_: Exception) { }
        _state.value = _state.value.copy(durationSeconds = duration)
    }

    fun setDuration(value: Int) {
        _state.value = _state.value.copy(durationSeconds = value.coerceAtLeast(0))
    }

    fun setTags(value: String) {
        _state.value = _state.value.copy(tags = value)
    }

    fun setThumbnailUrl(value: String) {
        _state.value = _state.value.copy(thumbnailUrl = value)
    }

    fun setHasAds(value: Boolean) {
        _state.value = _state.value.copy(hasAds = value)
    }

    fun setVideoQuality(value: String) {
        _state.value = _state.value.copy(videoQuality = value)
    }

    fun clearMessage() {
        _state.value = _state.value.copy(message = "", success = false)
    }

    suspend fun upload(context: Context): Boolean {
        val s = _state.value
        if (s.videoUri == null) {
            _state.value = s.copy(fileError = "Please select a video file.")
            return false
        }
        if (s.title.isBlank()) {
            _state.value = s.copy(fileError = "Title is required.")
            return false
        }
        if (s.title.length < 3) {
            _state.value = s.copy(fileError = "Title must be at least 3 characters.")
            return false
        }
        if (s.description.isBlank()) {
            _state.value = s.copy(fileError = "Description is required.")
            return false
        }
        if (s.description.length < 10) {
            _state.value = s.copy(fileError = "Description must be at least 10 characters.")
            return false
        }
        if (s.durationSeconds < 5) {
            _state.value = s.copy(fileError = "Video duration must be at least 5 seconds.")
            return false
        }

        _state.value = s.copy(isUploading = true, fileError = "", message = "")

        var tempFile: File? = null
        try {
            tempFile = withContext(Dispatchers.IO) {
                copyUriToTempFile(context, s.videoUri!!, s.videoFileName ?: "video.mp4")
            }
            if (tempFile == null || !tempFile.exists()) {
                _state.value = _state.value.copy(
                    isUploading = false,
                    message = "Could not read video file."
                )
                return false
            }

            val mimeType = context.contentResolver.getType(s.videoUri!!) ?: "video/mp4"
            val maxSize = 2L * 1024 * 1024 * 1024
            if (tempFile.length() > maxSize) {
                _state.value = _state.value.copy(
                    isUploading = false,
                    message = "File size exceeds 2GB limit."
                )
                return false
            }

            val response = ApiModule.uploadApi.uploadVideo(
                title = UploadPartBuilder.part("title", s.title),
                description = UploadPartBuilder.part("description", s.description),
                duration = UploadPartBuilder.part("duration", s.durationSeconds.toString()),
                videoFile = UploadPartBuilder.videoFile("videoFile", tempFile, mimeType),
                tags = UploadPartBuilder.part("tags", s.tags),
                thumbnailUrl = UploadPartBuilder.part("thumbnailUrl", s.thumbnailUrl),
                hasAds = UploadPartBuilder.part("hasAds", if (s.hasAds) "true" else "false"),
                videoQuality = UploadPartBuilder.part("videoQuality", s.videoQuality),
                thumbnailFile = null
            )

            val result = response.body()
            if (response.isSuccessful && result?.success == true) {
                _state.value = _state.value.copy(
                    isUploading = false,
                    message = result.message ?: "Video uploaded successfully!",
                    success = true,
                    title = "",
                    description = "",
                    videoUri = null,
                    videoFileName = null,
                    durationSeconds = 0,
                    tags = "",
                    thumbnailUrl = "",
                    hasAds = false,
                    videoQuality = "auto"
                )
                return true
            }
            _state.value = _state.value.copy(
                isUploading = false,
                message = result?.message ?: "Upload failed (${response.code()})."
            )
            return false
        } catch (e: Exception) {
            _state.value = _state.value.copy(
                isUploading = false,
                message = "Upload failed: ${e.message}"
            )
            return false
        } finally {
            tempFile?.takeIf { it.exists() }?.delete()
        }
    }

    private fun copyUriToTempFile(context: Context, uri: Uri, suggestedName: String): File? {
        return try {
            val ext = suggestedName.substringAfterLast('.', "mp4")
            val file = File.createTempFile("upload_", ".$ext", context.cacheDir)
            context.contentResolver.openInputStream(uri)?.use { input ->
                FileOutputStream(file).use { output ->
                    input.copyTo(output)
                }
            }
            file
        } catch (_: Exception) {
            null
        }
    }
}
