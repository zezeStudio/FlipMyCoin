# Spin to Decide - CoinFlip Pro - Blueprint

## Overview
This document outlines the Spin to Decide feature within the CoinFlip Pro project. It provides a dynamic and interactive roulette wheel for decision-making, allowing users to input custom entries, manage ratios, and spin for a random outcome.

## Style, Design, and Features

### Design Principles
- **Interactive & Engaging:** Provides a fun and visual way to make decisions.
- **Customizable:** Users can define their own entries and optionally assign custom ratios.
- **Responsive:** Adapts to various screen sizes for a consistent user experience.

### Core Features
- **Spinner Wheel:** A visually appealing roulette wheel that animates a spin to a winning entry.
- **Entry Management:**
    - Add/remove entries via a textarea or single input field.
    - Shuffle and sort entries.
    - Ratio Free Mode: Allows users to assign custom percentage-based ratios to entries.
    - Spin Logic based on ratios (or equal distribution).
- **Result Display:** Clearly shows the winning entry after a spin.
- **Guide Modal:** Provides instructions on how to use the SpinDecide feature.

### Technology Stack
- **Frontend:** HTML, CSS, JavaScript (Framework-less)
- **Styling:** Tailwind CSS (via CDN), Custom CSS (`style.css`, `SpinDecide.css`)
- **Fonts & Icons:** Google Fonts (Spline Sans), Material Symbols Outlined.

## Current Changes

### New Global State: `wheelItems`
- **Description:** A new global array `let wheelItems = [];` has been added at the very top of `SpinDecide.js`. This variable is intended to serve as a central state management mechanism for the items currently displayed and processed by the roulette wheel, allowing for easier manipulation and access across different functions.
- **Update: Global `wheelItems` Synchronization:** The `wheelItems` global array is now explicitly updated with the latest entries by calling `wheelItems = getEntries();` at the end of the `updateEntriesTextarea()` function. This ensures that `wheelItems` always reflects the current state of the entries being displayed and used by the wheel.

### Bug Fix: Entry Truncation Reset
- **Description:** Previously, when in "Ratio Free Mode" and exceeding the `MAX_ENTRIES` limit, an alert would appear. Upon dismissing this alert, the `entriesTextarea` content would unexpectedly reset (clear) instead of truncating to the allowed number of entries. This was due to an incorrect mapping operation when re-assigning the `entriesTextarea.value`.
- **Fix:** The logic in `SpinDecide.js`'s `entriesTextarea.addEventListener('input', ...)` was corrected. Instead of attempting to remap `truncatedEntries` (which are already raw strings) to preserve ratio information (which was causing `undefined` values), the `entriesTextarea.value` is now directly assigned `truncatedEntries.join('\n')`. This ensures that when entries exceed the limit, only the excess entries are removed, and the remaining valid entries (with their ratios) are correctly preserved and displayed.

### Bug Fix: Missing HTML Element ID (`ratio-free-desc`)
- **Description:** An `Uncaught TypeError: Cannot set properties of null (setting 'textContent')` error occurred in `SpinDecide.js` because the JavaScript code attempted to modify the `textContent` of an HTML element with the ID `ratio-free-desc`, which was missing from `SpinDecide.html`.
- **Fix:** The `id="ratio-free-desc"` attribute was added to the `<p>` tag that serves as the description for "Ratio Free Mode" in `SpinDecide.html`. This ensures the JavaScript code can correctly reference and update the element.

