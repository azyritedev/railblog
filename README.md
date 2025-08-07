# azyrite's rail blog
> The (messy) source code and full resolution images for azyrite's rail blog.
Images are currently just stored in the `src/content/photos` directory although once this becomes too big they might be moved to proper object storage.

> It's live! **[railblog.astrial.org](https://railblog.astrial.org)**

## Demo
Please check out the gallery at **[railblog.astrial.org](https://railblog.astrial.org)**!

## Deployment Instructions
You will need the specified pnpm version (check `package.json`). Install all dependencies. Make sure to edit the configuration `astro.config.mjs` before running `pnpm build`.

The server and client will be in the `dist` folder ready for deployment to your
hosting provider of choice. The `dist/client` folder can be deployed to any CDN
to speed up your but will also be served by the Node.js server in `dist/server`. 

## Photo Storage
Currently, photos are just stored in `src/content/photos` alongside their YAML
"sidecar" files (which have the same name as the photos except with a `.yaml`)
extension instead of `.jpg`. These sidecar files contain metadata about the photo
including the author, description, title, etc.

~~The extension **must be exactly** `.jpg` for photos (case sensitive) and `.yaml`
for sidecar files due to the way these files are handled (admittedly in a hacky 
way). This should be alleviated in the future although that might not come before
photos are moved onto a proper object storage solution such as B2 or S3.~~

Update: The above restriction has been **lifted**, as a result of refactoring how
photos are imported and handled.

Photos currently are not updated at runtime, and are "built" into the final `dist/`
bundle at compile/build time.