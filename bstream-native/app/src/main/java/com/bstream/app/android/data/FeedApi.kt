package com.bstream.app.android.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface FeedApi {
    @GET("api/feed")
    suspend fun getFeed(): FeedResponse

    @GET("api/search")
    suspend fun search(
        @Query("q") query: String,
        @Query("limit") limit: Int = 20
    ): SearchResponse

    @GET("api/live")
    suspend fun getLive(): LiveResponse

    @GET("api/studio/videos")
    suspend fun getStudioVideos(): Response<StudioVideosResponse>

    @POST("api/track-view")
    suspend fun trackView(@Body body: TrackViewRequest): TrackViewResponse
}

data class StudioVideosResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val videos: List<StudioVideoItem>? = null,
)

data class StudioVideoItem(
    val id: String,
    val title: String,
    val description: String? = null,
    val thumbnailUrl: String? = null,
    val duration: Int = 0,
    val status: String? = null,
    val publishedAt: String? = null,
    val channel: FeedChannel? = null,
)

data class LiveResponse(
    val liveStreams: List<LiveStreamItem>? = null,
    val recentVideos: List<FeedVideo>? = null,
)

data class LiveStreamItem(
    val id: String,
    val title: String,
    val description: String? = null,
    val shareUrl: String? = null,
    val status: String? = null,
    val viewerCount: Int = 0,
    val channel: FeedChannel? = null,
)

data class TrackViewRequest(val videoId: String)
data class TrackViewResponse(val success: Boolean? = null)

data class SearchResponse(
    val videos: List<FeedVideo>? = null,
    val channels: List<FeedChannel>? = null,
    val query: String? = null
)
