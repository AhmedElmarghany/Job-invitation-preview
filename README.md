# Resource Portal — redesign preview

A standalone HTML/CSS/JS preview of the redesigned resource portal. **Nothing here is wired to
the Django project.** Every job, name, file and figure is invented, and every action (accept,
decline, bid, sign out, download) only changes what is on screen.

The folder is self-contained: fonts, logo, avatar and the design tokens are copied in, all paths
are relative, and there is no build step. It can be opened from disk or published to GitHub Pages
as-is.

---

## Running it

Double-click `index.html` (it redirects to `invitations.html`), or serve the folder:

```bash
python -m http.server 8777
```

### Publishing to GitHub Pages

Push the folder and point Pages at it. `index.html` redirects to the Invitations page, so the
folder URL is the only link stakeholders need.

One thing to fix before publishing: **this folder's name contains spaces**, so its URL becomes
`.../resource%20portal%20preview/`. Renaming it to `resource-portal-preview` gives a clean link.
Nothing inside the folder refers to the folder name, so renaming is safe.

---

## What is built

| Page | State |
| --- | --- |
| `invitations.html` | **Built.** Job Invitations — the full page. |
| `jobs.html` | **Built.** My Jobs — Active / Waiting / Completed in one page. |
| `dashboard.html` | Placeholder |
| `earnings.html` | Placeholder |
| `professional-profile.html` | Placeholder |
| `account.html` | Placeholder |

The sidebar, topbar, availability control, profile menu and logout modal are **final** and shared
by all six pages, so a new page only needs its own content.

---

## File structure

```
resource portal preview/
├── index.html                  redirect → invitations.html
├── invitations.html            built page
├── jobs.html                   built page
├── dashboard.html …            placeholders, one per sidebar entry
└── assets/
    ├── css/
    │   ├── variables.css       design tokens — copied from config/static/css/variables.css
    │   ├── base.css            app shell, icons, toasts, segmented filter, placeholders
    │   ├── sidebar.css         rp-sidebar
    │   ├── topbar.css          rp-topbar, availability pill, profile menu
    │   ├── availability.css    the availability dropdown (ws-dropdown)
    │   ├── toolbar.css         copied from config/static/css/cu_table_toolbar.css
    │   ├── table.css           copied from config/static/tables/table.css
    │   ├── status.css          copied from config/static/css/status.css
    │   ├── pagination.css      copied from config/static/css/pagination-bar.css
    │   ├── columns-modal.css   copied from config/static/css/customize_columns_modal.css
    │   ├── logout-modal.css    copied from config/static/css/logoutModal.css
    │   ├── navigation-tabs.css copied from config/static/css/navigation-tabs.css
    │   ├── invitations.css     page-specific: rows, expanded panel, offer card
    │   └── jobs.css            page-specific: table chrome, waiting/slip cells
    ├── js/
    │   ├── icons.js            inline Lucide set — RP.icon('name')
    │   ├── data.js             the dummy records and the signed-in resource
    │   ├── layout.js           renders sidebar + topbar + modals into #rp-layout
    │   ├── availability.js     the availability pill + dropdown (dummy logic)
    │   ├── columns-modal.js    reusable "Customize Columns" modal
    │   ├── navigation-tabs.js  copied from config/static/js/navigation-tabs.js
    │   ├── invitations.js      table render, search, sort, expand, paginate
    │   └── jobs.js             tabs, per-tab columns, search, sort, paginate
    ├── fonts/                  IBM Plex Sans + Serif (woff2)
    └── img/                    logo.png, placeholder-headshot.png
```

### Copied vs. written

The CSS and JS files marked *copied* are byte-for-byte from the project, except that
`cu_sidebar-is-collapsed` was renamed to `rp-sidebar-collapsed` and the per-page
`max-height` rules in `table.css` were replaced with one for this table. If those files change
in the project, re-copy them. `navigation-tabs.css` also leaves behind `.page-content`, the
global scrollbar reset and `scroll-behavior`, none of which belong to the tab strip;
`navigation-tabs.js` finds its strip by class instead of by id, so a page can hold more than
one, and re-measures when the buttons are written in by the page's script.

`jobs.css` repeats, rather than shares, the row striping, sort icon, empty state and toolbar
rules that `invitations.css` also carries. That is deliberate: the Invitations design is signed
off and its file is not to be reopened. When both pages are ported to Django these rules belong
in one stylesheet, not two.

