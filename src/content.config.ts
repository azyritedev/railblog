import { defineCollection, reference, z } from "astro:content";
import { glob, file } from "astro/loaders";

/**
 * Defining collections
 */

const authors = defineCollection({
    loader: file("./src/data/authors.json"),
    schema: z.object({
        displayName: z.string(),
        email: z.string().optional()
    })
})

// Longer form, primarily text based pages
const posts = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/posts" }),

    schema: z.object({
        title: z.string(),
        blurb: z.string(),
        author: reference('authors'),
        published: z.coerce.date()
    })
})

export const collections = { authors, posts }