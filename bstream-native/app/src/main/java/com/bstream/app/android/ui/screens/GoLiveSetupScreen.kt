package com.bstream.app.android.ui.screens

import android.Manifest
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.bstream.app.android.SessionHolder
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.ChannelItem
import com.bstream.app.android.data.GoLiveRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.content.Context
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoLiveSetupScreen(
    onBack: () -> Unit,
    onNavigateToLogin: () -> Unit,
) {
    val isLoggedIn by SessionHolder.isLoggedIn.collectAsState(initial = false)
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var channels by remember { mutableStateOf<List<ChannelItem>>(emptyList()) }
    var channelsLoading by remember { mutableStateOf(false) }
    var channelsError by remember { mutableStateOf<String?>(null) }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var visibility by remember { mutableStateOf("PUBLIC") }
    var selectedChannelId by remember { mutableStateOf<String?>(null) }
    var startError by remember { mutableStateOf("") }
    var startLoading by remember { mutableStateOf(false) }
    var streamShareUrl by remember { mutableStateOf<String?>(null) }
    var streamId by remember { mutableStateOf<String?>(null) }

    var cameraActive by remember { mutableStateOf(false) }
    var micOn by remember { mutableStateOf(true) }
    var permissionDenied by remember { mutableStateOf(false) }
    var cameraProvider by remember { mutableStateOf<ProcessCameraProvider?>(null) }
    var cameraUnavailable by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.values.all { it }
        permissionDenied = !allGranted
        if (allGranted) cameraActive = true
    }

    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    LaunchedEffect(isLoggedIn) {
        if (!isLoggedIn) return@LaunchedEffect
        withContext(Dispatchers.Main) {
            channelsLoading = true
            channelsError = null
        }
        try {
            val response = ApiModule.goLiveApi.getChannels()
            val body = response.body()
            withContext(Dispatchers.Main) {
                when {
                    response.isSuccessful && body?.success == true && !body.channels.isNullOrEmpty() -> {
                        channels = body.channels ?: emptyList()
                        selectedChannelId = body.channels?.firstOrNull()?.id
                    }
                    response.code() == 401 -> channelsError = "Sign in required. Please sign in and try again."
                    response.isSuccessful && (body?.channels.isNullOrEmpty() != false) ->
                        channelsError = "No channels found. Create a channel in the web app first."
                    else -> channelsError = "Failed to load channels"
                }
            }
        } catch (e: Throwable) {
            withContext(Dispatchers.Main) {
                channelsError = e.message ?: "Failed to load channels"
            }
        } finally {
            withContext(Dispatchers.Main) {
                channelsLoading = false
            }
        }
    }

    DisposableEffect(cameraActive) {
        onDispose {
            cameraProvider?.unbindAll()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0f172a))
    ) {
        TopAppBar(
            title = { Text("Go Live", color = Color.White) },
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
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            when {
                !isLoggedIn -> {
                    Text(
                        text = "Sign in to go live",
                        color = Color.White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Button(
                        onClick = onNavigateToLogin,
                        modifier = Modifier.fillMaxWidth(),
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFF06b6d4)),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Text("Sign in", color = Color.White)
                    }
                }
                channelsLoading -> {
                    Text("Loading channels…", color = Color.White.copy(alpha = 0.7f))
                }
                channelsError != null -> {
                    Text(
                        text = channelsError!!,
                        color = Color(0xFFf87171),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                channels.isEmpty() -> {
                    Text(
                        text = "Create a channel in the web app first, then try again.",
                        color = Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                else -> {
                    // --- Camera preview area (like web: Start camera → live feed) ---
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(16f / 9f)
                            .background(Color(0xFF1e293b), RoundedCornerShape(16.dp))
                    ) {
                        if (!cameraActive) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    Icons.Default.Videocam,
                                    contentDescription = null,
                                    tint = Color.White.copy(alpha = 0.3f),
                                    modifier = Modifier.padding(bottom = 12.dp)
                                )
                                Text(
                                    text = "Camera preview",
                                    color = Color.White.copy(alpha = 0.7f),
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    text = "Tap \"Start camera\" to begin",
                                    color = Color.White.copy(alpha = 0.5f),
                                    style = MaterialTheme.typography.bodySmall
                                )
                                if (permissionDenied) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Camera and microphone access was denied. Enable in Settings → Apps → Bstream → Permissions.",
                                        color = Color(0xFFfda4af),
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        } else {
                            CameraPreview(
                                context = context,
                                lifecycleOwner = lifecycleOwner,
                                onProviderReady = { cameraProvider = it; cameraUnavailable = false },
                                onCameraUnavailable = { cameraUnavailable = true }
                            )
                            if (cameraUnavailable) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(Color(0xFF1e293b)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier.padding(24.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.VideocamOff,
                                            contentDescription = null,
                                            tint = Color.White.copy(alpha = 0.5f),
                                            modifier = Modifier.size(48.dp)
                                        )
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Text(
                                            text = "Camera not available",
                                            color = Color.White.copy(alpha = 0.9f),
                                            style = MaterialTheme.typography.bodyLarge
                                        )
                                        Text(
                                            text = "On emulator: enable Virtual Scene Camera in AVD settings (Extended controls → Camera), or test on a real device.",
                                            color = Color.White.copy(alpha = 0.6f),
                                            style = MaterialTheme.typography.bodySmall,
                                            modifier = Modifier.padding(top = 8.dp)
                                        )
                                    }
                                }
                            }
                            if (streamId != null) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopStart)
                                        .padding(12.dp)
                                        .background(Color(0xFFef4444), RoundedCornerShape(20.dp))
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .background(Color.White, RoundedCornerShape(4.dp))
                                        )
                                        Text(
                                            text = "LIVE",
                                            color = Color.White,
                                            style = MaterialTheme.typography.labelMedium
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // --- Controls: Start camera / Stop camera + Mic (when camera active) ---
                    if (!cameraActive) {
                        Button(
                            onClick = {
                                permissionDenied = false
                                permissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.CAMERA,
                                        Manifest.permission.RECORD_AUDIO
                                    )
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color.White),
                            shape = RoundedCornerShape(24.dp)
                        ) {
                            Icon(Icons.Default.Videocam, contentDescription = null, tint = Color(0xFF0f172a), modifier = Modifier.padding(end = 8.dp))
                            Text("Start camera", color = Color(0xFF0f172a))
                        }
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedButton(
                                onClick = { cameraActive = false; if (streamId != null) { streamId = null; streamShareUrl = null } },
                                modifier = Modifier.weight(1f),
                                colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Icon(Icons.Default.VideocamOff, contentDescription = null, tint = Color.White, modifier = Modifier.padding(end = 6.dp))
                                Text("Stop camera")
                            }
                            OutlinedButton(
                                onClick = { micOn = !micOn },
                                modifier = Modifier.weight(1f),
                                colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                                    contentColor = if (micOn) Color.White else Color(0xFFf87171)
                                ),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Text(if (micOn) "Mic on" else "Mic off")
                            }
                        }

                        // Stream visibility (when camera on, before or during live)
                        Text(
                            text = "Stream visibility",
                            color = Color.White.copy(alpha = 0.8f),
                            style = MaterialTheme.typography.labelMedium
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { visibility = "PUBLIC" },
                                modifier = Modifier.weight(1f),
                                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                    containerColor = if (visibility == "PUBLIC") Color(0xFF06b6d4) else Color(0xFF1e293b)
                                ),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Text("Public", color = Color.White)
                            }
                            Button(
                                onClick = { visibility = "PRIVATE" },
                                modifier = Modifier.weight(1f),
                                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                    containerColor = if (visibility == "PRIVATE") Color(0xFF06b6d4) else Color(0xFF1e293b)
                                ),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Text("Private", color = Color.White)
                            }
                        }

                        // Stream details (channel, title, description) — only when not live
                        if (streamId == null) {
                            Text(
                                text = "Channel",
                                color = Color.White.copy(alpha = 0.7f),
                                style = MaterialTheme.typography.labelSmall
                            )
                            channels.forEach { ch ->
                                OutlinedButton(
                                    onClick = { selectedChannelId = ch.id },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                                        contentColor = if (selectedChannelId == ch.id) Color(0xFF06b6d4) else Color.White
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(ch.name)
                                }
                            }
                            OutlinedTextField(
                                value = title,
                                onValueChange = { title = it; startError = "" },
                                label = { Text("Stream title *", color = Color.White.copy(alpha = 0.7f)) },
                                placeholder = { Text("My Live Stream", color = Color.White.copy(alpha = 0.4f)) },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                colors = goLiveTextFieldColors()
                            )
                            OutlinedTextField(
                                value = description,
                                onValueChange = { description = it },
                                label = { Text("Description (optional)", color = Color.White.copy(alpha = 0.7f)) },
                                placeholder = { Text("Tell viewers what your stream is about...", color = Color.White.copy(alpha = 0.4f)) },
                                modifier = Modifier.fillMaxWidth(),
                                maxLines = 3,
                                colors = goLiveTextFieldColors()
                            )
                            if (startError.isNotEmpty()) {
                                Text(
                                    text = startError,
                                    color = Color(0xFFf87171),
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                            Button(
                                onClick = {
                                    val chId = selectedChannelId
                                    if (chId == null || title.isBlank()) {
                                        startError = if (title.isBlank()) "Enter a stream title" else "Select a channel"
                                        return@Button
                                    }
                                    if (title.length < 3) {
                                        startError = "Title must be at least 3 characters"
                                        return@Button
                                    }
                                    startLoading = true
                                    startError = ""
                                    scope.launch {
                                        try {
                                            val response = ApiModule.goLiveApi.startStream(
                                                GoLiveRequest(
                                                    title = title.trim(),
                                                    description = description.takeIf { it.isNotBlank() },
                                                    visibility = visibility,
                                                    channelId = chId
                                                )
                                            )
                                            val body = response.body()
                                            val ok = response.isSuccessful && body?.success == true && body.stream != null
                                            val sid = body?.stream?.id
                                            val url = body?.stream?.shareUrl ?: body?.stream?.streamUrl
                                            val errMsg = body?.message ?: "Failed to start stream"
                                            withContext(Dispatchers.Main) {
                                                if (ok && sid != null) {
                                                    streamId = sid
                                                    streamShareUrl = url
                                                } else {
                                                    startError = errMsg
                                                }
                                            }
                                        } catch (e: Exception) {
                                            withContext(Dispatchers.Main) {
                                                startError = e.message ?: "Failed to start stream"
                                            }
                                        } finally {
                                            withContext(Dispatchers.Main) {
                                                startLoading = false
                                            }
                                        }
                                    }
                                },
                                enabled = !startLoading,
                                modifier = Modifier.fillMaxWidth(),
                                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFFef4444)),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Text(if (startLoading) "Starting…" else "Go Live")
                            }
                        } else {
                            // Live: show End stream and optional copy link (no "Share this link with viewers" message)
                            if (streamShareUrl != null) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFF1e293b), RoundedCornerShape(8.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = streamShareUrl!!,
                                        color = Color.White.copy(alpha = 0.8f),
                                        style = MaterialTheme.typography.bodySmall,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                            OutlinedButton(
                                onClick = {
                                    scope.launch {
                                        withContext(Dispatchers.Main) { startLoading = true; startError = "" }
                                        try {
                                            val resp = ApiModule.goLiveApi.endStream(streamId!!)
                                            val ok = resp.isSuccessful && resp.body()?.success == true
                                            val errMsg = resp.body()?.message ?: "Failed to end stream"
                                            withContext(Dispatchers.Main) {
                                                if (ok) {
                                                    streamShareUrl = null
                                                    streamId = null
                                                } else {
                                                    startError = errMsg
                                                }
                                            }
                                        } catch (e: Exception) {
                                            withContext(Dispatchers.Main) {
                                                startError = e.message ?: "Failed to end stream"
                                            }
                                        } finally {
                                            withContext(Dispatchers.Main) { startLoading = false }
                                        }
                                    }
                                },
                                enabled = !startLoading,
                                modifier = Modifier.fillMaxWidth(),
                                colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFf87171)),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Text(if (startLoading) "Ending…" else "End stream")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CameraPreview(
    context: Context,
    lifecycleOwner: androidx.lifecycle.LifecycleOwner,
    onProviderReady: (ProcessCameraProvider) -> Unit,
    onCameraUnavailable: () -> Unit
) {
    var listenerAdded by remember { mutableStateOf(false) }
    AndroidView(
        factory = { ctx ->
            PreviewView(ctx).apply {
                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
            }
        },
        modifier = Modifier.fillMaxSize(),
        update = { previewView ->
            if (listenerAdded) return@AndroidView
            listenerAdded = true
            val providerFuture = ProcessCameraProvider.getInstance(context)
            providerFuture.addListener({
                val provider = providerFuture.get()
                val preview = Preview.Builder().build().apply {
                    setSurfaceProvider(previewView.surfaceProvider)
                }
                try {
                    provider.unbindAll()
                    try {
                        provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview)
                    } catch (_: Exception) {
                        // Emulators often have only front camera; try it
                        provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_FRONT_CAMERA, preview)
                    }
                    onProviderReady(provider)
                } catch (_: Exception) {
                    onCameraUnavailable()
                }
            }, ContextCompat.getMainExecutor(context))
        }
    )
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun goLiveTextFieldColors() =
    androidx.compose.material3.TextFieldDefaults.outlinedTextFieldColors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedBorderColor = Color(0xFF06b6d4),
        unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
        cursorColor = Color(0xFF06b6d4),
        focusedLabelColor = Color(0xFF06b6d4),
        unfocusedLabelColor = Color.White.copy(alpha = 0.7f),
    )
