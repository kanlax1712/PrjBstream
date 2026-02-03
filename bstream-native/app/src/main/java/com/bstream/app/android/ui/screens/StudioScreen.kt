package com.bstream.app.android.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.bstream.app.android.SessionHolder
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.ChannelItem
import com.bstream.app.android.data.CreateChannelRequest
import com.bstream.app.android.data.StudioVideoItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun StudioScreen(onUploadClick: () -> Unit = {}) {
    val context = LocalContext.current
    val isLoggedIn by SessionHolder.isLoggedIn.collectAsState(initial = false)
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var channels by remember { mutableStateOf<List<ChannelItem>>(emptyList()) }
    var studioVideos by remember { mutableStateOf<List<StudioVideoItem>>(emptyList()) }
    var channelsLoading by remember { mutableStateOf(false) }
    var videosLoading by remember { mutableStateOf(false) }
    var channelsError by remember { mutableStateOf<String?>(null) }
    var videosError by remember { mutableStateOf<String?>(null) }

    var channelName by remember { mutableStateOf("") }
    var channelHandle by remember { mutableStateOf("") }
    var channelDescription by remember { mutableStateOf("") }
    var createLoading by remember { mutableStateOf(false) }
    var createError by remember { mutableStateOf("") }
    var createMessage by remember { mutableStateOf("") }

    LaunchedEffect(isLoggedIn) {
        if (!isLoggedIn) return@LaunchedEffect
        channelsLoading = true
        channelsError = null
        try {
            val response = ApiModule.goLiveApi.getChannels()
            val body = response.body()
            withContext(Dispatchers.Main) {
                when {
                    response.isSuccessful && body?.success == true -> {
                        channels = body.channels ?: emptyList()
                    }
                    response.code() == 401 -> channelsError = "Sign in required"
                    else -> channelsError = body?.message ?: "Failed to load channels"
                }
            }
        } catch (e: Throwable) {
            withContext(Dispatchers.Main) {
                channelsError = e.message ?: "Failed to load channels"
            }
        } finally {
            withContext(Dispatchers.Main) { channelsLoading = false }
        }
    }

    LaunchedEffect(isLoggedIn) {
        if (!isLoggedIn) return@LaunchedEffect
        videosLoading = true
        videosError = null
        try {
            val response = ApiModule.feedApi.getStudioVideos()
            val body = response.body()
            withContext(Dispatchers.Main) {
                when {
                    response.isSuccessful && body?.success == true -> {
                        studioVideos = body.videos ?: emptyList()
                    }
                    response.code() == 401 -> videosError = "Sign in required"
                    else -> videosError = body?.message ?: "Failed to load videos"
                }
            }
        } catch (e: Throwable) {
            withContext(Dispatchers.Main) {
                videosError = e.message ?: "Failed to load videos"
            }
        } finally {
            withContext(Dispatchers.Main) { videosLoading = false }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0f172a))
            .verticalScroll(scrollState)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Header card (like web)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    color = Color(0xFF1e293b),
                    shape = RoundedCornerShape(24.dp)
                )
                .padding(24.dp)
        ) {
            Column {
                Text(
                    text = "CREATOR STUDIO",
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.labelSmall
                )
                Text(
                    text = "Welcome back, ${if (isLoggedIn) (channels.firstOrNull()?.name ?: "Creator") else "Guest"}",
                    color = Color.White,
                    style = MaterialTheme.typography.headlineSmall,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
                if (isLoggedIn && channels.isNotEmpty()) {
                    Text(
                        text = "${channels.size} ${if (channels.size == 1) "channel" else "channels"}",
                        color = Color.White.copy(alpha = 0.6f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Text(
                    text = "Plan uploads, schedule premieres, and track watch time from one place.",
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 4.dp)
                )
                if (isLoggedIn && studioVideos.isNotEmpty()) {
                    Text(
                        text = "${studioVideos.size} published ${if (studioVideos.size == 1) "video" else "videos"}",
                        color = Color.White.copy(alpha = 0.6f),
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }

        if (!isLoggedIn) {
            Text(
                text = "Sign in to create channels, upload videos, and see your latest releases.",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodyMedium
            )
        } else {
            // Your Channels
            Text(
                text = "Your Channels",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium
            )
            when {
                channelsLoading -> {
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF06b6d4), modifier = Modifier.size(32.dp))
                    }
                }
                channelsError != null -> {
                    Text(
                        text = channelsError!!,
                        color = Color(0xFFf87171),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                channels.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF1e293b), RoundedCornerShape(16.dp))
                            .padding(24.dp)
                    ) {
                        Text(
                            text = "No channels yet. Create your first channel to get started.",
                            color = Color.White.copy(alpha = 0.6f),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
                else -> {
                    channels.forEach { ch ->
                        ChannelCard(
                            channel = ch,
                            onViewClick = {
                                val base = ApiModule.baseUrl().trimEnd('/')
                                val url = "$base/channel/${ch.handle ?: ch.id}"
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                            }
                        )
                    }
                }
            }

            // Create Your Channel
            Text(
                text = "Create Your Channel",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = "Create a channel to start uploading and sharing videos with your audience.",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodySmall
            )
            OutlinedTextField(
                value = channelName,
                onValueChange = { channelName = it; createError = ""; createMessage = "" },
                label = { Text("Channel Name *", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("My Awesome Channel", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = studioTextFieldColors()
            )
            OutlinedTextField(
                value = channelHandle,
                onValueChange = { v ->
                    channelHandle = v.lowercase().replace(Regex("[^a-z0-9-]"), "-").replace(Regex("-+"), "-").trimStart('-').trimEnd('-')
                    createError = ""
                    createMessage = ""
                },
                label = { Text("Handle *", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("my-awesome-channel", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = studioTextFieldColors()
            )
            Text(
                text = "Only lowercase letters, numbers, and hyphens. This will be your channel URL.",
                color = Color.White.copy(alpha = 0.5f),
                style = MaterialTheme.typography.bodySmall
            )
            OutlinedTextField(
                value = channelDescription,
                onValueChange = { channelDescription = it },
                label = { Text("Description (optional)", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("Tell viewers about your channel...", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3,
                colors = studioTextFieldColors()
            )
            if (createError.isNotEmpty()) {
                Text(text = createError, color = Color(0xFFf87171), style = MaterialTheme.typography.bodySmall)
            }
            if (createMessage.isNotEmpty()) {
                Text(text = createMessage, color = Color(0xFF6ee7b7), style = MaterialTheme.typography.bodySmall)
            }
            Button(
                onClick = {
                    if (channelName.length < 2) {
                        createError = "Channel name must be at least 2 characters"
                        return@Button
                    }
                    if (channelHandle.length < 2) {
                        createError = "Handle must be at least 2 characters"
                        return@Button
                    }
                    if (!Regex("^[a-z0-9-]+$").matches(channelHandle)) {
                        createError = "Handle can only contain lowercase letters, numbers, and hyphens"
                        return@Button
                    }
                    createLoading = true
                    createError = ""
                    createMessage = ""
                    scope.launch {
                        try {
                            val response = ApiModule.goLiveApi.createChannel(
                                CreateChannelRequest(
                                    name = channelName.trim(),
                                    handle = channelHandle,
                                    description = channelDescription.takeIf { it.isNotBlank() }
                                )
                            )
                            val body = response.body()
                            withContext(Dispatchers.Main) {
                                if (response.isSuccessful && body?.success == true) {
                                    createMessage = body.message ?: "Channel created."
                                    channelName = ""
                                    channelHandle = ""
                                    channelDescription = ""
                                    body.channel?.let { channels = channels + it }
                                } else {
                                    createError = body?.message ?: "Failed to create channel"
                                }
                            }
                        } catch (e: Exception) {
                            withContext(Dispatchers.Main) {
                                createError = e.message ?: "Failed to create channel"
                            }
                        } finally {
                            withContext(Dispatchers.Main) { createLoading = false }
                        }
                    }
                },
                enabled = !createLoading,
                modifier = Modifier.fillMaxWidth(),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFF06b6d4)),
                shape = RoundedCornerShape(24.dp)
            ) {
                Text(if (createLoading) "Creating..." else "Create Channel", color = Color.White)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Latest releases
            Text(
                text = "Latest releases",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium
            )
            when {
                videosLoading -> {
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF06b6d4), modifier = Modifier.size(32.dp))
                    }
                }
                videosError != null -> {
                    Text(
                        text = videosError!!,
                        color = Color(0xFFf87171),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                studioVideos.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF1e293b), RoundedCornerShape(16.dp))
                            .padding(24.dp)
                    ) {
                        Text(
                            text = "No uploads yet. Publish your first video today.",
                            color = Color.White.copy(alpha = 0.6f),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
                else -> {
                    studioVideos.forEach { video ->
                        StudioVideoCard(video = video)
                    }
                }
            }

            // Upload new video
            Text(
                text = "Upload new video",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium
            )
            Button(
                onClick = onUploadClick,
                modifier = Modifier.fillMaxWidth(),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFF06b6d4)),
                shape = RoundedCornerShape(24.dp)
            ) {
                Icon(Icons.Default.Upload, contentDescription = null, tint = Color.White, modifier = Modifier.padding(end = 8.dp))
                Text("Upload new video", color = Color.White)
            }
        }
    }
}

@Composable
private fun ChannelCard(
    channel: ChannelItem,
    onViewClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1e293b), RoundedCornerShape(16.dp))
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = channel.name,
                color = Color.White,
                style = MaterialTheme.typography.titleSmall
            )
            channel.handle?.let { handle ->
                Text(
                    text = "@$handle",
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodySmall
                )
            }
            channel.description?.takeIf { it.isNotBlank() }?.let { desc ->
                Text(
                    text = desc,
                    color = Color.White.copy(alpha = 0.5f),
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        OutlinedButton(
            onClick = onViewClick,
            colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
            shape = RoundedCornerShape(24.dp)
        ) {
            Text("View")
        }
    }
}

@Composable
private fun StudioVideoCard(video: StudioVideoItem) {
    val thumbUrl = ApiModule.resolveUrl(video.thumbnailUrl)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1e293b), RoundedCornerShape(16.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(width = 120.dp, height = 68.dp)
                .background(Color.Black, RoundedCornerShape(8.dp))
        ) {
            AsyncImage(
                model = thumbUrl,
                contentDescription = video.title,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = video.title,
                color = Color.White,
                style = MaterialTheme.typography.titleSmall,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            video.description?.takeIf { it.isNotBlank() }?.let { desc ->
                Text(
                    text = desc,
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Row(
                modifier = Modifier.padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Status: ${(video.status ?: "ready").lowercase()}",
                    color = Color.White.copy(alpha = 0.5f),
                    style = MaterialTheme.typography.labelSmall
                )
                video.publishedAt?.let { pub ->
                    Text(
                        text = formatRelative(pub),
                        color = Color.White.copy(alpha = 0.5f),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
                Text(
                    text = if (video.duration >= 60) "${video.duration / 60} min" else "${video.duration} sec",
                    color = Color.White.copy(alpha = 0.5f),
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

private fun formatRelative(isoDate: String): String {
    return try {
        val date = java.time.Instant.parse(isoDate)
        val now = java.time.Instant.now()
        val days = java.time.Duration.between(date, now).toDays()
        when {
            days < 1 -> "Today"
            days == 1L -> "1 day ago"
            days < 30 -> "${days} days ago"
            days < 60 -> "1mo ago"
            days < 365 -> "${days / 30}mo ago"
            else -> "${days / 365}y ago"
        }
    } catch (_: Exception) {
        isoDate
    }
}

@Composable
@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
private fun studioTextFieldColors() =
    androidx.compose.material3.TextFieldDefaults.outlinedTextFieldColors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedBorderColor = Color(0xFF06b6d4),
        unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
        cursorColor = Color(0xFF06b6d4),
        focusedLabelColor = Color(0xFF06b6d4),
        unfocusedLabelColor = Color.White.copy(alpha = 0.7f),
    )
