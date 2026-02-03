package com.bstream.app.android.data

import com.bstream.app.android.AuthTokenHolder
import com.bstream.app.android.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiModule {
    private val BASE_URL: String = BuildConfig.BASE_URL

    private val authInterceptor = Interceptor { chain ->
        val token = AuthTokenHolder.getToken()
        val request = if (token != null) {
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        chain.proceed(request)
    }

    private val okHttp = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(authInterceptor)
        .apply {
            val log = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
            addInterceptor(log)
        }
        .build()

    private val uploadOkHttp = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(300, TimeUnit.SECONDS)
        .addInterceptor(authInterceptor)
        .apply {
            val log = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
            addInterceptor(log)
        }
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttp)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val uploadRetrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(uploadOkHttp)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val feedApi: FeedApi = retrofit.create(FeedApi::class.java)
    val uploadApi: UploadApi = uploadRetrofit.create(UploadApi::class.java)
    val authApi: AuthApi = retrofit.create(AuthApi::class.java)
    val goLiveApi: GoLiveApi = retrofit.create(GoLiveApi::class.java)

    fun streamUrl(videoId: String, quality: String? = null): String =
        if (quality.isNullOrBlank()) "${BASE_URL}api/video/$videoId/stream"
        else "${BASE_URL}api/video/$videoId/quality/$quality"

    fun baseUrl(): String = BASE_URL

    /** Use for thumbnail/media paths that may be relative (e.g. /uploads/...) */
    fun resolveUrl(path: String?): String {
        if (path.isNullOrBlank()) return baseUrl().trimEnd('/') + "/uploads/default-thumbnail.svg"
        if (path.startsWith("http")) return path
        return baseUrl().trimEnd('/') + path
    }
}
