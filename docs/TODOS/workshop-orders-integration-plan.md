# Implementation Plan - Workshop-Specific Order Management

The goal is to decentralize order management by integrating it directly into the workshop detail page, allowing employees to manage orders specifically for the workshop they are currently handling.

## 1. API Evolution
### `src/app/api/admin/orders/route.ts`
- Update the `GET` handler to accept a `workshopId` query parameter.
- Filter `Cart` results by `guest: { workshopId }` if provided.

## 2. Frontend Integration
### `src/app/admin/workshops/[id]/page.tsx`
- **Tab System**: Add "SIPARIŞLER" (Orders) to the `Tab` type and navigation.
- **State Management**:
  - `orders`: Array of carts for the workshop.
  - `orderLoading`: Boolean for loading state.
  - `activeOrderStatusTab`: Filter for the sub-tabs (ORDERED, PREPARING, etc.).
- **Logic**:
  - `fetchOrders()`: Fetch orders filtered by the current `workshopId`.
  - `updateOrderStatus()`: Re-implement the status transition logic.
- **UI Component**:
  - Re-use the card-based layout from `src/app/admin/orders/page.tsx`.
  - Implement the status sub-tabs (New, Preparing, Ready, Paid) within the Orders tab.

## 3. Data Schema
- `Cart` relates to `Guest` via `guestId`.
- `Guest` relates to `Workshop` via `workshopId`.
- Filtering logic: `where: { guest: { workshopId: id } }`.

## 4. UX Optimization
- Implement real-time polling (every 30s) or a manual refresh button within the tab.
- Visual indicators for pending orders on the tab itself.
