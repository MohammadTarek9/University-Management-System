
const pool = require('../db/mysql');

// Helper: Get attribute_id by name (or create if not exists)
async function getAttributeId(attributeName, dataType = 'string') {
	const [rows] = await pool.query(
		'SELECT attribute_id FROM maintenance_eav_attributes WHERE attribute_name = ?',
		[attributeName]
	);
	if (rows.length > 0) return rows[0].attribute_id;
	const [result] = await pool.query(
		'INSERT INTO maintenance_eav_attributes (attribute_name, data_type) VALUES (?, ?)',
		[attributeName, dataType]
	);
	return result.insertId;
}

// Helper: Map EAV values to a maintenance request object
function mapMaintenance(entity, values) {
	const location = {
		building: '',
		floor: '',
		roomNumber: ''
	};
	const req = {
			id: entity.entity_id,
			name: entity.name,
			createdAt: entity.created_at,
			updatedAt: entity.updated_at,
			location,
			// attributes below
			issueType: '',
			title: '',
			category: '',
			description: '',
			severity: '',
			priority: '',
			status: '',
			reportedBy: null,
			submittedBy: null,
			reportedDate: null,
			assignedTo: null,
			scheduledDate: null,
			completedDate: null,
			estimatedCost: null,
			actualCost: null,
			notes: '',
			attachments: '',
			preventiveMaintenance: false,
			recurrencePattern: ''
		};
	for (const row of values) {
		let val = row.value_string ?? row.value_number ?? row.value_text ?? row.value_boolean ?? row.value_date;
		if (row.attribute_name === 'location_building') location.building = val || '';
		else if (row.attribute_name === 'location_floor') location.floor = val || '';
		else if (row.attribute_name === 'location_room_number') location.roomNumber = val || '';
		else if (row.attribute_name === 'preventive_maintenance') req.preventiveMaintenance = !!val;
		else req[row.attribute_name] = val;
	}
	return req;
}

// Create a new maintenance request
async function createMaintenanceRequest(data) {
	const [entityResult] = await pool.query(
		'INSERT INTO maintenance_eav_entities (name, created_at, updated_at) VALUES (?, NOW(), NOW())',
		[data.title || data.issueType || 'Maintenance Request']
	);
	const entityId = entityResult.insertId;
	const attributes = {
		issue_type: { value: data.issueType, dataType: 'string' },
		title: { value: data.title, dataType: 'string' },
		category: { value: data.category, dataType: 'string' },
		description: { value: data.description, dataType: 'text' },
		severity: { value: data.severity, dataType: 'string' },
		priority: { value: data.priority, dataType: 'string' },
		location_building: { value: data.location?.building, dataType: 'string' },
		location_floor: { value: data.location?.floor, dataType: 'string' },
		location_room_number: { value: data.location?.roomNumber, dataType: 'string' },
		status: { value: data.status || 'pending', dataType: 'string' },
		reported_by: { value: data.reportedBy, dataType: 'number' },
		submitted_by: { value: data.submittedBy, dataType: 'number' },
		reported_date: { value: data.reportedDate, dataType: 'date' },
		assigned_to: { value: data.assignedTo, dataType: 'number' },
		scheduled_date: { value: data.scheduledDate, dataType: 'date' },
		completed_date: { value: data.completedDate, dataType: 'date' },
		estimated_cost: { value: data.estimatedCost, dataType: 'number' },
		actual_cost: { value: data.actualCost, dataType: 'number' },
		notes: { value: data.notes, dataType: 'text' },
		attachments: { value: data.attachments, dataType: 'text' },
		preventive_maintenance: { value: data.preventiveMaintenance ? 1 : 0, dataType: 'boolean' },
		recurrence_pattern: { value: data.recurrencePattern, dataType: 'text' }
	};
	for (const [attr, { value, dataType }] of Object.entries(attributes)) {
		if (value !== undefined && value !== null) {
			const attrId = await getAttributeId(attr, dataType);
			await pool.query(
				`INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_string, value_number, value_text, value_boolean, value_date)
				 VALUES (?, ?, ?, ?, ?, ?, ?)
				 ON DUPLICATE KEY UPDATE value_string=VALUES(value_string), value_number=VALUES(value_number), value_text=VALUES(value_text), value_boolean=VALUES(value_boolean), value_date=VALUES(value_date)`,
				[
					entityId,
					attrId,
					dataType === 'string' ? value : null,
					dataType === 'number' ? value : null,
					dataType === 'text' ? value : null,
					dataType === 'boolean' ? value : null,
					dataType === 'date' ? value : null
				]
			);
		}
	}
	return getMaintenanceRequestById(entityId);
}

// Get a maintenance request by ID
async function getMaintenanceRequestById(entityId) {
	const [entities] = await pool.query(
		'SELECT * FROM maintenance_eav_entities WHERE entity_id = ?',
		[entityId]
	);
	if (entities.length === 0) return null;
	const [values] = await pool.query(
		`SELECT a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
		 FROM maintenance_eav_values v
		 JOIN maintenance_eav_attributes a ON v.attribute_id = a.attribute_id
		 WHERE v.entity_id = ?`,
		[entityId]
	);
	return mapMaintenance(entities[0], values);
}

