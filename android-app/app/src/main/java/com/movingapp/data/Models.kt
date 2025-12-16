package com.movingapp.data

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: User
)

data class User(
    val id: Int,
    val username: String,
    val displayName: String,
    val isAdmin: Boolean
)

data class Item(
    val id: Int,
    val name: String,
    val image_path: String?,
    val created_by: Int,
    val created_by_name: String,
    val created_at: String,
    val decision: String?,
    val votes: List<Vote>
)

data class Vote(
    val user_id: Int,
    val username: String,
    val vote: String,
    val comment: String?
)

data class VoteRequest(
    val vote: String,
    val comment: String?
)

data class DecisionRequest(
    val decision: String
)

data class ItemResponse(
    val message: String,
    val itemId: Int,
    val imagePath: String?
)

data class ErrorResponse(
    val error: String
)

enum class VoteType(val value: String, val label: String) {
    MOVE("move", "Move it"),
    TOSS("toss", "Toss it"),
    GIVE("give", "Give away"),
    SELL("sell", "Sell it"),
    OTHER("other", "Other")
}
