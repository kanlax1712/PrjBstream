package com.bstream.app.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.UploadPartBuilder
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)

@Composable
fun RegisterScreen(
    onBack: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onRegisterSuccess: () -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var age by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0f172a))
    ) {
        TopAppBar(
            title = { Text("Create Account", color = Color.White) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
            },
            colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                containerColor = Color(0xFF0f172a),
                titleContentColor = Color.White
            )
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState)
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Bstream",
                color = Color.White.copy(alpha = 0.5f),
                style = MaterialTheme.typography.labelMedium
            )
            Text(
                text = "Join Bstream to watch and share videos",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodyMedium
            )

            OutlinedTextField(
                value = name,
                onValueChange = { name = it; error = "" },
                label = { Text("Full Name", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("John Doe", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = loginTextFieldColors(),
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it; error = "" },
                label = { Text("Email", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("you@example.com", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                colors = loginTextFieldColors(),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it; error = "" },
                label = { Text("Password", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("At least 8 characters with letters and numbers", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                colors = loginTextFieldColors(),
            )
            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it; error = "" },
                label = { Text("Confirm Password", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("Re-enter password", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                colors = loginTextFieldColors(),
            )
            OutlinedTextField(
                value = age,
                onValueChange = { age = it.filter { c -> c.isDigit() }.take(3) },
                label = { Text("Age (optional)", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("Age", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = loginTextFieldColors(),
            )
            OutlinedTextField(
                value = gender,
                onValueChange = { gender = it; error = "" },
                label = { Text("Gender (optional)", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("Male / Female / Other", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = loginTextFieldColors(),
            )

            if (error.isNotEmpty()) {
                Text(
                    text = error,
                    color = Color(0xFFf87171),
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Button(
                onClick = {
                    error = ""
                    if (name.isBlank()) {
                        error = "Full name is required"
                        return@Button
                    }
                    if (email.isBlank()) {
                        error = "Email is required"
                        return@Button
                    }
                    if (password != confirmPassword) {
                        error = "Passwords do not match"
                        return@Button
                    }
                    if (password.length < 8) {
                        error = "Password must be at least 8 characters"
                        return@Button
                    }
                    if (!password.any { it.isLetter() }) {
                        error = "Password must contain at least one letter"
                        return@Button
                    }
                    if (!password.any { it.isDigit() }) {
                        error = "Password must contain at least one number"
                        return@Button
                    }
                    isLoading = true
                    scope.launch {
                        try {
                            val agePart = if (age.isNotBlank()) UploadPartBuilder.part("age", age) else UploadPartBuilder.part("age", "")
                            val genderPart = if (gender.isNotBlank()) UploadPartBuilder.part("gender", gender) else UploadPartBuilder.part("gender", "")
                            val response = ApiModule.authApi.register(
                                name = UploadPartBuilder.part("name", name.trim()),
                                email = UploadPartBuilder.part("email", email.trim().lowercase()),
                                password = UploadPartBuilder.part("password", password),
                                age = agePart,
                                gender = genderPart,
                            )
                            val body = response.body()
                            if (response.isSuccessful && body?.success == true) {
                                onRegisterSuccess()
                            } else {
                                error = body?.message ?: "Registration failed"
                            }
                        } catch (e: Exception) {
                            error = e.message ?: "Registration failed. Please try again."
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
                    text = if (isLoading) "Creating Account…" else "Create Account",
                    color = Color(0xFF0f172a)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Already have an account? ",
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "Sign in",
                    color = Color(0xFF22d3ee),
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.clickable(onClick = onNavigateToLogin)
                )
            }
        }
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
