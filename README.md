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
| `job.html` | **Built.** A single job — opens from a Job ID on My Jobs (`job.html?id=J-47990`). |
| `dashboard.html` | **Built.** Dashboard — the resource's home; the logo and the first sidebar entry open it. |
| `earnings.html` | **Built.** My Earnings — every bill, paid and pending, with its totals. |
| `professional-profile.html` | Placeholder |
| `account.html` | **Built.** User Account — the resource's own profile, opened from their name and photo in the sidebar. |

The sidebar, topbar, availability control, profile menu and logout modal are **final** and shared
by all six pages, so a new page only needs its own content.

---

## File structure

```
resource portal preview/
├── index.html                  redirect → invitations.html
├── invitations.html            built page
├── jobs.html                   built page
├── job.html                    built page — one job, ?id=J-…
├── account.html                built page — the resource's own profile (User Account)
├── dashboard.html              built page — the resource's home, ?period=month|quarter|year|all
├── earnings.html               built page — the bills, ?period=…&status=…&q=… or ?bill=B-…
├── professional-profile.html   placeholder
└── assets/
    ├── css/
    │   ├── variables.css       design tokens — copied from config/static/css/variables.css
    │   ├── base.css            app shell, icons, toasts, segmented filter, placeholders
    │   ├── sidebar.css         rp-sidebar
    │   ├── topbar.css          rp-topbar, availability pill + dropdown, profile menu
    │   ├── toolbar.css         copied from config/static/css/cu_table_toolbar.css
    │   ├── table.css           copied from config/static/tables/table.css
    │   ├── status.css          copied from config/static/css/status.css
    │   ├── pagination.css      copied from config/static/css/pagination-bar.css
    │   ├── columns-modal.css   copied from config/static/css/customize_columns_modal.css
    │   ├── logout-modal.css    copied from config/static/css/logoutModal.css
    │   ├── navigation-tabs.css copied from config/static/css/navigation-tabs.css
    │   ├── invitations.css     page-specific: rows, expanded panel, offer card
    │   ├── jobs.css            page-specific: table chrome, waiting/slip cells
    │   ├── job.css             page-specific: job head, cards, checklist, upload, chat, viewer
    │   ├── account.css         page-specific: profile head, field grid, records, technology, terms
    │   ├── dashboard.css       page-specific: job tiles, revenue pipeline, meters, due soon, feed
    │   ├── earnings.css        page-specific: totals, period picker, status filter, bill panel
    │   └── password-modal.css  copied from config/static/css/password-modal.css (shell swapped)
    ├── js/
    │   ├── icons.js            inline Lucide set — RP.icon('name')
    │   ├── data.js             the dummy records and the signed-in resource
    │   ├── layout.js           renders sidebar + topbar + modals into #rp-layout
    │   ├── columns-modal.js    reusable "Customize Columns" modal
    │   ├── navigation-tabs.js  copied from config/static/js/navigation-tabs.js
    │   ├── invitations.js      table render, search, sort, expand, paginate
    │   ├── jobs.js             tabs, per-tab columns, search, sort, paginate
    │   ├── job.js              one job: sections, jump tabs, start / deliver, chat, file viewer
    │   ├── account.js          the profile: jump tabs, inline edit, dialogs, profile strength
    │   ├── dashboard.js        the home: period switch, count-up, tips, meters that repaint from data-value
    │   ├── earnings.js         the bills: period and status filters, search, totals, the open bill
    │   └── password-policy.js  copied from config/static/js/password-policy.js
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

`job.css` does the same for the Invitations panel: facts, section titles, file rows, the serif
amount, the countdown chip and the navy CTA are rebuilt at the same sizes and colours under the
job page's own class names, rather than loading `invitations.css` on a second page.

`account.css` follows suit: the head, jump tabs, cards, buttons and modal are rebuilt from
`job.css`, and the fields inside a card from `profile-details.css` under its own `.pd-*` names, so
the Personal details markup ports straight onto the customer profile's stylesheet.
`password-policy.js` is byte-for-byte. `password-modal.css` is too, except that its Bootstrap
shell (`.modal-dialog`, `.modal-content` and the agile.css bridge) is replaced by the preview's
`.rp-modal` panel — every `.pwd-*` rule is untouched.

`earnings.css` does the same once more: the totals are `dashboard.css`'s `.rp-stat` tiles and the
table chrome, sort icon, empty state and open row are `jobs.css` and `invitations.css`, all under
their original class names.

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
make — the Job ID and the eye button both open `job.html?id=…`. The open tab is kept in the URL
(`jobs.html?tab=waiting`), so Back and the job page's breadcrumb land on the same tab.

---

## Single job

`job.html?id=J-47990` is the resource's page for one accepted job, redesigned from
`templates/tms/job.html` and `tms/sections/section_2.html`. It keeps every decision the original
makes and gives each one a place:

- **Head** — breadcrumb back to the tab it came from, a service mark, the project name, then
  ID · service · languages · specialty, and the status pill.
- **Jump tabs** — the Orders nav again, sticky, with a scroll-spy. It lists only the sections the
  job has, as `job_details_nav.html` does.
- **Cards on the left**, in working order — read, prepare, deliver, ask.
- **A sticky aside on the right** — the payout, the deadline and the one next step, then the
  project manager. Below ~980px of content width it stacks, with the summary straight after the
  head. On a screen shorter than 760px it stops being sticky rather than hide its own bottom.

| Section | Holds | In the original |
| --- | --- | --- |
| Overview | Six steps — Assigned, In progress, Delivered, Approved, Billed, Settled — then the facts | The facts table; the steps are new |
| Instructions | Comments from the project manager and from the customer | The two comment rows |
| Files | *To work on*: source, original, template, brief. *For reference*: reference, pre-translated, AI translation | Template / Original / Source / Pre-Translated / AI Translation / Reference rows |
| Glossaries | Name with its ID (`#150`), client or public, term count, the pair in full ("English → Arabic"), View terms and CSV | Glossaries card, per-language services only |
| Delivery | The previous job's checklist to verify, this job's checklist, the upload; afterwards the delivered files and the submitted checklist | Delivery and Completed files cards |
| Chat | The job's thread with the project manager | `chat/order_and_job_chat.html` |
| Aside | Payout with ≈ USD and the rate, deadline with a countdown, progress, the next step; email, phone and mobile | Amount and Deadline rows, Start job, Project manager card |