// Update a maintenance request
async function updateMaintenanceRequest(entityId, data) {
	if (data.title) {
		await pool.query(
			'UPDATE maintenance_eav_entities SET name = COALESCE(?, name), updated_at = NOW() WHERE entity_id = ?',
			[data.title, entityId]
		);
	}
	const attributes = {
		issue_type: { value: data.issueType, dataType: 'string' },
		title: { value: data.title, dataType: 'string' },
		category: { value: data.category, dataType: 'string' },
		description: { value: data.description, dataType: 'text' },
		severity: { value: data.severity, dataType: 'string' },
		priority: { value: data.priority, dataType: 'string' },
		location_building: { value: data.location?.building, dataType: 'string' },
		location_floor: { value: data.location?.floor, dataType: 'string' },
		location_room_number: { value: data.location?.roomNumber, dataType: 'string' },
		status: { value: data.status, dataType: 'string' },
		reported_by: { value: data.reportedBy, dataType: 'number' },
		submitted_by: { value: data.submittedBy, dataType: 'number' },
		reported_date: { value: data.reportedDate, dataType: 'date' },
		assigned_to: { value: data.assignedTo, dataType: 'number' },
		scheduled_date: { value: data.scheduledDate, dataType: 'date' },
		completed_date: { value: data.completedDate, dataType: 'date' },
		estimated_cost: { value: data.estimatedCost, dataType: 'number' },
		actual_cost: { value: data.actualCost, dataType: 'number' },
		notes: { value: data.notes, dataType: 'text' },
		attachments: { value: data.attachments, dataType: 'text' },
		preventive_maintenance: { value: data.preventiveMaintenance ? 1 : 0, dataType: 'boolean' },
		recurrence_pattern: { value: data.recurrencePattern, dataType: 'text' }
	};
	for (const [attr, { value, dataType }] of Object.entries(attributes)) {
		if (value !== undefined && value !== null) {
			const attrId = await getAttributeId(attr, dataType);
			await pool.query(
				`INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_string, value_number, value_text, value_boolean, value_date)
				 VALUES (?, ?, ?, ?, ?, ?, ?)
				 ON DUPLICATE KEY UPDATE value_string=VALUES(value_string), value_number=VALUES(value_number), value_text=VALUES(value_text), value_boolean=VALUES(value_boolean), value_date=VALUES(value_date)`,
				[
					entityId,
					attrId,
					dataType === 'string' ? value : null,
					dataType === 'number' ? value : null,
					dataType === 'text' ? value : null,
					dataType === 'boolean' ? value : null,
					dataType === 'date' ? value : null
				]
			);
		}
	}
	return getMaintenanceRequestById(entityId);
}

// Delete a maintenance request
async function deleteMaintenanceRequest(entityId) {
	const [result] = await pool.query(
		'DELETE FROM maintenance_eav_entities WHERE entity_id = ?',
		[entityId]
	);
	return result.affectedRows > 0;
}

