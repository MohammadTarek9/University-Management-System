const eavUtil = require('../utils/eavNew');

const ENTITY_TYPE = 'maintenance';

/**
 * Map EAV entity to maintenance object
 */
function mapMaintenanceEntity(entity) {
  if (!entity) return null;

  return {
    id: entity.entity_id,
    roomId: entity.room_id,
    issueType: entity.issue_type,
    title: entity.title,
    category: entity.category,
    description: entity.description,
    severity: entity.severity,
    priority: entity.priority,
    location: entity.location,
    status: entity.status,
    reportedBy: entity.reported_by || entity.submitted_by,
    submittedBy: entity.submitted_by || entity.reported_by,
    reportedDate: entity.reported_date,
    assignedTo: entity.assigned_to,
    scheduledDate: entity.scheduled_date,
    completedDate: entity.completed_date,
    estimatedCost: entity.estimated_cost,
    actualCost: entity.actual_cost,
    notes: entity.notes,
    attachments: entity.attachments,
    preventiveMaintenance: entity.preventive_maintenance,
    recurrencePattern: entity.recurrence_pattern,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at
  };
}

/**
 * Get all maintenance requests
 */
async function getAllMaintenanceRequests(options = {}) {
  try {
    const entities = await eavUtil.getEntitiesByType(ENTITY_TYPE);
    const allRequests = entities.map(mapMaintenanceEntity);
    
    // Apply filters if provided
    let filtered = allRequests;
    
    if (options.status) {
      filtered = filtered.filter(req => req.status === options.status);
    }
    
    if (options.category) {
      filtered = filtered.filter(req => req.category === options.category);
    }
    
    if (options.priority) {
      filtered = filtered.filter(req => req.priority === options.priority || req.severity === options.priority);
    }
    
    if (options.submittedBy) {
      filtered = filtered.filter(req => req.submittedBy === options.submittedBy);
    }
    
    // Pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginated = filtered.slice(startIndex, endIndex);
    
    return {
      maintenanceRequests: paginated,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit)
    };
  } catch (error) {
    console.error('Error getting all maintenance requests:', error);
    throw error;
  }
}

/**
 * Get maintenance request by ID
 */
async function getMaintenanceRequestById(id) {
  try {
    const entity = await eavUtil.getEntityById(id);
    if (!entity || entity.entity_type !== ENTITY_TYPE) {
      return null;
    }
    return mapMaintenanceEntity(entity);
  } catch (error) {
    console.error(`Error getting maintenance request ${id}:`, error);
    throw error;
  }
}

/**
 * Create new maintenance request
 */
async function createMaintenanceRequest(maintenanceData) {
  try {
    // Map controller fields to repository fields
    const issueType = maintenanceData.title || maintenanceData.category || maintenanceData.issueType || 'General';
    const reportedBy = maintenanceData.submittedBy || maintenanceData.reportedBy;
    
    // Create the entity first
    const entityId = await eavUtil.createEntity(
      ENTITY_TYPE,
      `${issueType} - ${maintenanceData.description?.substring(0, 50) || 'Maintenance Request'}`,
      { isActive: maintenanceData.status !== 'completed' }
    );

    // Set all attributes
    await eavUtil.setEntityAttributes(entityId, {
      room_id: { value: maintenanceData.roomId, type: 'number' },
      issue_type: { value: issueType, type: 'string' },
      title: { value: maintenanceData.title, type: 'string' },
      category: { value: maintenanceData.category, type: 'string' },
      description: { value: maintenanceData.description, type: 'text' },
      severity: { value: maintenanceData.severity || maintenanceData.priority || 'medium', type: 'string' },
      priority: { value: maintenanceData.priority, type: 'string' },
      location: { value: maintenanceData.location, type: 'string' },
      status: { value: maintenanceData.status || 'pending', type: 'string' },
      reported_by: { value: reportedBy, type: 'number' },
      submitted_by: { value: maintenanceData.submittedBy, type: 'number' },
      reported_date: { value: maintenanceData.reportedDate || new Date(), type: 'date' },
      assigned_to: { value: maintenanceData.assignedTo, type: 'number' },
      scheduled_date: { value: maintenanceData.scheduledDate, type: 'date' },
      completed_date: { value: maintenanceData.completedDate, type: 'date' },
      estimated_cost: { value: maintenanceData.estimatedCost, type: 'number' },
      actual_cost: { value: maintenanceData.actualCost, type: 'number' },
      notes: { value: maintenanceData.notes, type: 'text' },
      attachments: { value: maintenanceData.attachments, type: 'text' },
      preventive_maintenance: { value: maintenanceData.preventiveMaintenance || false, type: 'boolean' },
      recurrence_pattern: { value: maintenanceData.recurrencePattern, type: 'text' }
    });

    return await getMaintenanceRequestById(entityId);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    throw error;
  }
}

/**
 * Update maintenance request
 */