The status decides the page, the way `section_2.html` does:

| Status | Open this | The aside offers |
| --- | --- | --- |
| Assigned, files not released (`job_ready = NR`) | `J-48002` | Start job, disabled, with a note naming the job it waits on |
| Assigned (`AS`) | `J-47968` | **Start job** — a job with a template asks the resource to use it first |
| In progress (`PR`) | `J-47990` | **Deliver job**, which jumps to Delivery, and Open in Matecat when CAT is on |
| Overdue (`OV`) | `J-47947` | The same, under a deadline-passed alert |
| Delivered (`DL`) | `J-47875` | View delivered file, waiting for approval |
| Approved / Billed / Settled | `J-47901` / `J-47894` / `J-47888` | Bill ID with its pill, and the job slip |

Two more worth opening: `J-47953` is DTP after a Translation job — the client's original, the
previous resource's delivery as the source, and their checklist to verify. `J-47982` has an AI
translation: Compare opens the source and the AI output side by side.

The upload keeps the original rule — locked until every checklist item is answered, Done or
N/A. The Verified ticks on the previous job's list do not gate it, as before. Colours follow the
table: from Delivered on, the pills are `RP.JOB_STATUS`'s; before that the page uses
`.status-new`, `.status-pending`, `.status-inProgress` and `.status-overdue`.

**In the preview**, Start job and Deliver move the job through the real statuses in memory.
Starting opens the work file, as the real page does after `startJob()`. Delivering needs the
checklist and any picked file — nothing is uploaded. Chat messages append to the thread.
Downloads, the bill, the job slip, glossary terms, the email and phone links and Matecat only
raise a toast. Reloading resets the job.

The table rows carry no `Job.status`, so `data.js` derives one: an active row at 15 % or less
stands in for accepted-but-not-started, and a passed deadline for Overdue. `RP.jobDetail(job)`
builds the rest — files, checklists, instructions, glossaries, chat — from the row, so every job
in the table opens on a full page.

---

## User account

