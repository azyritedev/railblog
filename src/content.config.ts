import { defineCollection, reference, z } from "astro:content";
import { glob, file, type Loader } from "astro/loaders";

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
        description: z.string()
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

                const photo = resolvedPhotos[objKey]
                const toWrite = await ctx.parseData({
                    id,
                    data: {
                        meta: data.default,
                        photo,
                        key: objKey + ".jpg"
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

// The meta sidecar file (YAML) properties
const zPhotoMeta = z.object({
    title: z.string(),
    detail: z.string(), // also alt text
    tags: z.array(reference('tags')),
    approxLocation: z.string().optional(),
    date: z.date(),
    author: reference('authors'),
    edited: z.boolean(),
    notes: z.string().optional()
})

const photos = defineCollection({
    loader: photoLoader(),
    // tied with photoLoader() -- do not edit without modifying function!
    schema: z.object({
        photo: zImageMetadata, // ImageMetadata
        meta: zPhotoMeta,
        key: z.string()
    })
})

export const collections = { authors, posts, tags, photos }