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
        email: z.string().optional()
    })
})

// Longer form, primarily text based pages
const posts = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),

    schema: z.object({
        title: z.string(),
        blurb: z.string(),
        author: reference('authors'),
        published: z.coerce.date()
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

/**
 * Custom loader for photos with sidecar JSON
 */
function photoLoader(): Loader {
    return {
        name: "photo-loader",
        load: async (ctx) => {
            ctx.logger.info("Loading photos and sidecar metadata");
            ctx.store.clear()

            // must be hardcoded: no dynamic support
            const photos = Object.fromEntries(Object.entries(import.meta.glob<{ default: ImageMetadata }>("/src/content/photos/*.jpg", { eager: true })).map(([key, value]) => /* drop file ext */[key.slice(0, key.lastIndexOf(".")), value]))
            const photoNames = Object.keys(photos)
            // "sidecar" metadata YAML files corresponding to image names. filter by corresponding photo name
            const photoMetas = Object.fromEntries(Object.entries(import.meta.glob<{ default: Record<string, unknown> }>("/src/content/photos/*.yaml", { eager: true })).filter(([key]) => photoNames.includes(key.slice(0, -5))))

            // Resolve photos by calling Promise
            const resolvedPhotos = Object.fromEntries(await Promise.all(Object.entries(photos).map(async ([key, value]) => {
                return [
                    key,
                    value.default
                ] as [string, ImageMetadata]
            })))

            for (const [key, data] of Object.entries(photoMetas)) {
                const objKey = key.slice(0, -5) // key for resolvedPhotos including path
                const id = objKey.split("/").at(-1) ?? "" // slice off .json, and get last part of path

                const realPath = path.join(import.meta.dirname, "content/photos", id + '.jpg')
                const bytes = await fs.readFile(realPath);
                const exif = await exifr.parse(bytes)

                const photo = resolvedPhotos[objKey]
                const toWrite = await ctx.parseData({
                    id,
                    data: {
                        meta: data.default,
                        photo,
                        exif: exif ? {
                            cameraMake: exif.Make,
                            cameraModel: exif.Model,
                            fNumber: exif.FNumber,
                            aperture: exif.ApertureValue,
                            iso: exif.ISO,
                            exposureTime: exif.ExposureTime,
                            lat: exif.latitude,
                            lon: exif.longitude,
                            date: exif.DateTimeOriginal
                        } : {}, // empty object = no exif
                        key: objKey + ".jpg",
                    },
                });

                ctx.store.set({
                    id, data: toWrite,
                })
            }
        }
    }
}

// A loose representation of the ImageMetadata type for Zod
const zImageMetadata = z.object({
    // empty object
}).passthrough().transform(val => val as ImageMetadata) // force to correct type

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
const zPhotoMeta = z.object({
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
    loader: photoLoader(),
    // tied with photoLoader() -- do not edit without modifying function!
    schema: z.object({
        photo: zImageMetadata, // ImageMetadata
        meta: zPhotoMeta,
        exif: zExif,
        key: z.string()
    })
})

export const collections = { authors, posts, tags, photos }