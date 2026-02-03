package com.bstream.app.android.data

import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import retrofit2.Response
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import java.io.File

/**
 * Video upload API aligned with Bstream web app (/api/upload-video).
 * Form fields: title, description, duration, videoFile, tags, thumbnailUrl, thumbnailFile, hasAds, videoQuality.
 */
interface UploadApi {
    @Multipart
    @POST("api/upload-video")
    suspend fun uploadVideo(
        @Part title: MultipartBody.Part,
        @Part description: MultipartBody.Part,
        @Part duration: MultipartBody.Part,
        @Part videoFile: MultipartBody.Part,
        @Part tags: MultipartBody.Part,
        @Part thumbnailUrl: MultipartBody.Part,
        @Part hasAds: MultipartBody.Part,
        @Part videoQuality: MultipartBody.Part,
        @Part thumbnailFile: MultipartBody.Part?,
    ): Response<UploadResponse>
}

data class UploadResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val videoId: String? = null,
)

object UploadPartBuilder {
    fun part(name: String, value: String): MultipartBody.Part =
        MultipartBody.Part.createFormData(name, value)

    fun videoFile(name: String, file: File, mimeType: String): MultipartBody.Part =
        MultipartBody.Part.createFormData(
            name,
            file.name,
            file.asRequestBody(mimeType.toMediaTypeOrNull())
        )

    fun thumbnailFile(name: String, file: File): MultipartBody.Part =
        MultipartBody.Part.createFormData(
            name,
            file.name,
            file.asRequestBody("image/jpeg".toMediaTypeOrNull())
        )
}
