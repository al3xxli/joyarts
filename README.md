# JoyArts Studio

The site builds to static HTML, CSS, JavaScript, fonts and images. All visitor-facing assets are hosted with the site.

## Preview locally

With Node.js 20 or newer, run `npm run dev` from the repository root and open the local URL printed in the terminal. Refresh the browser after editing source files or photos to see the rebuilt site. Press Ctrl+C to stop the preview.

## Deploy on Vercel

Import this GitHub repository into Vercel and use the repository root as the project root. The checked-in `vercel.json` sets the build command to `npm run build` and the output directory to `dist`. The build requires no npm dependencies or environment variables. After reviewing the deployment URL, add `joyarts.ca` under the project’s Domains settings and follow Vercel’s DNS instructions.

## Content and photography

- Edit the About, Classes, Workshops and Exhibitions copy in `src/studio.json`.
- Keep supplied photographs in `public/Joyarts Updates/`. Add gallery photographs to the corresponding group in `src/galleries.json`, with their filename, alt text and pixel dimensions. Dated photos appear newest first. Undated photos follow in their listed order. Set an updated photo’s `updatedAt` timestamp to feature it on Classes & Gallery. The spotlight shows the latest dated photo per collection, newest first.
- The original studio branding, slideshow photographs, Life Drawing gallery and licensed fonts are in `media/`.
- The build copies only the referenced photographs from the update folder. The editorial Word brief stays in the source repository.
- Old Carrd bookmarks such as `/#wp` and `/#camps` resolve to the matching new pages. The former Camps gallery bookmark opens Classes & Gallery.
