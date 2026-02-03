package com.bstream.app.android.data

import com.google.gson.annotations.SerializedName

data class FeedResponse(
    val hero: FeedVideo?,
    val secondary: List<FeedVideo>,
    val playlists: List<FeedPlaylist>,
    val counts: FeedCounts?
)

data class FeedVideo(
    val id: String,
    val title: String,
    val description: String?,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String?,
    val duration: Int,
    @SerializedName("publishedAt") val publishedAt: String?,
    val channel: FeedChannel?
)

data class FeedChannel(
    val id: String,
    val name: String,
    val handle: String?,
    @SerializedName("avatarUrl") val avatarUrl: String?
)

data class FeedPlaylist(
    val id: String,
    val title: String,
    val description: String?,
    val owner: FeedPlaylistOwner?,
    val videos: List<FeedPlaylistVideo>?
)

data class FeedPlaylistOwner(val name: String?)

data class FeedPlaylistVideo(
    val order: Int,
    val video: FeedVideo?
)

data class FeedCounts(
    val videos: Int = 0,
    val channels: Int = 0,
    val communityComments: Int = 0
)
