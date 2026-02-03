package com.bstream.app.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bstream.app.android.data.FeedCounts
import com.bstream.app.android.data.FeedPlaylist
import com.bstream.app.android.data.FeedResponse
import com.bstream.app.android.data.FeedVideo
import com.bstream.app.android.data.ApiModule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeState(
    val hero: FeedVideo? = null,
    val secondary: List<FeedVideo> = emptyList(),
    val playlists: List<FeedPlaylist> = emptyList(),
    val counts: FeedCounts? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

class HomeViewModel : ViewModel() {
    private val _state = MutableStateFlow(HomeState())
    val state: StateFlow<HomeState> = _state.asStateFlow()

    fun loadFeed() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val response = ApiModule.feedApi.getFeed()
                _state.value = HomeState(
                    hero = response.hero,
                    secondary = response.secondary,
                    playlists = response.playlists,
                    counts = response.counts,
                    isLoading = false
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load feed"
                )
            }
        }
    }
}
