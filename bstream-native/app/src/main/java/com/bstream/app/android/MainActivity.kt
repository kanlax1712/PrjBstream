package com.bstream.app.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.bstream.app.android.data.FeedVideo
import com.bstream.app.android.ui.screens.AccountScreen
import com.bstream.app.android.ui.screens.GoLiveScreen
import com.bstream.app.android.ui.screens.GoLiveSetupScreen
import com.bstream.app.android.ui.screens.HomeScreen
import com.bstream.app.android.ui.screens.InsightsScreen
import com.bstream.app.android.ui.screens.StudioScreen
import com.bstream.app.android.ui.screens.HomeViewModel
import com.bstream.app.android.ui.screens.SearchScreen
import com.bstream.app.android.ui.screens.SearchViewModel
import com.bstream.app.android.ui.screens.VideoPlayerScreen
import com.bstream.app.android.ui.screens.UploadScreen
import com.bstream.app.android.ui.screens.LoginScreen
import com.bstream.app.android.ui.screens.RegisterScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BstreamTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0f172a)
                ) {
                    BstreamNav()
                }
            }
        }
    }
}

@Composable
private fun BstreamTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MaterialTheme.colorScheme.copy(
            background = Color(0xFF0f172a),
            surface = Color(0xFF0f172a),
            primary = Color(0xFF06b6d4)
        ),
        content = content
    )
}

private data class NavItem(val route: String, val label: String, val icon: ImageVector)

@Composable
private fun BstreamNav() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = currentRoute in listOf("home", "search", "live", "studio", "account", "insights")

    val navItems = listOf(
        NavItem("home", "Home", Icons.Default.Home),
        NavItem("search", "Search", Icons.Default.Search),
        NavItem("live", "Live", Icons.Default.LiveTv),
        NavItem("studio", "Studio", Icons.Default.VideoLibrary),
        NavItem("account", "Account", Icons.Default.Person)
    )

    androidx.compose.material3.Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = Color(0xFF0f172a),
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = Color(0xFF1e293b)) {
                    navItems.forEach { item ->
                        val selected = currentRoute == item.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = item.label,
                                    tint = if (selected) Color(0xFF06b6d4) else Color.White.copy(alpha = 0.7f)
                                )
                            },
                            label = {
                                Text(
                                    text = item.label,
                                    color = if (selected) Color(0xFF06b6d4) else Color.White.copy(alpha = 0.7f)
                                )
                            }
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(padding)
        ) {
            composable("home") {
                val homeViewModel: HomeViewModel = viewModel()
                HomeScreen(
                    viewModel = homeViewModel,
                    onVideoClick = { video ->
                        SelectedVideoHolder.video = video
                        navController.navigate("video/${video.id}")
                    }
                )
            }
            composable("search") {
                val searchViewModel: SearchViewModel = viewModel()
                SearchScreen(
                    viewModel = searchViewModel,
                    onVideoClick = { video ->
                        SelectedVideoHolder.video = video
                        navController.navigate("video/${video.id}")
                    }
                )
            }
            composable("live") {
                GoLiveScreen(
                    onVideoClick = { video ->
                        SelectedVideoHolder.video = video
                        navController.navigate("video/${video.id}")
                    },
                    onGoLiveClick = {
                        navController.navigate("golive") {
                            launchSingleTop = true
                        }
                    }
                )
            }
            composable("golive") {
                GoLiveSetupScreen(
                    onBack = { navController.popBackStack() },
                    onNavigateToLogin = {
                        navController.navigate("login") {
                            popUpTo("golive") { inclusive = true }
                        }
                    }
                )
            }
            composable("studio") {
                StudioScreen(onUploadClick = { navController.navigate("upload") })
            }
            composable("account") {
                AccountScreen(
                    onInsightsClick = { navController.navigate("insights") },
                    onUploadClick = { navController.navigate("upload") },
                    onNavigateToLogin = { navController.navigate("login") },
                    onNavigateToRegister = { navController.navigate("register") }
                )
            }
            composable("login") {
                LoginScreen(
                    onBack = { navController.popBackStack() },
                    onNavigateToRegister = {
                        navController.navigate("register") {
                            popUpTo("login") { inclusive = true }
                        }
                    },
                    onLoginSuccess = { navController.popBackStack() }
                )
            }
            composable("register") {
                RegisterScreen(
                    onBack = { navController.popBackStack() },
                    onNavigateToLogin = {
                        navController.navigate("login") {
                            popUpTo("register") { inclusive = true }
                        }
                    },
                    onRegisterSuccess = {
                        com.bstream.app.android.AuthFlowState.justRegistered = true
                        navController.navigate("login") {
                            popUpTo("register") { inclusive = true }
                        }
                    }
                )
            }
            composable("upload") {
                UploadScreen(onBack = { navController.popBackStack() })
            }
            composable("insights") {
                InsightsScreen()
            }
            composable(
                route = "video/{videoId}",
                arguments = listOf(navArgument("videoId") { type = NavType.StringType })
            ) { backStackEntry ->
                val videoId = backStackEntry.arguments?.getString("videoId") ?: return@composable
                val video = remember(videoId) {
                    SelectedVideoHolder.video?.takeIf { it.id == videoId }
                        ?: FeedVideo(
                            id = videoId,
                            title = "",
                            description = null,
                            thumbnailUrl = null,
                            duration = 0,
                            publishedAt = null,
                            channel = null
                        )
                }
                VideoPlayerScreen(
                    video = video,
                    onBack = { navController.popBackStack() },
                    onSelectVideo = { newVideo ->
                        SelectedVideoHolder.video = newVideo
                        navController.navigate("video/${newVideo.id}") {
                            popUpTo("video/$videoId") { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
