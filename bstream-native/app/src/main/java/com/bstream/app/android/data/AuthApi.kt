package com.bstream.app.android.data

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface AuthApi {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<LoginResponse>

    @POST("api/auth/google")
    suspend fun loginWithGoogle(@Body body: GoogleLoginRequest): Response<LoginResponse>

    @Multipart
    @POST("api/register")
    suspend fun register(
        @Part name: MultipartBody.Part,
        @Part email: MultipartBody.Part,
        @Part password: MultipartBody.Part,
        @Part age: MultipartBody.Part,
        @Part gender: MultipartBody.Part,
    ): Response<RegisterResponse>
}

data class LoginRequest(val email: String, val password: String)

data class GoogleLoginRequest(val idToken: String)

data class LoginResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val user: LoginUser? = null,
    val token: String? = null,
)

data class LoginUser(
    val id: String? = null,
    val name: String? = null,
    val email: String? = null,
)

data class RegisterResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val userId: String? = null,
)
