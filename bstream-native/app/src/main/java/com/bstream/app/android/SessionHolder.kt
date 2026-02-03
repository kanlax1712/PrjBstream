package com.bstream.app.android

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Simple session state for the app. When real auth is added (e.g. NextAuth token),
 * replace with token/session from API so mobile and web stay in sync.
 */
object SessionHolder {
    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    private val _userName = MutableStateFlow<String?>(null)
    val userName: StateFlow<String?> = _userName.asStateFlow()

    fun setLoggedIn(loggedIn: Boolean) {
        _isLoggedIn.value = loggedIn
        if (!loggedIn) _userName.value = null
    }

    fun setUserName(name: String?) {
        _userName.value = name
    }

    fun signIn() {
        _isLoggedIn.value = true
    }

    fun signOut() {
        _isLoggedIn.value = false
        _userName.value = null
        AuthTokenHolder.clearToken()
    }
}
