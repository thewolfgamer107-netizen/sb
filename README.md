# SkyBlock Task Menu — Complete Build

This is a static, desktop-first SkyBlock companion designed for GitHub Pages. It combines all requested features into one clean build.

## Included

- **Today**: skill tabs, groups, weighted tasks, weighted checklist parts, automatic daily rollover, manual reset, rarity-based progress, and a 7-day overview.
- **Goals**: separate main tabs and subtabs, groups, checklist goals, tier progressions, counters, percentages, stars, completion dates, API-linked conditions, and completed goal handling.
- **Profile**: username/API-key settings, selected-profile cache, museum/profile refresh, Trophy Fish/Frogs/Mutations/Shards discovery, API task links, and live item catalog.
- **Recipes**: recursive recipe projects, higher-tier material credit, raw-cost expansion, detected profile holdings, manual holding overrides, and API recipe import when metadata is available.
- **History**: weighted daily details plus week, month, and year heatmaps.
- **Settings**: editable colors and rarities, editable/reorderable tabs, groups, and tasks, collapsible management sections, archive, permanent delete, backup export/import.

## Fresh storage namespace

This complete build uses a new browser-storage key so it starts clean instead of inheriting the partially broken API build. Existing older data will not load automatically. You can still try importing a JSON backup through the app.

## GitHub Pages

1. Unzip this package.
2. Upload the files inside the folder to the root of your GitHub repository.
3. Commit the replacements.
4. In **Settings → Pages**, publish from `main` and `/(root)`.
5. Hard-refresh the live page once after deployment.

## API use

Enter the Minecraft username and Hypixel API key under **Settings → Profile setup**. The key is stored in that browser's local storage and is not included in the repository files. Automatic checks can run every 5, 10, or 30 minutes.

The item catalog is loaded from Hypixel's live SkyBlock resource endpoint. Recipe metadata is not available for every item, so recipes can also be entered manually. Recursive calculations still work for all manually saved recipes.


## Cache repair in v14
Assets use matching versioned URLs and the service worker is network-first. This prevents an older app.js from being combined with a newer index.html or styles.css. Tab and page renders also explicitly restore all frame ornaments.


## v15 fixes
- Background profile refreshes no longer show blocking alerts when an endpoint returns HTML or malformed data.
- API responses are validated before JSON parsing and now produce useful manual-refresh errors.
- Startup searches previous SkyBlock tracker localStorage namespaces and restores the richest valid saved state.
- Local data is rendered repeatedly during boot, independently of the item catalog network request.
