package com.movingapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.movingapp.ui.AddItemScreen
import com.movingapp.ui.ItemsScreen
import com.movingapp.ui.LoginScreen
import com.movingapp.ui.MainViewModel
import com.movingapp.ui.theme.MovingAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MovingAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MovingApp()
                }
            }
        }
    }
}

@Composable
fun MovingApp() {
    val viewModel = remember { MainViewModel(androidx.compose.ui.platform.LocalContext.current) }
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Login) }

    // Auto-navigate if already logged in
    LaunchedEffect(viewModel.user.value) {
        if (viewModel.user.value != null) {
            currentScreen = Screen.Items
        }
    }

    when (currentScreen) {
        Screen.Login -> {
            LoginScreen(
                viewModel = viewModel,
                onLoginSuccess = {
                    currentScreen = Screen.Items
                }
            )
        }
        Screen.Items -> {
            ItemsScreen(
                viewModel = viewModel,
                onAddItemClick = {
                    currentScreen = Screen.AddItem
                }
            )

            // Handle logout
            LaunchedEffect(viewModel.user.value) {
                if (viewModel.user.value == null) {
                    currentScreen = Screen.Login
                }
            }
        }
        Screen.AddItem -> {
            AddItemScreen(
                viewModel = viewModel,
                onNavigateBack = {
                    currentScreen = Screen.Items
                    viewModel.loadItems()
                }
            )
        }
    }
}

sealed class Screen {
    object Login : Screen()
    object Items : Screen()
    object AddItem : Screen()
}
