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
| `productivity.html` | **Built.** Productivity — the work delivered a month (or a year) at a time, its trend and its totals; `?as=fulltimer` for a full-timer's page. |
| `professional-profile.html` | **Built.** Professional Profile — services and rates by language pair with their certificates, specialities, billing details, payment methods and emails. |
| `account.html` | **Built.** User Account — the resource's own profile, opened from their name and photo in the sidebar. |

The sidebar, topbar, availability control, profile menu and logout modal are **final** and shared
by every page, so a new page only needs its own content.

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
├── productivity.html           built page — delivered work, ?view=yearly&period=…&metric=…, ?month=2026-09, ?as=fulltimer
├── professional-profile.html   built page — services, rates, certificates, payment, ?highlight_cert=…
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
    │   ├── productivity.css    page-specific: totals strip, trend chart, columns popover, export menu, period panel (services / net words, pay)
    │   ├── professional.css    page-specific: profile head with facts, pair blocks, certificates, method cards, emails and their pager
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
    │   ├── productivity.js     delivered work: monthly / yearly, period, trend chart, export, the open period
    │   ├── professional.js     the work profile: pair blocks, rate and certificate dialogs, specialities, payment
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

`productivity.css` is `earnings.css` again — period picker, table chrome, sort icon, empty state,
open row and tip — plus `dashboard.css`'s card, `.rp-scope` and `.rp-delta`, all under their original
names. New: the totals strip, the chart, the columns popover, the export menu and what an open period
holds. The page does not load `columns-modal.css` / `columns-modal.js`: its Columns is a popover of
its own.

`professional.css` rebuilds User Account's head, jump tabs, cards, `.pd-*` fields, aside, confirm
popover and modal from `account.css`, under the same names. Specialities wear Technology's
`.rp-tech*` groups and `.rp-toggle` chips, and the pair block's head is the Invitations panel's inset
head with its navy rule.

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
| Files | *To work on*: source, original, template, brief. *For reference*: reference, pre-translated | Template / Original / Source / Pre-Translated / Reference rows |
| AI translation | Its own section and tab: the file, its pair and size, **Compare** (source and AI output side by side) and download; while it is generated, its progress in place of the buttons | The AI Translation row, `ai_translation_cell.html` |
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
translation: Compare opens the source and the AI output side by side. On `J-47607` it is still being
generated — the bar fills on its own and Compare takes its place, as the real page's status polling does.

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

## Professional profile

`professional-profile.html` is what the resource offers and how they are paid, redesigned from
`templates/translation/singleResource.html` as a resource sees it. The sidebar's Professional Profile
entry opens it, and its head links back to User Account. It is built like User Account: a head,
sticky jump tabs with a scroll-spy, cards on the left and a sticky aside that stacks below ~1100px
of content width (Needs your attention first, At a glance last).

The head is one band, as compact as User Account's. On the left, who: User Account's photo (same
photo dialog) and name, the verified mark, *Freelancer*, the ID and *Company preferred* (bid requests
reach them first; it was a switch the resource could see). The ID reads **ID #202**, as the old
page's *Resource ID #202* did, rather than the system key `T-202` (the topbar menu and User Account
still show `T-202`). On the right, the status and the way out:

- **Availability** — label over value behind a hairline, in the topbar pill's colours, with
  **Change**. It sits under the topbar's own pill, so the dropdown Change opens is right above it.
  Native language, preferred currency and joining date live in At a glance, not here.
- **User Account** — on a phone, its icon alone.

Below 760px of head width the status has no room beside the name, so it becomes the name's third
line — `● Available · Change`, the label hidden, the dot and word saying enough.

**At a glance** opens on an ID card, as User Account's Account card opens on Resource ID: `#202` in
the serif with a copy button, *Freelancer* and *Company preferred*, then native language, preferred
currency and joining date on the same tile. Under the tile, the work: language pairs used of 6,
services, certificates, specialities and the vendor manager. In the aside it reads top to bottom;
stacked full width, the ID sits beside its three facts and the counts make one row under them. The
aside stays sticky only while it fits the window — measured, since the card grew.

