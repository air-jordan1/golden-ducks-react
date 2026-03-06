This is the spring 2026 Software Development project of George, Kenneth, Jordan, and Eunice. https://scripturize-36b25.web.app is the url of the hosted website. A good tool for testing html features is https://htmlcheatsheet.com/

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Build instructions

If you do not have the firebase project set up on your computer, run "firebase init" from your local terminal. Select "Use an existing project", "scripturize-36b25", use "public", not a single-page app and no automatic github deploys. You can delete 404.html and index.html that it generates. 
The next step is to build the website using "npm run build". The browser cannot run .jsk files, so this turns all of our code into an html file, a javascript file, and a css file to be used on the site. With the config in vite.config.js, the built code should go right into the public folder so the last step is to run "firebase deploy".
