# SkyBlock Task Menu

A static, offline-capable task and goals tracker designed for GitHub Pages.

## Features

- Hypixel-style square rarity frames with mirrored four-corner ornaments
- Separate Today and Goals layouts
- Weighted task progress, including weights for checklist parts
- Connected 7-day overview on Today, plus 1-week, 1-month, and 1-year History heat maps
- Automatic rarity colors based on weighted completion percentage
- Goal completion dates, completed-group copies, and an option for goals completed before creation
- Editable colors for the page, panels, groups, tasks, inner areas, outlines, and rarities
- Archive and permanent-delete controls
- Browser-local history with JSON backup and restore

## Publish on GitHub Pages

1. Unzip this package.
2. Upload the files inside `skyblock-daily-tracker` to the root of your GitHub repository.
3. Open **Settings → Pages** in the repository.
4. Choose **Deploy from a branch**, then select `main` and `/(root)`.
5. Save and wait for GitHub to publish the site.

## Updating an existing installation

Export a backup from **History** first. Then replace the repository files with this package and commit them. Existing browser data is migrated automatically; old tasks and checklist parts receive a default weight of 1.

## Data safety

Data is stored locally for each browser and website address. Export backups regularly, especially before clearing browser data, changing the GitHub Pages URL, or testing permanent deletion.

## Font

The interface uses the open-source Pixelify Sans web font when an internet connection is available, with a monospace fallback for offline use.