// Get all maintenance requests
async function getAllMaintenanceRequests(filters = {}, page = 1, limit = 10) {
	let where = 'WHERE 1=1';
	let params = [];
	if (filters.isActive !== undefined) {
		where += ' AND is_active = ?';
		params.push(filters.isActive ? 1 : 0);
	}
	const [[{ count: total }]] = await pool.query(
		`SELECT COUNT(*) as count FROM maintenance_eav_entities ${where}`,
		params
	);
	const totalPages = Math.ceil(total / limit) || 1;
	const offset = (page - 1) * limit;
	const [entities] = await pool.query(
		`SELECT * FROM maintenance_eav_entities ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		[...params, limit, offset]
	);
	const ids = entities.map(e => e.entity_id);
	let requests = [];
	if (ids.length > 0) {
		const [values] = await pool.query(
			`SELECT v.entity_id, a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
			 FROM maintenance_eav_values v
			 JOIN maintenance_eav_attributes a ON v.attribute_id = a.attribute_id
			 WHERE v.entity_id IN (${ids.map(() => '?').join(',')})`,
			ids
		);
		const valueMap = {};
		for (const v of values) {
			if (!valueMap[v.entity_id]) valueMap[v.entity_id] = [];
			valueMap[v.entity_id].push(v);
		}
		requests = entities.map(e => mapMaintenance(e, valueMap[e.entity_id] || []));
	}
	return { maintenanceRequests: requests, total, totalPages };
}

// Get maintenance requests by room
async function getMaintenanceRequestsByRoom(roomId) {
	const attrId = await getAttributeId('room_id', 'number');
	const [values] = await pool.query(
		`SELECT entity_id FROM maintenance_eav_values WHERE attribute_id = ? AND value_number = ?`,
		[attrId, roomId]
	);
	if (values.length === 0) return [];
	const ids = values.map(v => v.entity_id);
	const [entities] = await pool.query(
		`SELECT * FROM maintenance_eav_entities WHERE entity_id IN (${ids.map(() => '?').join(',')})`,
		ids
	);
	if (entities.length === 0) return [];
	const [allValues] = await pool.query(
		`SELECT v.entity_id, a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
		 FROM maintenance_eav_values v
		 JOIN maintenance_eav_attributes a ON v.attribute_id = a.attribute_id
		 WHERE v.entity_id IN (${ids.map(() => '?').join(',')})`,
		ids
	);
	const valueMap = {};
	for (const v of allValues) {
		if (!valueMap[v.entity_id]) valueMap[v.entity_id] = [];
		valueMap[v.entity_id].push(v);
	}
	return entities.map(e => mapMaintenance(e, valueMap[e.entity_id] || []));
}

// Get maintenance requests by status
async function getMaintenanceRequestsByStatus(status) {
	const attrId = await getAttributeId('status', 'string');
	const [values] = await pool.query(
		`SELECT entity_id FROM maintenance_eav_values WHERE attribute_id = ? AND value_string = ?`,
		[attrId, status]
	);
	if (values.length === 0) return [];
	const ids = values.map(v => v.entity_id);
	const [entities] = await pool.query(
		`SELECT * FROM maintenance_eav_entities WHERE entity_id IN (${ids.map(() => '?').join(',')})`,
		ids
	);
	if (entities.length === 0) return [];
	const [allValues] = await pool.query(
		`SELECT v.entity_id, a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
		 FROM maintenance_eav_values v
		 JOIN maintenance_eav_attributes a ON v.attribute_id = a.attribute_id
		 WHERE v.entity_id IN (${ids.map(() => '?').join(',')})`,
		ids
	);
	const valueMap = {};
	for (const v of allValues) {
		if (!valueMap[v.entity_id]) valueMap[v.entity_id] = [];
		valueMap[v.entity_id].push(v);
	}
	return entities.map(e => mapMaintenance(e, valueMap[e.entity_id] || []));
}

// Get maintenance requests by severity
async function getMaintenanceRequestsBySeverity(severity) {
	const attrId = await getAttributeId('severity', 'string');
	const [values] = await pool.query(
		`SELECT entity_id FROM maintenance_eav_values WHERE attribute_id = ? AND value_string = ?`,
		[attrId, severity]
	);
	if (values.length === 0) return [];
	const ids = values.map(v => v.entity_id);
	const [entities] = await pool.query(
		`SELECT * FROM maintenance_eav_entities WHERE entity_id IN (${ids.map(() => '?').join(',')})`,
		ids
	);
	if (entities.length === 0) return [];
	const [allValues] = await pool.query(
		`SELECT v.entity_id, a.attribute_name, v.value_string, v.value_number, v.value_text, v.value_boolean, v.value_date
		 FROM maintenance_eav_values v
		 JOIN maintenance_eav_attributes a ON v.attribute_id = a.attribute_id
		 WHERE v.entity_id IN (${ids.map(() => '?').join(',')})`,
		ids
	);
	const valueMap = {};
	for (const v of allValues) {
		if (!valueMap[v.entity_id]) valueMap[v.entity_id] = [];
		valueMap[v.entity_id].push(v);
	}
	return entities.map(e => mapMaintenance(e, valueMap[e.entity_id] || []));
}

// Get pending maintenance requests
async function getPendingMaintenanceRequests() {
	return getMaintenanceRequestsByStatus('pending');
}

// Assign maintenance request to staff
async function assignMaintenanceRequest(entityId, assignedToId) {
	const attrId = await getAttributeId('assigned_to', 'number');
	await pool.query(
		`INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_number)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE value_number=VALUES(value_number)`,
		[entityId, attrId, assignedToId]
	);
	const statusAttrId = await getAttributeId('status', 'string');
	await pool.query(
		`INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_string)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE value_string=VALUES(value_string)`,
		[entityId, statusAttrId, 'assigned']
	);
	return getMaintenanceRequestById(entityId);
}

// Complete maintenance request
async function completeMaintenanceRequest(entityId, completionData = {}) {
	const statusAttrId = await getAttributeId('status', 'string');
	await pool.query(
		`INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_string)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE value_string=VALUES(value_string)`,
		[entityId, statusAttrId, 'completed']
	);
	const completedDateAttrId = await getAttributeId('completed_date', 'date');
	await pool.query(
		`INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_date)
		 VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE value_date=VALUES(value_date)`,
		[entityId, completedDateAttrId, completionData.completedDate || new Date()]
	);
	if (completionData.actualCost !== undefined) {
		const actualCostAttrId = await getAttributeId('actual_cost', 'number');
		await pool.query(
			`INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_number)
			 VALUES (?, ?, ?)
			 ON DUPLICATE KEY UPDATE value_number=VALUES(value_number)`,
			[entityId, actualCostAttrId, completionData.actualCost]
		);
	}
	if (completionData.notes !== undefined) {
		const notesAttrId = await getAttributeId('notes', 'text');
		await pool.query(
			`INSERT INTO maintenance_eav_values (entity_id, attribute_id, value_text)
			 VALUES (?, ?, ?)
			 ON DUPLICATE KEY UPDATE value_text=VALUES(value_text)`,
			[entityId, notesAttrId, completionData.notes]
		);
	}
	// No is_active update needed
	return getMaintenanceRequestById(entityId);
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