package com.inspectionapp.mobile.ui.composables

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

/**
 * Tri-state chip component for OK/NOT_OK/NA selection
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TriStateChip(
    value: String,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    val options = listOf("OK", "NOT_OK", "NA")
    
    Row(
        modifier = modifier.selectableGroup(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        options.forEach { option ->
            val isSelected = value == option
            val colors = when (option) {
                "OK" -> if (isSelected) {
                    AssistChipDefaults.assistChipColors(
                        containerColor = Color(0xFF00A693), // Buscor teal for OK
                        labelColor = Color.White
                    )
                } else {
                    AssistChipDefaults.assistChipColors()
                }
                "NOT_OK" -> if (isSelected) {
                    AssistChipDefaults.assistChipColors(
                        containerColor = Color(0xFFFF7F00), // Buscor orange for NOT_OK
                        labelColor = Color.White
                    )
                } else {
                    AssistChipDefaults.assistChipColors()
                }
                "NA" -> if (isSelected) {
                    AssistChipDefaults.assistChipColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant,
                        labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    AssistChipDefaults.assistChipColors()
                }
                else -> AssistChipDefaults.assistChipColors()
            }
            
            AssistChip(
                onClick = { if (enabled) onChange(option) },
                label = { 
                    Text(
                        text = when (option) {
                            "OK" -> "✓ OK"
                            "NOT_OK" -> "✗ NOT OK"
                            "NA" -> "— N/A"
                            else -> option
                        }
                    ) 
                },
                colors = colors,
                modifier = Modifier.selectable(
                    selected = isSelected,
                    onClick = { if (enabled) onChange(option) },
                    role = Role.RadioButton
                ),
                enabled = enabled
            )
        }
    }
}

/**
 * Inspection item card with tri-state selection
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InspectionItemCard(
    label: String,
    description: String,
    priority: String,
    status: String,
    comment: String,
    onStatusChange: (String) -> Unit,
    onCommentChange: (String) -> Unit,
    onPhotoClick: () -> Unit,
    hasPhoto: Boolean = false,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    var expanded by remember { mutableStateOf(false) }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when (priority) {
                "CRITICAL" -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.1f)
                "HIGH" -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.1f)
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header with priority indicator
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.titleMedium
                    )
                    if (description.isNotBlank()) {
                        Text(
                            text = description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                // Priority badge
                AssistChip(
                    onClick = { },
                    label = { Text(priority) },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = when (priority) {
                            "CRITICAL" -> MaterialTheme.colorScheme.error
                            "HIGH" -> MaterialTheme.colorScheme.primary
                            "MEDIUM" -> MaterialTheme.colorScheme.secondary
                            else -> MaterialTheme.colorScheme.outline
                        },
                        labelColor = when (priority) {
                            "CRITICAL" -> MaterialTheme.colorScheme.onError
                            "HIGH" -> MaterialTheme.colorScheme.onPrimary
                            "MEDIUM" -> MaterialTheme.colorScheme.onSecondary
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    ),
                    enabled = false
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Tri-state selection
            TriStateChip(
                value = status,
                onChange = onStatusChange,
                enabled = enabled
            )
            
            // Comment and photo section (shown when NOT_OK is selected)
            if (status == "NOT_OK") {
                Spacer(modifier = Modifier.height(12.dp))
                
                OutlinedTextField(
                    value = comment,
                    onValueChange = onCommentChange,
                    label = { Text("Comment (required for defects)") },
                    placeholder = { Text("Describe the issue...") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    enabled = enabled
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedButton(
                    onClick = onPhotoClick,
                    enabled = enabled,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        if (hasPhoto) "📷 Photo Attached" else "📷 Add Photo"
                    )
                }
            }
        }
    }
}