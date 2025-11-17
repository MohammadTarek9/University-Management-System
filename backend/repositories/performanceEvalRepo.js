const pool = require('../db/mysql');

function mapPerformanceRow(row) {
	if (!row) return null;
	return {
		id: row.id,
		userId: row.user_id,
		evaluationDate: row.evaluation_date,
		evaluatorId: row.evaluator_id,
		score: row.score,
		rating: row.rating,
		comments: row.comments,
		actionPlan: row.action_plan,
		reviewed: !!row.reviewed,
		reviewDate: row.review_date,
		createdBy: row.created_by,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

async function createPerformanceRecord(data) {
	const {
		userId,
		evaluationDate,
		evaluatorId = null,
		score = null,
		rating = null,
		comments = null,
		actionPlan = null,
		reviewed = 0,
		reviewDate = null,
		createdBy = null
	} = data;

	const [result] = await pool.query(
		`INSERT INTO performance_records (
			user_id, evaluation_date, evaluator_id, score, rating, comments, action_plan,
			reviewed, review_date, created_by, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
		[
			userId,
			evaluationDate,
			evaluatorId,
			score,
			rating,
			comments,
			actionPlan,
			reviewed ? 1 : 0,
			reviewDate,
			createdBy
		]
	);

	const insertId = result.insertId;
	const [rows] = await pool.query('SELECT * FROM performance_records WHERE id = ?', [insertId]);
	return mapPerformanceRow(rows[0]);
}

async function getPerformanceById(id) {
	const [rows] = await pool.query('SELECT * FROM performance_records WHERE id = ?', [id]);
	if (!rows[0]) return null;
	return mapPerformanceRow(rows[0]);
}

async function getPerformanceRecords(filters = {}, page = 1, limit = 20) {
	const where = [];
	const params = [];

	if (filters.userId) {
		where.push('user_id = ?');
		params.push(filters.userId);
	}
	if (filters.evaluatorId) {
		where.push('evaluator_id = ?');
		params.push(filters.evaluatorId);
	}
	if (filters.startDate && filters.endDate) {
		where.push('evaluation_date BETWEEN ? AND ?');
		params.push(filters.startDate, filters.endDate);
	} else if (filters.startDate) {
		where.push('evaluation_date >= ?');
		params.push(filters.startDate);
	} else if (filters.endDate) {
		where.push('evaluation_date <= ?');
		params.push(filters.endDate);
	}
	if (filters.minScore !== undefined) {
		where.push('score >= ?');
		params.push(filters.minScore);
	}
	if (filters.rating) {
		where.push('rating = ?');
		params.push(filters.rating);
	}
	if (filters.reviewed !== undefined) {
		where.push('reviewed = ?');
		params.push(filters.reviewed ? 1 : 0);
	}

	const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

	const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM performance_records ${whereClause}`, params);
	const total = countRows[0]?.total || 0;

	const offset = (page - 1) * limit;
	const [rows] = await pool.query(
		`SELECT * FROM performance_records ${whereClause} ORDER BY evaluation_date DESC, id DESC LIMIT ? OFFSET ?`,
		[...params, Number(limit), Number(offset)]
	);

	const records = rows.map(mapPerformanceRow);
	return { records, total, page, pages: Math.ceil(total / limit) };
}

async function updatePerformanceRecord(id, data) {
	const fields = [];
	const params = [];

	const setIf = (col, val, transform) => {
		if (val !== undefined) {
			fields.push(`${col} = ?`);
			params.push(transform ? transform(val) : val);
		}
	};

	setIf('user_id', data.userId);
	setIf('evaluation_date', data.evaluationDate);
	setIf('evaluator_id', data.evaluatorId);
	setIf('score', data.score);
	setIf('rating', data.rating);
	setIf('comments', data.comments);
	setIf('action_plan', data.actionPlan);
	setIf('reviewed', data.reviewed, v => v ? 1 : 0);
	setIf('review_date', data.reviewDate);
	setIf('created_by', data.createdBy);

	if (fields.length === 0) {
		const existing = await getPerformanceById(id);
		if (!existing) throw new Error('Performance record not found');
		return existing;
	}

	fields.push('updated_at = NOW()');
	const sql = `UPDATE performance_records SET ${fields.join(', ')} WHERE id = ?`;
	params.push(id);

	await pool.query(sql, params);
	return getPerformanceById(id);
}

async function deletePerformanceRecord(id) {
	const [result] = await pool.query('DELETE FROM performance_records WHERE id = ?', [id]);
	return result.affectedRows > 0;
}

module.exports = {
	createPerformanceRecord,
	getPerformanceById,
	getPerformanceRecords,
	updatePerformanceRecord,
	deletePerformanceRecord
};

