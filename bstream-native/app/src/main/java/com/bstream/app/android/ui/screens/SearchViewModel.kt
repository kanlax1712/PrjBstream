package com.bstream.app.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bstream.app.android.data.ApiModule
import com.bstream.app.android.data.FeedChannel
import com.bstream.app.android.data.FeedVideo
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SearchState(
    val query: String = "",
    val videos: List<FeedVideo> = emptyList(),
    val channels: List<FeedChannel> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class SearchViewModel : ViewModel() {
    private val _state = MutableStateFlow(SearchState())
    val state: StateFlow<SearchState> = _state.asStateFlow()

    private var searchJob: Job? = null

    fun setQuery(query: String) {
        _state.value = _state.value.copy(query = query)
        searchJob?.cancel()
        if (query.isBlank()) {
            _state.value = _state.value.copy(videos = emptyList(), channels = emptyList(), error = null)
            return
        }
        searchJob = viewModelScope.launch {
            delay(300)
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val response = ApiModule.feedApi.search(query = query.trim(), limit = 20)
                _state.value = _state.value.copy(
                    videos = response.videos ?: emptyList(),
                    channels = response.channels ?: emptyList(),
                    isLoading = false
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Search failed"
                )
            }
        }
    }

    fun search() {
        val q = _state.value.query.trim()
        if (q.isBlank()) return
        searchJob?.cancel()
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val response = ApiModule.feedApi.search(query = q, limit = 20)
                _state.value = _state.value.copy(
                    videos = response.videos ?: emptyList(),
                    channels = response.channels ?: emptyList(),
                    isLoading = false
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "Search failed"
                )
            }
        }
    }
}
