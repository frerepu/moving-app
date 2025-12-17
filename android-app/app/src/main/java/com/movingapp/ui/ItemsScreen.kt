package com.movingapp.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.movingapp.data.Item
import com.movingapp.data.RetrofitClient
import com.movingapp.data.VoteType

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ItemsScreen(
    viewModel: MainViewModel,
    onAddItemClick: () -> Unit
) {
    val items = viewModel.getSortedItems()
    val user = viewModel.user.value

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Moving Decisions") },
                actions = {
                    Column(
                        horizontalAlignment = Alignment.End,
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Text(
                            text = "Welcome, ${user?.displayName ?: ""}",
                            style = MaterialTheme.typography.bodySmall
                        )
                        TextButton(onClick = { viewModel.logout() }) {
                            Icon(Icons.Default.ExitToApp, contentDescription = "Logout", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Logout", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onAddItemClick,
                icon = { Icon(Icons.Default.Add, contentDescription = "Add") },
                text = { Text("Add Item") }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Stats
            if (items.isNotEmpty()) {
                StatsSection(items)
            }

            if (viewModel.isLoading.value && items.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (items.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.ShoppingCart,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "No items yet",
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            "Add your first item to get started",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(items, key = { it.id }) { item ->
                        ItemCard(item = item, viewModel = viewModel)
                    }
                }
            }
        }
    }
}

@Composable
fun StatsSection(items: List<Item>) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatItem("Total", items.size, Color.Gray)
            StatItem("Move", items.count { it.decision == "move" }, Color(0xFF2196F3))
            StatItem("Toss", items.count { it.decision == "toss" }, Color(0xFFF44336))
            StatItem("Give", items.count { it.decision == "give" }, Color(0xFF4CAF50))
            StatItem("Sell", items.count { it.decision == "sell" }, Color(0xFFFFC107))
        }
    }
}

