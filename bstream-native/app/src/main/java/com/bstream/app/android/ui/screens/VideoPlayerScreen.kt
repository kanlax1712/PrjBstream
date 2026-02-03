package com.bstream.app.android.ui.screens

import android.app.Activity
import android.app.PictureInPictureParams
import android.content.Context
import android.media.AudioManager
import android.media.audiofx.LoudnessEnhancer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Rational
import android.view.ViewGroup
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.RepeatOne
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import androidx.compose.ui.window.Popup
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.FeedVideo
import com.bstream.app.android.data.TrackViewRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private val QUALITIES = listOf("Auto", "480p", "720p", "1080p", "1440p", "2160p", "original")

private val SPEED_OPTIONS = listOf(1f, 1.25f, 1.5f, 1.75f, 2f)

private fun isEmulator(): Boolean = Build.FINGERPRINT.startsWith("generic")
    || Build.FINGERPRINT.startsWith("unknown")
    || Build.MODEL.contains("sdk")
    || Build.MODEL.contains("Emulator")
    || Build.PRODUCT == "sdk"
    || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))

@Composable
fun VideoPlayerScreen(
    video: FeedVideo,
    onBack: () -> Unit,
    onSelectVideo: (FeedVideo) -> Unit = {},
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val density = LocalDensity.current
    var descriptionExpanded by remember { mutableStateOf(false) }
    var selectedQuality by remember { mutableStateOf<String?>(null) }
    var volumeLevel by remember { mutableStateOf(1f) }
    var volumeMenuExpanded by remember { mutableStateOf(false) }
    var volumeDismissKey by remember { mutableStateOf(0) }
    var qualityDialogOpen by remember { mutableStateOf(false) }
    var speedDialogOpen by remember { mutableStateOf(false) }
    var playbackSpeed by remember { mutableStateOf(1f) }
    val snackbarHostState = remember { SnackbarHostState() }
    var viewReady by remember { mutableStateOf(false) }
    var layoutPosted by remember { mutableStateOf(false) }
    var playerViewRef by remember { mutableStateOf<PlayerView?>(null) }
    var loudnessEnhancer by remember { mutableStateOf<LoudnessEnhancer?>(null) }
    var repeatEnabled by remember { mutableStateOf(false) }
    var recommendedVideos by remember { mutableStateOf<List<FeedVideo>>(emptyList()) }
    var liked by remember { mutableStateOf(false) }

    val streamUrl = remember(selectedQuality) {
        ApiModule.streamUrl(video.id, selectedQuality.takeIf { it != "Auto" })
    }

    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            playWhenReady = true
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    if (playbackState == Player.STATE_READY) {
                        playerViewRef?.post {
                            playerViewRef?.requestLayout()
                            playerViewRef?.invalidate()
                        }
                    }
                }
                override fun onAudioSessionIdChanged(audioSessionId: Int) {
                    if (isEmulator() && audioSessionId != 0) {
                        try {
                            val enhancer = LoudnessEnhancer(audioSessionId).apply {
                                setTargetGain(1000) // +10 dB boost for emulator
                                enabled = true
                            }
                            Handler(Looper.getMainLooper()).post {
                                loudnessEnhancer?.release()
                                loudnessEnhancer = enhancer
                            }
                        } catch (_: Exception) { }
                    }
                }
            })
        }
    }

    LaunchedEffect(viewReady, streamUrl) {
        if (viewReady) {
            exoPlayer.setMediaItem(MediaItem.fromUri(streamUrl))
            exoPlayer.prepare()
        }
    }

    LaunchedEffect(volumeLevel) {
        exoPlayer.volume = volumeLevel
    }

    LaunchedEffect(repeatEnabled) {
        exoPlayer.repeatMode = if (repeatEnabled) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
    }

    LaunchedEffect(playbackSpeed) {
        exoPlayer.setPlaybackParameters(PlaybackParameters(playbackSpeed, 1f))
    }

    LaunchedEffect(video.id) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val feed = ApiModule.feedApi.getFeed()
                val list = buildList {
                    feed.hero?.takeIf { it.id != video.id }?.let { add(it) }
                    addAll(feed.secondary.filter { it.id != video.id })
                }.take(12)
                withContext(Dispatchers.Main) { recommendedVideos = list }
            } catch (_: Exception) { }
        }
    }

    DisposableEffect(Unit) {
        activity?.setVolumeControlStream(AudioManager.STREAM_MUSIC)
        if (isEmulator()) {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            am?.let {
                val maxVol = it.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
                it.setStreamVolume(AudioManager.STREAM_MUSIC, maxVol, 0)
            }
        }
        onDispose {
            loudnessEnhancer?.release()
            loudnessEnhancer = null
            exoPlayer.release()
        }
    }

    LaunchedEffect(video.id) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                ApiModule.feedApi.trackView(TrackViewRequest(videoId = video.id))
            } catch (_: Exception) { }
        }
    }
    LaunchedEffect(volumeMenuExpanded, volumeDismissKey) {
        if (!volumeMenuExpanded) return@LaunchedEffect
        delay(5000)
        volumeMenuExpanded = false
    }

    val scope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF0f172a))) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
                .background(Color.Black)
        ) {
            AndroidView(
                factory = {
                    PlayerView(context).apply {
                        player = exoPlayer
                        resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    }
                },
                modifier = Modifier.fillMaxSize(),
                update = { playerView ->
                    playerViewRef = playerView
                    if (!layoutPosted) {
                        layoutPosted = true
                        playerView.post {
                            playerView.post {
                                viewReady = true
                            }
                        }
                    }
                }
            )

            Row(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = 8.dp, end = 8.dp, start = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                IconButton(onClick = { repeatEnabled = !repeatEnabled }) {
                    Icon(
                        imageVector = if (repeatEnabled) Icons.Filled.RepeatOne else Icons.Filled.Repeat,
                        contentDescription = if (repeatEnabled) "Repeat on" else "Repeat off",
                        tint = if (repeatEnabled) Color(0xFF06b6d4) else Color.White
                    )
                }
                Box {
                    IconButton(
                        onClick = { volumeMenuExpanded = !volumeMenuExpanded }
                    ) {
                    Icon(
                        imageVector = Icons.Filled.GraphicEq,
                        contentDescription = "Volume",
                        tint = Color.White
                    )
                }
                if (volumeMenuExpanded) {
                    Popup(
                        alignment = Alignment.TopEnd,
                        offset = IntOffset(0, with(density) { 48.dp.roundToPx() }),
                        onDismissRequest = { volumeMenuExpanded = false }
                    ) {
                        Box(
                            modifier = Modifier
                                .background(Color(0xFF1e293b), RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            VerticalVolumeSlider(
                                value = volumeLevel,
                                onValueChange = { newValue ->
                                    volumeDismissKey++
                                    volumeLevel = newValue.coerceIn(0f, 1f)
                                    exoPlayer.volume = volumeLevel
                                },
                                trackHeight = 160.dp,
                                trackWidth = 20.dp,
                                trackColor = Color(0xFF334155),
                                fillColor = Color(0xFF7DD3FC),
                                thumbColor = Color(0xFF475569)
                            )
                        }
                    }
                }
            }
                IconButton(onClick = { qualityDialogOpen = true }) {
                    Icon(Icons.Filled.Settings, contentDescription = "Quality", tint = Color.White)
                }
                IconButton(onClick = { speedDialogOpen = true }) {
                    Icon(Icons.Filled.Speed, contentDescription = "Speed", tint = Color.White)
                }
                if (qualityDialogOpen) {
                    val currentQuality = selectedQuality ?: "Auto"
                    AlertDialog(
                        onDismissRequest = { qualityDialogOpen = false },
                        containerColor = Color(0xFF1e293b),
                        title = { Text("Video quality", color = Color.White) },
                        text = {
                            Column(
                                modifier = Modifier
                                    .size(width = 280.dp, height = 360.dp)
                                    .verticalScroll(rememberScrollState()),
                                verticalArrangement = Arrangement.spacedBy(0.dp)
                            ) {
                                QUALITIES.forEach { q ->
                                    val label = when (q) {
                                        "Auto" -> "Auto (recommended)"
                                        "1440p" -> "1440p (2K)"
                                        "2160p" -> "2160p (4K)"
                                        else -> q
                                    }
                                    val isSelected = (q == "Auto" && selectedQuality == null) || (q != "Auto" && currentQuality == q)
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                selectedQuality = q.takeIf { it != "Auto" }
                                                qualityDialogOpen = false
                                            }
                                            .padding(vertical = 12.dp, horizontal = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        RadioButton(
                                            selected = isSelected,
                                            onClick = {
                                                selectedQuality = q.takeIf { it != "Auto" }
                                                qualityDialogOpen = false
                                            },
                                            colors = androidx.compose.material3.RadioButtonDefaults.colors(
                                                selectedColor = Color(0xFF06b6d4),
                                                unselectedColor = Color.White.copy(alpha = 0.7f)
                                            )
                                        )
                                        Spacer(modifier = Modifier.size(8.dp))
                                        Text(
                                            text = label,
                                            style = MaterialTheme.typography.bodyLarge,
                                            color = Color.White
                                        )
                                    }
                                }
                            }
                        },
                        confirmButton = {
                            TextButton(onClick = { qualityDialogOpen = false }) {
                                Text("Done", color = Color(0xFF06b6d4))
                            }
                        }
                    )
                }
                if (speedDialogOpen) {
                    AlertDialog(
                        onDismissRequest = { speedDialogOpen = false },
                        containerColor = Color(0xFF1e293b),
                        title = { Text("Playback speed", color = Color.White) },
                        text = {
                            Column(
                                modifier = Modifier
                                    .width(240.dp)
                                    .verticalScroll(rememberScrollState()),
                                verticalArrangement = Arrangement.spacedBy(0.dp)
                            ) {
                                SPEED_OPTIONS.forEach { speed ->
                                    val label = if (speed == 1f) "Normal (1x)" else "${speed}x"
                                    val isSelected = playbackSpeed == speed
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                playbackSpeed = speed
                                                speedDialogOpen = false
                                            }
                                            .padding(vertical = 12.dp, horizontal = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        RadioButton(
                                            selected = isSelected,
                                            onClick = {
                                                playbackSpeed = speed
                                                speedDialogOpen = false
                                            },
                                            colors = androidx.compose.material3.RadioButtonDefaults.colors(
                                                selectedColor = Color(0xFF06b6d4),
                                                unselectedColor = Color.White.copy(alpha = 0.7f)
                                            )
                                        )
                                        Spacer(modifier = Modifier.size(8.dp))
                                        Text(
                                            text = label,
                                            style = MaterialTheme.typography.bodyLarge,
                                            color = Color.White
                                        )
                                    }
                                }
                            }
                        },
                        confirmButton = {
                            TextButton(onClick = { speedDialogOpen = false }) {
                                Text("Done", color = Color(0xFF06b6d4))
                            }
                        }
                    )
                }
                if (activity != null) {
                    IconButton(
                        onClick = {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                val params = PictureInPictureParams.Builder()
                                    .setAspectRatio(Rational(16, 9))
                                    .build()
                                activity.enterPictureInPictureMode(params)
                            }
                        }
                    ) {
                        Text("PiP", color = Color.White, style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
            Row(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF0f172a))
                .padding(16.dp)
        ) {
            Text(
                text = video.title,
                color = Color.White,
                style = MaterialTheme.typography.titleMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            video.channel?.name?.let { name ->
                Text(
                    text = name,
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ActionChip(
                    icon = Icons.Filled.ThumbUp,
                    label = "Like",
                    active = liked,
                    onClick = {
                        liked = !liked
                        scope.launch {
                            snackbarHostState.showSnackbar(
                                if (liked) "Liked" else "Unliked",
                                withDismissAction = true
                            )
                        }
                    }
                )
                ActionChip(
                    icon = Icons.Filled.ChatBubble,
                    label = "Comment",
                    active = false,
                    onClick = {
                        scope.launch {
                            snackbarHostState.showSnackbar(
                                "Comments coming soon",
                                withDismissAction = true
                            )
                        }
                    }
                )
                ActionChip(
                    icon = Icons.Filled.Share,
                    label = "Share",
                    active = false,
                    onClick = {
                        shareVideo(context, video)
                        scope.launch {
                            snackbarHostState.showSnackbar(
                                "Sharing...",
                                withDismissAction = true
                            )
                        }
                    }
                )
            }

            video.description?.takeIf { it.isNotBlank() }?.let { desc ->
                Spacer(modifier = Modifier.height(4.dp))
                AnimatedVisibility(
                    visible = descriptionExpanded,
                    enter = expandVertically(),
                    exit = shrinkVertically()
                ) {
                    Text(
                        text = desc,
                        color = Color.White.copy(alpha = 0.9f),
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = if (descriptionExpanded) 20 else 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    text = if (descriptionExpanded) "Show less" else "Show more",
                    color = Color(0xFF06b6d4),
                    style = MaterialTheme.typography.labelMedium,
                    modifier = Modifier
                        .padding(top = 4.dp)
                        .clickable { descriptionExpanded = !descriptionExpanded }
                )
            }

            if (recommendedVideos.isNotEmpty()) {
                Spacer(modifier = Modifier.height(20.dp))
                Text(
                    text = "Recommended",
                    color = Color.White.copy(alpha = 0.9f),
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                recommendedVideos.forEach { rec ->
                    RecommendedVideoCard(
                        video = rec,
                        onClick = { onSelectVideo(rec) }
                    )
                }
            }
        }
    }
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp),
            snackbar = { snackbarData ->
                androidx.compose.material3.Snackbar(
                    snackbarData = snackbarData,
                    containerColor = Color(0xFF1e293b),
                    contentColor = Color.White
                )
            }
        )
    }
}

