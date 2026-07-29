# SkyBlock Task Menu

A free static website for GitHub Pages. Data stays in the browser and can be exported as a JSON backup.

## Update an existing GitHub Pages site

1. Open the live site and use **History → Export backup**.
2. Unzip this package.
3. In the existing GitHub repository, choose **Add file → Upload files**.
4. Upload `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, and this README.
5. Commit the changes. GitHub Pages will redeploy automatically.
6. Reload the live site. Existing version-1/version-2 browser data is migrated automatically.

## Features

- Separate Today and Goals folder tabs
- Square Hypixel-style panels and corner accents
- Editable rarity names and hex colors
- Rarity outlines on groups and tasks
- Every task can gain checklist parts using its `+` button
- Parent completion requires every checklist part
- Daily history and reset behavior
- Long-term Goals with compact completion dates
- Active and completed copies of partially completed goal groups
- Completed goal groups use their own rarity
- Goal folder tabs automatically adopt the highest completed-task rarity
- Overall and per-folder progress bars
- Import/export backups