@Composable
fun StatItem(label: String, count: Int, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = count.toString(),
            style = MaterialTheme.typography.headlineSmall,
            color = color
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun ItemCard(item: Item, viewModel: MainViewModel) {
    var showVoteDialog by remember { mutableStateOf<VoteType?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showAdminControls by remember { mutableStateOf(false) }
    val user = viewModel.user.value
    val userVote = viewModel.getUserVote(item)

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = item.name,
                            style = MaterialTheme.typography.titleLarge
                        )
                        if (userVote != null) {
                            Spacer(modifier = Modifier.width(8.dp))
                            AssistChip(
                                onClick = { },
                                label = { Text("✓ Voted", style = MaterialTheme.typography.labelSmall) },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            )
                        }
                    }
                    Text(
                        text = "Added by ${item.created_by_name}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (user?.isAdmin == true) {
                    IconButton(onClick = { showDeleteDialog = true }) {
                        Icon(Icons.Default.Close, contentDescription = "Delete")
                    }
                }
            }

            // Image
            item.image_path?.let { path ->
                Spacer(modifier = Modifier.height(12.dp))
                val imageUrl = "${RetrofitClient.getBaseUrl().removeSuffix("/")}${path}"
                AsyncImage(
                    model = imageUrl,
                    contentDescription = item.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
            }

            // Vote Summary
            if (item.votes.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                VoteSummary(item)
            }

            // Voting Buttons
            Spacer(modifier = Modifier.height(12.dp))
            VotingButtons(
                item = item,
                userVote = userVote,
                enabled = item.decision == null,
                onVoteClick = { voteType -> showVoteDialog = voteType }
            )

            // Who Voted What
            if (item.votes.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Divider()
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Everyone's Votes:",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                item.votes.forEach { vote ->
                    Row(modifier = Modifier.padding(vertical = 2.dp)) {
                        Text(
                            text = "${vote.username}: ",
                            style = MaterialTheme.typography.bodyMedium,
                            color = getVoteColor(vote.vote)
                        )
                        Text(
                            text = VoteType.values().find { it.value == vote.vote }?.label ?: vote.vote ?: "Unknown",
                            style = MaterialTheme.typography.bodyMedium,
                            color = getVoteColor(vote.vote)
                        )
                        vote.comment?.let {
                            Text(
                                text = " - \"$it\"",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                            )
                        }
                    }
                }
            }

            // Final Decision
            item.decision?.let { decision ->
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = getVoteColor(decision).copy(alpha = 0.1f)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = getVoteColor(decision)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Final Decision: ${VoteType.values().find { it.value == decision }?.label ?: decision}",
                            style = MaterialTheme.typography.titleMedium,
                            color = getVoteColor(decision)
                        )
                    }
                }
            }

            // Admin Controls
            if (user?.isAdmin == true && item.decision == null) {
                Spacer(modifier = Modifier.height(12.dp))
                Divider()
                Spacer(modifier = Modifier.height(8.dp))

                // Expandable admin section
                OutlinedButton(
                    onClick = { showAdminControls = !showAdminControls },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        if (showAdminControls) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Finalize Decision (Admin Only)")
                }

                if (showAdminControls) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                "⚠️ This will finalize the decision for all users",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                VoteType.values().forEach { voteType ->
                                    Button(
                                        onClick = {
                                            viewModel.finalizeDecision(item.id, voteType.value)
                                            showAdminControls = false
                                        },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = getVoteColor(voteType.value)
                                        ),
                                        contentPadding = PaddingValues(4.dp)
                                    ) {
                                        Column(
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.Center
                                        ) {
                                            Icon(
                                                getVoteIcon(voteType.value),
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Text(
                                                text = voteType.label.replace(" it", "").replace(" away", ""),
                                                style = MaterialTheme.typography.labelSmall,
                                                maxLines = 1
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    showVoteDialog?.let { voteType ->
        VoteDialog(
            voteType = voteType,
            onDismiss = { showVoteDialog = null },
            onConfirm = { comment ->
                viewModel.voteOnItem(item.id, voteType.value, comment)
                showVoteDialog = null
            }
        )
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Item") },
            text = { Text("Are you sure you want to delete this item?") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteItem(item.id)
                        showDeleteDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun VoteSummary(item: Item) {
    val voteCounts = VoteType.values().associateWith { voteType ->
        item.votes.count { it.vote == voteType.value }
    }

    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        voteCounts.filter { it.value > 0 }.forEach { (voteType, count) ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .background(
                        getVoteColor(voteType.value).copy(alpha = 0.1f),
                        RoundedCornerShape(4.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Icon(
                    getVoteIcon(voteType.value),
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = getVoteColor(voteType.value)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = count.toString(),
                    style = MaterialTheme.typography.labelLarge,
                    color = getVoteColor(voteType.value)
                )
            }
        }
    }
}

@Composable
fun VotingButtons(
    item: Item,
    userVote: String?,
    enabled: Boolean,
    onVoteClick: (VoteType) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        VoteType.values().forEach { voteType ->
            val isSelected = userVote == voteType.value
            Button(
                onClick = { onVoteClick(voteType) },
                modifier = Modifier.weight(1f),
                enabled = enabled,
                colors = ButtonDefaults.buttonColors(
                    containerColor = getVoteColor(voteType.value).copy(alpha = if (isSelected) 1f else 0.7f),
                    contentColor = Color.White
                ),
                contentPadding = PaddingValues(vertical = 8.dp, horizontal = 4.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        getVoteIcon(voteType.value),
                        contentDescription = voteType.label,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = voteType.label.replace(" it", "").replace(" away", ""),
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1
                    )
                    if (isSelected) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "✓",
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun VoteDialog(
    voteType: VoteType,
    onDismiss: () -> Unit,
    onConfirm: (String?) -> Unit
) {
    var comment by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                getVoteIcon(voteType.value),
                contentDescription = null,
                tint = getVoteColor(voteType.value),
                modifier = Modifier.size(32.dp)
            )
        },
        title = { Text("Vote: ${voteType.label}") },
        text = {
            Column {
                Text("Add a comment (optional):")
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    placeholder = { Text("Add your thoughts here...") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(comment.ifBlank { null }) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = getVoteColor(voteType.value)
                )
            ) {
                Text("Submit Vote")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

fun getVoteColor(vote: String?): Color {
    return when (vote) {
        "move" -> Color(0xFF2196F3)
        "toss" -> Color(0xFFF44336)
        "give" -> Color(0xFF4CAF50)
        "sell" -> Color(0xFFFFC107)
        "other" -> Color(0xFF9C27B0)
        else -> Color.Gray
    }
}

fun getVoteIcon(vote: String): androidx.compose.ui.graphics.vector.ImageVector {
    return when (vote) {
        "move" -> Icons.Default.ShoppingCart
        "toss" -> Icons.Default.Delete
        "give" -> Icons.Default.Favorite
        "sell" -> Icons.Default.ShoppingCart
        "other" -> Icons.Default.MoreHoriz
        else -> Icons.Default.MoreHoriz
    }
}
