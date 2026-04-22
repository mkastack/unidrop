/**
 * Helper to optimize Unsplash and remote images for faster loading.
 */
export function optimizeImage(url: string | undefined, width = 400, quality = 80): string {
  if (!url) return "";
  
  // If it's an Unsplash URL, append optimization parameters
  if (url.includes("images.unsplash.com")) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }
  
  return url;
}
