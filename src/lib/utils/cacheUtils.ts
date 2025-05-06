// src/lib/utils/cacheUtils.ts

// Cache expiration time (5 minutes)
export const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Get an item from the cache
 * @param key The cache key
 * @returns The cached item or null if not found or expired
 */
export function getCachedItem<T>(key: string): T | null {
  try {
    const cachedItemJson = sessionStorage.getItem(key);
    const cachedTimestampJson = sessionStorage.getItem(`${key}_timestamp`);

    if (!cachedItemJson || !cachedTimestampJson) {
      return null;
    }

    const cachedTimestamp = JSON.parse(cachedTimestampJson);
    const now = Date.now();

    // Check if cache is still valid
    if (now - cachedTimestamp < CACHE_EXPIRATION) {
      const cachedItem = JSON.parse(cachedItemJson);

      // If this is a simplified assignment, log a message
      if (key.includes('cached_assignment_') &&
          cachedItem &&
          (!cachedItem.createdAt || !cachedItem.updatedAt)) {
        console.log('Using simplified cached assignment data');
      }

      return cachedItem;
    }

    // Cache expired, remove it
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_timestamp`);
    return null;
  } catch (e) {
    console.error('Error getting cached item:', e);
    // Clean up potentially corrupted cache entries
    try {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(`${key}_timestamp`);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Set an item in the cache
 * @param key The cache key
 * @param item The item to cache
 * @returns boolean indicating success
 */
export function setCachedItem<T>(key: string, item: T): boolean {
  try {
    // For assignments, we'll store a simplified version to avoid quota issues
    if (key.includes('cached_assignment_')) {
      // Create a simplified version of the assignment with minimal data
      const simplifiedItem = simplifyAssignmentForCache(item);
      sessionStorage.setItem(key, JSON.stringify(simplifiedItem));
    } else {
      // For other items, store normally
      sessionStorage.setItem(key, JSON.stringify(item));
    }

    sessionStorage.setItem(`${key}_timestamp`, JSON.stringify(Date.now()));
    return true;
  } catch (e) {
    console.error('Error setting cached item:', e);

    // If we hit a quota error with an assignment, try to store an even more minimal version
    if (e instanceof DOMException && e.name === 'QuotaExceededError' && key.includes('cached_assignment_')) {
      try {
        // Create an ultra-minimal version with just the essential data
        const minimalItem = {
          id: (item as any).id,
          title: (item as any).title,
          description: (item as any).description,
          type: (item as any).type,
          status: (item as any).status,
          // Store only question IDs and types, not full question data
          questions: Array.isArray((item as any).questions)
            ? (item as any).questions.map((q: any) => ({
                id: q.id,
                questionType: q.questionType,
                questionText: q.questionText
              }))
            : []
        };

        sessionStorage.setItem(key, JSON.stringify(minimalItem));
        sessionStorage.setItem(`${key}_timestamp`, JSON.stringify(Date.now()));
        console.log('Stored minimal version of assignment in cache due to quota limits');
        return true;
      } catch (minimalError) {
        console.error('Failed to store even minimal version of assignment:', minimalError);
        return false;
      }
    }

    return false;
  }
}

/**
 * Helper function to simplify an assignment object for caching
 * Removes unnecessary data to reduce storage size
 */
function simplifyAssignmentForCache<T>(item: T): any {
  if (!item || typeof item !== 'object') return item;

  const assignment = item as any;

  // Check if it's an assignment object
  if (!assignment.id || !assignment.questions) return item;

  // Create a simplified version with essential data
  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    type: assignment.type,
    status: assignment.status,
    organizationId: assignment.organizationId,
    // Simplify questions to reduce size
    questions: Array.isArray(assignment.questions)
      ? assignment.questions.map((q: any) => ({
          id: q.id,
          assignmentId: q.assignmentId,
          questionType: q.questionType,
          questionText: q.questionText,
          questionData: q.questionData,
          audioInstructions: q.audioInstructions
        }))
      : []
  };
}

/**
 * Remove an item from the cache
 * @param key The cache key
 */
export function removeCachedItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_timestamp`);
  } catch (e) {
    console.error('Error removing cached item:', e);
  }
}

/**
 * Clear all cached items
 */
export function clearCache(): void {
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error('Error clearing cache:', e);
  }
}
