# Android Mobile App

Native Android application for vehicle pre-trip inspections with offline-first architecture and modern UI.

## 🚀 Quick Start

### Prerequisites
- **Android Studio** Arctic Fox or later
- **Android SDK** API level 24+ (Android 7.0)
- **Kotlin** 1.9.10+

### Setup
1. **Open project** in Android Studio
2. **Sync Gradle** files
3. **Update configuration** in `build.gradle`
4. **Run on device** or emulator

## 📱 App Features

### 🔐 Authentication
- **Email/password login** with JWT tokens
- **Biometric authentication** (fingerprint/face unlock)
- **Device registration** for security
- **Automatic token refresh**

### 📋 Dynamic Inspections
- **Schema-driven forms** loaded from backend
- **Tri-state responses**: ✅ OK / ❌ NOT OK / ➖ N/A
- **Required field validation**
- **Progress tracking** with completion percentage

### 📷 Media Capture
- **Photo capture** for defects with camera API
- **Image compression** and optimization
- **Cloudinary integration** for upload
- **Offline photo queuing**

### 📍 GPS & Location
- **Automatic location capture** for inspections
- **Address resolution** with reverse geocoding
- **Location permissions** handling
- **Offline location caching**

### ✍️ Digital Signatures
- **Touch signature capture**
- **Signature validation**
- **PDF integration** for reports

### 🔄 Offline-First Architecture
- **Room database** for local storage
- **Background sync** with WorkManager
- **Conflict resolution** for data merging
- **Queue management** for failed uploads

## 🏗️ Architecture

### MVVM + Clean Architecture
```
📱 UI Layer (Jetpack Compose)
    ↓
🎯 Presentation Layer (ViewModels)
    ↓
💼 Domain Layer (Use Cases)
    ↓
📊 Data Layer (Repositories)
    ↓
🔌 Data Sources (Remote API / Local Room)
```

### Dependency Injection
- **Hilt** for dependency injection
- **Module organization** by feature
- **Singleton services** for API and database

## 📁 Project Structure

```
app/src/main/java/com/inspectionapp/mobile/
├── data/                    # Data layer
│   ├── database/           # Room database
│   │   ├── entities/       # Database entities
│   │   ├── dao/            # Data access objects
│   │   └── InspectionDatabase.kt
│   ├── network/            # Retrofit API
│   │   ├── services/       # API service interfaces
│   │   ├── dto/            # Data transfer objects
│   │   └── NetworkModule.kt
│   ├── repository/         # Data repositories
│   └── model/              # Data models
├── domain/                  # Domain layer
│   ├── usecase/           # Business logic use cases
│   ├── repository/        # Repository interfaces
│   └── model/             # Domain models
├── presentation/           # UI layer
│   ├── ui/                # Jetpack Compose screens
│   │   ├── login/         # Login screen
│   │   ├── vehicle/       # Vehicle selection
│   │   ├── inspection/    # Inspection flow
│   │   └── sync/          # Sync status
│   ├── viewmodel/         # ViewModels
│   ├── composables/       # Reusable UI components
│   └── theme/             # Material Design theme
├── utils/                  # Utility classes
│   ├── location/          # GPS utilities
│   ├── camera/            # Camera helpers
│   └── extensions/        # Kotlin extensions
└── InspectionApplication.kt # Application class
```

## 🎨 UI Components

### Material Design 3
- **Dynamic color** based on device theme
- **Adaptive layouts** for different screen sizes
- **Accessibility support** with semantic annotations

### Key Composables

#### TriStateChip
```kotlin
@Composable
fun TriStateChip(
    value: String,
    onChange: (String) -> Unit,
    enabled: Boolean = true
) {
    // Implementation with OK/NOT_OK/NA options
}
```

#### InspectionItemCard
```kotlin
@Composable
fun InspectionItemCard(
    item: InspectionItem,
    status: String,
    onStatusChange: (String) -> Unit,
    onPhotoClick: () -> Unit
) {
    // Card with tri-state selection and photo capture
}
```

#### VehicleSelector
```kotlin
@Composable
fun VehicleSelector(
    vehicles: List<Vehicle>,
    selectedVehicle: Vehicle?,
    onVehicleSelected: (Vehicle) -> Unit
) {
    // Vehicle selection with search and filtering
}
```

## 📊 Data Models

### Local Database (Room)
```kotlin
@Entity(tableName = "inspections")
data class InspectionLocal(
    @PrimaryKey val id: String,
    val vehicleId: String,
    val driverId: String,
    val status: String,
    val submittedAt: String?,
    val syncStatus: SyncStatus,
    val jsonData: String // Serialized inspection data
)

@Entity(tableName = "inspection_items")
data class InspectionItemLocal(
    @PrimaryKey val id: String,
    val inspectionId: String,
    val itemKey: String,
    val status: String,
    val comment: String?,
    val photoPath: String?,
    val syncStatus: SyncStatus
)
```

### Network DTOs
```kotlin
@Serializable
data class InspectionDTO(
    val schemaVersion: String,
    val vehicleId: String,
    val odometer: Double?,
    val location: GeoPoint?,
    val startedAt: String,
    val items: List<InspectionItemDTO>
)

@Serializable
data class InspectionItemDTO(
    val section: String,
    val key: String,
    val label: String,
    val status: String,
    val comment: String? = null,
    val photoUrl: String? = null
)
```

## 🔧 Configuration

