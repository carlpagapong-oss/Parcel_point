# ParcelPoint – Frontend Prototype (SDF01 · OOP)

Frontend only: React 18 + TypeScript + Vite + lucide-react. No backend, database connection, API or auth.
All data is mock data held in local React state (`src/data/mock.ts`, `src/lib/store.tsx`). A standalone MySQL schema is provided at `database/schema.sql`; it is not connected to the frontend.

    npm install
    npm run dev      # http://localhost:5173
    npm run build

## Structure
- `src/types.ts` – domain types (Pkg, Claim, Notice, Slot…)
- `src/data/mock.ts` – consistent sample data (PP-1020…PP-1027, R-001…R-008, Hub A/B storage)
- `src/lib/store.tsx` – reducer + context (packages, claims, notices, routing, role, toasts)
- `src/components/ui.tsx` – reusable UI (Card, Badge, Modal, Tabs, Field, charts, skeleton, toasts)
- `src/components/Shell.tsx` – sidebar, top bar, notification center, profile menu, ⌘K search
- `src/pages/*` – the 11 pages

## Demo tips
- Switch role from the profile menu (locked modules show a lock icon).
- Tracking: try PP-1027, PG-2600001022 (unassigned), PP-1024 (claimed), PP-9999 (error).
- Claims: Package Claims → Process claim → 3-step flow → receipt (updates dashboard, tracking, storage).
- Recipient Portal: sidebar footer or profile menu (Maya Chen, R-001).
