# Trip Packing List App

## Overview
A trip packing checklist generator built with React + TypeScript + Vite. Users answer questions about a trip and the app generates a personalised gear list. Hosted on GitHub Pages.

## Stack
- React 19 + TypeScript + Vite
- react-router-dom (HashRouter for GitHub Pages)
- Plain CSS (no framework)
- GitHub Actions auto-deploy on push to main

## Project Structure
```
src/
  assets/gear-data.json        -- All gear items and their conditions (source of truth)
  logic/
    types.ts                   -- GearItem, TripAnswers interfaces, CONDITION_FIELDS, CATEGORY_ORDER, DEFAULT_CATEGORY_FIELDS
    matching.ts                -- matchGear() algorithm, extractOptions() helper
  context/TripContext.tsx       -- Shared trip answers state
  context/GearContext.tsx       -- Gear items + category field mappings, persisted to localStorage
  components/
    App.tsx                    -- HashRouter + routes (/, /list, /editor)
    Layout.tsx                 -- Nav bar + Outlet, wide layout for /list and /editor
    questionnaire/
      questions.ts             -- Question definitions, skip logic, option merging
      Questionnaire.tsx        -- Step-by-step flow, manages draft answers
      QuestionStep.tsx         -- Single/multi select button UI
    packing-list/
      PackingList.tsx           -- Runs matching, groups by category, 4-col card grid
      CategoryGroup.tsx         -- Category card with items
      PackingItem.tsx           -- Checkbox item
    gear-editor/
      GearEditor.tsx            -- Category cards in 4-col grid, modal edit form, JSON export
      GearItemRow.tsx           -- Item row with delete button
      GearItemForm.tsx          -- Edit form with condition checkboxes + "add new value" inputs
      CategoryForm.tsx          -- Modal form for creating/editing category field mappings
  styles/global.css             -- All styles in one file
```

## Data Model
Each gear item has: id, name, category, always (bool), and 7 condition arrays:
- activities (multi-select): climbing, caving, sailing, hiking...
- weather (multi-select): rain, cold, hot, snow
- duration: single_day, multi_day
- shelter: tent, van, hut, hotel, bothy
- sleepProvision: full_bedding, mattress_only, none
- location: home, abroad
- cooking: self_catered, provided, none

Options are derived from gear data (Option B) - adding a new value to any item makes it available everywhere. Duration and location have base options hardcoded via mergeOpts().

## Matching Logic
- `always === true` -> always include
- For each condition field with non-empty values on item: trip must match at least one (AND between fields)
- Empty array = "don't care"
- Null trip answer (skipped question) + non-empty item field = no match

## Questionnaire Skip Logic
- `single_day` skips: location, shelter, sleepProvision, cooking
- `shelter === 'hotel'` auto-sets sleepProvision to 'full_bedding'

## Category Field Mappings
- Each category has a configurable set of condition fields (which questions apply to its items)
- Stored in localStorage (`custom-category-fields`) alongside gear data
- DEFAULT_CATEGORY_FIELDS in types.ts provides defaults for built-in categories
- Categories not in the mapping show all condition fields as fallback
- Users can set fields when creating a category and edit them later via the gear icon button

## Gear Editor Workflow
Edit items visually -> Export JSON -> Replace src/assets/gear-data.json in repo -> Push to main -> Auto-deploys

## Vite Config
- base: '/' (custom domain mygearlist.co.uk, no path prefix needed)

## Key Conventions
- Type-only imports required (verbatimModuleSyntax): `import type { Foo }` for types
- GearItem and TripAnswers have index signatures for dynamic field access
- Categories sorted by CATEGORY_ORDER constant
- Both packing list and gear editor use 4-column responsive card grid layout
