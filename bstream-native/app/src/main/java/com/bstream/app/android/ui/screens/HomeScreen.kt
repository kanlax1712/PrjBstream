package com.bstream.app.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.FeedCounts
import com.bstream.app.android.data.FeedPlaylist
import com.bstream.app.android.data.FeedVideo

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onVideoClick: (FeedVideo) -> Unit,
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadFeed()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0f172a))
    ) {
        TopAppBar(
            title = { Text("Bstream", color = Color.White) },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color(0xFF0f172a),
                titleContentColor = Color.White
            ),
            actions = {
                IconButton(onClick = { viewModel.loadFeed() }) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = Color.White
                    )
                }
            }
        )

        Box(modifier = Modifier.fillMaxSize()) {
            when {
                state.isLoading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF06b6d4))
                    }
                }
                state.error != null -> {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "Could not load feed",
                                color = Color.White,
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                text = state.error!!,
                                color = Color.White.copy(alpha = 0.8f),
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                            Text(
                                text = "On emulator: run the web app locally:\ncd web && npm run dev",
                                color = Color(0xFF06b6d4),
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(top = 16.dp)
                            )
                        }
                    }
                }
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(bottom = 24.dp),
                        verticalArrangement = Arrangement.spacedBy(24.dp)
                    ) {
                        if (state.hero == null && state.secondary.isEmpty() && state.playlists.isEmpty()) {
                            item(key = "empty") {
                                EmptyFeedMessage()
                            }
                        } else {
                            state.hero?.let { hero ->
                                item(key = "hero") {
                                    HeroCard(video = hero, onClick = { onVideoClick(hero) })
                                }
                            }
                            if (state.secondary.isNotEmpty()) {
                                item(key = "trending_header") {
                                    SectionHeader(
                                        title = "Trending now",
                                        subtitle = "Fresh drops from the community"
                                    )
                                }
                                items(state.secondary, key = { it.id }) { video ->
                                    VideoCard(
                                        video = video,
                                        onClick = { onVideoClick(video) }
                                    )
                                }
                            }
                            if (state.playlists.isNotEmpty()) {
                                item(key = "playlists_header") {
                                    SectionHeader(
                                        title = "Curated playlists",
                                        subtitle = "Finish in a weekend"
                                    )
                                }
                                state.playlists.forEach { playlist ->
                                    val playlistVideos = playlist.videos
                                        ?.mapNotNull { it.video }
                                        ?.take(10)
                                        ?: emptyList()
                                    if (playlistVideos.isNotEmpty()) {
                                        item(key = "playlist_${playlist.id}") {
                                            Column(Modifier.padding(horizontal = 12.dp)) {
                                                Text(
                                                    text = playlist.title,
                                                    color = Color.White,
                                                    style = MaterialTheme.typography.titleMedium,
                                                    modifier = Modifier.padding(bottom = 8.dp)
                                                )
                                                LazyRow(
                                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                                ) {
                                                    items(playlistVideos, key = { it.id }) { video ->
                                                        SmallVideoCard(
                                                            video = video,
                                                            onClick = { onVideoClick(video) }
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        item(key = "insight_cards") {
                            InsightCards(counts = state.counts ?: FeedCounts(0, 0, 0))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyFeedMessage() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
            .background(Color(0xFF1e293b), RoundedCornerShape(16.dp))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "No videos yet. Head to the studio to publish your first story.",
            color = Color.White.copy(alpha = 0.8f),
            style = MaterialTheme.typography.bodyLarge
        )
    }
}

@Composable
private fun SectionHeader(title: String, subtitle: String) {
    Column(Modifier.padding(horizontal = 12.dp)) {
        Text(
            text = title,
            color = Color.White,
            style = MaterialTheme.typography.titleLarge
        )
        Text(
            text = subtitle,
            color = Color.White.copy(alpha = 0.5f),
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}

@Composable
private fun HeroCard(video: FeedVideo, onClick: () -> Unit) {
    val thumbUrl = ApiModule.resolveUrl(video.thumbnailUrl)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp)
            .background(Color(0xFF1e293b), RoundedCornerShape(16.dp))
    ) {
        Text(
            text = "Premiere",
            color = Color(0xFF22d3ee).copy(alpha = 0.9f),
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(start = 16.dp, top = 16.dp)
        )
        AsyncImage(
            model = thumbUrl,
            contentDescription = video.title,
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f),
            contentScale = ContentScale.Crop
        )
        Column(Modifier.padding(16.dp)) {
            Text(
                text = video.title,
                color = Color.White,
                style = MaterialTheme.typography.titleLarge,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            video.description?.take(120)?.let { desc ->
                Text(
                    text = desc + if ((video.description?.length ?: 0) > 120) "…" else "",
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
            video.channel?.name?.let { name ->
                Text(
                    text = name,
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun InsightCards(counts: FeedCounts) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Community",
            color = Color.White,
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            InsightCard(modifier = Modifier.fillMaxWidth(1f / 3f), label = "Videos published", value = counts.videos)
            InsightCard(modifier = Modifier.fillMaxWidth(1f / 3f), label = "Creator channels", value = counts.channels)
            InsightCard(modifier = Modifier.fillMaxWidth(1f / 3f), label = "Community comments", value = counts.communityComments)
        }
    }
}

@Composable
private fun InsightCard(
    modifier: Modifier = Modifier,
    label: String,
    value: Int,
) {
    Column(
        modifier = modifier
            .background(Color(0xFF1e293b), RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(
            text = label,
            color = Color.White.copy(alpha = 0.6f),
            style = MaterialTheme.typography.labelSmall
        )
        Text(
            text = "%,d".format(value),
            color = Color.White,
            style = MaterialTheme.typography.titleMedium
        )
    }
}

@Composable
private fun VideoCard(
    video: FeedVideo,
    onClick: () -> Unit,
) {
    val thumbUrl = ApiModule.resolveUrl(video.thumbnailUrl)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp)
    ) {
        AsyncImage(
            model = thumbUrl,
            contentDescription = video.title,
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f),
            contentScale = ContentScale.Crop
        )
        Column(Modifier.padding(8.dp)) {
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
        }
    }
}

@Composable
private fun SmallVideoCard(
    video: FeedVideo,
    onClick: () -> Unit,
) {
    val thumbUrl = ApiModule.resolveUrl(video.thumbnailUrl)

    Column(
        modifier = Modifier
            .width(160.dp)
            .clickable(onClick = onClick)
    ) {
        AsyncImage(
            model = thumbUrl,
            contentDescription = video.title,
            modifier = Modifier
                .width(160.dp)
                .height(90.dp),
            contentScale = ContentScale.Crop
        )
        Text(
            text = video.title,
            color = Color.White,
            style = MaterialTheme.typography.bodySmall,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}
