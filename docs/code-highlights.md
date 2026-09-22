# Code Highlights

A few parts of `main.js` worth pointing at.

Loading published cards, filtered and sorted by the database rather than in the browser:

```js
const query = 'gallery_items?select=*&published=eq.true' +
              '&order=sort_order.asc,event_date.desc,created_at.desc';

fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
})
```

Validating the membership form before anything is sent, and only showing success once the save is confirmed:

```js
if (!firstName || !lastName || !email || !studentId || !dept) {
  alert('Please fill in all fields — including your Student ID — to continue.');
  return;
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  alert('Please enter a valid email address.');
  return;
}
```

Today's date in the visitor's own timezone, so an event doesn't disappear early for anyone:

```js
function todayISO() {
  const d = new Date();
  return [d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0')].join('-');
}
```

