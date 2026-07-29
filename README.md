# SkyBlock Daily Tracker

Static GitHub Pages app. Upload the files in this folder to the root of the existing repository.

## New in this build

- Goal API conditions with a searchable live Hypixel item catalog.
- Museum-donation, detected-item-count, and advanced profile-field rules.
- Automatic profile polling (manual, 5, 10, or 30 minutes) and cached data.
- Current Hypixel item resources refresh daily and use the endpoint `lastUpdated` value.
- New Recipes page with recursive crafting chains and raw-equivalent progress.
- Higher-tier holdings are consumed before lower-tier ingredients are expanded.
- Automatic sack/plain-count detection plus manual holding overrides.
- Optional “Try API recipe” import when Hypixel exposes recipe metadata; manual recipes remain available when it does not.

## Important API limits

The profile and museum endpoints require your own Hypixel development key. The key is saved only in browser local storage. The app does not place it in the repository files. Automatic polling defaults to every 5 minutes, which is far below a 300 requests per 5 minutes allowance for one personal profile.

Some inventories are returned as compressed NBT rather than simple JSON counters. This build automatically reads plain counters such as exposed sack counts. Use a manual holding override for quantities not exposed as plain counters.

## Updating

1. Export a tracker backup from History.
2. Upload all files from this folder to the existing GitHub repository.
3. Commit the replacements.
4. Wait for GitHub Pages to deploy, then hard-refresh once if the service worker still shows an older build.