`account.html` is the resource's own profile, redesigned from `templates/accounts/profile/main.html`
as a translator (`user_type == 'TR'`) sees it. The sidebar's name and photo open it. The page is
built like the single job: a head with the photo and a Professional Profile button, sticky jump
tabs with a scroll-spy, cards on the left and a sticky aside on the right. Inside a card the fields
are laid out as on the customer profile (`customer/profile/personal_details.html`): labels over
values in a grid, three to a row, instead of one row per field.

The aside stacks earlier than the job page's, below ~1100px of content width, because a form needs
the width for three fields a row. Stacked, the Terms banner comes first, then profile strength
(its score beside the to-do list), the sections, and the account facts in one row.

| Section | Holds | In the original |
| --- | --- | --- |
| Personal details | Basics, contact, address. View mode by default, **Edit** swaps in the form; the bar under it holds **Reset password** | `personal_details_edit_form.html` + `email_update.html`; the bar and the dialog are the customer profile's |
| Education | Degree · major, university, country, graduation year | `_education_list.html`, `add_user_education.html` |
| Work experience | Position, company, country, years, duties (two lines, then *Show more*); "I have no work experience" when empty | `_work_list.html`, `add_work_experience.html` |
| Technology | **New.** The software the resource works in, in five groups plus their own tools | — |
| Certifications | Read-only, as before: status pill, ID, expiry, the rejection reason, a link to Services & Prices | `tr_certificate.html` |
| Documents | CV, resume, education and other documents: upload, replace, delete | `accounts/partials/tr_documents.html` |
| Terms | **New.** "Dear Ahmed", the two documents, the tick box and Confirm agreement | `term_and_condition_accept.html` was a pop-up only |
| Aside | Profile strength (what is left, each item opens the right editor), Resource ID with copy, partner since, availability, terms | — |

**Left out, because `main.html` hides them from a translator:** the Billing tab (billing address,
credit card and bank info), Reference Documents, *How did you find us?*, Industry and the Back
button. The email stays read-only with the reason on a *Not editable* badge — only AD, OM and VM
can change it.

**Changed on the way:**

- Change password is no longer an inline form. **Reset password** in the Personal details bar opens
  the customer profile's dialog — same copy, same checklist, same `data-password-*` gate.
- Deleting asks in a small *Delete / Keep* popover instead of the modal that made you type a code.
- Photo upload opens a dialog with a round preview and zoom, instead of the croppie box.
- Empty values are dashed *+ Add …* buttons that open the editor on that field.
- `?highlight_cert=334` still scrolls to a certificate and flags it.

Other states worth opening: `account.html?terms=none` (never agreed) and `?terms=agreed` (the
receipt). The default is an update waiting for agreement, as `is_expired` shows it.

**In the preview**, saving, uploading, the photo, the password and agreeing change the page in
memory only — the header, sidebar and topbar pick up a new name or photo, and profile strength
recounts. Reading the terms, viewing a file and the phone links raise a toast. Reloading resets it.

---

## Dashboard

`dashboard.html` is new — the current system has no page like it. The logo and the first sidebar
entry open it. It keeps the other pages' anatomy (white head band, cards with navy titles, the
segmented control from `base.css`) and reads top to bottom as *what needs me → my jobs → my money
→ how I am doing → what is next*.

| Block | Shows | Comes from |
| --- | --- | --- |
| Head | Today's date, a greeting, the period switch | — |
| Needs your attention | Overdue jobs, jobs due in 24 hours, invitations waiting, terms to agree to — only the ones that apply | `RP.JOBS`, `RP.USER.invitationCount`, `RP.PROFILE.terms` |
| Jobs | Active, Completed, Lost bids, Declined: the count, its words, the change vs the previous period — on the customer portal's `.cp-card` | Active from `RP.JOBS`; the rest from `RP.DASHBOARD.periods` |
| Revenue | Total paid (period) and Total expected (now), both with ≈ USD; where the expected money is | `RP.JOBS` amounts by stage; `RP.DASHBOARD.monthly` |
| Performance | Quality, On-time delivery, Response rate, Professional conduct — a meter each in green, orange or red, the target as a tick, a state chip | `RP.DASHBOARD.performance` |
| Due soon | The next five deadlines, overdue first, each opening its job | `RP.JOBS` |
| Recent activity | Invitations, deliveries, approvals, payments, lost bids and declines | `RP.DASHBOARD.activity` |

