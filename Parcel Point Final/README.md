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
- `frontend/src/types.ts` – domain types (Pkg, Claim, Notice, Slot…)
- `frontend/src/data/officialData.ts` – official recipient and facility reference data
- `frontend/src/lib/api.ts` – API client for database-backed records
- `frontend/src/lib/store.tsx` – reducer + context (packages, claims, notices, routing, role, toasts)
- `database/schema.sql` – ParcelPoint schema plus the current official seed records
- `frontend/src/components/ui.tsx` – reusable UI (Card, Badge, Modal, Tabs, Field, charts, skeleton, toasts)
- `frontend/src/components/Shell.tsx` – sidebar, top bar, notification center, profile menu, ⌘K search
- `frontend/src/pages/*` – the application pages

## Operational tips
- Switch role from the profile menu (locked modules show a lock icon).
- Tracking: use a tracking number from the current database records, or enter an unknown number to see the not-found state.
- Claims: Package Claims → Process claim → 3-step flow → receipt (updates dashboard, tracking, storage).
- Recipient Portal: sidebar footer or profile menu (Maya Chen, R-001).
