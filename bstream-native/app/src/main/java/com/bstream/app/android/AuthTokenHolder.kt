package com.bstream.app.android

/**
 * Holds the API token returned from login/Google auth. Used by OkHttp interceptor
 * to add Authorization: Bearer on requests. Clear on sign out.
 */
object AuthTokenHolder {
    @Volatile
    private var token: String? = null

    fun getToken(): String? = token

    fun setToken(t: String?) {
        token = t
    }

    fun clearToken() {
        token = null
    }
}
