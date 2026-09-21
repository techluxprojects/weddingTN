# Thilini & Nimash Wedding Invitation

Static HTML5/CSS/JavaScript wedding invitation designed for GitHub Pages.

## What is included

- Full-screen double-door opening animation.
- Wedding-bell sound and a lightweight generated ambient music loop. No audio files are required.
- The supplied wedding card is used as the visual invitation, with the `MR. / MRS. / MR. & MRS. / MISS. / FAMILY.` placeholder removed.
- Hotel/location click opens Google Maps driving directions to Resheen Hotel and Banquets, Kurunegala Road, Kotadeniyawa, Divulapitiya.
- RSVP modal loads invite names from `db.json`.
- Guest responses are stored in browser `localStorage` immediately.
- Optional API hook is included in `script.js` for shared RSVP persistence.
- Bootstrap 5.3.8 is loaded from jsDelivr.

## GitHub Pages deployment

1. Put all files in the repository root (or in the folder you publish from).
2. Commit and push.
3. In GitHub: Settings -> Pages -> Deploy from branch.
4. Select the branch and folder containing `index.html`.

## Personalised links

A personalised invitation link can be generated with the guest ID:

`https://YOUR-USERNAME.github.io/YOUR-REPO/?guest=INV001`

The RSVP dialog will pre-select that guest.

## Important: db.json and GitHub Pages

GitHub Pages is static hosting. A browser cannot safely write back to `db.json` on the repository. The supplied code therefore uses `db.json` as the invitation list and stores each RSVP locally in the guest's browser.

For a real shared RSVP database, deploy a tiny HTTPS endpoint and set this in `script.js`:

```js
const CONFIG = {
  RSVP_API_URL: 'https://YOUR-ENDPOINT.example.com/rsvp',
  LOCATION_QUERY: 'Resheen Hotel and Banquets, Kurunegala Road, Kotadeniyawa, Divulapitiya, Sri Lanka'
};
```

The frontend will POST:

```json
{
  "guestId": "INV001",
  "name": "Guest Name 01",
  "attending": "attending"
}
```

The easiest production setup is a tiny serverless endpoint backed by Google Sheets, Supabase, or another hosted database. Do not put a GitHub personal access token inside browser JavaScript.

## Changing guest names

Edit only the `invites` array in `db.json`. Keep `id` values unique.

Example:

```json
{
  "id": "INV025",
  "name": "Kamal & Nadeesha",
  "attending": null
}
```


## Two separate invitation links

The repository now contains two independent pages:

- `index.html` — Wedding invitation
- `homecoming.html` — Homecoming invitation

They share the same `db.json` guest list and can be sent as two different links:

- `https://YOUR-USERNAME.github.io/YOUR-REPO/`
- `https://YOUR-USERNAME.github.io/YOUR-REPO/homecoming.html`

The homecoming page uses the supplied homecoming card as `assets/homecoming-card.jpg`.
