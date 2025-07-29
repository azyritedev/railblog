/**
 * Handle importing photos using import.meta.glob
 */

export function getPhotoSrc(path: string) {
    const allImages = import.meta.glob<{ default: ImageMetadata }>(
        "/src/content/photos/*.{jpg,jpeg}"
    );

    const image = allImages[path];
    if (!image) throw new Error(`Invalid image path ${path}!`) // Error should occur at build time only

    return image()
}