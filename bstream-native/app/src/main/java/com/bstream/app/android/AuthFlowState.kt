package com.bstream.app.android

/**
 * Temporary state for auth flow (e.g. show "Account created! Please sign in." on Login after Register).
 */
object AuthFlowState {
    var justRegistered: Boolean = false
}
