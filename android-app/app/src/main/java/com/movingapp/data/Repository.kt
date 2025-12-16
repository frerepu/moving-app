package com.movingapp.data

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.flow.first
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class Repository(private val context: Context) {
    private val preferencesManager = PreferencesManager(context)
    private val apiService = RetrofitClient.apiService

    suspend fun login(username: String, password: String): Result<LoginResponse> {
        return try {
            val response = apiService.login(LoginRequest(username, password))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                preferencesManager.saveToken(loginResponse.token)
                preferencesManager.saveUser(loginResponse.user)
                RetrofitClient.setToken(loginResponse.token)
                Result.success(loginResponse)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        preferencesManager.clearAll()
        RetrofitClient.setToken(null)
    }

    suspend fun getStoredUser(): User? {
        return preferencesManager.user.first()
    }

    suspend fun getStoredToken(): String? {
        return preferencesManager.token.first()
    }

    suspend fun initializeAuth(): User? {
        val token = getStoredToken()
        val user = getStoredUser()

        if (token != null) {
            RetrofitClient.setToken(token)
        }

        return user
    }

    suspend fun saveServerUrl(url: String) {
        preferencesManager.saveServerUrl(url)
        RetrofitClient.setBaseUrl(url)
    }

    suspend fun getServerUrl(): String? {
        return preferencesManager.serverUrl.first()
    }

    suspend fun getItems(): Result<List<Item>> {
        return try {
            val response = apiService.getItems()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to fetch items"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createItem(name: String, imageUri: Uri?): Result<ItemResponse> {
        return try {
            val nameBody = name.toRequestBody("text/plain".toMediaTypeOrNull())

            val imagePart = imageUri?.let { uri ->
                val file = File(context.cacheDir, "temp_image_${System.currentTimeMillis()}.jpg")
                context.contentResolver.openInputStream(uri)?.use { input ->
                    file.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }

                val requestFile = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("image", file.name, requestFile)
            }

            val response = apiService.createItem(nameBody, imagePart)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to create item"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun voteOnItem(itemId: Int, vote: String, comment: String?): Result<Unit> {
        return try {
            val response = apiService.voteOnItem(itemId, VoteRequest(vote, comment))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to vote"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateDecision(itemId: Int, decision: String): Result<Unit> {
        return try {
            val response = apiService.updateDecision(itemId, DecisionRequest(decision))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to update decision"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteItem(itemId: Int): Result<Unit> {
        return try {
            val response = apiService.deleteItem(itemId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to delete item"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
