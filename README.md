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


## Profile API viewer

Open Settings > Profile setup and enter a Minecraft username and a Hypixel developer API key. The key is kept in this browser's local storage and is not included in the project files. Press Refresh on the Profile page to cache the latest profile response. Trophy Fish, Trophy Frogs, Mutations, and Shards are displayed by matching the fields currently exposed by the API; a category may be empty if Hypixel does not expose it for that profile or changes its schema.

## This update

- Restores the rarity color editor and opens it by default.
- Preserves expanded/collapsed layout-management sections while renaming or reordering items.
- Uses real spacer columns between weeks in the month/year heat map.
- Adds an experimental browser-cached Hypixel profile viewer.

## Goals progression system

Goals now use a three-level organization: main tab, subtab, and group. Goal cards can be checklists, tier progressions, counters, percentages, or stars. Progression tiers use `Tier name | rarity`; checklist parts use `Part name | weight | rarity`. Completed checklist parts can automatically promote the card color, while progression arrows move through the configured tiers.