| Section | Holds | In the original |
| --- | --- | --- |
| Services & prices | One block per language pair — its services with rate, status and actions, then its certificates. Single-language and language-independent services follow in blocks of their own. Every block collapses; *Collapse all* folds them at once | `resources_prices/table.html` and its certificate sub-row, `addPriceForm.html`, the certificate modal |
| Specialities | **Own section and tab.** Up to ten, in six groups like Technology on User Account; Edit swaps in the toggles | The Specialties picker inside Resource Details |
| Billing details | The address as label over value, or *Same as your primary address* linking to User Account; Edit opens the form; Tax read-only | `resource/billing_details.html` |
| Payment method | A card per method: the default framed in navy, Verified or Pending verification, Make default; a method not added yet is a dashed row | `resource/preferred_payment_method.html`, `method_Forms/` |
| Emails | The mail sent to the resource, eight a page, found by search, topic and All / Unread; unread in bold with a dot, read in a dialog | `customer/emails.html` |
| Aside | Needs your attention: rejected or expiring certificates, an unverified default method. At a glance: the ID card (resource ID with copy, category, company preferred, native language, preferred currency, joining date), then pairs used of 6, services, certificates, specialities, vendor manager | — |

**Pairs instead of a table with an expanding row.** A certificate belongs to a language pair (and one
service), the freelancer limit counts pairs, and a translator thinks in pairs. Grouping by pair puts
each pair's certificates under its rates, so a rejected or expiring one is on screen without opening
anything. Inside a block the rows keep a table's columns — service, rate, status, actions — so rates
still compare at a glance. Search sits above them on the left, the status filter and *Collapse all*
on the right. The six-pair limit is no longer a meter there: *How services and prices work* says it,
with how many pairs are priced, and At a glance counts them.

**Emails, a page at a time.** Five years of mail is about two hundred emails, and *Show more* would
take forty presses and a card longer than the rest of the page. So the card stays one size: a page
of eight, newest first, with the tables' pager under it (*1–8 of 200*, first, last and the pages
either side, in `pagination.css`'s classes). Above the list, as on Services & prices, search on the
left — subject, sender and text — and on the right the topic (Invitations, Payments, Rates,
Certificates, Account) and **All / Unread**, the unread count on its segment. Searching or filtering
goes back to page 1; only the list and pager repaint, so the search keeps its caret. The Emails tab
counts what is unread, not the inbox, and reading an email updates it with the other two counts. The preview's 200 are generated in `data.js`: each bill on My
Earnings brings a *ready* and a *paid* email (bill, amount and Wise or PayPal as listed there),
sixty older invitations fall between, and the eight written-out emails lead.

**Collapse.** Blocks open by default. The chevron at a block's right folds it (the whole head does,
for a mouse); *Collapse all* folds every block and turns into *Expand all*, so a resource can close
everything and open the one pair they work on. The state lives in memory only — a reload opens them
all. A search or the status filter opens the blocks it finds, and a save or `?highlight_cert=` opens
the block of the row it flags.

**Changed on the way:**

- One *Add services* dialog builds a list and saves it in one go, as the old modal did. Opened from a
  pair, it starts on that pair and the first service the pair has no rate for. A duplicate rate and a
  seventh pair are refused before saving, the latter with a link to message the vendor manager.
- A rate shows NZD first, then ≈ the currency it was typed in (or USD), as the old two lines did.
  The clock date the old table printed under each rate is that rate's own exchange-rate update, not
  when the service was edited, so it moved out from under the service name into the rate cell, on
  the ≈ line itself — *🕘 9:12 am │ ≈ USD 0.0333*, right-aligned under the NZD amount with a hairline
  between — so a rate takes two lines, not three (`rateUpdated` on each price; the full stamp on
  hover). Saving a rate stamps it again.
- New rates are *Pending approval* — on this page `.status-pending` is honey amber with a brighter
  dot, the colour read everywhere as "waiting"; *Active* is the Verified green.
- A verified certificate expiring within 60 days gets **Renew**, which adds the renewed one; the
  old one then reads *Renewal sent* and stops asking. A rejected one shows its reason and
  **Replace the file**. Verified certificates are locked, as before.
- A verified payment method opens read-only, with the old notice and a link to the vendor manager.
  *Make default* asks first. An unverified default turns Preferred currency to pending and raises an
  attention item, as the old amber card did.
- Billing's *Same as my primary address* locks the fields to User Account's address; unticked, they
  start from it. Tax and resource type are shown read-only — the original hid them from a resource.

**Left out, because the original shows them to staff or full-timers only:** internal notes,
productivity, calendar, schedule and leaves, chat, category, created by, account status, the
verified switch and *Payment details verified by admin*.

**The numbers agree with the other pages.** English → Arabic translation at NZD 0.0550 a word is
the rate on invitation J-48210, interpreting at NZD 70.00 an hour the one on the interpreting
invitations; Wise is the default because it paid the last thirty bills on My Earnings; the
certificates are User Account's own records; the B-2201 email carries that bill's amount.

