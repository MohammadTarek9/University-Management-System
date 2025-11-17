// repositories/teachingStaffProfileRepo.js
const pool = require('../db/mysql');

// Get teaching staff profile by user ID
async function getTeachingStaffProfile(userId) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM teaching_staff_profiles WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    
    if (rows.length === 0) return null;
    
    const profile = rows[0];
    return {
      id: profile.id,
      userId: profile.user_id,
      officeHours: profile.office_hours,
      officeLocation: profile.office_location,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  } catch (error) {
    console.error('Error getting teaching staff profile:', error);
    throw error;
  }
}

// Get teaching staff profile with user and employee details
async function getTeachingStaffProfileWithDetails(userId) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        tsp.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.phone_number,
        u.profile_picture,
        ed.department,
        ed.position,
        ed.employee_id
      FROM teaching_staff_profiles tsp
      LEFT JOIN users u ON tsp.user_id = u.id
      LEFT JOIN employee_details ed ON u.id = ed.user_id
      WHERE tsp.user_id = ? AND u.role IN ('professor', 'ta')
      LIMIT 1`,
      [userId]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      officeHours: row.office_hours,
      officeLocation: row.office_location,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        fullName: `${row.first_name} ${row.last_name}`,
        email: row.email,
        role: row.role,
        phoneNumber: row.phone_number,
        profilePicture: row.profile_picture,
        department: row.department,
        position: row.position,
        employeeId: row.employee_id
      }
    };
  } catch (error) {
    console.error('Error getting teaching staff profile with details:', error);
    throw error;
  }
}

// Get all teaching staff profiles with details
async function getAllTeachingStaffProfiles() {
  try {
    const [rows] = await pool.query(
      `SELECT 
        tsp.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.phone_number,
        u.profile_picture,
        u.is_active,
        ed.department,
        ed.position,
        ed.employee_id
      FROM teaching_staff_profiles tsp
      INNER JOIN users u ON tsp.user_id = u.id
      LEFT JOIN employee_details ed ON u.id = ed.user_id
      WHERE u.role IN ('professor', 'ta')
      ORDER BY u.first_name, u.last_name`
    );
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      officeHours: row.office_hours,
      officeLocation: row.office_location,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        fullName: `${row.first_name} ${row.last_name}`,
        email: row.email,
        role: row.role,
        phoneNumber: row.phone_number,
        profilePicture: row.profile_picture,
        isActive: !!row.is_active,
        department: row.department,
        position: row.position,
        employeeId: row.employee_id
      }
    }));
  } catch (error) {
    console.error('Error getting all teaching staff profiles:', error);
    throw error;
  }
}

// Get teaching staff profiles by department
async function getTeachingStaffByDepartment(department) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        tsp.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.phone_number,
        u.profile_picture,
        u.is_active,
        ed.department,
        ed.position,
        ed.employee_id
      FROM teaching_staff_profiles tsp
      INNER JOIN users u ON tsp.user_id = u.id
      INNER JOIN employee_details ed ON u.id = ed.user_id
      WHERE u.role IN ('professor', 'ta') 
        AND ed.department = ?
        AND u.is_active = 1
      ORDER BY u.first_name, u.last_name`,
      [department]
    );
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      officeHours: row.office_hours,
      officeLocation: row.office_location,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        fullName: `${row.first_name} ${row.last_name}`,
        email: row.email,
        role: row.role,
        phoneNumber: row.phone_number,
        profilePicture: row.profile_picture,
        isActive: !!row.is_active,
        department: row.department,
        position: row.position,
        employeeId: row.employee_id
      }
    }));
  } catch (error) {
    console.error('Error getting teaching staff by department:', error);
    throw error;
  }
}

// In teachingStaffProfileRepo.js - Add this function
async function updateUserContactInfo(userId, phoneNumber, email) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const updates = [];
    const values = [];
    
    if (phoneNumber !== undefined) {
      updates.push('phone_number = ?');
      values.push(phoneNumber || null);
    }
    
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (updates.length > 0) {
      values.push(userId);
      await connection.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    await connection.commit();
    
    // Return updated user info
    const [rows] = await connection.query(
      'SELECT phone_number, email FROM users WHERE id = ?',
      [userId]
    );
    
    return rows[0] || null;
  } catch (error) {
    await connection.rollback();
    console.error('Error updating user contact info:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function upsertTeachingStaffProfile(userId, profileData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { officeHours, officeLocation, phoneNumber, email } = profileData;
    
    // Update user contact info if provided
    if (phoneNumber !== undefined || email !== undefined) {
      await updateUserContactInfoTransaction(connection, userId, phoneNumber, email);
    }
    
    // Handle teaching staff profile (office hours/location)
    const [existing] = await connection.query(
      'SELECT id FROM teaching_staff_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (existing.length > 0) {
      // Update existing profile
      await connection.query(
        `UPDATE teaching_staff_profiles 
         SET office_hours = ?,
             office_location = ?
         WHERE user_id = ?`,
        [officeHours || null, officeLocation || null, userId]
      );
    } else {
      // Create new profile
      await connection.query(
        `INSERT INTO teaching_staff_profiles 
         (user_id, office_hours, office_location) 
         VALUES (?, ?, ?)`,
        [userId, officeHours || null, officeLocation || null]
      );
    }
    
    await connection.commit();
    
    // Return updated profile with user info
    return getTeachingStaffProfileWithDetails(userId);
  } catch (error) {
    await connection.rollback();
    console.error('Error upserting teaching staff profile:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Helper function for updating user contact info within transaction
async function updateUserContactInfoTransaction(connection, userId, phoneNumber, email) {
  const updates = [];
  const values = [];
  
  if (phoneNumber !== undefined) {
    updates.push('phone_number = ?');
    values.push(phoneNumber || null);
  }
  
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  
  if (updates.length > 0) {
    values.push(userId);
    await connection.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }
}

module.exports = {
  getTeachingStaffProfile,
  getTeachingStaffProfileWithDetails,
  getAllTeachingStaffProfiles,
  upsertTeachingStaffProfile,
  getTeachingStaffByDepartment,
  updateUserContactInfo
};