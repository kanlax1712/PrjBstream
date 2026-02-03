package com.bstream.app.android.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface GoLiveApi {
    @GET("api/channels")
    suspend fun getChannels(): Response<ChannelsResponse>

    @POST("api/channels")
    suspend fun createChannel(@Body body: CreateChannelRequest): Response<CreateChannelResponse>

    @POST("api/go-live")
    suspend fun startStream(@Body body: GoLiveRequest): Response<GoLiveResponse>

    @DELETE("api/go-live")
    suspend fun endStream(@Query("streamId") streamId: String): Response<EndStreamResponse>
}

data class ChannelsResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val channels: List<ChannelItem>? = null,
)

data class ChannelItem(
    val id: String,
    val name: String,
    val handle: String? = null,
    val description: String? = null,
)

data class CreateChannelRequest(
    val name: String,
    val handle: String,
    val description: String? = null,
)

data class CreateChannelResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val channel: ChannelItem? = null,
)

data class GoLiveRequest(
    val title: String,
    val description: String? = null,
    val visibility: String,
    val channelId: String,
)

data class GoLiveResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val stream: GoLiveStream? = null,
)

data class GoLiveStream(
    val id: String,
    val title: String? = null,
    val shareUrl: String? = null,
    val streamKey: String? = null,
    val streamUrl: String? = null,
)

data class EndStreamResponse(
    val success: Boolean? = null,
    val message: String? = null,
)
