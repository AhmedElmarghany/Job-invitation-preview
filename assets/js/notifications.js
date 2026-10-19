/* ============================================================
   NOTIFICATIONS — the topbar bell and the panel it opens.
   Built into #rpBell (layout.js) on every page from RP.NOTIFICATIONS:
   newest first, in day groups, a job's repeated reminders and
   re-sent invitations folded into one row. Older rows load as the
   panel scrolls. Read and removed state lasts for the tab
   (sessionStorage); sound and desktop alerts for the browser.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;

    var LOCALE = "en-NZ";
    var PAGE = 12;
    var MINUTE = 60000;
    var HOUR = 60 * MINUTE;
    var DAY = 24 * HOUR;
    var UNDO_MS = 6000;
    var STATE_KEY = "rp_notifications";
    var PREFS_KEY = "rp_notification_prefs";

    var state = {
        open: false,
        view: "list",
        filter: "all",
        shown: PAGE,
        loading: false,
        expanded: {},
        items: [],
        read: {},
        removed: {},
        extra: [],
        undo: null,
        freshId: null,
        menuRow: null,
        menuBtn: null
    };

    /* The old strip's default volume was 5%, too quiet to notice; 40% is still gentle */
    var prefs = { sound: true, volume: 40, desktop: false };

    var els = {};
    var audio = null;
    var undoTimer = null;
    var clockTimer = null;
    var observer = null;

    /* ── Small helpers ───────────────────────────────────── */

    function esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function still() {
        return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    /* Storage throws in some browsers when the page is opened straight off disk */
    function readJSON(store, key) {
        try {
            return JSON.parse(store.getItem(key));
        } catch (err) {
            return null;
        }
    }

    function writeJSON(store, key, value) {
        try {
            store.setItem(key, JSON.stringify(value));
        } catch (err) {
            /* the change just does not outlive the page */
        }
    }

    function findBy(list, key, value) {
        for (var i = 0; i < (list || []).length; i++) {
            if (list[i][key] === value) return list[i];
        }
        return null;
    }

    function jobRow(id) {
        return findBy(RP.JOBS, "id", id) || findBy(RP.INVITATIONS, "id", id);
    }

    function hours(n) {
        return n + (n === 1 ? " hour" : " hours");
    }

    function money(value) {
        return value.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* "2d 4h" / "5h 12m" / "18m", as the invitations table counts down */
    function spread(ms) {
        var mins = Math.max(0, Math.floor(ms / MINUTE));
        var d = Math.floor(mins / 1440);
        var h = Math.floor((mins % 1440) / 60);
        var m = mins % 60;
        if (d) return d + "d " + h + "h";
        if (h) return h + "h " + m + "m";
        return m + "m";
    }

    /* ── Dates ───────────────────────────────────────────── */

    function dayStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    /* Rounded, so a daylight-saving day of 23 or 25 hours still counts as one */
    function groupOf(date, now) {
        var days = Math.round((dayStart(now) - dayStart(date)) / DAY);
        if (days <= 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return "Last 7 days";
        return "Older";
    }

    function clock(date) {
        return date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
    }

    function shortDate(date, now) {
        var opts = { day: "numeric", month: "short" };
        if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
        return date.toLocaleDateString(LOCALE, opts);
    }

    function longDate(date) {
        return date.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
    }

    function fullDate(date) {
        return date.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + ", " + clock(date);
    }

    /* A row's time: relative today, the clock under a day heading that already names the day */
    function when(date, now) {
        var group = groupOf(date, now);
        if (group === "Today") {
            var mins = Math.floor((now - date) / MINUTE);
            if (mins < 1) return "Just now";
            if (mins < 60) return mins + " min ago";
            return hours(Math.floor(mins / 60)) + " ago";
        }
        if (group === "Yesterday") return clock(date);
        if (group === "Last 7 days") return date.toLocaleDateString(LOCALE, { weekday: "short" }) + ", " + clock(date);
        return shortDate(date, now);
    }

    /* An earlier entry in a fold has no day heading of its own, so it names the day */
    function stamp(date, now) {
        var group = groupOf(date, now);
        if (group === "Today") return when(date, now);
        if (group === "Yesterday") return "Yesterday, " + clock(date);
        return when(date, now);
    }

    /* ── What each type says ─────────────────────────────── */

    function about(row) {
        if (!row) return "";
        return row.project + " · " + row.source + " → " + row.target;
    }

    function inviteChip(row) {
        if (!row) return null;
        if (row.status === "bid_sent") return { text: "Bid sent", tone: "good" };
        if (!row.expiresAt) return null;
        return expiryChip(row.expiresAt.getTime(), Date.now());
    }

    function expiryChip(until, now) {
        var left = until - now;
        if (left <= 0) return { text: "Expired", tone: "quiet", until: until };
        return { text: "Expires in " + spread(left), tone: left < 3 * HOUR ? "warn" : "quiet", until: until };
    }

    /* Real rows store one sentence; the port builds these per type on the server instead */
    function view(n) {
        var row, bill, cert, price;

        switch (n.type) {
            case "job_invitation":
            case "job_bid_invitation":
                row = jobRow(n.job);
                var interpreting = row && row.type === "interpretation";
                var bid = n.type === "job_bid_invitation";
                return {
                    icon: interpreting ? "interpreting" : bid ? "bid" : "invitations",
                    title: (interpreting ? "Interpreting invitation" : bid ? "Bid request" : "New invitation") + " for " + n.job,
                    short: bid ? "Bid request" : "Invitation",
                    detail: about(row),
                    chip: inviteChip(row),
                    href: "invitations.html?invited_job_id=" + n.job.replace("J-", "")
                };

            case "job_assign":
                return {
                    icon: "jobs",
                    title: n.job + " was assigned to you",
                    detail: about(jobRow(n.job)),
                    href: "job.html?id=" + n.job
                };

            case "job_delivery_reminder":
                return {
                    icon: n.dueIn > 0 ? "clock" : "clock-alert",
                    tone: n.dueIn > 0 ? "warn" : "bad",
                    title:
                        n.dueIn > 0 ? n.job + " is due in " + hours(n.dueIn)
                        : n.dueIn === 0 ? n.job + " is due now"
                        : n.job + " is " + hours(-n.dueIn) + " overdue",
                    detail: about(jobRow(n.job)),
                    href: "job.html?id=" + n.job
                };

            case "job_cancel":
                return {
                    icon: "bid",
                    tone: "quiet",
                    title: n.job + " went to another resource",
                    detail: about(n),
                    href: "invitations.html"
                };

            case "job_approved":
                return {
                    icon: "check-check",
                    title: n.job + " was approved",
                    detail: about(jobRow(n.job)),
                    href: "job.html?id=" + n.job
                };

            case "bill_issued":
                bill = findBy(RP.BILLS, "id", n.bill);
                return {
                    icon: "receipt",
                    title: "Bill " + n.bill + " was issued",
                    detail: bill ? money(bill.amount) + " " + RP.USER.currency + " · Due " + longDate(bill.due) : "",
                    href: "earnings.html?bill=" + n.bill
                };

            case "bill_paid":
                bill = findBy(RP.BILLS, "id", n.bill);
                return {
                    icon: "credit-card-check",
                    tone: "good",
                    title: "Bill " + n.bill + " was paid",
                    detail: bill ? money(bill.amount) + " " + RP.USER.currency + " · Paid by " + bill.method : "",
                    href: "earnings.html?bill=" + n.bill
                };

            case "certificate_verification":
                cert = findBy(RP.PROFILE && RP.PROFILE.certificates, "id", n.cert) || {};
                if (n.result === "rejected") {
                    return {
                        icon: "circle-alert",
                        tone: "bad",
                        title: "Certificate rejected",
                        detail: cert.name + (cert.reason ? " · " + cert.reason : ""),
                        href: "professional-profile.html?highlight_cert=" + n.cert
                    };
                }
                return {
                    icon: "badge-check",
                    tone: "good",
                    title: "Certificate verified",
                    detail: cert.name + " · " + cert.source + " → " + cert.target,
                    href: "professional-profile.html?highlight_cert=" + n.cert
                };

            case "certificate_expiring":
                cert = findBy(RP.PROFILE && RP.PROFILE.certificates, "id", n.cert) || {};
                return {
                    icon: "calendar-clock",
                    tone: "warn",
                    title: "Certificate expiring soon",
                    detail: cert.name + (cert.expires ? " · Expires " + longDate(cert.expires) : ""),
                    href: "professional-profile.html?highlight_cert=" + n.cert
                };

            case "language_pair_approval":
                price = findBy(RP.PRO && RP.PRO.prices, "id", n.price) || {};
                return {
                    icon: "languages",
                    tone: "good",
                    title: "Language pair approved",
                    detail: price.service + " · " + price.source + " → " + price.target,
                    href: "professional-profile.html#services"
                };

            case "payment_method_verified":
                return {
                    icon: "wallet",
                    tone: "good",
                    title: "Payment method verified",
                    detail: n.method || "",
                    href: "professional-profile.html#payment"
                };

            case "terms_updated":
                return {
                    icon: "shield-check",
                    title: "Terms and conditions updated",
                    detail: "Version " + n.version,
                    chip: RP.PROFILE && RP.PROFILE.terms.state !== "agreed" ? { text: "Action needed", tone: "warn" } : null,
                    href: "account.html#terms"
                };

            case "test":
                return {
                    icon: "bell-ring",
                    title: "Test notification",
                    detail: "Your notifications are working",
                    href: null
                };
        }

        return { icon: "notifications", title: n.description || "Notification", detail: "", href: null };
    }

    /* ── Rows: one per notification, or one per job for its repeats ── */

    function stackKey(n) {
        if (n.type === "job_delivery_reminder") return "due:" + n.job;
        if (n.type === "job_invitation" || n.type === "job_bid_invitation") return "invite:" + n.job;
        return null;
    }

    /* The list is newest first, so a fold's first member is its latest and heads the row */
    function rowsOf(items) {
        var byKey = {};
        var out = [];
        items.forEach(function (n) {
            var key = stackKey(n);
            if (key && byKey[key]) {
                byKey[key].earlier.push(n);
                return;
            }
            var row = { id: n.id, head: n, earlier: [] };
            if (key) byKey[key] = row;
            out.push(row);
        });
        return out;
    }

    function members(row) {
        return [row.head].concat(row.earlier);
    }

    function isUnread(row) {
        return members(row).some(function (n) {
            return !n.read;
        });
    }

    function findRow(id) {
        return findBy(rowsOf(state.items), "id", id);
    }

    function rowElement(row) {
        return row ? els.body.querySelector('.rp-notification[data-id="' + row.id + '"]') : null;
    }

    function unreadCount() {
        return rowsOf(state.items).filter(isUnread).length;
    }

    /* ── State ───────────────────────────────────────────── */

    function load() {
        var saved = readJSON(global.sessionStorage, STATE_KEY) || {};
        state.read = saved.read || {};
        state.removed = saved.removed || {};
        state.extra = saved.extra || [];

        var extra = state.extra.map(function (n) {
            return Object.assign({}, n, { at: new Date(n.at) });
        });

        state.items = (RP.NOTIFICATIONS || [])
            .concat(extra)
            .filter(function (n) {
                return !state.removed[n.id];
            })
            .map(function (n) {
                return Object.assign({}, n, { read: n.id in state.read ? state.read[n.id] : n.read });
            })
            .sort(function (a, b) {
                return b.at - a.at || b.id - a.id;
            });
    }

    function persist() {
        writeJSON(global.sessionStorage, STATE_KEY, { read: state.read, removed: state.removed, extra: state.extra });
    }

    function setRead(list, value) {
        list.forEach(function (n) {
            n.read = value;
            state.read[n.id] = value;
        });
        persist();
    }

    function snapshot() {
        return JSON.stringify({ read: state.read, removed: state.removed, extra: state.extra });
    }

    function restore(snap) {
        writeJSON(global.sessionStorage, STATE_KEY, JSON.parse(snap));
        load();
    }

    /* ── Markup ──────────────────────────────────────────── */

    function panelMarkup() {
        return (
            '<section class="rp-notifications" id="rpNotifications" role="dialog" aria-labelledby="rpNotificationsTitle" tabindex="-1" hidden>' +
            '<div class="rp-notifications__view" data-view="list">' +
            '<header class="rp-notifications__head">' +
            '<div class="rp-notifications__bar">' +
            '<h2 class="rp-notifications__title" id="rpNotificationsTitle">Notifications</h2>' +
            '<button class="rp-notifications__icon-btn" type="button" data-act="settings" aria-label="Notification settings" title="Notification settings">' +
            icon("settings") +
            "</button>" +
            "</div>" +
            '<div class="rp-notifications__bar">' +
            '<div class="rp-segmented rp-notifications__filter" role="group" aria-label="Show notifications">' +
            '<button class="rp-segment" type="button" data-filter="all">All</button>' +
            '<button class="rp-segment" type="button" data-filter="unread">Unread<span class="rp-segment-count" data-unread-count></span></button>' +
            "</div>" +
            '<button class="rp-notifications__text-btn" type="button" data-act="read-all">' +
            icon("check-check") +
            "Mark all as read</button>" +
            "</div>" +
            "</header>" +
            '<div class="rp-notifications__body" data-body></div>' +
            "</div>" +
            settingsMarkup() +
            '<div class="rp-notifications__menu" role="menu" aria-label="Notification actions" data-menu hidden>' +
            '<button class="rp-notifications__menu-item" type="button" role="menuitem" data-act="menu-read"></button>' +
            '<button class="rp-notifications__menu-item rp-notifications__menu-item--danger" type="button" role="menuitem" data-act="menu-remove">' +
            icon("close") +
            "Remove</button>" +
            "</div>" +
            '<div class="rp-notifications__undo" data-undo hidden>' +
            '<span data-undo-text></span>' +
            '<button type="button" data-act="undo">Undo</button>' +
            "</div>" +
            '<p class="rp-notifications__sr" aria-live="polite" data-live></p>' +
            "</section>"
        );
    }

    function switchMarkup(name, label) {
        return (
            '<label class="rp-nset__switch">' +
            '<input class="rp-nset__input" type="checkbox" role="switch" data-pref="' +
            name +
            '">' +
            '<span class="rp-nset__track" aria-hidden="true"><span class="rp-nset__thumb"></span></span>' +
            '<span class="rp-nset__label">' +
            label +
            "</span>" +
            "</label>"
        );
    }

    function settingsMarkup() {
        return (
            '<div class="rp-notifications__view" data-view="settings" hidden>' +
            '<header class="rp-notifications__head rp-notifications__head--sub">' +
            '<button class="rp-notifications__icon-btn" type="button" data-act="back" aria-label="Back to notifications" title="Back to notifications">' +
            icon("chevron-left") +
            "</button>" +
            '<h2 class="rp-notifications__title">Notification settings</h2>' +
            "</header>" +
            '<div class="rp-notifications__settings">' +
            '<section class="rp-nset" aria-labelledby="rpNsetSound">' +
            '<h3 class="rp-nset__title" id="rpNsetSound">' +
            icon("volume-2") +
            "Sound</h3>" +
            switchMarkup("sound", "Play a sound when a notification arrives") +
            '<div class="rp-nset__volume" data-volume-row>' +
            '<span class="rp-nset__volume-icon" aria-hidden="true" data-volume-icon></span>' +
            '<input class="rp-nset__range" type="range" min="0" max="100" step="5" data-pref="volume" aria-label="Volume">' +
            '<output class="rp-nset__value" data-volume-value></output>' +
            '<button class="rp-notifications__text-btn" type="button" data-act="test-sound">' +
            icon("play") +
            "Test</button>" +
            "</div>" +
            "</section>" +
            '<section class="rp-nset" aria-labelledby="rpNsetDesktop">' +
            '<h3 class="rp-nset__title" id="rpNsetDesktop">' +
            icon("monitor") +
            "Desktop alerts</h3>" +
            switchMarkup("desktop", "Show an alert when this tab is in the background") +
            '<p class="rp-nset__state" data-desktop-state hidden></p>' +
            "</section>" +
            "</div>" +
            '<footer class="rp-notifications__foot">' +
            '<button class="rp-notifications__btn" type="button" data-act="send-test">' +
            icon("bell-ring") +
            "<span>Send a test notification</span></button>" +
            "</footer>" +
            "</div>"
        );
    }

    function chipMarkup(chip) {
        return (
            '<span class="rp-notification__chip rp-notification__chip--' +
            chip.tone +
            '"' +
            (chip.until ? ' data-until="' + chip.until + '"' : "") +
            ">" +
            esc(chip.text) +
            "</span>"
        );
    }

    function timeMarkup(date, now, earlier) {
        return (
            '<time class="rp-notification__time" datetime="' +
            date.toISOString() +
            '" title="' +
            fullDate(date) +
            '" data-at="' +
            date.getTime() +
            '"' +
            (earlier ? " data-stamp" : "") +
            ">" +
            (earlier ? stamp(date, now) : when(date, now)) +
            "</time>"
        );
    }

    function stackMarkup(row, now) {
        var open = !!state.expanded[row.id];
        var count = row.earlier.length;
        var noun = row.head.type === "job_delivery_reminder" ? "reminder" : "invitation";

        return (
            '<button class="rp-notification__stack" type="button" data-act="stack" aria-expanded="' +
            open +
            '" aria-controls="rpEarlier' +
            row.id +
            '">' +
            icon("chevron-down") +
            count +
            " earlier " +
            noun +
            (count === 1 ? "" : "s") +
            "</button>" +
            '<ol class="rp-notification__earlier" id="rpEarlier' +
            row.id +
            '"' +
            (open ? "" : " hidden") +
            ">" +
            row.earlier
                .map(function (n) {
                    return (
                        '<li class="rp-notification__earlier-item' +
                        (n.read ? "" : " is-unread") +
                        '"><span>' +
                        esc(view(n).title) +
                        "</span>" +
                        timeMarkup(n.at, now, true) +
                        "</li>"
                    );
                })
                .join("") +
            "</ol>"
        );
    }

    function rowMarkup(row, now) {
        var n = row.head;
        var v = view(n);
        var unread = isUnread(row);
        var tag = v.href ? "a" : "button";
        var readLabel = unread ? "Mark as read" : "Mark as unread";

        return (
            '<li class="rp-notification' +
            (unread ? " rp-notification--unread" : "") +
            (state.freshId === row.id ? " is-fresh" : "") +
            '" data-id="' +
            row.id +
            '">' +
            "<" +
            tag +
            ' class="rp-notification__link" ' +
            (v.href ? 'href="' + esc(v.href) + '"' : 'type="button"') +
            ' data-open="' +
            row.id +
            '">' +
            '<span class="rp-notification__icon' +
            (v.tone ? " rp-notification__icon--" + v.tone : "") +
            '" aria-hidden="true">' +
            icon(v.icon) +
            "</span>" +
            '<span class="rp-notification__main">' +
            '<span class="rp-notification__line">' +
            '<span class="rp-notification__title">' +
            (unread ? '<span class="rp-notifications__sr">Unread: </span>' : "") +
            esc(v.title) +
            "</span>" +
            timeMarkup(n.at, now) +
            "</span>" +
            (v.detail ? '<span class="rp-notification__detail">' + esc(v.detail) + "</span>" : "") +
            (v.chip ? '<span class="rp-notification__meta">' + chipMarkup(v.chip) + "</span>" : "") +
            "</span>" +
            "</" +
            tag +
            ">" +
            '<span class="rp-notification__dot" aria-hidden="true"></span>' +
            '<span class="rp-notification__actions">' +
            '<button class="rp-notification__action" type="button" data-act="toggle-read" aria-label="' +
            readLabel +
            '" title="' +
            readLabel +
            '">' +
            icon(unread ? "check" : "circle-dot") +
            "</button>" +
            '<button class="rp-notification__action rp-notification__action--remove" type="button" data-act="remove" aria-label="Remove notification" title="Remove">' +
            icon("close") +
            "</button>" +
            "</span>" +
            '<button class="rp-notification__more" type="button" data-act="menu" aria-label="More actions" aria-haspopup="menu" aria-expanded="false">' +
            icon("ellipsis") +
            "</button>" +
            (row.earlier.length ? stackMarkup(row, now) : "") +
            "</li>"
        );
    }

    function skeletonMarkup(count) {
        var one =
            '<div class="rp-notifications__skeleton" aria-hidden="true">' +
            '<span class="rp-notifications__bone rp-notifications__bone--icon"></span>' +
            '<span class="rp-notifications__bones">' +
            '<span class="rp-notifications__bone"></span>' +
            '<span class="rp-notifications__bone rp-notifications__bone--short"></span>' +
            "</span></div>";
        var out = "";
        for (var i = 0; i < count; i++) out += one;
        return out;
    }

    function emptyMarkup() {
        var caughtUp = state.filter === "unread" && state.items.length > 0;
        return (
            '<div class="rp-notifications__empty">' +
            '<span class="rp-notifications__empty-icon" aria-hidden="true">' +
            icon(caughtUp ? "check-check" : "bell-off") +
            "</span>" +
            '<p class="rp-notifications__empty-title">' +
            (caughtUp ? "You're all caught up" : "No notifications yet") +
            "</p>" +
            (caughtUp
                ? '<button class="rp-notifications__text-btn" type="button" data-filter="all">Show all notifications</button>'
                : '<p class="rp-notifications__empty-note">Invitations, deadlines and payments show up here.</p>') +
            "</div>"
        );
    }

    /* ── Render ──────────────────────────────────────────── */

    function visibleRows() {
        var all = rowsOf(state.items);
        return state.filter === "unread" ? all.filter(isUnread) : all;
    }

    function renderHead() {
        var count = unreadCount();
        els.panel.querySelectorAll("[data-filter]").forEach(function (btn) {
            if (!btn.classList.contains("rp-segment")) return;
            var active = btn.dataset.filter === state.filter;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
        var badge = els.panel.querySelector("[data-unread-count]");
        badge.textContent = count;
        badge.hidden = !count;
        els.panel.querySelector('[data-act="read-all"]').disabled = !count;
    }

    function renderBody() {
        var now = new Date();
        var list = visibleRows();
        var shown = list.slice(0, state.shown);
        var html = "";

        if (!list.length) {
            html = emptyMarkup();
        } else {
            var group = null;
            shown.forEach(function (row) {
                var label = groupOf(row.head.at, now);
                if (label !== group) {
                    if (group) html += "</ul></section>";
                    group = label;
                    html +=
                        '<section class="rp-notifications__group" aria-label="' +
                        label +
                        '"><h3 class="rp-notifications__group-label">' +
                        label +
                        '</h3><ul class="rp-notifications__list" role="list">';
                }
                html += rowMarkup(row, now);
            });
            html += "</ul></section>";

            if (shown.length < list.length) {
                html += '<div class="rp-notifications__tail" data-tail>' + (state.loading ? skeletonMarkup(2) : "") + "</div>";
            } else if (state.filter === "all" && list.length > PAGE) {
                html += '<p class="rp-notifications__end">No older notifications</p>';
            }
        }

        var top = els.body.scrollTop;
        els.body.innerHTML = html;
        els.body.scrollTop = top;
        watchTail();
    }

    function render() {
        renderHead();
        renderBody();
        updateBadge();
    }

    function updateBadge() {
        var count = unreadCount();
        els.badge.hidden = !count;
        els.badge.textContent = count > 9 ? "9+" : String(count);
        els.btn.setAttribute("aria-label", count ? "Notifications, " + count + " unread" : "Notifications");
    }

    /* One row redrawn in place, so the list does not jump while it is being read */
    function redrawRow(row, focusSelector) {
        var li = rowElement(row);
        if (!li) return;
        var holder = document.createElement("ul");
        holder.innerHTML = rowMarkup(row, new Date());
        var fresh = holder.firstElementChild;
        li.parentNode.replaceChild(fresh, li);
        if (focusSelector) {
            var target = fresh.querySelector(focusSelector);
            if (target) target.focus({ preventScroll: true });
        }
    }

    /* ── Loading older rows ──────────────────────────────── */

    function watchTail() {
        var tail = els.body.querySelector("[data-tail]");
        if (observer) observer.disconnect();
        if (!tail || !state.open) return;

        if (global.IntersectionObserver) {
            observer =
                observer ||
                new global.IntersectionObserver(
                    function (entries) {
                        if (entries.some(function (e) { return e.isIntersecting; })) loadMore();
                    },
                    { root: els.body, rootMargin: "0px 0px 120px 0px" }
                );
            observer.observe(tail);
        }
    }

    function loadMore() {
        if (state.loading || !state.open) return;
        state.loading = true;
        var tail = els.body.querySelector("[data-tail]");
        if (tail) tail.innerHTML = skeletonMarkup(2);

        /* Stands in for the request a page of older rows would take */
        global.setTimeout(function () {
            state.loading = false;
            state.shown += PAGE;
            renderBody();
        }, 450);
    }

    /* Browsers without IntersectionObserver still load on scroll */
    function onScroll() {
        closeMenu(false);
        if (global.IntersectionObserver) return;
        var b = els.body;
        if (b.scrollTop + b.clientHeight >= b.scrollHeight - 120 && b.querySelector("[data-tail]")) loadMore();
    }

    /* ── Live times ──────────────────────────────────────── */

    function tick() {
        var now = new Date();
        els.panel.querySelectorAll("[data-at]").forEach(function (el) {
            var date = new Date(Number(el.getAttribute("data-at")));
            el.textContent = el.hasAttribute("data-stamp") ? stamp(date, now) : when(date, now);
        });
        els.panel.querySelectorAll("[data-until]").forEach(function (el) {
            var chip = expiryChip(Number(el.getAttribute("data-until")), now.getTime());
            el.textContent = chip.text;
            el.className = "rp-notification__chip rp-notification__chip--" + chip.tone;
        });
    }

    /* ── Open / close ────────────────────────────────────── */

    function open() {
        if (state.open) return;
        state.open = true;
        state.shown = PAGE;
        showView("list", false);
        els.panel.hidden = false;
        els.bell.classList.add("is-open");
        els.btn.setAttribute("aria-expanded", "true");
        els.body.scrollTop = 0;
        render();
        els.panel.focus({ preventScroll: true });
        clockTimer = global.setInterval(tick, 30000);
    }

    function close(returnFocus) {
        if (!state.open) return;
        state.open = false;
        closeMenu(false);
        hideUndo();
        if (observer) observer.disconnect();
        global.clearInterval(clockTimer);
        els.panel.hidden = true;
        els.bell.classList.remove("is-open");
        els.btn.setAttribute("aria-expanded", "false");
        if (returnFocus) els.btn.focus();
    }

    function showView(name, moveFocus) {
        state.view = name;
        closeMenu(false);
        els.panel.querySelectorAll("[data-view]").forEach(function (v) {
            v.hidden = v.getAttribute("data-view") !== name;
        });
        if (name === "settings") syncPrefs();
        if (moveFocus === false) return;
        var target = els.panel.querySelector(name === "settings" ? '[data-act="back"]' : '[data-act="settings"]');
        if (target) target.focus({ preventScroll: true });
    }

    function announce(text) {
        els.live.textContent = "";
        global.setTimeout(function () {
            els.live.textContent = text;
        }, 50);
    }

    /* ── Actions ─────────────────────────────────────────── */

    function setFilter(filter) {
        if (state.filter === filter) return;
        state.filter = filter;
        state.shown = PAGE;
        els.body.scrollTop = 0;
        renderHead();
        renderBody();
    }

    function openNotification(link, event) {
        var row = findRow(Number(link.getAttribute("data-open")));
        if (!row) return;
        setRead(members(row), true);

        if (!link.getAttribute("href")) {
            event.preventDefault();
            redrawRow(row, ".rp-notification__link");
            renderHead();
            updateBadge();
            return;
        }

        /* A new tab keeps this page as it is, so the row only turns read */
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            redrawRow(row);
            renderHead();
            updateBadge();
            return;
        }

        close(false);
        updateBadge();
    }

    function toggleRead(row, viaMenu) {
        if (!row) return;
        var unread = isUnread(row);
        if (unread) setRead(members(row), true);
        else setRead([row.head], false);
        redrawRow(row, viaMenu ? '[data-act="menu"]' : '[data-act="toggle-read"]');
        renderHead();
        updateBadge();
        announce(unread ? "Marked as read" : "Marked as unread");
    }

    function readAll() {
        var unread = state.items.filter(function (n) {
            return !n.read;
        });
        if (!unread.length) return;
        var snap = snapshot();
        setRead(unread, true);
        renderHead();
        renderBody();
        updateBadge();
        offerUndo("All marked as read", snap);
    }

    function removeRow(row) {
        if (!row) return;
        var li = rowElement(row);
        var next = li ? li.nextElementSibling || li.previousElementSibling : null;
        var nextId = next && next.getAttribute("data-id");
        var hadFocus = li && li.contains(document.activeElement);
        var snap = snapshot();

        members(row).forEach(function (n) {
            state.removed[n.id] = true;
        });
        persist();
        state.items = state.items.filter(function (n) {
            return !state.removed[n.id];
        });

        function finish() {
            renderHead();
            renderBody();
            updateBadge();
            if (!hadFocus) return;
            var target = nextId && els.body.querySelector('.rp-notification[data-id="' + nextId + '"] .rp-notification__link');
            (target || els.panel).focus({ preventScroll: true });
        }

        if (li && !still()) {
            li.classList.add("is-leaving");
            global.setTimeout(finish, 180);
        } else {
            finish();
        }
        offerUndo("Notification removed", snap);
    }

    function toggleStack(row, button) {
        var list = document.getElementById("rpEarlier" + row.id);
        if (!list) return;
        var open = list.hidden;
        list.hidden = !open;
        button.setAttribute("aria-expanded", String(open));
        if (open) state.expanded[row.id] = true;
        else delete state.expanded[row.id];
    }

    function offerUndo(text, snap) {
        state.undo = snap;
        els.undoText.textContent = text;
        els.undo.hidden = false;
        announce(text);
        global.clearTimeout(undoTimer);
        undoTimer = global.setTimeout(hideUndo, UNDO_MS);
    }

    function hideUndo() {
        global.clearTimeout(undoTimer);
        els.undo.hidden = true;
        state.undo = null;
    }

    function undo() {
        if (!state.undo) return;
        restore(state.undo);
        hideUndo();
        render();
        announce("Undone");
    }

    /* ── Touch: the ⋯ menu stands in for the hover buttons ── */

    function openMenu(row, button) {
        if (!row) return;
        if (state.menuRow && state.menuRow.id === row.id && !els.menu.hidden) {
            closeMenu(true);
            return;
        }
        closeMenu(false);
        state.menuRow = row;
        state.menuBtn = button;

        var unread = isUnread(row);
        els.menu.querySelector('[data-act="menu-read"]').innerHTML =
            icon(unread ? "check" : "circle-dot") + (unread ? "Mark as read" : "Mark as unread");

        els.menu.hidden = false;
        var panel = els.panel.getBoundingClientRect();
        var box = button.getBoundingClientRect();
        var top = box.bottom - panel.top + 4;
        if (top + els.menu.offsetHeight > panel.height - 8) top = box.top - panel.top - els.menu.offsetHeight - 4;
        els.menu.style.top = Math.max(8, top) + "px";
        els.menu.style.right = Math.max(8, panel.right - box.right) + "px";

        button.setAttribute("aria-expanded", "true");
        els.menu.querySelector("button").focus({ preventScroll: true });
    }

    function closeMenu(returnFocus) {
        if (!els.menu || els.menu.hidden) return;
        els.menu.hidden = true;
        if (state.menuBtn) {
            state.menuBtn.setAttribute("aria-expanded", "false");
            if (returnFocus && document.body.contains(state.menuBtn)) state.menuBtn.focus({ preventScroll: true });
        }
        state.menuRow = null;
        state.menuBtn = null;
    }

    /* ── Sound and desktop alerts ────────────────────────── */

    function readPrefs() {
        var saved = readJSON(global.localStorage, PREFS_KEY) || {};
        if (typeof saved.sound === "boolean") prefs.sound = saved.sound;
        if (typeof saved.volume === "number") prefs.volume = Math.min(100, Math.max(0, saved.volume));
        if (typeof saved.desktop === "boolean") prefs.desktop = saved.desktop;
    }

    function savePrefs() {
        writeJSON(global.localStorage, PREFS_KEY, prefs);
    }

    function desktopSupport() {
        return "Notification" in global ? global.Notification.permission : "unsupported";
    }

    /* The browser only lets audio start inside a click, so the context is made there */
    function ensureAudio() {
        var Ctx = global.AudioContext || global.webkitAudioContext;
        if (!Ctx) return null;
        try {
            audio = audio || new Ctx();
            if (audio.state === "suspended") audio.resume();
        } catch (err) {
            audio = null;
        }
        return audio;
    }

    /* A soft two-note chime, made here, so the preview needs no sound file */
    function chime(force) {
        if ((!force && !prefs.sound) || !prefs.volume || !ensureAudio()) return;
        var start = audio.currentTime + 0.01;
        var peak = 0.3 * (prefs.volume / 100);
        [[880, 0], [1318.51, 0.11]].forEach(function (note) {
            var at = start + note[1];
            var osc = audio.createOscillator();
            var gain = audio.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(note[0], at);
            gain.gain.setValueAtTime(0.0001, at);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.38);
            osc.connect(gain);
            gain.connect(audio.destination);
            osc.start(at);
            osc.stop(at + 0.4);
        });
    }

    function syncPrefs() {
        var p = els.panel;
        var support = desktopSupport();
        var range = p.querySelector('[data-pref="volume"]');
        var desktop = p.querySelector('[data-pref="desktop"]');
        var note = p.querySelector("[data-desktop-state]");
        var audible = prefs.sound && prefs.volume > 0;

        p.querySelector('[data-pref="sound"]').checked = prefs.sound;
        range.value = prefs.volume;
        range.disabled = !prefs.sound;
        p.querySelector("[data-volume-value]").textContent = prefs.volume + "%";
        p.querySelector("[data-volume-icon]").innerHTML = icon(audible ? "volume-2" : "volume-x");
        p.querySelector("[data-volume-row]").classList.toggle("is-off", !prefs.sound);
        p.querySelector('[data-act="test-sound"]').disabled = !audible;

        desktop.checked = prefs.desktop && support === "granted";
        desktop.disabled = support === "unsupported" || support === "denied";
        var text =
            support === "unsupported" ? "This browser cannot show desktop alerts."
            : support === "denied" ? "Blocked in this browser's site settings."
            : "";
        note.textContent = text;
        note.hidden = !text;
    }

    function askDesktop() {
        var support = desktopSupport();
        if (support === "granted") {
            prefs.desktop = true;
            savePrefs();
            syncPrefs();
            return;
        }
        if (support !== "default") {
            syncPrefs();
            return;
        }

        /* Older Safari answers through a callback, the rest with a promise */
        var settled = false;
        function done(result) {
            if (settled) return;
            settled = true;
            prefs.desktop = result === "granted";
            savePrefs();
            syncPrefs();
        }
        var asked = global.Notification.requestPermission(done);
        if (asked && asked.then) asked.then(done, function () { done("denied"); });
    }

    function desktopAlert(n) {
        if (!prefs.desktop || desktopSupport() !== "granted" || !document.hidden) return;
        var v = view(n);
        try {
            var alert = new global.Notification(v.title, { body: v.detail, icon: "assets/img/logo.png", tag: "rp-" + n.id });
            alert.onclick = function () {
                global.focus();
                if (v.href) global.location.href = v.href;
                else open();
                alert.close();
            };
        } catch (err) {
            /* some mobile browsers only allow alerts from a service worker */
        }
    }

    function onPrefChange(event) {
        var key = event.target.getAttribute("data-pref");
        if (key === "sound") {
            prefs.sound = event.target.checked;
            savePrefs();
            syncPrefs();
            if (prefs.sound) chime();
        } else if (key === "volume") {
            chime();
        } else if (key === "desktop") {
            if (event.target.checked) {
                askDesktop();
            } else {
                prefs.desktop = false;
                savePrefs();
                syncPrefs();
            }
        }
    }

    function onPrefInput(event) {
        if (event.target.getAttribute("data-pref") !== "volume") return;
        prefs.volume = Number(event.target.value);
        savePrefs();
        syncPrefs();
    }

    /* ── Arrivals ────────────────────────────────────────── */

    function ring() {
        if (still()) return;
        els.bell.classList.remove("is-ringing");
        void els.bell.offsetWidth;
        els.bell.classList.add("is-ringing");
        global.setTimeout(function () {
            els.bell.classList.remove("is-ringing");
        }, 1000);
    }

    /* What a pushed notification does, as the WebSocket's onmessage would */
    function arrive(n) {
        state.extra.push({ id: n.id, type: n.type, at: n.at.toISOString(), read: false });
        persist();
        load();
        state.freshId = n.id;

        if (state.open) {
            if (state.view !== "list") showView("list", false);
            els.body.scrollTop = 0;
            render();
        } else {
            updateBadge();
            RP.toast(view(n).title, "info");
        }

        ring();
        chime();
        desktopAlert(n);
        announce("New notification: " + view(n).title);

        global.setTimeout(function () {
            state.freshId = null;
            var li = els.body.querySelector(".rp-notification.is-fresh");
            if (li) li.classList.remove("is-fresh");
        }, 2600);
    }

    function sendTest(button) {
        var label = button.querySelector("span");
        ensureAudio();
        button.disabled = true;
        label.textContent = "Sending…";
        global.setTimeout(function () {
            button.disabled = false;
            label.textContent = "Send a test notification";
            arrive({ id: Date.now(), type: "test", at: new Date(), read: false });
        }, 2000);
    }

    /* ── Events ──────────────────────────────────────────── */

    function onClick(event) {
        var target = event.target.closest("[data-act], [data-filter], [data-open]");
        if (!target || !els.panel.contains(target)) return;

        if (target.hasAttribute("data-filter")) {
            setFilter(target.getAttribute("data-filter"));
            return;
        }
        if (target.hasAttribute("data-open")) {
            openNotification(target, event);
            return;
        }

        var li = target.closest(".rp-notification");
        var row = li ? findRow(Number(li.getAttribute("data-id"))) : null;

        switch (target.getAttribute("data-act")) {
            case "settings":
                showView("settings");
                break;
            case "back":
                showView("list");
                break;
            case "read-all":
                readAll();
                break;
            case "toggle-read":
                toggleRead(row);
                break;
            case "remove":
                removeRow(row);
                break;
            case "stack":
                toggleStack(row, target);
                break;
            case "menu":
                openMenu(row, target);
                break;
            case "menu-read":
                var readRow = state.menuRow;
                closeMenu(false);
                toggleRead(readRow, true);
                break;
            case "menu-remove":
                var gone = state.menuRow;
                closeMenu(false);
                removeRow(gone);
                break;
            case "undo":
                undo();
                break;
            case "test-sound":
                chime(true);
                break;
            case "send-test":
                sendTest(target);
                break;
        }
    }

    /* ↑ / ↓ / Home / End walk the rows, the way a list of links should */
    function onKeydown(event) {
        var keys = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" };
        if (!(event.key in keys)) return;
        if (event.target !== els.panel && !event.target.closest("[data-body]")) return;

        var links = [].slice.call(els.body.querySelectorAll(".rp-notification__link"));
        if (!links.length) return;
        var li = event.target.closest(".rp-notification");
        var at = li ? links.indexOf(li.querySelector(".rp-notification__link")) : -1;
        var move = keys[event.key];
        var next =
            move === "first" ? 0
            : move === "last" ? links.length - 1
            : at === -1 ? 0
            : Math.min(links.length - 1, Math.max(0, at + move));

        event.preventDefault();
        links[next].focus();
        links[next].scrollIntoView({ block: "nearest" });
    }

    function wire() {
        els.btn.addEventListener("click", function () {
            if (state.open) close(false);
            else open();
        });

        /* Capture: the profile trigger stops its clicks, and opening that menu must still close this one */
        document.addEventListener(
            "click",
            function (event) {
                if (!state.open) return;
                if (!els.menu.hidden && !event.target.closest("[data-menu]") && !event.target.closest('[data-act="menu"]')) {
                    closeMenu(false);
                }
                if (!els.bell.contains(event.target)) close(false);
            },
            true
        );

        document.addEventListener("keydown", function (event) {
            if (!state.open || event.key !== "Escape") return;
            if (!els.menu.hidden) closeMenu(true);
            else close(true);
        });

        els.panel.addEventListener("click", onClick);
        els.panel.addEventListener("keydown", onKeydown);
        els.panel.addEventListener("change", onPrefChange);
        els.panel.addEventListener("input", onPrefInput);
        els.body.addEventListener("scroll", onScroll, { passive: true });

        global.addEventListener("resize", function () {
            closeMenu(false);
        });
    }

    /* ── Boot ────────────────────────────────────────────── */

    function mount() {
        els.bell = document.getElementById("rpBell");
        if (!els.bell || !icon) return;

        els.btn = document.getElementById("rpBellBtn");
        els.badge = document.getElementById("rpBellBadge");
        els.bell.insertAdjacentHTML("beforeend", panelMarkup());
        els.panel = document.getElementById("rpNotifications");
        els.body = els.panel.querySelector("[data-body]");
        els.menu = els.panel.querySelector("[data-menu]");
        els.undo = els.panel.querySelector("[data-undo]");
        els.undoText = els.panel.querySelector("[data-undo-text]");
        els.live = els.panel.querySelector("[data-live]");

        readPrefs();
        load();
        updateBadge();
        wire();
    }

    RP.notifications = { open: open, close: close, arrive: arrive };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mount);
    } else {
        mount();
    }
})(window);
