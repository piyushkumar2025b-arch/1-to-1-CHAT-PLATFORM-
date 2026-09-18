/**
 * Recursively cleans an object to remove undefined values,
 * ensuring Firestore addDoc / updateDoc / setDoc never throws
 * "Unsupported field value: undefined".
 * Hardened against circular references and stack overflow / recursion attacks.
 */
export function sanitizeForFirestore<T>(
  data: T,
  maxDepth = 25,
  seen = new WeakSet<object>()
): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (maxDepth <= 0) {
    return null as any;
  }

  // Preserve Firestore FieldValue instances (e.g. serverTimestamp, deleteField, arrayUnion)
  if (
    typeof data === 'object' &&
    (('_methodName' in (data as any)) || (data as any)?.constructor?.name === 'FieldValue')
  ) {
    return data;
  }
  if (data instanceof Date) {
    return data;
  }

  // Circular reference defense
  if (typeof data === 'object') {
    if (seen.has(data as object)) {
      return null as any;
    }
    seen.add(data as object);
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item, maxDepth - 1, seen)) as any;
  }

  if (typeof data === 'object') {
    const res: Record<string, any> = Object.create(null);
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      if (value !== undefined) {
        res[key] = sanitizeForFirestore(value, maxDepth - 1, seen);
      }
    }
    // Return standard object without prototype contamination
    return Object.assign({}, res) as any;
  }

  return data;
}
