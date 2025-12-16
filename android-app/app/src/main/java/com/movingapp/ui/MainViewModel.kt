package com.movingapp.ui

import android.content.Context
import android.net.Uri
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.movingapp.data.*
import kotlinx.coroutines.launch

class MainViewModel(context: Context) : ViewModel() {
    private val repository = Repository(context)

    var user = mutableStateOf<User?>(null)
    var items = mutableStateOf<List<Item>>(emptyList())
    var isLoading = mutableStateOf(false)
    var errorMessage = mutableStateOf<String?>(null)
    var serverUrl = mutableStateOf("http://")

    init {
        viewModelScope.launch {
            // Load stored server URL
            repository.getServerUrl()?.let {
                serverUrl.value = it
            }

            // Try to auto-login with stored credentials
            val storedUser = repository.initializeAuth()
            if (storedUser != null) {
                user.value = storedUser
                loadItems()
            }
        }
    }

    fun login(username: String, password: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            isLoading.value = true
            errorMessage.value = null

            repository.login(username, password)
                .onSuccess { response ->
                    user.value = response.user
                    loadItems()
                    onSuccess()
                }
                .onFailure { error ->
                    errorMessage.value = error.message ?: "Login failed"
                }

            isLoading.value = false
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            user.value = null
            items.value = emptyList()
        }
    }

    fun setServerUrl(url: String) {
        viewModelScope.launch {
            serverUrl.value = url
            repository.saveServerUrl(url)
        }
    }

    fun loadItems() {
        viewModelScope.launch {
            isLoading.value = true
            errorMessage.value = null

            repository.getItems()
                .onSuccess { fetchedItems ->
                    items.value = fetchedItems
                }
                .onFailure { error ->
                    errorMessage.value = error.message ?: "Failed to load items"
                }

            isLoading.value = false
        }
    }

    fun createItem(name: String, imageUri: Uri?, onSuccess: () -> Unit) {
        viewModelScope.launch {
            isLoading.value = true
            errorMessage.value = null

            repository.createItem(name, imageUri)
                .onSuccess {
                    loadItems()
                    onSuccess()
                }
                .onFailure { error ->
                    errorMessage.value = error.message ?: "Failed to create item"
                }

            isLoading.value = false
        }
    }

    fun voteOnItem(itemId: Int, vote: String, comment: String?) {
        viewModelScope.launch {
            repository.voteOnItem(itemId, vote, comment)
                .onSuccess {
                    loadItems()
                }
                .onFailure { error ->
                    errorMessage.value = error.message ?: "Failed to vote"
                }
        }
    }

    fun finalizeDecision(itemId: Int, decision: String) {
        viewModelScope.launch {
            repository.updateDecision(itemId, decision)
                .onSuccess {
                    loadItems()
                }
                .onFailure { error ->
                    errorMessage.value = error.message ?: "Failed to finalize decision"
                }
        }
    }

    fun deleteItem(itemId: Int) {
        viewModelScope.launch {
            repository.deleteItem(itemId)
                .onSuccess {
                    loadItems()
                }
                .onFailure { error ->
                    errorMessage.value = error.message ?: "Failed to delete item"
                }
        }
    }

    fun getUserVote(item: Item): String? {
        return item.votes.find { it.user_id == user.value?.id }?.vote
    }

    fun getSortedItems(): List<Item> {
        val currentUser = user.value ?: return items.value

        val unvoted = mutableListOf<Item>()
        val voted = mutableListOf<Item>()

        items.value.forEach { item ->
            if (item.votes.any { it.user_id == currentUser.id }) {
                voted.add(item)
            } else {
                unvoted.add(item)
            }
        }

        return unvoted + voted
    }
}