`variables.css` is a copy too — it is the one file to re-sync if the tokens move.

---

## My Jobs

One page, three tabs, and the page never reloads: `jobs.html` replaces the `trJobAssignments` /
`trJobWaiting` / `trJobCompleted` tabs the resource dashboard reaches through `?tab=`.

The strip is the customer Orders nav — `navigation-tabs.css`, unchanged, so the underline, the
hover and the badge are the ones already shipping. It is navy throughout: the plain
`navigation-tabs.css` already paints the badge navy, it is only the `.scoped` twin that paints it
gold. Each tab carries an icon and a live count:

| Tab | Icon | Is | Comes from |
| --- | --- | --- | --- |
| Active jobs | `circle-play` (Lucide) | Running now | `job_ready = RE`, job status `AS` / `PR` |
| Waiting jobs | `hourglass` (Lucide) | Assigned, files not released | `job_ready = NR` |
| Completed jobs | `circle-check` (Lucide) | Delivered and on its way to a bill | status `CL` `AP` `DL` `ST` `BL` |

**Columns change with the tab**, as `my_jobs.html` does on `trJobCompleted`: Active and Waiting
share one set, Completed adds **Bill ID**, **Status**, **Delivered At** and **Job Slip**. Each tab
also keeps its own Customize Columns choice (`rp_jobs_columns_<tab>`), so hiding Bill ID on
Completed does not touch the other two. The modal is rebuilt on every tab change, which is what
`ColumnsModal.destroy()` was added for.

Three cells are borrowed rather than designed:

- **Progress** is `customer_orders.html`'s widget verbatim — `.progress-widget`, percentage above,
  bar below — already styled in the copied `table.css`. On Waiting it is replaced by a muted
  "Not ready": there is nothing to be a percentage of yet.
- **Deadline** wears the Due Date colours from the orders table (`.col-due-date` /
  `.col-due-date-time`), so it is red on every row, not only the late ones.
- **Job Slip** and **Actions** use `table.css`'s own `.btn-view` / `.actions-wrap` / `.tooltip-wrap`.

Rows do not expand. The job is already accepted, so there is no offer to read and no decision to
make — the Job ID and the eye button both go to the job page. In the preview they raise a toast
saying so.

---

## Adding the next page

1. Copy a placeholder page (e.g. `earnings.html`) and set `data-page` / `data-title` on `#rp-layout`.
   `data-page` must match the `key` in `NAV` inside `assets/js/layout.js` for the active state to
   light up.
2. Add its stylesheet under `assets/css/` and its script under `assets/js/`.
3. Put its dummy records in `assets/js/data.js` next to `RP.INVITATIONS`.

The sidebar and topbar need no edits — they are generated from `NAV` and `RP.USER`.

---

## Porting it back to Django

- `layout.js` writes plain HTML with the same BEM class names used here. Split it into
  `_rp_sidebar.html` / `_rp_topbar.html` includes and drop the JS renderer.
- The logout modal is a copy of `templates/partials/logout_modal.html` with the close icon
  inlined; use `{% include %}` plus `logoutModal.css` and `logout_modal.js` instead.
- The columns modal keeps the class names of
  `accounting/customer/modals/orders_customize_columns_modal.html`, including `.form-check.col-box`
  and `.column-toggle`, so the existing `customize_columns_modal.js` works unchanged.
- The table keeps `id="new-customized-table"`, `.sticky-col`, `.col-*`, `.col-filler` and the
  `.resizer` handles, so `tables/table-columns-ordering.js` should attach with no changes.
- Row statuses are the three the real table can show, in `RP.STATUS` (`assets/js/data.js`):

  | Status | Comes from | Pill (`status.css`) |
  | --- | --- | --- |
  | New invite | `show_job_status_using_bid_or_invite`, job status `RQ` | `.status-new` — teal |
  | New Bid | `bid_status_badge`, not quoted yet | `.status-processing` — amber |
  | Bid Sent | `bid_status_badge`, `is_quoted` | `.status-edited` — purple |

  Teal, amber and purple sit ~100°+ apart on the hue wheel, so the three tell apart without
  reading them. There is no accepted, declined or expired state: the real list drops the row once
  the invitation is deactivated, and the preview does the same.
