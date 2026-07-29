# SkyBlock Task Menu

A static, offline-capable task and goals tracker designed for GitHub Pages.

## Features

- Hypixel-style square panels and rarity-colored folder tabs
- Separate Today and Goals layouts
- Weighted task progress, including weights for checklist parts
- Daily skill heat map with 1-week, 1-month, and 1-year ranges
- Automatic rarity colors based on weighted completion percentage
- Goal completion dates and completed-group copies
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