`?highlight_cert=334` flags a certificate, as on the old page, and `#translator_prices` — the old
anchor — lands on Services & prices. User Account's *Replace the file* now links with the
certificate's ID, and the Invitations notice about a missing payment method lands on Payment method.

Settings > Industries has no category, so the six speciality groups are this preview's own.

**In the preview**, every add, edit, delete, upload and default changes the page in memory only; the
tabs, the attention list and At a glance recount. Viewing a file and messaging the vendor manager
raise a toast. Reloading resets it.

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
| Sr No. | The row's place in the list, counted across pages | `Sr.No` — `forloop.counter`, which restarted on every page |
| Bill No. | `B-2209`, beside the caret that opens the bill | `invoice.id`, a link to `resource_invoice` |
| Period | `1 Sept 2026 – 30 Sept 2026`, both dates in full | `from_date – to_date` |
| Job Count | **New.** The jobs the bill pays for | — |
| Amount | `NZD 1,608.66`, currency first as on My Jobs and Invitations; ≈ USD on hover | `formatVatAndBonusIncludedAMount`, bonus and deduction in |
| Payment Status | `Pending` in `status.css`'s orange `.status-processing`, `Paid` in `.status-paid`; the paid or due date on hover | `get_status_display` |

`.status-pending` is not used for bills: its brown stays with the job page's *Waiting for files* and
the account page's *Pending verification*.

**Totals close the list**, under the table where the original's *Total Earnings* line sat: the
dashboard's `.rp-stat` tiles — Total Job Count (and the bills it spans), Total Earned (≈ USD) and
Total Paid (and what is still pending) — in a centred row no wider than three tiles (300px each),
rather than across the page. Below the table rather than above it, so the page reads filters →
bills → their total and the bills are the first thing on screen, on a phone too. They sit outside
the table, so they never scroll sideways or disappear with a hidden column. They add up **every
bill the period, status and search let through, on all pages** — the original's `total_earnings`
took the search into account the same way. An empty list hides them. The tiles read value then
unit, as on the dashboard (`106,421.11 NZD`); the Amount column and the open bill lead with the
currency (`NZD 1,608.66`).

**Amount and Payment Status get a gutter**, since a right-aligned figure beside a left-aligned pill
read as one cell: 28px after the figure and 18px before the pill once the columns reach their set
widths, 12px and 14px when the screen squeezes them to their minimum, so `NZD 3,610.80` is never
cut. Header and cells share the padding, so *Amount* ends where the figures end and *Payment
Status* starts where the pills start.

**The toolbar** runs search → payment status → period → Columns:

- **Payment status**, beside the search — All / Pending / Paid, `base.css`'s segmented control.
  Pending and Paid carry the pill's own dot; only Pending carries a count, since it is the one still
  waiting on money.
- **Period**, beside Columns — All time, Last 3 / 6 / 12 months, a calendar year, or a custom range
  of months. A chosen period turns the button navy and gives it its own red ×. The picker opens
  leftwards, since the button sits at the end of the row.

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
they fit from about 1070px with the sidebar open (1024px with it collapsed) — the full-date period
made its column ~70px wider; below that the table scrolls sideways with Bill No. pinned. A column
resized by hand is left alone. On a phone the tiles go one a row, the status filter takes a row of
its own and the period shares the next with Columns, Bill No. stays pinned while the rest
scrolls, and an open bill fits the screen — its title and period take the first row, the pill
joins the buttons under them.

---

## Productivity

`productivity.html` replaces the dashboard's `trProductivity` tab — `freelancer_productivity_table.html`
and `fulltimer_productivity_table.html`, their overview cards and their filter. The sidebar entry sits
under Earnings. It reads **toolbar → totals → trend → rows**: what the view adds up to leads, in one
full-width strip, then how it moved, then the months themselves.

**What went.** The current-month cards (Jobs, Word Count, Hours Count, Document Count; Translation WC,
Revision WC, Legalization PC, Hours Count and Net WC Count for a full-timer): this month is now the top
row, marked *So far*, and its open row says the rest. The Quality / Punctuality / Completed Jobs line
is not repeated either — the Dashboard carries it as Performance and the Completed jobs tile.

**The toolbar** — the old search box held three icons; each is now a control of its own:

| Control | Does | Was |
| --- | --- | --- |
| Monthly / Yearly | How the rows are grouped, `base.css`'s segmented control | *Breakdown: Month-Wise / Year-Wise*, inside the filter popup |
| Period | My Earnings' picker: All time, Last 3 / 6 / 12 months, a year, a custom range of months, with a red ×. Rolling and this month included, so *Last 3 months* is the dashboard's | *Productivity Months*, a flatpickr range; hidden in Yearly as before |
| Columns | A popover of checkboxes, the Period and Export popovers' twin, applied as you tick: *Select all*, and *Reset* (the default columns at their default widths, undoing a hand resize). Month is ticked, greyed and locked. With columns hidden the button turns navy and counts what is shown, *5/6*; a full-timer's eleven come in three groups — Work, Words counted, Pay | The sliders icon and its checkbox popup; the other pages' Customize Columns modal |
| Export | A menu that first says what goes out — *Export 12 months · 1 Nov 2025 – 31 Oct 2026* — then PDF report or Excel (CSV). Every page of the view, not only the page on screen as the old form posted | The export icon, PDF only |

**One chart instead of four.** Earnings, Jobs, Words, and Hours or Documents when the view has any,
one at a time on a segmented switch; changing it moves the same bars rather than redrawing them. Bars
are at most 24px with a 4px rounded cap, in one step of the dashboard's validated navy ramp; the month
still running is a paler step, keyed *This month so far*. A dashed line marks the average of the
complete periods in view, and the best one carries its value on its cap — the only direct label; the
tip and the table carry the rest. Hovering a bar lights its row and hovering a row lights its bar;
clicking a bar opens that period in the table, turning the page when it is on another one. Many months
keep only the year labels, at each January.

**The table** — Month (Year) · Job Count · Word Count · Hours · Documents · Earnings. Only money is
right-aligned — Earnings here, Excess Pay and both Monthly Pay columns for a full-timer — its header
ending where the amounts end (one 18px gutter for both); counts stay left-aligned, as in every other
table, and so do they in an open period. A period with none reads as a quiet dash rather than *0*. Earnings leads with the currency, ≈ USD on hover; Hours
and Earnings explain themselves in a tip. 12 / 24 / 48 a page — a year to a page by default. Sorting,
resizing, the pinned first column and the striping are My Earnings'.

**A row opens** to the period — *By service* (jobs, volume in words, hours, documents or pages,
earnings and its share) beside a *Summary* against the period before (Job Count, Word Count and
Earnings carry the change; a period still running, or the year after the short first one, carries
none). *View jobs* opens My Jobs' Completed tab for this month; older months only say where they would
go, as do the PDF buttons.

**Totals lead the page**, in one full-width strip (`.rp-sumbar`) with a hairline between figures:
Total Job Count (in *n* months), Total Word Count (and the hours and documents) and Total Earned
(≈ USD) — every period the view lets through, on all pages. The lines are the strip's border colour
showing through 1px gaps, so they hold however the cells wrap: three a row, two a row on a phone with
Total Earned across the bottom. A full-timer's strip has Total Job Count, Total Net WC and Total Pay.

**The numbers agree with the other pages.** `RP.PRODUCTIVITY` in `data.js` files a month at a time
from March 2021:

- Jobs and words add up to the dashboard's periods: this month 30 jobs and 55,040 words (the completed
  rows on My Jobs), Last 3 months 84 and 158,420, This year 241 and 452,880, All time 1,164 and
  2,184,300; last month is 27, the 3 months before 77 and Jan – Oct 2025 218, as the dashboard's
  changes imply.
- A month's earnings are its bill's jobs: September is B-2209 (1,608.66, the pending balance), August
  B-2201 (3,410.97, the payment in Recent activity). This month is not billed yet, so it is the
  dashboard's Delivered and Approved stages, 2,086.05.
- All-time Total Earned is 108,427.16 NZD: My Earnings' 106,421.11, less the 80.00 that bonuses and
  deductions add on the bills, plus the 2,086.05 not billed yet.
- Hours count per-minute work as hours, as `hours_ann` does: this month's 15.68 is 13.5 interpreting
  hours and 131 minutes of subtitling.

### A full-timer's page — `productivity.html?as=fulltimer`

Months only, as before: a full-timer is paid a month at a time. In the switch's place the toolbar
reads their base — *Base 50,000 words · 1,000.00 USD a month* — as plain text.

