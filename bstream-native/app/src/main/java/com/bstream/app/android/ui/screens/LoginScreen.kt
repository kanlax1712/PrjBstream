package com.bstream.app.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.app.Activity
import com.bstream.app.android.AuthTokenHolder
import com.bstream.app.android.BuildConfig
import com.bstream.app.android.SessionHolder
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.GoogleLoginRequest
import com.bstream.app.android.data.LoginRequest
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.launch
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts

@OptIn(ExperimentalMaterial3Api::class)

@Composable
fun LoginScreen(
    onBack: () -> Unit,
    onNavigateToRegister: () -> Unit,
    onLoginSuccess: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()
    val context = LocalContext.current
    val activity = context as? Activity
    val webClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID
    val googleSignInOptions = remember(webClientId) {
        if (webClientId.isNotEmpty()) {
            GoogleSignInOptions.Builder()
                .requestIdToken(webClientId)
                .requestEmail()
                .build()
        } else null
    }
    val googleSignInClient = remember(activity, googleSignInOptions) {
        if (activity != null && googleSignInOptions != null) {
            GoogleSignIn.getClient(activity, googleSignInOptions)
        } else null
    }
    val googleSignInLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode != Activity.RESULT_OK) return@rememberLauncherForActivityResult
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            val idToken = account?.idToken
            if (idToken != null) {
                scope.launch {
                    isLoading = true
                    error = ""
                    try {
                        val response = ApiModule.authApi.loginWithGoogle(GoogleLoginRequest(idToken))
                        val body = response.body()
                        if (response.isSuccessful && body?.success == true) {
                            SessionHolder.signIn()
                            body.token?.let { AuthTokenHolder.setToken(it) }
                            body.user?.name?.let { SessionHolder.setUserName(it) }
                            onLoginSuccess()
                        } else {
                            error = body?.message ?: "Google sign-in failed"
                        }
                    } catch (e: Exception) {
                        error = e.message ?: "Google sign-in failed"
                    } finally {
                        isLoading = false
                    }
                }
            } else {
                error = "Could not get Google account"
            }
        } catch (e: ApiException) {
            error = "Google sign-in failed: ${e.message ?: "Unknown error"}"
        }
    }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        if (com.bstream.app.android.AuthFlowState.justRegistered) {
            com.bstream.app.android.AuthFlowState.justRegistered = false
            success = "Account created successfully! Please sign in."
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF020617),
                        Color(0xFF0f172a),
                        Color(0xFF020617)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "BSTREAM",
                        color = Color.White.copy(alpha = 0.5f),
                        style = MaterialTheme.typography.labelSmall,
                        letterSpacing = 2.4.sp
                    )
                    Text(
                        text = "Sign in",
                        color = Color.White,
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.SemiBold
                        )
                    )
                    Text(
                        text = "Sign in to your Bstream account",
                        color = Color.White.copy(alpha = 0.6f),
                        style = MaterialTheme.typography.bodyMedium
                    )

                    if (success.isNotEmpty()) {
                        Text(
                            text = success,
                            color = Color(0xFF6ee7b7),
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    Color(0xFF065f46).copy(alpha = 0.3f),
                                    RoundedCornerShape(16.dp)
                                )
                                .padding(12.dp)
                        )
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it; error = "" },
                        label = { Text("Email", color = Color.White.copy(alpha = 0.7f)) },
                        placeholder = { Text("you@example.com", color = Color.White.copy(alpha = 0.4f)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        colors = loginTextFieldColors(),
                        shape = RoundedCornerShape(16.dp)
                    )
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it; error = "" },
                        label = { Text("Password", color = Color.White.copy(alpha = 0.7f)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = loginTextFieldColors(),
                        shape = RoundedCornerShape(16.dp)
                    )

                    if (error.isNotEmpty()) {
                        Text(
                            text = error,
                            color = Color(0xFFfda4af),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    Button(
                        onClick = {
                            error = ""
                            if (email.isBlank() || password.isBlank()) {
                                error = "Please enter both email and password"
                                return@Button
                            }
                            isLoading = true
                            scope.launch {
                                try {
                                    val response = ApiModule.authApi.login(
                                        LoginRequest(email.trim().lowercase(), password)
                                    )
                                    val body = response.body()
                                    if (response.isSuccessful && body?.success == true) {
                                        SessionHolder.signIn()
                                        body.token?.let { AuthTokenHolder.setToken(it) }
                                        if (body.user?.name != null) SessionHolder.setUserName(body.user.name)
                                        onLoginSuccess()
                                    } else {
                                        error = body?.message ?: "Invalid email or password"
                                    }
                                } catch (e: Exception) {
                                    error = e.message ?: "Sign in failed. Please try again."
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth(),
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color.White),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Text(
                            text = if (isLoading) "Signing in…" else "Sign In",
                            color = Color(0xFF0f172a)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(Color.White.copy(alpha = 0.1f))
                                .align(Alignment.Center)
                        )
                        Text(
                            text = "OR SIGN IN WITH",
                            color = Color.White.copy(alpha = 0.5f),
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier
                                .background(Color.White.copy(alpha = 0.05f))
                                .padding(horizontal = 12.dp)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        SocialLoginButton(
                            text = "Google",
                            modifier = Modifier.weight(1f),
                            enabled = !isLoading && googleSignInClient != null,
                            onClick = {
                                error = ""
                                if (isLoading || googleSignInClient == null) return@SocialLoginButton
                                googleSignInLauncher.launch(googleSignInClient.signInIntent)
                            }
                        )
                        SocialLoginButton(
                            text = "Microsoft",
                            modifier = Modifier.weight(1f),
                            enabled = !isLoading,
                            onClick = {
                                scope.launch {
                                    snackbarHostState.showSnackbar("Coming soon", duration = SnackbarDuration.Short)
                                }
                            }
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        SocialLoginButton(
                            text = "Facebook",
                            modifier = Modifier.weight(1f),
                            enabled = !isLoading,
                            onClick = {
                                scope.launch {
                                    snackbarHostState.showSnackbar("Coming soon", duration = SnackbarDuration.Short)
                                }
                            }
                        )
                        SocialLoginButton(
                            text = "Instagram",
                            modifier = Modifier.weight(1f),
                            enabled = !isLoading,
                            onClick = {
                                scope.launch {
                                    snackbarHostState.showSnackbar("Coming soon", duration = SnackbarDuration.Short)
                                }
                            }
                        )
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "Don't have an account? ",
                            color = Color.White.copy(alpha = 0.6f),
                            style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                            text = "Create one",
                            color = Color(0xFF22d3ee),
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.clickable(onClick = onNavigateToRegister)
                        )
                    }
                }
            }
        }

        IconButton(
            onClick = onBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(8.dp)
        ) {
            Icon(
                Icons.Default.ArrowBack,
                contentDescription = "Back",
                tint = Color.White
            )
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp)
        ) { data ->
            Snackbar(
                snackbarData = data,
                containerColor = Color(0xFF1e293b),
                contentColor = Color.White
            )
        }
    }
}

@Composable
private fun SocialLoginButton(
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier,
        colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
            contentColor = Color.White
        ),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
    ) {
        Text(
            text = "Continue with $text",
            style = MaterialTheme.typography.labelMedium,
            maxLines = 1
        )
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun loginTextFieldColors() = androidx.compose.material3.TextFieldDefaults.outlinedTextFieldColors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White,
    focusedBorderColor = Color(0xFF06b6d4),
    unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
    cursorColor = Color(0xFF06b6d4),
    focusedLabelColor = Color(0xFF06b6d4),
    unfocusedLabelColor = Color.White.copy(alpha = 0.7f),
)