private fun shareVideo(context: Context, video: FeedVideo) {
    val url = "${ApiModule.baseUrl()}api/video/${video.id}/stream"
    val sendIntent = android.content.Intent().apply {
        action = android.content.Intent.ACTION_SEND
        putExtra(android.content.Intent.EXTRA_TEXT, "${video.title}\n$url")
        type = "text/plain"
    }
    context.startActivity(android.content.Intent.createChooser(sendIntent, null))
}

@Composable
private fun ActionChip(
    icon: ImageVector,
    label: String,
    active: Boolean,
    onClick: () -> Unit,
) {
    val bg = if (active) Color(0xFF06b6d4).copy(alpha = 0.25f) else Color(0xFF334155).copy(alpha = 0.5f)
    val tint = if (active) Color(0xFF06b6d4) else Color.White.copy(alpha = 0.85f)
    Row(
        modifier = Modifier
            .clickable(onClick = onClick)
            .background(bg, RoundedCornerShape(20.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(icon, contentDescription = label, tint = tint, modifier = Modifier.size(18.dp))
        Text(
            text = label,
            color = tint,
            style = MaterialTheme.typography.labelMedium
        )
    }
}

@Composable
private fun RecommendedVideoCard(
    video: FeedVideo,
    onClick: () -> Unit,
) {
    val thumbUrl = ApiModule.resolveUrl(video.thumbnailUrl)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = thumbUrl,
            contentDescription = video.title,
            modifier = Modifier
                .width(120.dp)
                .height(68.dp)
                .background(Color(0xFF1e293b), RoundedCornerShape(8.dp)),
            contentScale = ContentScale.Crop
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = video.title,
                color = Color.White,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            video.channel?.name?.let { name ->
                Text(
                    text = name,
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
    }
}

@Composable
private fun VerticalVolumeSlider(
    value: Float,
    onValueChange: (Float) -> Unit,
    trackHeight: androidx.compose.ui.unit.Dp,
    trackWidth: androidx.compose.ui.unit.Dp,
    trackColor: Color,
    fillColor: Color,
    thumbColor: Color,
    modifier: Modifier = Modifier
) {
    var heightPx by remember { mutableStateOf(1) }
    val trackShape = RoundedCornerShape(percent = 50)
    val thumbWidth = 14.dp
    val thumbHeight = 8.dp
    val fillHeightDp = (trackHeight.value * value.coerceIn(0f, 1f)).dp
    val thumbOffsetYDp = (trackHeight.value * (1f - value.coerceIn(0f, 1f)) - thumbHeight.value / 2f).coerceAtLeast(0f).dp

    Box(
        modifier = modifier
            .width(trackWidth + 20.dp)
            .height(trackHeight + 24.dp)
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .width(trackWidth)
                .height(trackHeight)
                .onSizeChanged { heightPx = it.height }
                .pointerInput(heightPx) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            if (heightPx > 1) {
                                val y = offset.y
                                val h = heightPx.toFloat()
                                val newValue = (1f - (y / h).coerceIn(0f, 1f)).coerceIn(0f, 1f)
                                onValueChange(newValue)
                            }
                        },
                        onDrag = { change, _ ->
                            change.consume()
                            if (heightPx > 1) {
                                val y = change.position.y
                                val h = heightPx.toFloat()
                                val newValue = (1f - (y / h).coerceIn(0f, 1f)).coerceIn(0f, 1f)
                                onValueChange(newValue)
                            }
                        }
                    )
                }
                .background(trackColor, trackShape)
        ) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .width(trackWidth)
                    .height(fillHeightDp)
                    .background(fillColor, trackShape)
            )
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = thumbOffsetYDp)
                    .width(thumbWidth)
                    .height(thumbHeight)
                    .background(thumbColor, RoundedCornerShape(percent = 50))
            )
        }
    }
}
