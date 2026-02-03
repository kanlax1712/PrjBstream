package com.bstream.app.android.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.foundation.layout.Box
import kotlinx.coroutines.launch

private val QUALITIES = listOf("auto", "480p", "720p", "1080p", "1440p", "2160p", "original")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UploadScreen(
    onBack: () -> Unit,
    viewModel: UploadViewModel = viewModel<UploadViewModel>(),
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    val videoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        val name = uri?.let { getFileName(context, it) } ?: "video.mp4"
        viewModel.setVideoUri(uri, name, context)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0f172a))
    ) {
        TopAppBar(
            title = { Text("Upload video", color = Color.White) },
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = state.title,
                onValueChange = viewModel::setTitle,
                label = { Text("Title", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("Name your story", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = outlineColors(),
            )
            OutlinedTextField(
                value = state.description,
                onValueChange = viewModel::setDescription,
                label = { Text("Description", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("Tell your audience what to expect", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                colors = outlineColors(),
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1e293b), RoundedCornerShape(8.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(Icons.Default.VideoLibrary, contentDescription = null, tint = Color(0xFF06b6d4))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = state.videoFileName ?: "No video selected",
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "MP4, MOV, WebM up to 2GB",
                        color = Color.White.copy(alpha = 0.5f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Button(
                    onClick = { videoPicker.launch("video/*") },
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFF06b6d4))
                ) {
                    Text(if (state.videoUri != null) "Change" else "Select video")
                }
            }

            OutlinedTextField(
                value = state.thumbnailUrl,
                onValueChange = viewModel::setThumbnailUrl,
                label = { Text("Thumbnail URL (optional)", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("https://", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = outlineColors(),
            )
            OutlinedTextField(
                value = if (state.durationSeconds > 0) state.durationSeconds.toString() else "",
                onValueChange = { viewModel.setDuration(it.toIntOrNull() ?: 0) },
                label = { Text("Duration (seconds)", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("Auto from video", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = outlineColors(),
            )
            if (state.durationSeconds > 0) {
                Text(
                    text = "Auto-detected: ${formatDuration(state.durationSeconds)} (editable)",
                    color = Color.White.copy(alpha = 0.5f),
                    style = MaterialTheme.typography.bodySmall
                )
            }

            OutlinedTextField(
                value = state.tags,
                onValueChange = viewModel::setTags,
                label = { Text("Tags (optional)", color = Color.White.copy(alpha = 0.7f)) },
                placeholder = { Text("streaming, creator", color = Color.White.copy(alpha = 0.4f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = outlineColors(),
            )

            var qualityExpanded by remember { mutableStateOf(false) }
            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = state.videoQuality,
                    onValueChange = { },
                    readOnly = true,
                    label = { Text("Video quality", color = Color.White.copy(alpha = 0.7f)) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { qualityExpanded = true },
                    colors = outlineColors(),
                )
                DropdownMenu(
                    expanded = qualityExpanded,
                    onDismissRequest = { qualityExpanded = false }
                ) {
                    QUALITIES.forEach { q ->
                        val label = when (q) {
                            "auto" -> "Auto"
                            "1440p" -> "1440p (2K)"
                            "2160p" -> "2160p (4K)"
                            else -> q
                        }
                        DropdownMenuItem(
                            text = { Text(label, color = Color.White) },
                            onClick = {
                                viewModel.setVideoQuality(q)
                                qualityExpanded = false
                            }
                        )
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1e293b), RoundedCornerShape(8.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = state.hasAds,
                    onCheckedChange = viewModel::setHasAds,
                    colors = androidx.compose.material3.CheckboxDefaults.colors(
                        checkedColor = Color(0xFF06b6d4),
                        uncheckedColor = Color.White.copy(alpha = 0.6f)
                    )
                )
                Text(
                    text = "Include 10-second ad before video (monetize with pre-roll)",
                    color = Color.White.copy(alpha = 0.9f),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }

            if (state.fileError.isNotEmpty()) {
                Text(
                    text = state.fileError,
                    color = Color(0xFFf87171),
                    style = MaterialTheme.typography.bodySmall
                )
            }
            if (state.message.isNotEmpty()) {
                Text(
                    text = state.message,
                    color = if (state.success) Color(0xFF34d399) else Color(0xFFf87171),
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = {
                    scope.launch {
                        viewModel.upload(context)
                    }
                },
                enabled = !state.isUploading,
                modifier = Modifier.fillMaxWidth(),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color(0xFF06b6d4))
            ) {
                Text(if (state.isUploading) "Uploading…" else "Publish video")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun outlineColors() = androidx.compose.material3.TextFieldDefaults.outlinedTextFieldColors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White,
    focusedBorderColor = Color(0xFF06b6d4),
    unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
    cursorColor = Color(0xFF06b6d4),
    focusedLabelColor = Color(0xFF06b6d4),
    unfocusedLabelColor = Color.White.copy(alpha = 0.7f),
)

private fun formatDuration(seconds: Int): String {
    val m = seconds / 60
    val s = seconds % 60
    return "%d:%02d".format(m, s)
}

private fun getFileName(context: android.content.Context, uri: Uri): String {
    var name: String? = null
    context.contentResolver.query(
        uri,
        arrayOf(android.provider.OpenableColumns.DISPLAY_NAME),
        null,
        null,
        null
    )?.use { cursor ->
        if (cursor.moveToFirst()) {
            val idx = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
            if (idx >= 0) name = cursor.getString(idx)
        }
    }
    return name ?: uri.lastPathSegment?.substringAfterLast('/') ?: "video.mp4"
}
