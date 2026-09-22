# Backend Setup — Supabase

The site is a static front end, so everything dynamic runs on Supabase. This is how the back end is put together and how to recreate it.

## 1. Project configuration

The front end only needs two public values, set at the top of `main.js`:

```js
const SUPABASE_URL      = "https://<project-ref>.supabase.co";
const SUPABASE_ANON_KEY = "<publishable key>";
const PHOTO_BASE_URL    = `${SUPABASE_URL}/storage/v1/object/public/event-photos/`;
```

The publishable (anon) key is designed to be visible in browser code. It is safe here **because access is controlled on the server side**: Row Level Security decides what can be read, and anything that writes goes through an Edge Function. The service-role key is never used in the front end.

## 2. Database — `gallery_items` table

One table drives both the "Upcoming Events" and "Past Highlights" sections, so new content is added from the Supabase dashboard without touching any code.

| Column | Purpose |
|---|---|
| `section` | `event` (upcoming) or `activity` (past highlight) |
| `title` | Card title |
| `description` | Write-up: shown on event cards, and inside the popup for activities |
| `event_date`, `event_time` | Date and time; each line is skipped when the column is empty |
| `location`, `speaker` | Optional detail lines |
| `image_path` | Cover photo file name in the storage bucket |
| `photo_paths` | Optional extra photos for the popup gallery |
| `sort_order` | Lower numbers appear first |
| `published` | Untick to hide a card without deleting it |

The front end reads it with a single REST call, filtering and sorting in the query rather than in the browser:

```
gallery_items?select=*&published=eq.true
  &order=sort_order.asc,event_date.desc,created_at.desc
```

Events whose date has already passed drop out of "Upcoming" automatically, using the visitor's own timezone.

## 3. Storage — `event-photos` bucket

A public bucket holding event photos. The table stores only file names; the front end builds the full URL from `PHOTO_BASE_URL`.

**Adding a new event takes three steps, with no code changes:** upload the photo → insert a row in `gallery_items` → refresh the page.

## 4. Edge Functions — form handling

Both forms POST to Supabase Edge Functions instead of writing to the database directly, so the browser is never trusted with insert permissions:

| Function | Used by | What it does |
|---|---|---|
| `submit-join` | Membership form | Validates the input, saves the application, and emails a notification |
| `submit-contact` | Contact form | Validates the message, saves it, and emails a notification |

The email step uses `RESEND_API_KEY` and `NOTIFY_EMAIL`, stored as **function secrets in Supabase** — never in the front-end code.

## 5. Security notes

- **No secret keys in the front end.** Only the publishable key ships to the browser.
- **Writes go through Edge Functions**, which validate input server-side, so the client can't insert arbitrary rows.
- **Honeypot field** on the join form: a hidden input that real users leave empty, so simple bots are filtered out.
- **Read-only public data.** The only thing the browser can read is published gallery rows.
- **Graceful failure.** If Supabase is unreachable, the page keeps its placeholder cards instead of breaking or showing a blank section.
