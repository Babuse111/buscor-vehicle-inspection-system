package com.inspectionapp.mobile.data.model

import kotlinx.serialization.Serializable

@Serializable
data class GeoPoint(
    val lat: Double,
    val lng: Double
)

@Serializable
data class InspectionItemDTO(
    val section: String,
    val key: String,
    val label: String,
    val status: String, // OK, NOT_OK, NA
    val comment: String? = null,
    val photoUrl: String? = null,
    val priority: String? = null
)

@Serializable
data class InspectionDTO(
    val schemaVersion: String,
    val driverId: String,
    val vehicleId: String,
    val odometer: Double? = null,
    val location: GeoPoint? = null,
    val startedAt: String,
    val submittedAt: String,
    val signatureUrl: String? = null,
    val items: List<InspectionItemDTO>
)

@Serializable
data class Vehicle(
    val id: String,
    val fleetCode: String,
    val registration: String,
    val make: String,
    val model: String,
    val year: Int? = null,
    val status: String = "active"
)

@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String,
    val role: String,
    val phone: String? = null,
    val isActive: Boolean = true
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val deviceInfo: DeviceInfo? = null
)

@Serializable
data class DeviceInfo(
    val deviceId: String,
    val platform: String = "android",
    val version: String
)

@Serializable
data class LoginResponse(
    val success: Boolean,
    val token: String,
    val user: User,
    val expiresIn: String
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val message: String? = null
)

// Inspection Schema Models
@Serializable
data class InspectionSchema(
    val schemaVersion: String,
    val title: String,
    val description: String,
    val sections: List<InspectionSection>,
    val metadata: SchemaMetadata
)

@Serializable
data class InspectionSection(
    val id: String,
    val title: String,
    val description: String,
    val items: List<InspectionItem>
)

@Serializable
data class InspectionItem(
    val key: String,
    val label: String,
    val type: String = "tristate",
    val required: Boolean = true,
    val priority: String,
    val description: String
)

@Serializable
data class SchemaMetadata(
    val created: String,
    val version: String,
    val author: String,
    val lastUpdated: String,
    val requiredFields: List<String>,
    val passFailCriteria: PassFailCriteria
)

@Serializable
data class PassFailCriteria(
    val autoFail: List<String>,
    val needsAttention: List<String>,
    val pass: List<String>
)