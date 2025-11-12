package com.inspectionapp.mobile.ui.theme

import androidx.compose.ui.graphics.Color

// Buscor Brand Colors - Extracted from Official Logo
object BuscorColors {
    // Primary Colors - From Logo
    val Orange = Color(0xFFFF7F00)      // Main Buscor orange from logo
    val OrangeLight = Color(0xFFFFB366) // Lighter orange gradient
    val OrangeDark = Color(0xFFE56B00)  // Darker orange
    
    val Teal = Color(0xFF00A693)        // Buscor teal/turquoise from logo
    val TealLight = Color(0xFF33B8A8)   // Lighter teal
    val TealDark = Color(0xFF008A7A)    // Darker teal
    
    val Yellow = Color(0xFFFFD700)      // Bright yellow from logo center
    
    // Supporting Colors
    val Blue = Color(0xFF2E86AB)        // Accent blue
    val Green = Color(0xFF52B788)       // Success green
    val Yellow = Color(0xFFFAD02E)      // Warning yellow
    val Red = Color(0xFFEF476F)        // Error/critical red
    
    // Neutral Colors
    val Gray100 = Color(0xFFF5F5F5)     // Very light gray
    val Gray200 = Color(0xFFE5E5E5)     // Light gray
    val Gray300 = Color(0xFFD4D4D4)     // Medium light gray
    val Gray400 = Color(0xFFA3A3A3)     // Medium gray
    val Gray500 = Color(0xFF737373)     // Medium dark gray
    val Gray600 = Color(0xFF525252)     // Dark gray
    val Gray700 = Color(0xFF404040)     // Very dark gray
    val Gray800 = Color(0xFF262626)     // Near black
    val Gray900 = Color(0xFF171717)     // Almost black
    
    // Status Colors for Inspections
    val StatusPass = Color(0xFF10B981)       // Green for PASS
    val StatusFail = Color(0xFFEF4444)       // Red for FAIL
    val StatusAttention = Color(0xFFF59E0B)  // Amber for NEEDS_ATTENTION
    val StatusNA = Color(0xFF6B7280)         // Gray for N/A
    
    // Priority Colors for Defects
    val PriorityCritical = Color(0xFFDC2626)  // Red for critical
    val PriorityHigh = Color(0xFFEA580C)      // Orange for high
    val PriorityMedium = Color(0xFFD97706)    // Amber for medium
    val PriorityLow = Color(0xFF059669)       // Green for low
}