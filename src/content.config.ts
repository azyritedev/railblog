import { defineCollection, reference, z } from "astro:content";
import { glob, file, type Loader } from "astro/loaders";
import fs from "node:fs/promises";
import path from "node:path"
import exifr from "exifr"

/**
 * Defining collections
 */

const authors = defineCollection({
    loader: file("./src/content/authors.json"),
    schema: z.object({
        displayName: z.string(),
        email: z.string().optional(),
        featuredPhotos: reference('photos').array().default([])
    })
})

// Longer form, primarily text based pages
const posts = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),

    schema: z.object({
        title: z.string(),
        blurb: z.string(),
        photo: reference('photos').optional(),
        author: reference('authors'),
        published: z.coerce.date(),
        draft: z.boolean().default(false)
    })
})

/**
 * Photographic collections
 */

// Tags for grouping photos
const tags = defineCollection({
    loader: file("./src/content/tags.json"),

    schema: z.object({
        // the `color` prefixed css variable for this tag's color
        // e.g. --color-train-t1 would be "train-t1" here.
        themeColor: z.string().optional(),
        description: z.string(),
        // optional groupings
        group: z.string().default("Miscellaneous")
    })
})

function photo2Loader(): Loader {
    return {
        name: "photo2-loader",
        load: async (ctx) => {
            ctx.logger.info("Loading photos and sidecar metadata")
            ctx.store.clear()

            const photoPaths = Object.keys(import.meta.glob("/src/content/photos/*.{jpg,jpeg}", { eager: true })).map((filepath) => path.parse(filepath));
            // Map photo to sidecar file
            const photoMap = await Promise.all(Object.entries(import.meta.glob<{ default: Record<string, unknown> }>("/src/content/photos/*.{yml,yaml}", { eager: true }))
                .map(async ([filepath, imported]) => {
                    const parsed = path.parse(filepath)
                    // If no matching photo found, skip
                    const matchingPhoto = photoPaths.find((photoPath) => photoPath.name === parsed.name)
                    if (!matchingPhoto) return false

                    // -- PATHS: fsPath for fs, importPath to match against import.meta.glob() 
                    // HACK: Slice off leading slash for file paths
                    const fsPath = path.join(matchingPhoto.dir.slice(1), matchingPhoto.base)
                    const importPath = path.join(matchingPhoto.dir, matchingPhoto.base)
                    const sidecar = zPhotoSidecar.parse(imported.default)

                    // Extract and parse EXIF
                    const exifRaw = await exifr.parse(await fs.readFile(fsPath))
                    const exif = zExif.parse(exifRaw ? {
                        cameraMake: exifRaw.Make,
                        cameraModel: exifRaw.Model,
                        fNumber: exifRaw.FNumber || 0,
                        aperture: exifRaw.ApertureValue || 0,
                        iso: exifRaw.ISO || 0,
                        exposureTime: exifRaw.ExposureTime || 0,
                        lat: exifRaw.latitude,
                        lon: exifRaw.longitude,
                        date: exifRaw.DateTimeOriginal
                    } : {})

                    return {
                        id: matchingPhoto.name,
                        path: importPath,
                        sidecar,
                        exif: exif
                    }
                }))
                .then(
                    // filter falsy
                    (ret) => ret.filter((v) => !!v) // doublebang required for TS
                )


            // Add to store
            for (const photo of photoMap) {
                ctx.store.set({
                    id: photo.id,
                    data: photo,
                });
            }
        }
    }
}

// Some EXIF image data (partial obj)
const zExif = z.object({
    cameraMake: z.string(),
    cameraModel: z.string(),
    fNumber: z.number(),
    aperture: z.number(),
    iso: z.number(),
    exposureTime: z.number(),
    lat: z.number(),
    lon: z.number(),
    date: z.date()
}).partial()

// The meta sidecar file (YAML) properties
const zPhotoSidecar = z.object({
    title: z.string(),
    detail: z.string(), // also alt text
    tags: z.array(reference('tags')),
    approxLocation: z.string().optional(),
    date: z.date().optional(), // now optional, may check exif
    author: reference('authors'),
    edited: z.boolean(),
    notes: z.string().optional(),
    // Automatic backlinks generated
    related: z.array(reference('photos')).optional()
})

const photos = defineCollection({
    loader: photo2Loader(),
    // tied with photoLoader() -- do not edit without modifying function!
    schema: z.object({
        path: z.string(), // Path to photo
        sidecar: zPhotoSidecar,
        exif: zExif,
    })
})

export const collections = { authors, posts, tags, photos }