**Scopes are labelled, not implied.** The period switch (This month / Last 3 months / This year /
All time) changes Completed, Lost bids, Declined and Total paid. Active jobs and Total expected
carry a *Now* chip, and Performance says *Last 90 days*,
because those numbers do not belong to a period. The choice is kept in the URL (`?period=year`)
and in `localStorage`.

**Every metric explains itself.** Each tile and each meter has an info button; its tip opens on
hover, on keyboard focus, and on tap (a tap pins it). The four performance tips are the
expectations word for word, and the targets they name (90%, 80%) are the ticks on the meters.

**Needs your attention** leads each item with its count on its own line (*1 job*, *24 invitations*)
and what it means under it, quieter, so no item wraps mid-sentence. Overdue and due-soon items are
tinted like the User Account's terms banner — a white icon disc on a pale red or amber ground; the
rest stay white. The items share one row while they fit, go two a row below ~1080px of content
width (an odd last one takes the whole row), and one a row on a phone.

**The four job tiles** are the customer portal's `.cp-card` (`company-profile.css`) with its two
grounds swapped: a grey inset well with the icon, the label and the figure, on a white bordered
tray that carries the note under it. The figure keeps this page's serif. On a phone the tiles go
one a row, with the figure beside the label.

**Where the expected money is** follows the data-viz method: one navy ramp, light to dark in the
order money travels, validated as an ordinal ramp on white, with a legend carrying every value. It
sits on the tiles' grey well (`.rp-pipe`), so it reads as the breakdown of the totals above it. The
legend is one row a stage with the amount at the end, like the job page's summary rows; on a
full-width card, where there is no Performance card beside it to match in height, the five stages
line up on one row in the bar's order instead.

**Balanced rows.** Revenue sits beside Performance and Due soon beside Recent activity, and each
pair is built to end at about the same height, so neither card has an empty bottom. A hairline
separates the meters, and each event's time sits at the end of its first line. On a phone a Due
soon row gives the title the whole line and puts the deadline and progress under it.

**Performance meters take their colour from the percentage.** A meter with a target (On-time
delivery 90%, Response rate 80%) is green from the target up, orange within 10 points under it,
red below that. Quality and Professional conduct have no stated target, so their line is 90%.
The chip says the same in words — *On track*, *Below 80%* / *Needs attention*, *At risk* — so the
state never rests on colour alone.

| Meter | Green | Orange | Red |
| --- | --- | --- | --- |
| On-time delivery (target 90) | 90–100 | 80–89 | 0–79 |
| Response rate (target 80) | 80–100 | 70–79 | 0–69 |
| Quality, Professional conduct (line 90) | 90–100 | 80–89 | 0–79 |

**Trying the colours.** Everything a meter shows is worked out from its `data-value`, so either:

- **Elements panel:** find `<li class="rp-meter" data-meter="response" data-value="76" …>`,
  double-click `data-value` and type another number. The bar, its colour, the number and the chip
  repaint as you press Enter. `data-target` moves (or, emptied, removes) the target tick the same way.
- **Console:** `RP.dashboard.setMeter("response", 65)` — or with a new target,
  `RP.dashboard.setMeter("conduct", 95, 98)`. It answers with the state it painted.

Changing the bar's `width` by hand does nothing to the colour — the width is an output of
`data-value`, not an input. The line and the band live in `dashboard.js` (`GREEN_LINE`,
`ORANGE_BAND`); the colours are `--ok-*`, `--warn-*` and `--bad-*` at the top of `dashboard.css`.

`data.js` now works out `RP.USER.balance` from the billed jobs, so the profile menu's Balance and
the dashboard's *Billed* stage are the same number.

---

## My Earnings

`earnings.html` replaces the two panels the resource dashboard shows today — **My Earnings**
(`#trBills`, the pending bills) and **My Payments** (`#trPayments`, the paid ones) — with one table
of bills, paid and pending together. The sidebar's Earnings entry opens it. Full-timers never
reach it, as before: the original answers *Not allowed*, and the preview's resource is a freelancer.

| Column | Shows | In the original |
| --- | --- | --- |
| Serial No. | The row's place in the list, counted across pages | `Sr.No` — `forloop.counter`, which restarted on every page |
| Bill No. | `B-2209`, beside the caret that opens the bill | `invoice.id`, a link to `resource_invoice` |
| Period | `1 – 30 Sept 2026`, the month and year said once | `from_date – to_date` |
| Job Count | **New.** The jobs the bill pays for | — |
| Amount | `1,608.66 NZD`, number first; ≈ USD on hover | `formatVatAndBonusIncludedAMount`, bonus and deduction in |
| Payment Status | `Paid` / `Pending`, `status.css`'s pills; the paid or due date on hover | `get_status_display` |

