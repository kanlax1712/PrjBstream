package com.bstream.app.android.ui.screens

import androidx.lifecycle.ViewModel
import com.bstream.app.android.data.LiveStreamItem
import androidx.lifecycle.viewModelScope
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.FeedVideo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LiveState(
    val liveStreams: List<LiveStreamItem> = emptyList(),
    val recentVideos: List<FeedVideo> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

class LiveViewModel : ViewModel() {
    private val _state = MutableStateFlow(LiveState())
    val state: StateFlow<LiveState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val response = ApiModule.feedApi.getLive()
                _state.value = LiveState(
                    liveStreams = response.liveStreams ?: emptyList(),
                    recentVideos = response.recentVideos ?: emptyList(),
                    isLoading = false
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load"
                )
            }
        }
    }
}