async function updateMaintenanceRequest(id, maintenanceData) {
  try {
    // Update base entity
    await eavUtil.updateEntity(id, {
      name: maintenanceData.issueType ? 
        `${maintenanceData.issueType} - ${maintenanceData.description?.substring(0, 50) || 'Maintenance Request'}` : undefined,
      isActive: maintenanceData.status !== 'completed'
    });

    // Update attributes
    const attributes = {};
    if (maintenanceData.roomId !== undefined) {
      attributes.room_id = { value: maintenanceData.roomId, type: 'number' };
    }
    if (maintenanceData.issueType !== undefined) {
      attributes.issue_type = { value: maintenanceData.issueType, type: 'string' };
    }
    if (maintenanceData.description !== undefined) {
      attributes.description = { value: maintenanceData.description, type: 'text' };
    }
    if (maintenanceData.severity !== undefined) {
      attributes.severity = { value: maintenanceData.severity, type: 'string' };
    }
    if (maintenanceData.status !== undefined) {
      attributes.status = { value: maintenanceData.status, type: 'string' };
    }
    if (maintenanceData.reportedBy !== undefined) {
      attributes.reported_by = { value: maintenanceData.reportedBy, type: 'number' };
    }
    if (maintenanceData.reportedDate !== undefined) {
      attributes.reported_date = { value: maintenanceData.reportedDate, type: 'date' };
    }
    if (maintenanceData.assignedTo !== undefined) {
      attributes.assigned_to = { value: maintenanceData.assignedTo, type: 'number' };
    }
    if (maintenanceData.scheduledDate !== undefined) {
      attributes.scheduled_date = { value: maintenanceData.scheduledDate, type: 'date' };
    }
    if (maintenanceData.completedDate !== undefined) {
      attributes.completed_date = { value: maintenanceData.completedDate, type: 'date' };
    }
    if (maintenanceData.estimatedCost !== undefined) {
      attributes.estimated_cost = { value: maintenanceData.estimatedCost, type: 'number' };
    }
    if (maintenanceData.actualCost !== undefined) {
      attributes.actual_cost = { value: maintenanceData.actualCost, type: 'number' };
    }
    if (maintenanceData.notes !== undefined) {
      attributes.notes = { value: maintenanceData.notes, type: 'text' };
    }
    if (maintenanceData.attachments !== undefined) {
      attributes.attachments = { value: maintenanceData.attachments, type: 'text' };
    }
    if (maintenanceData.preventiveMaintenance !== undefined) {
      attributes.preventive_maintenance = { value: maintenanceData.preventiveMaintenance, type: 'boolean' };
    }
    if (maintenanceData.recurrencePattern !== undefined) {
      attributes.recurrence_pattern = { value: maintenanceData.recurrencePattern, type: 'text' };
    }

    if (Object.keys(attributes).length > 0) {
      await eavUtil.setEntityAttributes(id, attributes);
    }

    return await getMaintenanceRequestById(id);
  } catch (error) {
    console.error(`Error updating maintenance request ${id}:`, error);
    throw error;
  }
}

/**
 * Delete maintenance request
 */
async function deleteMaintenanceRequest(id) {
  try {
    await eavUtil.deleteEntity(id);
    return true;
  } catch (error) {
    console.error(`Error deleting maintenance request ${id}:`, error);
    throw error;
  }
}

/**
 * Get maintenance requests by room
 */
async function getMaintenanceRequestsByRoom(roomId) {
  try {
    const allRequests = await getAllMaintenanceRequests();
    return allRequests.filter(req => req.roomId === roomId);
  } catch (error) {
    console.error(`Error getting maintenance requests for room ${roomId}:`, error);
    throw error;
  }
}

/**
 * Get maintenance requests by status
 */
async function getMaintenanceRequestsByStatus(status) {
  try {
    const results = await eavUtil.searchEntitiesByAttribute(
      ENTITY_TYPE,
      'status',
      status
    );
    return results.map(mapMaintenanceEntity);
  } catch (error) {
    console.error(`Error getting maintenance requests with status ${status}:`, error);
    throw error;
  }
}

/**
 * Get maintenance requests by severity
 */
async function getMaintenanceRequestsBySeverity(severity) {
  try {
    const results = await eavUtil.searchEntitiesByAttribute(
      ENTITY_TYPE,
      'severity',
      severity
    );
    return results.map(mapMaintenanceEntity);
  } catch (error) {
    console.error(`Error getting maintenance requests with severity ${severity}:`, error);
    throw error;
  }
}

/**
 * Get pending maintenance requests
 */
async function getPendingMaintenanceRequests() {
  try {
    return await getMaintenanceRequestsByStatus('pending');
  } catch (error) {
    console.error('Error getting pending maintenance requests:', error);
    throw error;
  }
}

/**
 * Assign maintenance request to staff
 */
async function assignMaintenanceRequest(id, assignedToId) {
  try {
    await eavUtil.setAttributeValue(id, 'assigned_to', assignedToId, 'number');
    await eavUtil.setAttributeValue(id, 'status', 'assigned', 'string');
    return await getMaintenanceRequestById(id);
  } catch (error) {
    console.error(`Error assigning maintenance request ${id}:`, error);
    throw error;
  }
}

/**
 * Complete maintenance request
 */
async function completeMaintenanceRequest(id, completionData) {
  try {
    await eavUtil.setEntityAttributes(id, {
      status: { value: 'completed', type: 'string' },
      completed_date: { value: completionData.completedDate || new Date(), type: 'date' },
      actual_cost: { value: completionData.actualCost, type: 'number' },
      notes: { value: completionData.notes, type: 'text' }
    });
    
    await eavUtil.updateEntity(id, { isActive: false });
    
    return await getMaintenanceRequestById(id);
  } catch (error) {
    console.error(`Error completing maintenance request ${id}:`, error);
    throw error;
  }
}

module.exports = {
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  getMaintenanceRequestsByRoom,
  getMaintenanceRequestsByStatus,
  getMaintenanceRequestsBySeverity,
  getPendingMaintenanceRequests,
  assignMaintenanceRequest,
  completeMaintenanceRequest
};