### Major Refactor: Roulette Wheel Canvas Rendering Engine
- **Description:** The entire `generateWheel()` function in `SpinDecide.js` has undergone a significant refactor, replacing previous rendering methods with a new canvas-based radial layout engine. This aims to provide a robust and visually dynamic wheel by drawing slices and text directly on the canvas. The data structure for entries is now internally mapped from `{name, ratio}` to `{text, percent, scale}` for canvas rendering.
- **Changes Implemented:**
    - **Full `generateWheel()` Function Replacement:** The previous implementation has been entirely replaced with a new canvas-based drawing logic for both the wheel slices and text.
    - **Data Adaptation for Canvas:** Original entries (from `getEntries()`, containing `name` and `ratio`) are mapped to an `items` array, where `entry.name` becomes `item.text` and `entry.ratio` becomes `item.percent`. A default `item.scale` of `1` is introduced for font scaling.
    - **Canvas-based Slice Drawing:** Instead of using `conic-gradient`, the wheel slices are now drawn directly onto the canvas using `beginPath`, `moveTo`, `arc`, and `fill` methods.
    - **New HSL Color Scheme for Slices:** The slices are now colored using a dynamic HSL color scheme (`hsl(${i * 360 / items.length},70%,55%)`) that generates distinct colors for each segment based on its index.
    - **Visual Discrepancy with Ratio Free Mode:** *Crucially, the visual representation of the wheel now uses slice sizes directly proportional to `item.percent` (derived from `entry.ratio`). However, if "Ratio Free Mode" is used and the total percentage of entries does not sum to 100, the visual distribution on the wheel will accurately reflect these custom ratios. Previously, equal slices were drawn regardless of ratio. The spinning logic continues to respect the defined ratios for determining the winner.*
    - **Initialization of `currentStartAngle`:** A local `let currentStartAngle = 0;` initializes the angle for drawing slices and text, effectively setting the wheel's starting point to the right (3 o'clock position) for the first segment.
    - **Optimized Font Sizing:** Font size now scales effectively with the wheel's radius and a base size (`radius / 10`), potentially further adjusted by `item.scale`.
    - **Enhanced Conditional Text Rotation for Readability:** The rotation logic directly translates the canvas to the center, rotates by the `mid` angle of the slice, then translates out by `textR`. A conditional `ctx.rotate(Math.PI);` is applied if the text is in the bottom semicircle (`mid > Math.PI / 2 && mid < Math.PI * 1.5`) to ensure text remains upright and readable.
    - **Font Styling Update:** The font is set to `bold {fontSize}px Arial`.
    - **Fill Style:** The fill style for text is `white`.
    - **Updated Empty Wheel Background:** The `spinnerWheel.style.background` is set to `none` to allow the canvas to render the wheel when entries exist. If there are no entries, a default `conic-gradient(#1e293b, #334155)` is applied to the `spinnerWheel`.
    - **Total Percentage Handling:** Added a fallback to equal slices if the total percentage of `items` is zero while entries exist, preventing division by zero errors.

### `renderSingleEntryList()` Function Refactor for Pill-Shaped, Horizontal Entry Display
- **Description:** The `renderSingleEntryList()` function in `SpinDecide.js` has been significantly refactored to change how individual entries are displayed in "Single Entry Mode." Entries are now rendered as compact, pill-shaped elements that flow horizontally and wrap to the next line if they exceed the available width.
- **Changes Implemented:**
    - **Container as Flex-Wrap:** `singleEntryListContainer` now has `flex`, `flex-wrap`, `gap-2`, and `mt-2` classes to enable horizontal flow with spacing and wrapping.
    - **Pill-Shaped Entry Wrapper:** Each individual entry is enclosed in a new `div` (`entryWrapper`) with `flex`, `items-center`, `rounded-full`, `px-2`, `py-0.5` classes, giving it a pill-shaped appearance with more compact padding.
    - **Smaller Entry Text Font:** The `entryWrapper` now applies `text-sm` to make the entry name text smaller.
    - **Smaller Delete Icon and Compact Spacing:** The delete button icon has been reduced to `text-xs` (even smaller) and its padding (`p-0.5`) and margin (`ml-1`) have been adjusted to be more compact and fit within the pill shape.
    - **`whitespace-nowrap` for Entry Text:** The `entryWrapper` includes `whitespace-nowrap` to prevent individual entry names from wrapping within their own pill-shaped container.

### Control Buttons Functionality
- **Volume Button Removal:** The volume button HTML element has been removed from `SpinDecide.html` as per user request.
- **Fullscreen Button Implementation:**
    - The fullscreen button (`id="fullscreen-button"`) in `SpinDecide.html` has been given an ID.
    - JavaScript logic in `SpinDecide.js` now toggles the browser's fullscreen mode for the entire document when this button is clicked.
- **Zoom Button Implementation:**
    - The zoom button (`id="zoom-button"`) in `SpinDecide.html` has been given an ID.
    - JavaScript logic in `SpinDecide.js` now toggles a `zoomed` CSS class on the `spinnerWheel` element when this button is clicked.
    - Corresponding CSS for the `.zoomed` class has been added to `SpinDecide.css` to apply a `transform: scale(1.2)` effect, visually zooming the wheel.

## Artifact Trail
- **`SpinDecide.html`:** Volume button removed. `id="fullscreen-button"` and `id="zoom-button"` added to respective buttons.
- **`SpinDecide.js`:**
    - DOM element declarations for `fullscreenButton` and `zoomButton` added.
    - `toggleFullScreen()` function added to handle fullscreen entry and exit.
    - `toggleZoom()` function added to toggle the `zoomed` class on `spinnerWheel` and re-render the wheel.
    - Event listeners added for `fullscreenButton` and `zoomButton`.
- **`SpinDecide.css`:** Added `.zoomed` CSS class with `transform: scale(1.2)` and `transition` properties.

## Next Steps
- User to verify the functionality of the fullscreen and zoom buttons.
- User to verify the final state of the roulette wheel and overall application.