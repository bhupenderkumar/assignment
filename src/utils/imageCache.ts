// Global image cache utility to prevent constant reloading of images
class ImageCache {
  private cache: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  /**
   * Load and cache an image
   * @param url - The image URL to load
   * @returns Promise that resolves to the loaded image element
   */
  async loadImage(url: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Create new loading promise
    const loadingPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Cache the loaded image
        this.cache.set(url, img);
        this.loadingPromises.delete(url);
        resolve(img);
      };

      img.onerror = () => {
        this.loadingPromises.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Set loading attributes for better performance
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = url;
    });

    // Store the loading promise
    this.loadingPromises.set(url, loadingPromise);
    return loadingPromise;
  }

  /**
   * Get cached image if available
   * @param url - The image URL
   * @returns The cached image element or null
   */
  getCachedImage(url: string): HTMLImageElement | null {
    return this.cache.get(url) || null;
  }

  /**
   * Check if image is cached
   * @param url - The image URL
   * @returns True if image is cached
   */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Check if image is currently loading
   * @param url - The image URL
   * @returns True if image is loading
   */
  isLoading(url: string): boolean {
    return this.loadingPromises.has(url);
  }

  /**
   * Remove image from cache
   * @param url - The image URL to remove
   */
  removeFromCache(url: string): void {
    this.cache.delete(url);
    this.loadingPromises.delete(url);
  }

  /**
   * Clear all cached images
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache size
   * @returns Number of cached images
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Preload multiple images
   * @param urls - Array of image URLs to preload
   * @returns Promise that resolves when all images are loaded
   */
  async preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
    const promises = urls.map(url => this.loadImage(url));
    return Promise.all(promises);
  }
}

// Create and export a singleton instance
export const imageCache = new ImageCache();

// Export the class for testing or creating additional instances
export { ImageCache };

// Hook for React components to use the image cache
export const useImageCache = () => {
  return imageCache;
};
