/**
 * Utility functions for generating role-specific IDs
 * Format: STU-1, STU-2, PAR-1, PAR-2, TEA-1, TEA-2, etc.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Extract number from ID string (e.g., "STU-123" -> 123)
 */
const extractIdNumber = (idString) => {
  const match = idString.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Generate a Student ID (format: STU-1, STU-2, etc.)
 * Queries Firestore to find the highest existing student ID and increments it
 */
export const generateStudentId = async () => {
  try {
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'student'))
    );
    
    let maxNumber = 0;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.studentId) {
        const num = extractIdNumber(data.studentId);
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `STU-${nextNumber}`;
  } catch (error) {
    console.error('Error generating student ID:', error);
    // Fallback: return STU-1 if query fails
    return 'STU-1';
  }
};

/**
 * Generate a Parent ID (format: PAR-1, PAR-2, etc.)
 * Queries Firestore to find the highest existing parent ID and increments it
 */
export const generateParentId = async () => {
  try {
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'parent'))
    );
    
    let maxNumber = 0;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.parentId) {
        const num = extractIdNumber(data.parentId);
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `PAR-${nextNumber}`;
  } catch (error) {
    console.error('Error generating parent ID:', error);
    // Fallback: return PAR-1 if query fails
    return 'PAR-1';
  }
};

/**
 * Generate a Teacher ID (format: TEA-1, TEA-2, etc.)
 * Queries Firestore to find the highest existing teacher ID and increments it
 */
export const generateTeacherId = async () => {
  try {
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'teacher'))
    );
    
    let maxNumber = 0;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.teacherId) {
        const num = extractIdNumber(data.teacherId);
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `TEA-${nextNumber}`;
  } catch (error) {
    console.error('Error generating teacher ID:', error);
    // Fallback: return TEA-1 if query fails
    return 'TEA-1';
  }
};

/**
 * Generate an ID based on role (async function)
 * @param {string} role - The user role (student, parent, teacher)
 * @returns {Promise<string>} Generated ID
 */
export const generateIdByRole = async (role) => {
  switch (role) {
    case 'student':
      return await generateStudentId();
    case 'parent':
      return await generateParentId();
    case 'teacher':
      return await generateTeacherId();
    default:
      throw new Error(`Invalid role: ${role}`);
  }
};

/**
 * Get the ID field name based on role
 * @param {string} role - The user role
 * @returns {string} ID field name
 */
export const getIdFieldName = (role) => {
  switch (role) {
    case 'student':
      return 'studentId';
    case 'parent':
      return 'parentId';
    case 'teacher':
      return 'teacherId';
    default:
      return 'id';
  }
};