**Totals are tiles above the table**, the dashboard's `.rp-stat`, so the two pages read alike:
Total Job Count (and the bills it spans), Total Earned (≈ USD) and Total Paid (and what is still
pending). Tiles rather than a row under the columns: they stay on screen on a phone, where the
table scrolls sideways, and they do not disappear with a hidden column. They add up **every bill
the period, status and search let through, on all pages** — the original's `total_earnings` took
the search into account the same way.

**Filters sit in the toolbar, beside the search:**

- **Period** — All time, Last 3 / 6 / 12 months, a calendar year, or a custom range of months. A
  chosen period turns the button navy and gives it its own ×.
- **Payment status** — All / Pending / Paid, `base.css`'s segmented control, each with a count of
  what it would show and the pill's own dot.

**Search takes a bill number or a job number** — `B-2209`, `2209`, `J-47894` or `47894`. A bill
found through one of its jobs carries a chip naming that job, and the matching digits are marked.
When a job number finds exactly one bill, that bill opens with the job highlighted in it.

**A row opens to the bill**, in the Invitations panel: the jobs it pays for (Job No., project,
service, amount; the list scrolls on its own past seven rows) and a summary — issued, due or paid
on, paid by, the bonus and deduction when there are any, the total and ≈ USD. *Open bill* and *PDF*
stand in for the original's link to the bill page.

The view is kept in the URL (`?period=2025&status=paid&q=2209`), and `earnings.html?bill=B-2201`
opens one bill in its place in the list. The dashboard's *Bill … was paid* now links there.

**The numbers agree with the other pages.** `data.js` files one bill a month since March 2021, as
the monthly run in `celery_tasks/bills.py` does:

- The newest bill, B-2209, holds the jobs My Jobs shows as *Billed*, so **Pending equals the Balance
  in the profile menu**, 1,608.66 NZD — the same sum `tr_account_balance` makes.
- The one before, B-2201, holds the *Settled* jobs; it is the payment in the dashboard's activity.
- The eleven before that are the dashboard's paid-per-month figures, and **Total Paid for all time
  is the dashboard's 104,812.45 NZD**.
- *Approved* jobs carry B-2216, the next bill, not issued yet — the dashboard counts them as *not
  billed yet* too.

Only the jobs My Jobs still lists open a job page; older job numbers raise a toast.

**Narrower screens:** the six columns give back their spare width before the table scrolls, so
they fit a 1024px laptop with the sidebar open; a column resized by hand is left alone. On a phone
the tiles go one a row, the status filter takes a row of its own, Bill No. stays pinned while the
rest scrolls, and an open bill fits the screen.

---

## Adding the next page

1. Copy a placeholder page (e.g. `professional-profile.html`) and set `data-page` / `data-title` on `#rp-layout`.
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
- The availability dropdown is `templates/partials/_work_status_modal.html` redesigned: same three
  statuses (`Translator.WORK_STATUS_OPTIONS`), same descriptions, the optional note, Save / Cancel.
  It keeps `#ChangeWorkStatusPost`, `name="work_status"`, `name="work_status_description"`,
  `#submit_change_status` and the `ws-option*` / `ws-field*` / `ws-btn*` classes, so
  `submitWorkStatus()` binds as before. What changes is the container (`.ws-dropdown`, anchored
  under the pill, no backdrop or scroll lock) — add back the CSRF token and the two hidden inputs.
  In the preview it is UI only: Save shows a toast and every close resets the form.

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
| `class="lucide lucide-search"`, `class="ph ph-…"` | kept, so the icon can be found by name in the page; any other class is dropped |

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
| `Esc` | Leave the search field, close any modal, the availability dropdown or the mobile drawer; on User Account, close the Delete popover first; on My Earnings, close the period picker first |
| `Enter` | Submit a bid, when the bid field has focus; send a chat message on the job page (`Shift+Enter` for a new line) |
| `↑` / `↓` | Move between statuses in the availability dropdown |
| `Enter` in Technology's search | Pick the first match, or add what was typed as your own tool |
