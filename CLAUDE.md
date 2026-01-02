# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vanilla JavaScript breathing exercise web application. Users configure breath phase durations (inhale, inhale hold, exhale, exhale hold) and watch an animated circle that guides breathing cycles.

## Development

No build tools required. Open `index.html` directly in a browser to run.

## Architecture

- **index.html** - Single page with settings form and circle animation element
- **script.js** - Handles form persistence (localStorage) and breathing cycle timing
- **style.css** - CSS transitions driven by `data-phase` attribute on `<body>`

The breathing cycle works by:
1. Setting `document.body.dataset.phase` to the current phase name
2. CSS selectors like `[data-phase="inhale"] .circle` apply transforms/colors
3. `setTimeout` chains advance through the 4-phase cycle (inhale → inhale_hold → exhale → exhale_hold)