### Build Configuration
```kotlin
// build.gradle (app level)
android {
    defaultConfig {
        buildConfigField "String", "API_BASE_URL", 
            '"http://10.0.2.2:3000/api"'
        buildConfigField "boolean", "DEBUG_MODE", "true"
    }
    
    buildTypes {
        release {
            buildConfigField "String", "API_BASE_URL", 
                '"https://your-api-domain.com/api"'
            buildConfigField "boolean", "DEBUG_MODE", "false"
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
}
```

### Network Configuration
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor())
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BODY
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }
}
```

## 🔄 Offline Sync Strategy

### Local Storage
- **Immediate save** to Room database
- **Queue failed uploads** for retry
- **Conflict resolution** on sync

### Sync Process
```kotlin
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: InspectionRepository
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            // 1. Upload pending inspections
            repository.uploadPendingInspections()
            
            // 2. Download latest schema
            repository.syncInspectionSchema()
            
            // 3. Upload photos
            repository.uploadPendingPhotos()
            
            Result.success()
        } catch (exception: Exception) {
            Result.retry()
        }
    }
}
```

### Conflict Resolution
- **Last write wins** for simple conflicts
- **Manual resolution** for complex cases
- **Version tracking** with timestamps

## 📷 Camera Integration

### Photo Capture
```kotlin
@Composable
fun CameraCapture(
    onPhotoCaptured: (File) -> Unit,
    onError: (Exception) -> Unit
) {
    val context = LocalContext.current
    val cameraController = remember { LifecycleCameraController(context) }
    
    AndroidView(
        factory = { ctx ->
            PreviewView(ctx).apply {
                controller = cameraController
            }
        }
    )
    
    // Capture logic with error handling
}
```

### Image Processing
- **Automatic compression** to reduce file size
- **EXIF data handling** for location and timestamp
- **Thumbnail generation** for quick preview

## 📍 Location Services

### GPS Integration
```kotlin
class LocationService @Inject constructor(
    private val fusedLocationClient: FusedLocationProviderClient,
    private val context: Context
) {
    
    suspend fun getCurrentLocation(): GeoPoint? {
        return if (hasLocationPermission()) {
            try {
                val location = fusedLocationClient.lastLocation.await()
                GeoPoint(location.latitude, location.longitude)
            } catch (exception: SecurityException) {
                null
            }
        } else {
            null
        }
    }
}
```

### Permission Handling
```kotlin
@Composable
fun LocationPermissionRequest(
    onPermissionGranted: () -> Unit,
    onPermissionDenied: () -> Unit
) {
    val permissionState = rememberPermissionState(
        android.Manifest.permission.ACCESS_FINE_LOCATION
    )
    
    LaunchedEffect(permissionState.status) {
        when {
            permissionState.status.isGranted -> onPermissionGranted()
            permissionState.status.shouldShowRationale -> {
                // Show rationale
            }
            else -> onPermissionDenied()
        }
    }
}
```

## 🧪 Testing

### Unit Testing
```kotlin
@RunWith(MockitoJUnitRunner::class)
class InspectionViewModelTest {
    
    @Mock
    private lateinit var repository: InspectionRepository
    
    @InjectMocks
    private lateinit var viewModel: InspectionViewModel
    
    @Test
    fun `should update inspection item status`() {
        // Test implementation
    }
}
```

### Integration Testing
```kotlin
@RunWith(AndroidJUnit4::class)
@SmallTest
class InspectionDaoTest {
    
    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()
    
    private lateinit var database: InspectionDatabase
    private lateinit var dao: InspectionDao
    
    @Test
    fun insertAndRetrieveInspection() {
        // Database test implementation
    }
}
```

## 🚀 Build & Deployment

### Debug Build
```bash
./gradlew assembleDebug
# APK location: app/build/outputs/apk/debug/
```

### Release Build
```bash
./gradlew assembleRelease
# Requires signing configuration
```

### Signing Configuration
```kotlin
// build.gradle
android {
    signingConfigs {
        release {
            storeFile file('keystore.jks')
            storePassword 'store_password'
            keyAlias 'key_alias'
            keyPassword 'key_password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 📊 Performance Optimization

### Memory Management
- **Image recycling** to prevent memory leaks
- **View recycling** in large lists
- **Background task cleanup**

### Battery Optimization
- **Efficient location updates**
- **Background sync scheduling**
- **Doze mode compatibility**

### Network Optimization
- **Request caching** with OkHttp
- **Image compression** before upload
- **Retry logic** with exponential backoff

## 🔐 Security

### Data Protection
- **Room database encryption** with SQLCipher
- **Keystore integration** for sensitive data
- **Certificate pinning** for API calls

### Authentication Security
- **Token storage** in encrypted preferences
- **Biometric authentication** when available
- **Session timeout** handling

## 📚 Dependencies

### Core Android
```kotlin
implementation 'androidx.core:core-ktx:1.12.0'
implementation 'androidx.activity:activity-compose:1.8.0'
implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.7.0'
```

### Jetpack Compose
```kotlin
implementation platform('androidx.compose:compose-bom:2023.10.01')
implementation 'androidx.compose.ui:ui'
implementation 'androidx.compose.material3:material3'
implementation 'androidx.navigation:navigation-compose:2.7.4'
```

### Networking & Serialization
```kotlin
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0'
```

### Database & Sync
```kotlin
implementation 'androidx.room:room-runtime:2.6.0'
implementation 'androidx.room:room-ktx:2.6.0'
implementation 'androidx.work:work-runtime-ktx:2.8.1'
```

---

For more information, see the main project README.md