# Basic Next.js 15 (app router) template

This is a basic Next.js app, using the app router, with my preferred defaults in place for a quick start.

- [Pico](https://picocss.com/docs) for a simple extensible CSS framework
- [SWR](https://swr.vercel.app/docs/getting-started) for fetching and state
- [Jest](https://nextjs.org/docs/app/guides/testing/jest) for testing

VS Code tabs are a pain with Next.js app router (lots of tabs called `page.tsx`) - see [this StackOverflow question](https://stackoverflow.com/questions/39598007/showing-path-in-file-tabs-in-visual-studio-code).

> You can configure Visual Studio Code to always show parent folder names in the tabs! In your User Settings, just add this line: "workbench.editor.labelFormat": "short" (other values are "long", "medium" or "default")

This is the "bare" version of the template, see also the repo called "nextjs-pico-app-examples"

I have included stylistic linting for my preferences.

Project structure:

- main Next app is in `/src/app`
- shared components in `/src/components`
- static public assets (e.g. images) in `/src/public` (e.g. `/src/public/img`)
- shared utility functions / tools in `/src/util`
- shared library (e.g. constants) in `/src/lib`
- scripts in `/src/scripts`