- The availability dropdown is `templates/partials/_work_status_modal.html` grown into a small
  scheduler. It keeps `#ChangeWorkStatusPost`, `#submit_change_status`, the three statuses
  (`Translator.WORK_STATUS_OPTIONS`) with their descriptions, and the `ws-option*` / `ws-field*` /
  `ws-btn*` classes, so `submitWorkStatus()` still binds and `$(form).serialize()` posts every
  field. Add back the CSRF token and the two hidden inputs. The new fields are named after the
  models that already exist:

  | Field | Control | Goes to |
  | --- | --- | --- |
  | `work_status` | Status tiles | `Translator.work_status` |
  | `work_status_from` / `work_status_to` | Period (Today · Tomorrow · This week · Next week, or dates) | **no field yet** |
  | `working_days` (×7, `monday` … `sunday`) | Working days toggles | `ResourceDailyWorkSchedule.is_working_day` per `day` |
  | `start_time` / `end_time` | Working hours | `ResourceDailyWorkSchedule.start_time` / `end_time` |
  | `timezone` | Time-zone picker | `Profile.timezone` |
  | `work_status_description` | Note | `Translator.work_status_description` |

  Under the day toggles, the period is drawn in the same seven columns: working days in the
  status's colour, days off hatched. The bar above Save says the result in words ("Busy on 2
  working days · Back to Available on Mon 28 Sept") and turns into a warning, with Save
  disabled, when no day in the period is a working day.

  In the preview the logic is dummy: Save repaints the pill ("Busy until 27 Sept") and shows a
  toast, Cancel discards the edits, and nothing is stored — reloading resets it. The time-zone
  list is a short fixed one; use `Profile.TIMEZONES` in Django.

---

## Icons

**Every icon in the preview lives in one file: `assets/js/icons.js`.** Nothing is drawn inline in
the HTML any more.

To change one, find its name and paste your whole `<svg>…</svg>` between the backticks, exactly as
you copied it. Nothing needs stripping:

| What you paste | What happens |
| --- | --- |
| any `viewBox` (24, 32, 256 …) | kept as-is |
| `width` / `height` | dropped, so CSS sizes it |
| `fill="#000000"`, `stroke="#514231"` … | rewritten to `currentColor`, so it follows the design system |
| `fill="none"` or a `url(#gradient)` | left alone — structure, not colour |
| outline or solid | detected from whether the icon strokes |

```js
jobs: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M106,112a6,6…"></path></svg>`,
```

Two maps:

- **`ICONS`** — the normal weight, used everywhere.
- **`ICONS_ACTIVE`** — the solid weight the sidebar's current tab wears. Only the nav names need an
  entry; a name missing here falls back to the normal weight.

Used as `RP.icon("jobs")` in JS, or `<span data-rp-icon="jobs"></span>` anywhere in the HTML —
`icons.js` fills those in on load.

**Sorting** is the one exception: the table header uses
`templates/partials/_sorting_icon.html` verbatim — same three path pairs, same class names. The
partial's inline `display: none` is gone: `.is-asc` / `.is-desc` on the `<th>` choose the pair, so
both chevrons are always on screen and only the active direction is navy.

## The expanded row

Its anatomy comes from `company-profile.css` and `profile-details.css` rather than from the table:
one white card with a hairline border, an inset head carrying a navy rule, small uppercase navy
section titles, label-over-value rows, and a single filled navy control per decision.
**Navy is the primary**; gold is left for accents only — the file tags and the focus rings.

It is built to fit a laptop. The whole panel lands at roughly 330px for an invitation, 355px for a
bid request and 425px for an interpreting job. Two things keep it there: the identity moves into
the head so the fact grid does not repeat it, and Files sits beside Instructions instead of under
it. Both column splits are **container queries** on the panel's own width, not media queries —
opening or collapsing the sidebar moves that line by 184px, which a viewport query cannot see.

## Keyboard

| Key | Does |
| --- | --- |
| `/` | Jump to the search field |
| `Esc` | Leave the search field, close any modal, the availability dropdown or the mobile drawer |
| `Enter` | Submit a bid, when the bid field has focus |
| `↑` / `↓` / `←` / `→` | Move between statuses in the availability dropdown |
