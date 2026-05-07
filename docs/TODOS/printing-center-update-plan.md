# Print Studio Enhancements Plan

Improve the `Print Studio` tool located at `src/app/admin/print-settings/page.tsx` with better precision, alignment tools, and canvas customization.

## User Review Required

> [!IMPORTANT]
> I will be adding new fields to the `PrintConfig` model in `prisma/schema.prisma` to store canvas settings (width, height, background, grid). This will require running a database migration.

## Proposed Changes

### Database Schema

#### [MODIFY] [schema.prisma](file:///c:/Users/oguz_/Desktop/Workshop-App/prisma/schema.prisma)
- Add `canvasSettings` field (Json) to `PrintConfig` model.

### API Routes

#### [MODIFY] [route.ts](file:///c:/Users/oguz_/Desktop/Workshop-App/src/app/api/admin/print-configs/route.ts)
- Update GET and POST to handle the new `canvasSettings` field.

### Frontend (Print Studio)

#### [MODIFY] [page.tsx](file:///c:/Users/oguz_/Desktop/Workshop-App/src/app/admin/print-settings/page.tsx)

**1. Precision Controls in Property Editor:**
- Add numeric inputs for `X` and `Y` coordinates.
- Add numeric input for `FontSize` next to the slider.
- Add numeric inputs for `Width` and `Height` for all elements (not just images).
- Restore the `Color Picker` for all text/data components.

**2. Canvas Customization:**
- Add a new "Canvas Settings" section in the sidebar.
- Allow adjusting Canvas `Width` and `Height` (mm).
- Add `Grid` settings: `gridSize` (mm) and `showGrid` toggle.
- Add `Background` settings: `backgroundColor` and `backgroundImage` URL.

**3. Alignment & Snapping:**
- Implement "Snap Lines" (Alignment Lines) logic.
- When dragging an element, show horizontal/vertical lines when its edges or center align with other elements.
- Optional: Snap to grid if grid is enabled.

**4. Interchangable Cursors:**
- Add a cursor mode toggle (Standard vs. Plus).
- **Standard**: Normal drag-and-drop.
- **Plus**: Crosshair cursor showing exact `(x, y)` coordinates in mm near the cursor.

## Verification Plan

### Manual Verification
- Verify that templates can be saved and reloaded with all new settings (canvas size, background, etc.).
- Verify that coordinate inputs correctly move elements.
- Verify snap lines appear during dragging.
- Verify cursor mode toggle works as expected.
