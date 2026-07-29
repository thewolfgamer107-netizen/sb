# Skyblock Daily Tracker

A free, static Hypixel Skyblock daily checklist for GitHub Pages.

## Publish on GitHub Pages

1. On GitHub, click **New repository**.
2. Name it `skyblock-daily-tracker`.
3. Set it to **Public** if you use GitHub Free, then create it.
4. Click **uploading an existing file**.
5. Upload every file from this folder: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, and `README.md`.
6. Commit the files to the `main` branch.
7. Open the repository's **Settings** tab.
8. In the left sidebar, open **Pages**.
9. Under **Build and deployment**, set Source to **Deploy from a branch**.
10. Choose branch **main**, folder **/(root)**, and click **Save**.
11. After GitHub finishes publishing, the site will normally be at:
   `https://YOUR-USERNAME.github.io/skyblock-daily-tracker/`

## Important data behavior

- Checkboxes and history are stored in the browser using localStorage.
- A new calendar day automatically gets a fresh checklist; previous dates remain in History.
- Data does not automatically sync between devices or browsers.
- Use **History > Export backup** regularly.
- Importing a backup replaces the data currently stored in that browser.
- The repository contains the website code, not your personal checkbox history.

## Updating later

Keep stable task IDs when changing code so old history remains connected. The built-in task manager preserves IDs when renaming or editing a task. Archived tasks remain available to old history.
