/**
 * Location code parsing utilities
 */

export interface SalesFloorLocationCode {
  departmentCode: string;
  parentCode: string;
  sectionCode?: string;
}

export interface BackroomLocationCode {
  aisleNumber: number;
  columnLetter: string;
  bayNumber: number;
}

export interface OverflowLocationCode {
  code: string;
}

/**
 * Parse sales floor location code
 * Examples: "FashMT02(99)" -> {departmentCode: "Fash", parentCode: "MT02", sectionCode: "99"}
 */
export function parseSalesFloorCode(locationCode: string): SalesFloorLocationCode {
  const pattern = /^([A-Za-z]+)([A-Z]{1,3}\d{1,2})(?:\((\d+)\))?$/;
  const match = locationCode.match(pattern);

  if (!match) {
    throw new Error(`Invalid sales floor location code format: ${locationCode}`);
  }

  return {
    departmentCode: match[1],
    parentCode: match[2],
    sectionCode: match[3],
  };
}

/**
 * Build sales floor location code from components
 */
export function buildSalesFloorCode(
  departmentCode: string,
  parentCode: string,
  sectionCode?: string
): string {
  if (sectionCode) {
    return `${departmentCode}${parentCode}(${sectionCode})`;
  }
  return `${departmentCode}${parentCode}`;
}

/**
 * Parse backroom location code
 * Examples: "04C12" -> {aisleNumber: 4, columnLetter: "C", bayNumber: 12}
 */
export function parseBackroomCode(locationCode: string): BackroomLocationCode {
  const pattern = /^(\d{1,2})([A-Z])(\d{1,2})$/;
  const match = locationCode.match(pattern);

  if (!match) {
    throw new Error(`Invalid backroom location code format: ${locationCode}`);
  }

  const aisleNumber = parseInt(match[1], 10);
  const columnLetter = match[2];
  const bayNumber = parseInt(match[3], 10);

  if (aisleNumber < 1 || aisleNumber > 7) {
    throw new Error(`Aisle number must be between 1 and 7, got: ${aisleNumber}`);
  }

  if (!columnLetter.match(/[A-Z]/)) {
    throw new Error(`Column letter must be uppercase A-Z, got: ${columnLetter}`);
  }

  if (bayNumber < 1 || bayNumber > 20) {
    throw new Error(`Bay number must be between 1 and 20, got: ${bayNumber}`);
  }

  return {
    aisleNumber,
    columnLetter,
    bayNumber,
  };
}

/**
 * Build backroom location code from components
 */
export function buildBackroomCode(
  aisleNumber: number,
  columnLetter: string,
  bayNumber: number
): string {
  if (aisleNumber < 1 || aisleNumber > 7) {
    throw new Error(`Aisle number must be between 1 and 7, got: ${aisleNumber}`);
  }

  if (!columnLetter.match(/^[A-Z]$/)) {
    throw new Error(`Column letter must be a single uppercase letter, got: ${columnLetter}`);
  }

  if (bayNumber < 1 || bayNumber > 20) {
    throw new Error(`Bay number must be between 1 and 20, got: ${bayNumber}`);
  }

  return `${aisleNumber.toString().padStart(2, '0')}${columnLetter}${bayNumber}`;
}

/**
 * Parse overflow location code
 * Examples: "O4TT88" -> {code: "O4TT88"}
 */
export function parseOverflowCode(locationCode: string): OverflowLocationCode {
  const pattern = /^O\d+TT\d+$/;

  if (!pattern.test(locationCode)) {
    throw new Error(`Invalid overflow location code format: ${locationCode}`);
  }

  return { code: locationCode };
}

/**
 * Check if location code is overflow
 */
export function isOverflowCode(locationCode: string): boolean {
  try {
    parseOverflowCode(locationCode);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if location code is backroom
 */
export function isBackroomCode(locationCode: string): boolean {
  try {
    parseBackroomCode(locationCode);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if location code is sales floor
 */
export function isSalesFloorCode(locationCode: string): boolean {
  try {
    parseSalesFloorCode(locationCode);
    return true;
  } catch {
    return false;
  }
}

