package com.bstream.app.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.bstream.app.android.SessionHolder

@Composable
fun AccountScreen(
    onInsightsClick: () -> Unit = {},
    onUploadClick: () -> Unit = {},
    onNavigateToLogin: () -> Unit = {},
    onNavigateToRegister: () -> Unit = {},
) {
    val isLoggedIn by SessionHolder.isLoggedIn.collectAsState(initial = false)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0f172a))
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.5f),
                modifier = Modifier.padding(bottom = 16.dp)
            )
            Text(
                text = "Account",
                color = Color.White,
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Text(
                text = if (isLoggedIn)
                    "You're signed in. Upload videos, go live, and view insights."
                else
                    "Sign in to upload videos, go live, and see insights.",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodyMedium
            )
            if (!isLoggedIn) {
                Button(
                    onClick = onNavigateToLogin,
                    modifier = Modifier.padding(top = 16.dp),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFF06b6d4))
                ) {
                    Text("Sign in")
                }
                Button(
                    onClick = onNavigateToRegister,
                    modifier = Modifier.padding(top = 8.dp),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFF1e293b))
                ) {
                    Text("Create account")
                }
            } else {
                Button(
                    onClick = { SessionHolder.signOut() },
                    modifier = Modifier.padding(top = 16.dp),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFF64748b))
                ) {
                    Text("Sign out")
                }
            }
        }

        if (isLoggedIn) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onInsightsClick)
                    .padding(16.dp)
                    .background(Color(0xFF1e293b)),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(Icons.Default.Analytics, contentDescription = null, tint = Color(0xFF06b6d4))
                Text("Insights", color = Color.White, style = MaterialTheme.typography.bodyLarge)
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onUploadClick)
                    .padding(16.dp)
                    .background(Color(0xFF1e293b)),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(Icons.Default.Upload, contentDescription = null, tint = Color(0xFF06b6d4))
                Text("Upload video", color = Color.White, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}