| Part | Shows |
| --- | --- |
| Columns | Month · Job Count · Translation WC · Revision WC · Legalization PC · Hours · Net WC · Excess Words · Excess Pay · Monthly Pay · Monthly Pay (AED). The tips on Hours, Net WC, Excess Words, Excess Pay and Monthly Pay are the old popovers, with the company's weights written in |
| Chart | Net words against a solid **base** line, Pay against the base salary, Jobs against their average |
| Open month | *How your net words were counted* — each kind of work, what was done, its weight and what it counted for, down to Net words — beside *Pay*: net words against the base on a bar, *38,495 to go before excess pay* while the month runs, then base salary, excess pay, monthly pay and ≈ AED |
| Totals | Total Job Count, Total Net WC (and how many went past the base), Total Pay (and its excess pay) |

`RP.FULLTIMER` holds it: `CompanyFullTimerServiceWeightConfig`'s default weights (translation 100%,
revision 50%, legalization 25%, hours 100%; other work 100%), 250 words a page, 500 an hour; the base,
the salary and the excess rate (USD 0.0333 a word, English → Arabic's NZD 0.055) are this preview's
own; AED because the billing address is in Dubai. Each variant keeps its own column choice.

**In the URL**: `?view=yearly`, `?period=last-12` / `2025` / `2025-01_2025-06`, `?metric=words`;
`?month=2026-09` or `?year=2025` opens that period in its place in the list.

**Narrower screens:** the freelancer's six columns fit from about 1,140px with the sidebar open (950px
with it collapsed); below that the table scrolls with Month pinned, and a full-timer's eleven do on
most laptops. On a phone the switch takes a row and period, columns and export share the next, the
totals strip goes two a row with Total Earned across the bottom, and the chart drops to 150px.

---

## Adding the next page

1. Copy a page's shell (e.g. `account.html`) and set `data-page` / `data-title` on `#rp-layout`.
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

Brand marks come from Phosphor (`whatsapp`, `paypal`). Wise has a mark in neither library, so its
payment card wears Lucide's `arrow-right-left` until the real logo is pasted in.

**Sorting** is the one exception: the table header uses
`templates/partials/_sorting_icon.html` verbatim — same three path pairs, same class names. The
partial's inline `display: none` is gone: `.is-asc` / `.is-desc` on the `<th>` choose the pair, so
both chevrons are always on screen and only the active direction is navy.

## The expanded row

Its anatomy comes from `company-profile.css` and `profile-details.css` rather than from the table:
one white card with a hairline border, an inset head carrying a navy rule, small uppercase navy
section titles, label-over-value rows, and a single filled navy control per decision.
**Navy is the primary**; gold is left for accents only — the file tags and the focus rings.

It is built to fit a laptop. The whole panel lands at roughly 330px for an invitation, 360px for a
bid request and 425px for an interpreting job. Two things keep it there: the identity moves into
the head so the fact grid does not repeat it, and Files sits beside Instructions instead of under
it. Both column splits are **container queries** on the panel's own width, not media queries —
opening or collapsing the sidebar moves that line by 184px, which a viewport query cannot see.

On a bid request the bid leads the decision side: *Your bid* with the countdown, the price field
and **Submit bid**, then *Not interested*. The suggested range is only a reference, so it is one quiet
line at the bottom — label and value on one row, like the Total on an Earnings bill.

The price field is a grey well: the price in the serif on the left, its currency on the right as a
quiet **NZD ⌄** select — the original `job_bid_form.html`'s choice of the job's currency or USD.
Switching it converts the suggested range and the placeholder, so the bid and its reference read in
one currency. A bid typed in USD is kept in NZD, as the original converts it before saving: the
toast repeats what was typed (*Bid of USD 280.00*), and the Bid Sent card reads
`NZD 462.12 ≈ USD 280.00`. Rates are `RP.FX`, the same the Professional Profile converts with.

## Keyboard

| Key | Does |
| --- | --- |
| `/` | Jump to the search field; on Professional Profile, the services search |
| `Esc` | Leave the search field, close any modal, the availability dropdown or the mobile drawer; on User Account and Professional Profile, close the Delete popover first; on My Earnings, close the period picker first; on Productivity, the Columns popover, the Export menu or the period picker |
| `Enter` | Submit a bid, when the bid field has focus; send a chat message on the job page (`Shift+Enter` for a new line); in Add services' rate, add the service to the list |
| `↑` / `↓` | Move between statuses in the availability dropdown; on Productivity, `↓` on Columns or Export opens it, and the arrows move between the Export formats |
| `←` / `→`, `Home` / `End` | On Productivity's chart, move between the periods; `Enter` opens the one in focus in the table |
| `Enter` in Technology's search | Pick the first match, or add what was typed as your own tool |
| `Enter` in Specialities' search | Pick the first match that still has room |
