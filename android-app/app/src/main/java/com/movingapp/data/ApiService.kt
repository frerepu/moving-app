package com.movingapp.data

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("api/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/me")
    suspend fun getCurrentUser(): Response<User>

    @GET("api/items")
    suspend fun getItems(): Response<List<Item>>

    @Multipart
    @POST("api/items")
    suspend fun createItem(
        @Part("name") name: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<ItemResponse>

    @POST("api/items/{id}/vote")
    suspend fun voteOnItem(
        @Path("id") itemId: Int,
        @Body request: VoteRequest
    ): Response<Map<String, String>>

    @PATCH("api/items/{id}/decision")
    suspend fun updateDecision(
        @Path("id") itemId: Int,
        @Body request: DecisionRequest
    ): Response<Map<String, String>>

    @DELETE("api/items/{id}")
    suspend fun deleteItem(@Path("id") itemId: Int): Response<Map<String, String>>
}
