# ParcelPoint

ParcelPoint uses a React/Vite frontend and a Flask/MySQL API. The frontend is in
`frontend/`; the API is in `backend/`.

## Run locally

1. Make sure MySQL is running on `127.0.0.1:3306` with the `root` account.
2. Set the database password in the shell; do not commit it:

       $env:DB_PASSWORD = "your-password"

3. Install and start the API:

       cd backend
       python -m pip install -r requirements.txt
       python server.py

   The API creates the `parcelpoint` database and its facility tables on startup.
4. In another terminal, start the frontend:

       cd frontend
       npm install
       npm run dev

The Vite development server proxies `/api` requests to `http://127.0.0.1:5000`.
Set `VITE_API_URL` when the API is hosted elsewhere.

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
