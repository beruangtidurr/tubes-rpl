// Helper functions for academic year and semester management

export interface AcademicYearSemester {
  academicYear: string;
  semester: 'GANJIL' | 'GENAP';
}

/**
 * Get current academic year and semester based on current date
 * Academic year format: YYYY/YYYY+1 (e.g., "2025/2026")
 * Semester: GANJIL (Odd) = August-January, GENAP (Even) = February-July
 */
export function getCurrentAcademicYearSemester(): AcademicYearSemester {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Determine semester
  // GANJIL: August (8) to January (1) of next year
  // GENAP: February (2) to July (7)
  let semester: 'GANJIL' | 'GENAP';
  let academicYear: string;

  if (month >= 8 || month <= 1) {
    // GANJIL semester
    semester = 'GANJIL';
    if (month >= 8) {
      // August-December: current year / next year
      academicYear = `${year}/${year + 1}`;
    } else {
      // January: previous year / current year
      academicYear = `${year - 1}/${year}`;
    }
  } else {
    // GENAP semester: February-July
    semester = 'GENAP';
    academicYear = `${year - 1}/${year}`;
  }

  return { academicYear, semester };
}

/**
 * Get list of academic years for the last N years (including current)
 */
export function getAcademicYearsList(yearsBack: number = 2): string[] {
  const current = getCurrentAcademicYearSemester();
  const years: string[] = [];
  
  // Parse current academic year
  const [startYear] = current.academicYear.split('/').map(Number);
  
  for (let i = 0; i <= yearsBack; i++) {
    const year = startYear - i;
    years.push(`${year}/${year + 1}`);
  }
  
  return years;
}

/**
 * Check if an academic year/semester is in the past
 */
export function isPastSemester(
  academicYear: string,
  semester: 'GANJIL' | 'GENAP'
): boolean {
  const current = getCurrentAcademicYearSemester();
  
  // Parse academic years
  const [currentStart] = current.academicYear.split('/').map(Number);
  const [checkStart] = academicYear.split('/').map(Number);
  
  // If academic year is before current, it's past
  if (checkStart < currentStart) {
    return true;
  }
  
  // If same academic year, check semester
  if (checkStart === currentStart) {
    // GANJIL comes before GENAP in the same academic year
    if (current.semester === 'GENAP' && semester === 'GANJIL') {
      return true;
    }
    // If current is GANJIL and checking GANJIL, it's current (not past)
    // If current is GENAP and checking GENAP, it's current (not past)
  }
  
  return false;
}

/**
 * Compare two academic year/semester combinations
 * Returns: -1 if first is before second, 0 if equal, 1 if first is after second
 */
export function compareAcademicYearSemester(
  ay1: string,
  sem1: 'GANJIL' | 'GENAP',
  ay2: string,
  sem2: 'GANJIL' | 'GENAP'
): number {
  const [start1] = ay1.split('/').map(Number);
  const [start2] = ay2.split('/').map(Number);
  
  if (start1 < start2) return -1;
  if (start1 > start2) return 1;
  
  // Same academic year, compare semesters
  if (sem1 === 'GANJIL' && sem2 === 'GENAP') return -1;
  if (sem1 === 'GENAP' && sem2 === 'GANJIL') return 1;
  
  return 0;
}

