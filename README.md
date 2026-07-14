# UniCompany

UniCompany is a Next.js 16 application that connects individual talents with companies. It uses Firebase Authentication, Firestore, and Firebase Storage on the frontend with Vercel deployment.

## Stack

- Next.js 16 App Router
- React 19
- Firebase Auth
- Firestore
- Firebase Storage
- Zustand
- Tailwind CSS

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the Firebase public keys:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

3. Start the dev server:

```bash
npm run dev
```

4. Validate the app before deployment:

```bash
npm run lint
npm run build
```

## Important Firebase Collections

- `users`
- `jobs`
- `applications`
- `cvRequests`
- `conversations`
- `messages`
- `notifications`

## Deployment Notes

- Production uses Vercel.
- All `NEXT_PUBLIC_FIREBASE_*` variables must be set in Vercel exactly as raw values without extra newlines.
- Firestore security rules must stay aligned with the collections listed above.

## Current Routes

- `/`
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/companies`
- `/companies/[id]`
- `/jobs`
- `/talents`
- `/search`
- `/profile`
- `/chat`
- `/admin`

## Seeding

There is a seed page for development/demo data at `/admin/seed`.
