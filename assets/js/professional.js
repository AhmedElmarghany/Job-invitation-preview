/* ============================================================
   PROFESSIONAL PROFILE — professional-profile.html
   What the resource offers and how they are paid, from RP.PRO:
   services and rates grouped by language pair with that pair's
   certificates, specialities, billing details, payment methods and
   emails. Every change stays in memory; a reload starts over.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;
    var PRO = RP.PRO;
    var P = RP.PROFILE;
    var LOCALE = "en-NZ";
    var BASE = "NZD";
    var DAY = 86400000;
    var SOON = 60;
    var MAX_SPECIALITIES = 10;
    var MAX_UPLOAD = 10 * 1024 * 1024;
    var MAILS_PAGE = 8;
    var PLACEHOLDER_PHOTO = RP.USER.photo;

    var SERVICE_ICON = {
        Translation: "languages",
        Proofreading: "spell-check",
        Certified: "badge-check",
        PostEditing: "bot",
        Transcreation: "pen-line",
        Subtitling: "captions",
        Interpreting: "interpreting",
        DTP: "pen-tool",
        Transcription: "mic",
        Formatting: "layout-template"
    };

    var PRICE_STATUS = {
        active: { label: "Active", pill: "status-active" },
        pending: { label: "Pending approval", pill: "status-pending", tip: "Waiting for a vendor manager to approve it. Jobs use it once it is active." }
    };

    var CERT_STATUS = {
        verified: { label: "Verified", pill: "status-verified" },
        pending: { label: "Pending verification", pill: "status-pending" },
        rejected: { label: "Rejected", pill: "status-rejected" },
        expired: { label: "Expired", pill: "status-overdue" }
    };

    var METHODS = {
        WISE: { label: "Wise", icon: "wise", add: "Be paid into your Wise account, in your own currency." },
        PAYPAL: { label: "PayPal", icon: "paypal", add: "Be paid to the email on your PayPal account." },
        WIRE: { label: "Wire transfer", icon: "landmark", add: "Be paid straight into your bank account." }
    };

    var MAIL_ICON = { invitations: "invitations", rates: "banknote", payments: "wallet", certificates: "award", account: "user-round" };

    var MAIL_TOPICS = [
        ["all", "All topics"],
        ["invitations", "Invitations"],
        ["payments", "Payments"],
        ["rates", "Rates"],
        ["certificates", "Certificates"],
        ["account", "Account"]
    ];

    var editing = { specialities: false, billing: false };
    var dirty = { specialities: false, billing: false };
    var specDraft = null;
    var view = { q: "", status: "all" };
    var collapsed = {};
    var staged = [];
    var picked = { photo: null, file: null };
    var mailView = { q: "", show: "all", topic: "all", page: 1 };
    var sections = [];
    var spyQueued = false;
    var lastFocus = null;
    var els = {};

    /* ── Formatting ──────────────────────────────────────── */

    function esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function fmtDate(date) {
        return date.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
    }

    function fmtTime(date) {
        return date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
    }

    /* Today shows the time, this year the day, anything older the full date */
    function fmtWhen(date) {
        var now = new Date();
        if (date.toDateString() === now.toDateString()) return fmtTime(date);
        if (date.getFullYear() === now.getFullYear()) return date.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
        return fmtDate(date);
    }

    function isoDate(date) {
        var pad = function (n) {
            return (n < 10 ? "0" : "") + n;
        };
        return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
    }

    function daysUntil(date) {
        return Math.ceil((date - Date.now()) / DAY);
    }

    function plural(n, word) {
        return n + " " + word + (n === 1 ? "" : "s");
    }

    function dot() {
        return '<span class="rp-dot" aria-hidden="true"></span>';
    }

    /* T- is the system's prefix; people know a resource by the number, as the old "Resource ID #202" showed it */
    function resourceNo() {
        return "#" + String(RP.USER.resourceId).replace(/^\D*-?/, "");
    }

    /* Per-word rates need four places to mean anything; hourly ones read better with two */
    function money(value) {
        var places = value < 1 ? 4 : 2;
        return value.toLocaleString(LOCALE, { minimumFractionDigits: places, maximumFractionDigits: places });
    }

    function inCurrency(nzd, code) {
        return nzd * RP.FX[code];
    }

    function langCode(name) {
        var lang = RP.LANGUAGES.filter(function (l) {
            return l.name === name;
        })[0];
        return lang ? lang.code : name.slice(0, 2).toUpperCase();
    }

    function countryName(code) {
        var c = RP.COUNTRIES.filter(function (x) {
            return x.code === code;
        })[0];
        return c ? c.name : "";
    }

    function countryCode(name) {
        var c = RP.COUNTRIES.filter(function (x) {
            return x.name === name;
        })[0];
        return c ? c.code : "";
    }

    function serviceDef(key) {
        return RP.SERVICES.filter(function (s) {
            return s.key === key;
        })[0];
    }

    function pairText(source, target) {
        return '<span class="rp-pair">' + esc(source) + icon("arrow-right") + esc(target) + "</span>";
    }

    /* Escapes first, then marks the first match, so a query can never inject markup */
    function hl(text, q) {
        var safe = esc(text);
        if (!q) return safe;
        var at = String(text).toLowerCase().indexOf(q);
        if (at === -1) return safe;
        return esc(text.slice(0, at)) + '<mark class="rp-mark">' + esc(text.slice(at, at + q.length)) + "</mark>" + esc(text.slice(at + q.length));
    }

    function pill(st, tip) {
        return (
            '<span class="status-pill ' + st.pill + '"' + (tip ? ' tabindex="0" data-tip="' + esc(tip) + '"' : "") +
            '><span class="status-dot"></span><span class="status-text">' + st.label + "</span></span>"
        );
    }

    function find(list, id) {
        return list.filter(function (row) {
            return row.id === id;
        })[0];
    }

    function nextId(list) {
        return (
            list.reduce(function (max, row) {
                return Math.max(max, row.id);
            }, 0) + 1
        );
    }

    /* ── Records ─────────────────────────────────────────── */

    function groupKey(p) {
        return p.source ? p.source + "|" + p.target : p.language ? "@" + p.language : "*";
    }

    function parseGroup(key) {
        if (!key) return { kind: "pair", source: "", target: "" };
        if (key === "*") return { kind: "none" };
        if (key.charAt(0) === "@") return { kind: "single", language: key.slice(1) };
        var parts = key.split("|");
        return { kind: "pair", source: parts[0], target: parts[1] };
    }

    function groupLabel(g) {
        if (g.kind === "pair") return g.source + " " + g.target;
        if (g.kind === "single") return g.language;
        return "Any language";
    }

    function pairKeys(extra) {
        var keys = [];
        PRO.prices.concat(extra || []).forEach(function (p) {
            var k = p.source ? p.source + "|" + p.target : null;
            if (k && keys.indexOf(k) === -1) keys.push(k);
        });
        return keys;
    }

    function certsFor(source, target) {
        return P.certificates.filter(function (c) {
            return c.source === source && c.target === target;
        });
    }

    /* A verified certificate past its date is expired, whatever the record says */
    function certState(c) {
        if (c.status === "verified" && c.expires && daysUntil(c.expires) <= 0) return "expired";
        return c.status;
    }

    /* Once the renewed one is sent, the old one stops asking to be renewed */
    function soonDays(c) {
        if (certState(c) !== "verified" || !c.expires || c.renewedBy) return null;
        var left = daysUntil(c.expires);
        return left <= SOON ? left : null;
    }

    function certsNeedingAction() {
        return P.certificates.filter(function (c) {
            var state = certState(c);
            return state === "rejected" || (state === "expired" && !c.renewedBy) || soonDays(c);
        });
    }

    /* Pairs first, in the order they were priced, then single languages, then the rest */
    function groupList() {
        var groups = [];
        var byKey = {};
        var order = RP.SERVICES.map(function (s) {
            return s.key;
        });

        function ensure(key) {
            if (!byKey[key]) {
                var g = parseGroup(key);
                g.key = key;
                g.prices = [];
                byKey[key] = g;
                groups.push(g);
            }
            return byKey[key];
        }

        PRO.prices.forEach(function (p) {
            ensure(groupKey(p)).prices.push(p);
        });
        /* A pair whose rates were all deleted keeps its certificates on screen */
        P.certificates.forEach(function (c) {
            ensure(c.source + "|" + c.target);
        });

        var rank = { pair: 0, single: 1, none: 2 };
        groups.forEach(function (g, i) {
            g.index = i;
            g.prices.sort(function (a, b) {
                return order.indexOf(a.service) - order.indexOf(b.service) || (a.mode || "").localeCompare(b.mode || "");
            });
        });
        return groups.sort(function (a, b) {
            return rank[a.kind] - rank[b.kind] || a.index - b.index;
        });
    }

    function groupId(key) {
        return "group-" + (key === "*" ? "any" : key.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""));
    }

    function defaultMethod() {
        return PRO.payment.filter(function (m) {
            return m.isDefault;
        })[0];
    }

    function findMethod(code) {
        return PRO.payment.filter(function (m) {
            return m.code === code;
        })[0];
    }

    function preferredCurrency() {
        var m = defaultMethod();
        return m && m.verified ? m.currency : null;
    }

    function unreadCount() {
        return PRO.emails.filter(function (m) {
            return m.unread;
        }).length;
    }

    function primaryAddress() {
        return { country: P.country, city: P.city, state: P.state, address: P.address, zip: P.zip };
    }

    function billingAddress() {
        return PRO.billing.sameAsPrimary ? primaryAddress() : PRO.billing;
    }

    /* ── Form controls ───────────────────────────────────── */

    function attrs(o) {
        var out = "";
        if (o.required) out += " required";
        if (o.readonly) out += " readonly";
        if (o.disabled) out += " disabled";
        if (o.maxlength) out += ' maxlength="' + o.maxlength + '"';
        if (o.placeholder) out += ' placeholder="' + esc(o.placeholder) + '"';
        if (o.min !== undefined) out += ' min="' + o.min + '"';
        if (o.step) out += ' step="' + o.step + '"';
        if (o.inputmode) out += ' inputmode="' + o.inputmode + '"';
        if (o.label) out += ' aria-label="' + esc(o.label) + '"';
        if (o.autofocus) out += " data-autofocus";
        if (o.autocomplete) out += ' autocomplete="' + o.autocomplete + '"';
        return out;
    }

    function input(id, value, o) {
        o = o || {};
        return (
            '<input type="' + (o.type || "text") + '" class="form-control" id="' + id + '" name="' + id + '" value="' +
            esc(value == null ? "" : value) + '"' + attrs(o) + ">"
        );
    }

    function select(id, options, value, o) {
        o = o || {};
        return (
            '<select class="form-control" id="' + id + '" name="' + id + '"' + attrs(o) + ">" +
            (o.empty ? '<option value="">' + esc(o.empty) + "</option>" : "") +
            options
                .map(function (opt) {
                    return (
                        '<option value="' + esc(opt[0]) + '"' + (String(opt[0]) === String(value) ? " selected" : "") + ">" +
                        esc(opt[1]) + "</option>"
                    );
                })
                .join("") +
            "</select>"
        );
    }

    function field(id, label, control, o) {
        o = o || {};
        return (
            '<div class="pd-field' + (o.cls ? " " + o.cls : "") + '"' + (o.attr || "") + '><label for="' + id + '">' + label +
            (o.required ? ' <span class="asterisk" aria-hidden="true">*</span>' : "") + "</label>" + control +
            (o.hint ? '<p class="pd-field-hint"' + (o.hintAttr || "") + ">" + o.hint + "</p>" : "") + "</div>"
        );
    }

    function languageOptions() {
        return RP.LANGUAGES.map(function (l) {
            return [l.name, l.name];
        });
    }

    function countryOptions(codes) {
        return RP.COUNTRIES.filter(function (c) {
            return !codes || codes.indexOf(c.code) !== -1;
        }).map(function (c) {
            return [c.code, c.name];
        });
    }

    /* ── Shared pieces ───────────────────────────────────── */

    function cardHead(iconName, title, aside) {
        return '<div class="rp-card__head"><h2 class="rp-card__title">' + icon(iconName) + title + "</h2>" + (aside || "") + "</div>";
    }

    function editChip(section) {
        return '<button type="button" class="pd-edit-btn" data-act="edit" data-edit="' + section + '">' + icon("pen-line") + "Edit</button>";
    }

    function cancelChip(section) {
        return '<button type="button" class="pd-edit-btn" data-act="cancel" data-edit="' + section + '">Cancel</button>';
    }

    function saveBar(section, formId) {
        return (
            '<div class="pd-actions"><p class="pd-actions-note" data-note="' + section + '">' +
            (dirty[section] ? "You have unsaved changes." : "") + "</p>" +
            '<button type="button" class="pd-btn pd-btn-secondary" data-act="cancel" data-edit="' + section + '">Cancel</button>' +
            '<button type="submit" form="' + formId + '" class="pd-btn pd-btn-primary" data-save="' + section + '">' +
            '<span class="pd-spinner" aria-hidden="true"></span><span class="pd-btn-label">Save</span></button></div>'
        );
    }

    function footEdit(section) {
        return '<div class="pd-actions is-twin">' + editChip(section).replace("pd-edit-btn", "pd-edit-btn pd-foot-edit") + "</div>";
    }

    function group(iconName, title, note, inner, o) {
        o = o || {};
        return (
            '<div class="pd-group"><div class="pd-group-head"><span class="pd-group-icon" aria-hidden="true">' + icon(iconName) +
            '</span><div class="pd-group-titles"><h3 class="pd-group-title">' + title + '</h3><p class="pd-group-note">' + note +
            "</p></div>" + (o.aside ? '<div class="pd-group-aside">' + o.aside + "</div>" : "") + "</div>" + (o.lead || "") +
            '<div class="pd-grid">' + inner + "</div></div>"
        );
    }

    /* A value, or the dashed "+ Add …" that opens the editor on that field */
    function item(label, value, focus, addLabel, cls) {
        var body = value
            ? '<div class="pd-value">' + value + "</div>"
            : focus
            ? '<button type="button" class="pd-add" data-act="edit" data-edit="billing" data-focus-field="' + focus + '">' + addLabel + "</button>"
            : '<div class="pd-value">—</div>';
        return '<div class="pd-item' + (cls ? " " + cls : "") + '"><p class="pd-label">' + label + "</p>" + body + "</div>";
    }

    function empty(iconName, title, note, act, label, extra) {
        return (
            '<div class="pd-empty"><span class="pd-empty-icon" aria-hidden="true">' + icon(iconName) + '</span><p class="pd-empty-title">' +
            title + '</p><p class="pd-empty-note">' + note + "</p>" +
            (act ? '<button type="button" class="rp-button rp-button--outline rp-button--sm" data-act="' + act + '"' + (extra || "") + ">" + icon("plus") + label + "</button>" : "") +
            "</div>"
        );
    }

    /* ── Head ────────────────────────────────────────────── */

    function headMarkup() {
        return (
            '<div class="rp-prohead__inner">' +
            '<nav class="rp-crumbs" aria-label="Breadcrumb"><a href="dashboard.html">Dashboard</a>' + icon("chevron-right") +
            '<span aria-current="page">Professional Profile</span></nav>' +
            '<div class="rp-prohead__row">' +
            '<div class="rp-prohead__avatar"><img src="' + esc(RP.USER.photo) + '" alt="' + esc(RP.USER.fullName) + '" data-avatar>' +
            '<button type="button" class="rp-prohead__camera" data-act="photo" aria-label="Change profile photo" title="Change photo">' +
            icon("camera") + "</button></div>" +
            '<div class="rp-prohead__titles"><h1 class="rp-prohead__title">' + esc(RP.USER.fullName) +
            (PRO.verified ? '<span class="rp-verified" tabindex="0" role="img" aria-label="Verified resource" data-tip="Verified resource">' + icon("badge-check-filled") + "</span>" : "") +
            "</h1>" +
            '<p class="rp-prohead__meta"><span class="rp-tag">' + esc(PRO.category) + '</span><span class="rp-idchip">ID ' + resourceNo() + "</span>" +
            (PRO.companyPreferred
                ? '<span class="rp-preferred" tabindex="0" data-tip="Bid requests reach you before they go out to all freelancers.">' + icon("star") + "Company preferred</span>"
                : "") +
            "</p></div>" +
            statusMarkup() +
            '<div class="rp-prohead__actions"><a class="rp-button rp-button--outline" href="account.html" title="User Account">' + icon("user-round") +
            '<span class="rp-prohead__actionlabel">User Account</span></a></div>' +
            "</div></div>"
        );
    }

    /* Under the topbar's own pill, so Change opens a dropdown right above the status it changes */
    function statusMarkup() {
        var av = (RP.AVAILABILITY || {})[RP.USER.availability] || { label: RP.USER.availability };
        return (
            '<div class="rp-prohead__status">' +
            '<span class="rp-prohead__statusvalue"><span class="rp-avstate rp-avstate--' + RP.USER.availability + '">' + esc(av.label) + "</span>" +
            '</span></div>'
        );
    }

    /* ── Section tabs ────────────────────────────────────── */

    function sectionList() {
        return [
            { id: "services", label: "Services &amp; prices", icon: "banknote", count: PRO.prices.length, flag: certsNeedingAction().length > 0 },
            { id: "specialities", label: "Specialities", icon: "tags", count: PRO.specialities.length },
            { id: "billing", label: "Billing details", icon: "receipt-new" },
            { id: "payment", label: "Payment method", icon: "wallet", flag: !preferredCurrency() },
            /* What is waiting to be read, not the size of the inbox */
            { id: "emails", label: "Emails", icon: "mail", count: unreadCount() }
        ];
    }

    function tabsMarkup(activeId) {
        return sectionList()
            .map(function (s) {
                var on = s.id === activeId;
                return (
                    '<a class="navigation-tabs-link' + (on ? " active" : "") + '" href="#' + s.id + '" data-section="' + s.id + '"' +
                    (on ? ' aria-current="true"' : "") + '><span class="navigation-tabs-icon">' + icon(s.icon) + "</span>" + s.label +
                    (s.count ? '<span class="navigation-tabs-badge">' + s.count + "</span>" : "") +
                    (s.flag ? '<span class="rp-tabdot" role="img" aria-label="Needs your attention"></span>' : "") +
                    "</a>"
                );
            })
            .join("");
    }

    /* ── Services & prices ───────────────────────────────── */

    function segment(key, label) {
        var on = view.status === key;
        return (
            '<button type="button" class="rp-segment' + (on ? " is-active" : "") + '" data-act="svc-status" data-status="' + key +
            '" aria-pressed="' + on + '">' + label + "</button>"
        );
    }

    function segmentsMarkup() {
        var pending = PRO.prices.filter(function (p) {
            return p.status === "pending";
        }).length;
        return (
            segment("all", "All") +
            segment("active", '<span class="status-dot status-active" aria-hidden="true"></span>Active') +
            segment(
                "pending",
                '<span class="status-dot status-pending" aria-hidden="true"></span>Pending approval' +
                    (pending ? '<span class="rp-segment-count">' + pending + "</span>" : "")
            )
        );
    }

    /* Its label and icon are set by paintCollapseAll, which reads the groups once they are on the page */
    function servicesBar() {
        return (
            '<div class="rp-svcbar"><label class="rp-search">' + icon("search") +
            '<input type="search" placeholder="Search by service or language" aria-label="Search services and languages" data-svc-search autocomplete="off" value="' +
            esc(view.q) + '"></label>' +
            '<div class="rp-segmented" role="group" aria-label="Filter by status" data-svc-segments>' + segmentsMarkup() + "</div>" +
            '<button type="button" class="pd-edit-btn rp-svcbar__toggle" data-act="toggle-all"></button></div>'
        );
    }

    function rowText(p) {
        return (serviceDef(p.service).name + " " + (p.mode || "") + " " + (p.type || "")).toLowerCase();
    }

    function convCode(p) {
        return p.entered && p.entered !== BASE ? p.entered : "USD";
    }

    /* The stamp shares the ≈ line it dates, so a rate takes two lines; the ≈ amount stays under the NZD one */
    function priceRow(p, q) {
        var def = serviceDef(p.service);
        var st = PRICE_STATUS[p.status];
        var code = convCode(p);
        return (
            '<li class="rp-svc" id="price-' + p.id + '">' +
            '<span class="rp-svc__icon" aria-hidden="true">' + icon(SERVICE_ICON[p.service] || "jobs") + "</span>" +
            '<div class="rp-svc__name"><p class="rp-svc__title">' + hl(def.name, q) +
            (p.mode ? '<span class="rp-svc__mode">' + hl(p.mode, q) + " → " + hl(p.type, q) + "</span>" : "") + "</p></div>" +
            '<div class="rp-svc__rate"><p class="rp-svc__price">' + BASE + " " + money(p.price) + ' <span class="rp-svc__unit">/ ' + def.unit + "</span></p>" +
            '<p class="rp-svc__conv"><span class="rp-svc__fx" data-tip="Exchange rate updated ' + fmtDate(p.rateUpdated) + ", " + fmtTime(p.rateUpdated) + '">' +
            icon("clock") + fmtWhen(p.rateUpdated) + "</span>" +
            '<span class="rp-svc__amount">≈ ' + code + " " + money(inCurrency(p.price, code)) + "</span></p></div>" +
            '<div class="rp-svc__status">' + pill(st, st.tip) + "</div>" +
            '<div class="rp-svc__actions">' +
            '<button type="button" class="rp-iconbtn rp-iconbtn--ghost" data-act="edit-price" data-id="' + p.id + '" aria-label="Edit the ' +
            esc(def.name) + ' rate" title="Edit rate">' + icon("pen-line") + "</button>" +
            '<div class="rp-confirm-wrap"><button type="button" class="rp-iconbtn rp-iconbtn--ghost is-danger" data-act="ask-delete" data-id="' + p.id +
            '" aria-label="Delete the ' + esc(def.name) + ' rate" title="Delete">' + icon("trash-2") + "</button></div></div></li>"
        );
    }

    function certRow(c, q) {
        var state = certState(c);
        var left = soonDays(c);
        var def = serviceDef(c.service);
        var expiry = c.expires ? (state === "expired" ? "Expired " : "Expires ") + fmtDate(c.expires) : "Lifetime";
        var renew = (state === "expired" && !c.renewedBy) || left;
        var editable = state === "pending" || state === "rejected";

        return (
            '<li class="rp-cert" id="cert-' + c.id + '">' +
            icon("certificate-colour", "rp-cert__icon") +
            '<div class="rp-cert__body"><button type="button" class="rp-cert__name" data-act="cert-details" data-id="' + c.id + '">' + hl(c.name, q) + "</button>" +
            '<p class="rp-cert__meta"><span>' + esc(def ? def.name : c.service) + "</span>" + dot() + "<span>ID " + esc(c.certId) + "</span>" + dot() +
            "<span>" + expiry + "</span>" +
            (left ? '<span class="rp-soon">' + icon("calendar-clock") + "Expires in " + plural(left, "day") + "</span>" : "") +
            (c.renewedBy ? '<span class="rp-renewed">' + icon("refresh-cw") + "Renewal sent</span>" : "") +
            "</p></div>" +
            '<div class="rp-cert__status">' + pill(CERT_STATUS[state]) + "</div>" +
            '<div class="rp-cert__actions">' +
            (renew ? '<button type="button" class="rp-chipbtn rp-chipbtn--line" data-act="renew-cert" data-id="' + c.id + '">' + icon("refresh-cw") + "Renew</button>" : "") +
            (editable
                ? '<button type="button" class="rp-iconbtn rp-iconbtn--ghost" data-act="edit-cert" data-id="' + c.id + '" aria-label="Edit ' + esc(c.name) +
                  '" title="Edit">' + icon("pen-line") + "</button>"
                : "") +
            '<button type="button" class="rp-iconbtn rp-iconbtn--ghost" data-act="view-file" data-name="' + esc(c.file) + '" aria-label="View the ' + esc(c.name) +
            ' file" title="View certificate">' + icon("view") + "</button></div>" +
            (state === "rejected" && c.reason
                ? '<div class="rp-callout rp-callout--danger">' + icon("circle-alert") + "<span><strong>Rejection reason:</strong> " + esc(c.reason) +
                  ' <button type="button" class="rp-linkbtn" data-act="edit-cert" data-id="' + c.id + '">Replace the file</button></span></div>'
                : "") +
            "</li>"
        );
    }

    function groupContent(g, q) {
        var labelHit = !!q && groupLabel(g).toLowerCase().indexOf(q) !== -1;
        var allCerts = g.kind === "pair" ? certsFor(g.source, g.target) : [];
        return {
            rows: g.prices.filter(function (p) {
                return (view.status === "all" || p.status === view.status) && (!q || labelHit || rowText(p).indexOf(q) !== -1);
            }),
            certs:
                view.status === "all"
                    ? allCerts.filter(function (c) {
                          return !q || labelHit || c.name.toLowerCase().indexOf(q) !== -1;
                      })
                    : [],
            allCerts: allCerts
        };
    }

    function groupMarkup(g, q) {
        var content = groupContent(g, q);
        var rows = content.rows;
        var certs = content.certs;
        var allCerts = content.allCerts;
        if (!rows.length && !certs.length) return "";

        var mark;
        var title;
        var kind;
        var name;
        if (g.kind === "pair") {
            mark = esc(langCode(g.source)) + icon("arrow-right") + esc(langCode(g.target));
            title = hl(g.source, q) + icon("arrow-right") + hl(g.target, q);
            kind = "Language pair";
            name = g.source + " → " + g.target;
        } else if (g.kind === "single") {
            mark = esc(langCode(g.language));
            title = hl(g.language, q);
            kind = "Single language";
            name = g.language;
        } else {
            mark = icon("globe");
            title = "Any language";
            kind = "Language independent";
            name = "Any language";
        }

        var canCert =
            g.kind === "pair" &&
            (allCerts.length ||
                g.prices.some(function (p) {
                    return serviceDef(p.service).certifiable;
                }));
        var gid = groupId(g.key);
        var shut = !!collapsed[g.key];

        /* The whole head toggles for a pointer; the chevron is the control a keyboard reaches */
        return (
            '<article class="rp-svcgroup' + (shut ? " is-collapsed" : "") + '" id="' + gid + '" data-key="' + esc(g.key) + '">' +
            '<header class="rp-svcgroup__head" data-act="toggle-group"><span class="rp-langmark" aria-hidden="true">' + mark + "</span>" +
            '<div class="rp-svcgroup__titles"><h3 class="rp-svcgroup__title">' + title + "</h3>" +
            '<p class="rp-svcgroup__meta"><span>' + kind + "</span>" + dot() + "<span>" + plural(g.prices.length, "service") + "</span>" +
            (allCerts.length ? dot() + "<span>" + plural(allCerts.length, "certificate") + "</span>" : "") + "</p></div>" +
            '<div class="rp-svcgroup__actions">' +
            '<button type="button" class="rp-chipbtn" data-act="add-services" data-group="' + esc(g.key) + '">' + icon("plus") + "Add service</button>" +
            (canCert ? '<button type="button" class="rp-chipbtn" data-act="add-cert" data-group="' + esc(g.key) + '">' + icon("award") + "Add certificate</button>" : "") +
            "</div>" +
            '<button type="button" class="rp-iconbtn rp-iconbtn--ghost rp-svcgroup__toggle" data-act="toggle-group" data-name="' + esc(name) +
            '" aria-expanded="' + !shut + '" aria-controls="' + gid + '-body" aria-label="' + (shut ? "Expand " : "Collapse ") + esc(name) + '" title="' +
            (shut ? "Expand" : "Collapse") + '">' + icon("chevron-down") + "</button></header>" +
            '<div class="rp-svcgroup__body" id="' + gid + '-body"' + (shut ? " inert" : "") + '><div class="rp-svcgroup__inner">' +
            (rows.length
                ? '<ul class="rp-svclist">' + rows.map(function (p) {
                      return priceRow(p, q);
                  }).join("") + "</ul>"
                : "") +
            (certs.length
                ? '<div class="rp-certs"><p class="rp-certs__label">Certificates</p><ul class="rp-certlist">' +
                  certs.map(function (c) {
                      return certRow(c, q);
                  }).join("") + "</ul></div>"
                : "") +
            "</div></div></article>"
        );
    }

    function groupsMarkup() {
        var q = view.q.trim().toLowerCase();
        var out = groupList()
            .map(function (g) {
                return groupMarkup(g, q);
            })
            .join("");
        if (out) return out;

        var why = q
            ? "No service, language or certificate matches “" + esc(view.q.trim()) + "”."
            : view.status === "pending"
            ? "No rate is waiting for approval."
            : "No rate is active yet.";
        return '<p class="rp-nomatch">' + why + ' <button type="button" class="rp-linkbtn" data-act="svc-clear">Show every service</button></p>';
    }

    function servicesCard() {
        var has = PRO.prices.length > 0 || P.certificates.length > 0;
        return (
            '<section class="rp-card" id="services">' +
            cardHead(
                "banknote",
                "Services &amp; prices",
                '<div class="rp-card__headactions">' +
                    '<button type="button" class="rp-iconbtn rp-iconbtn--bare" data-act="help" aria-label="How services and prices work" title="How it works">' +
                    icon("circle-help") + "</button>" +
                    (has ? '<button type="button" class="rp-textbtn" data-act="add-services">' + icon("plus") + "Add services</button>" : "") +
                    "</div>"
            ) +
            '<div class="rp-card__body">' +
            (has
                ? servicesBar() + '<div class="rp-svcgroups" data-svc-groups>' + groupsMarkup() + "</div>"
                : empty(
                      "banknote",
                      "No services yet",
                      "Add each service you offer, its languages and your rate. Project managers can only invite you to work you have a rate for.",
                      "add-services",
                      "Add your first service"
                  )) +
            "</div></section>"
        );
    }

    /* Filtering repaints the groups only, so the search field keeps its focus */
    function paintGroups() {
        var q = view.q.trim().toLowerCase();
        /* A filter opens the groups it finds, or a collapsed one would hide its own matches */
        if (q || view.status !== "all") {
            groupList().forEach(function (g) {
                var found = groupContent(g, q);
                if (found.rows.length || found.certs.length) delete collapsed[g.key];
            });
        }
        var host = document.querySelector("[data-svc-groups]");
        if (host) host.innerHTML = groupsMarkup();
        var segs = document.querySelector("[data-svc-segments]");
        if (segs) segs.innerHTML = segmentsMarkup();
        paintCollapseAll();
    }

    /* ── Collapse: kept in memory only, so a reload opens every group again ── */

    function everyShut(groups) {
        return (
            groups.length > 0 &&
            Array.prototype.every.call(groups, function (el) {
                return el.classList.contains("is-collapsed");
            })
        );
    }

    function setGroupOpen(el, open) {
        var key = el.dataset.key;
        if (open) delete collapsed[key];
        else collapsed[key] = true;
        if (el.classList.contains("is-collapsed") === !open) return;

        var btn = el.querySelector(".rp-svcgroup__toggle");
        var body = el.querySelector(".rp-svcgroup__body");
        /* Clipped until the slide really ends; a timer could unclip it early on a slow or hidden tab */
        if (!reduced()) {
            el.classList.add("is-moving");
            body.addEventListener("transitionend", function done(e) {
                if (e.target !== body || e.propertyName !== "grid-template-rows") return;
                body.removeEventListener("transitionend", done);
                el.classList.remove("is-moving");
            });
        }
        el.classList.toggle("is-collapsed", !open);
        body.inert = !open;
        btn.setAttribute("aria-expanded", String(open));
        btn.setAttribute("aria-label", (open ? "Collapse " : "Expand ") + btn.dataset.name);
        btn.title = open ? "Collapse" : "Expand";
    }

    function toggleGroup(el) {
        setGroupOpen(el, el.classList.contains("is-collapsed"));
        paintCollapseAll();
    }

    /* Collapse all reaches groups a filter hides too, so clearing the filter does not reopen them */
    function toggleAll() {
        var groups = document.querySelectorAll("#services .rp-svcgroup");
        var open = everyShut(groups);
        if (open) {
            collapsed = {};
        } else {
            groupList().forEach(function (g) {
                collapsed[g.key] = true;
            });
        }
        groups.forEach(function (el) {
            setGroupOpen(el, open);
        });
        paintCollapseAll();
    }

    function paintCollapseAll() {
        var btn = document.querySelector('[data-act="toggle-all"]');
        if (!btn) return;
        var groups = document.querySelectorAll("#services .rp-svcgroup");
        var shut = everyShut(groups);
        var label = shut ? "Expand all" : "Collapse all";
        btn.disabled = !groups.length;
        btn.title = label;
        btn.innerHTML = icon(shut ? "chevrons-up-down" : "chevrons-down-up") + '<span class="rp-svcbar__togglelabel">' + label + "</span>";
    }

    function setStatus(key) {
        view.status = key;
        paintGroups();
        var btn = document.querySelector('[data-act="svc-status"][data-status="' + key + '"]');
        if (btn) btn.focus({ preventScroll: true });
    }

    function clearFilters() {
        view.q = "";
        view.status = "all";
        var search = document.querySelector("[data-svc-search]");
        if (search) search.value = "";
        paintGroups();
        if (search) search.focus({ preventScroll: true });
    }

    /* ── Specialities ────────────────────────────────────── */

    function specGroups(list) {
        var known = [];
        var groups = RP.SPECIALITY_GROUPS.map(function (g) {
            known = known.concat(g.items);
            return {
                label: g.label,
                icon: g.icon,
                items: g.items.filter(function (name) {
                    return list.indexOf(name) !== -1;
                })
            };
        }).filter(function (g) {
            return g.items.length;
        });

        /* An industry added in Settings after these groups were drawn still shows */
        var other = list.filter(function (name) {
            return known.indexOf(name) === -1;
        });
        if (other.length) groups.push({ label: "Other", icon: "shapes", items: other });
        return groups;
    }

    function specView() {
        return (
            '<div class="rp-tech rp-tech--grid">' +
            specGroups(PRO.specialities)
                .map(function (g) {
                    return (
                        '<div class="rp-tech__group"><p class="rp-tech__label">' + icon(g.icon) + esc(g.label) + '</p><ul class="rp-chips">' +
                        g.items.map(function (name) {
                            return '<li class="rp-chip">' + esc(name) + "</li>";
                        }).join("") + "</ul></div>"
                    );
                })
                .join("") +
            "</div>"
        );
    }

    function specToggle(name) {
        var on = specDraft.indexOf(name) !== -1;
        var blocked = !on && specDraft.length >= MAX_SPECIALITIES;
        return (
            '<button type="button" class="rp-toggle" aria-pressed="' + on + '" data-act="toggle-spec" data-spec="' + esc(name) + '"' +
            (blocked ? " disabled" : "") + ">" + icon("check") + esc(name) + "</button>"
        );
    }

    function specCountText() {
        var n = specDraft.length;
        return n >= MAX_SPECIALITIES
            ? "<strong>" + n + "</strong> of " + MAX_SPECIALITIES + " · remove one to pick another"
            : "<strong>" + n + "</strong> of " + MAX_SPECIALITIES + " selected";
    }

    function specEditor() {
        return (
            '<form class="pd-form rp-techedit" id="rpSpecForm" novalidate>' +
            '<p class="rp-card__intro">Pick up to ' + MAX_SPECIALITIES + " subjects you know best. Project managers use them to match you with jobs.</p>" +
            '<div class="rp-techedit__bar"><label class="rp-search">' + icon("search") +
            '<input type="search" placeholder="Search specialities" aria-label="Search specialities" data-spec-search autocomplete="off"></label>' +
            '<span class="rp-techedit__count' + (specDraft.length >= MAX_SPECIALITIES ? " is-full" : "") + '" data-spec-count aria-live="polite">' +
            specCountText() + "</span></div>" +
            '<div class="rp-tech">' +
            RP.SPECIALITY_GROUPS.map(function (g) {
                return (
                    '<div class="rp-tech__group" data-group="' + g.key + '"><p class="rp-tech__label">' + icon(g.icon) + esc(g.label) +
                    '</p><div class="rp-chips">' + g.items.map(specToggle).join("") + "</div></div>"
                );
            }).join("") +
            '<p class="rp-tech__nomatch" data-spec-nomatch hidden></p>' +
            "</div></form>"
        );
    }

    function specialitiesCard() {
        var on = editing.specialities;
        var has = PRO.specialities.length > 0;
        var body;

        if (on) {
            body = specEditor() + saveBar("specialities", "rpSpecForm");
        } else if (!has) {
            body = empty(
                "tags",
                "Which subjects do you know best?",
                "Pick up to " + MAX_SPECIALITIES + " specialities. Project managers look here when a job needs a subject expert — a contract, a patient leaflet, a software release.",
                "edit",
                "Pick your specialities",
                ' data-edit="specialities"'
            );
        } else {
            body = specView() + footEdit("specialities");
        }

        return (
            '<section class="rp-card' + (on ? " is-editing" : "") + '" id="specialities">' +
            cardHead(
                "tags",
                "Specialities",
                '<div class="pd-head-actions">' +
                    (has && !on ? '<span class="rp-card__aside"><strong>' + PRO.specialities.length + "</strong> of " + MAX_SPECIALITIES + "</span>" : "") +
                    (on ? cancelChip("specialities") : has ? editChip("specialities") : "") + "</div>"
            ) +
            '<div class="rp-card__body">' + body + "</div></section>"
        );
    }

    function paintSpecLimit() {
        var full = specDraft.length >= MAX_SPECIALITIES;
        document.querySelectorAll("#rpSpecForm .rp-toggle").forEach(function (t) {
            t.disabled = full && t.getAttribute("aria-pressed") !== "true";
        });
        var count = document.querySelector("[data-spec-count]");
        if (count) {
            count.innerHTML = specCountText();
            count.classList.toggle("is-full", full);
        }
    }

    function toggleSpec(btn) {
        var name = btn.dataset.spec;
        var on = btn.getAttribute("aria-pressed") !== "true";
        if (on && specDraft.length >= MAX_SPECIALITIES) return;
        btn.setAttribute("aria-pressed", String(on));
        if (on) specDraft.push(name);
        else specDraft.splice(specDraft.indexOf(name), 1);
        paintSpecLimit();
        markDirty("specialities");
    }

    function filterSpecs(query) {
        var q = query.trim().toLowerCase();
        var matches = 0;
        document.querySelectorAll("#rpSpecForm .rp-tech__group").forEach(function (g) {
            var shown = 0;
            g.querySelectorAll(".rp-toggle").forEach(function (chip) {
                var hit = !q || chip.dataset.spec.toLowerCase().indexOf(q) !== -1;
                chip.hidden = !hit;
                if (hit) shown++;
            });
            matches += shown;
            g.hidden = !!q && !shown;
        });
        var none = document.querySelector("[data-spec-nomatch]");
        none.hidden = !q || matches > 0;
        if (!none.hidden) none.textContent = "No speciality matches “" + query.trim() + "”. The list comes from our team; ask your vendor manager to add one.";
    }

    /* ── Billing details ─────────────────────────────────── */

    var BILL_FIELDS = { bill_country: "country", bill_city: "city", bill_state: "state", bill_address: "address", bill_zip: "zip" };

    function taxGroup() {
        var why = "Only our vendor team can change these. Message your vendor manager if your tax status changes.";
        return group(
            "percent",
            "Tax",
            "How your bills are taxed.",
            item("Resource type", esc(PRO.billing.type)) +
                item("Tax registration", PRO.billing.taxRegistered ? "Registered" : "Not registered for VAT or GST"),
            { aside: '<span class="pd-lock-badge is-tip-end" tabindex="0" data-tip="' + why + '" aria-label="' + why + '">' + icon("lock") + "Not editable</span>" }
        );
    }

    function billingView() {
        var a = billingAddress();
        var same = PRO.billing.sameAsPrimary;
        /* Mirrored from User Account, so an empty value is fixed there, not here */
        var add = function (key) {
            return same ? null : key;
        };
        return group(
            "map-pin",
            "Billing address",
            "The address your bills are made out to.",
            item("Country", a.country ? esc(countryName(a.country)) : null, add("bill_country"), "Add country") +
                item("City", a.city ? esc(a.city) : null, add("bill_city"), "Add city") +
                item("State or Province", a.state ? esc(a.state) : null, add("bill_state"), "Add state or province") +
                item("Street address", a.address ? esc(a.address) : null, add("bill_address"), "Add street address", "pd-col-wide") +
                item("Postal code", a.zip ? esc(a.zip) : null, add("bill_zip"), "Add postal code"),
            {
                lead: same
                    ? '<p class="rp-billsame">' + icon("info") + '<span>Same as your primary address on <a href="account.html#personal">User Account</a>.</span></p>'
                    : ""
            }
        );
    }

    function billingForm() {
        var same = PRO.billing.sameAsPrimary;
        var a = billingAddress();
        return (
            '<form class="pd-form rp-billing' + (same ? " is-same" : "") + '" id="rpBillingForm" novalidate>' +
            group(
                "map-pin",
                "Billing address",
                "The address your bills are made out to.",
                field("bill_country", "Country", select("bill_country", countryOptions(), a.country, { required: true, empty: "Select your country", disabled: same }), {
                    required: true
                }) +
                    field("bill_city", "City", input("bill_city", a.city, { maxlength: 60, readonly: same })) +
                    field("bill_state", "State or Province", input("bill_state", a.state, { maxlength: 30, readonly: same })) +
                    field("bill_address", "Street address", input("bill_address", a.address, { maxlength: 160, required: true, readonly: same }), {
                        required: true,
                        cls: "pd-col-wide"
                    }) +
                    field("bill_zip", "Postal code", input("bill_zip", a.zip, { maxlength: 10, readonly: same })),
                {
                    lead:
                        '<label class="rp-optout"><input type="checkbox" data-same-primary' + (same ? " checked" : "") +
                        "><span>My billing address is the same as my primary address</span></label>"
                }
            ) +
            "</form>"
        );
    }

    function billingCard() {
        var on = editing.billing;
        return (
            '<section class="rp-card' + (on ? " is-editing" : "") + '" id="billing">' +
            cardHead("receipt-new", "Billing details", '<div class="pd-head-actions">' + (on ? cancelChip("billing") : editChip("billing")) + "</div>") +
            '<div class="rp-card__body">' +
            (on ? billingForm() + taxGroup() + saveBar("billing", "rpBillingForm") : billingView() + taxGroup() + footEdit("billing")) +
            "</div></section>"
        );
    }

    /* Ticked, the fields show the primary address and lock; unticked, they start from it */
    function setSame(form, same) {
        var primary = primaryAddress();
        form.classList.toggle("is-same", same);
        Object.keys(BILL_FIELDS).forEach(function (id) {
            var el = form.querySelector("#" + id);
            if (same) el.value = primary[BILL_FIELDS[id]] || "";
            if (el.tagName === "SELECT") el.disabled = same;
            else el.readOnly = same;
            el.classList.remove("is-invalid");
        });
        markDirty("billing");
    }

    /* ── Payment method ──────────────────────────────────── */

    function maskTail(value) {
        var clean = String(value || "").replace(/\s+/g, "");
        return clean.length > 4 ? "•••• " + clean.slice(-4) : clean;
    }

    function methodFacts(m) {
        if (m.code === "WIRE") {
            return [["Bank", m.bank], ["Account", maskTail(m.iban || m.account)], ["Currency", m.currency]];
        }
        return [["Account", m.email], ["Holder", m.holder], ["Currency", m.currency]];
    }

    function methodCard(m) {
        var def = METHODS[m.code];
        var status = pill(m.verified ? CERT_STATUS.verified : CERT_STATUS.pending);
        return (
            '<article class="rp-paycard' + (m.isDefault ? " is-default" : "") + '" id="method-' + m.code + '">' +
            '<div class="rp-paycard__head"><span class="rp-paycard__logo" aria-hidden="true">' + icon(def.icon) + "</span>" +
            '<div class="rp-paycard__titles"><h3 class="rp-paycard__name">' + def.label + '</h3><p class="rp-paycard__sub">Added ' + fmtDate(m.added) + "</p></div>" +
            (m.isDefault ? '<span class="rp-default">Default</span>' : "") + "</div>" +
            '<dl class="rp-paycard__facts">' +
            methodFacts(m)
                .map(function (f) {
                    return "<div><dt>" + f[0] + '</dt><dd title="' + esc(f[1]) + '">' + esc(f[1]) + "</dd></div>";
                })
                .join("") +
            "</dl>" +
            '<div class="rp-paycard__foot">' + status + '<div class="rp-paycard__actions">' +
            (m.isDefault ? "" : '<button type="button" class="rp-chipbtn rp-chipbtn--line" data-act="method-default" data-code="' + m.code + '">Make default</button>') +
            '<button type="button" class="rp-iconbtn rp-iconbtn--ghost" data-act="method-view" data-code="' + m.code + '" aria-label="' +
            (m.verified ? "Details of " : "Edit ") + def.label + '" title="' + (m.verified ? "Details" : "Edit") + '">' + icon(m.verified ? "view" : "pen-line") +
            "</button></div></div></article>"
        );
    }

    function addMethodCard(code) {
        var def = METHODS[code];
        return (
            '<button type="button" class="rp-paycard rp-paycard--add" data-act="method-add" data-code="' + code + '">' +
            '<span class="rp-paycard__logo" aria-hidden="true">' + icon(def.icon) + "</span>" +
            '<span class="rp-paycard__addtitle">' + icon("plus") + "Add " + (code === "WIRE" ? "a bank account" : def.label) + "</span>" +
            '<span class="rp-paycard__addnote">' + def.add + "</span></button>"
        );
    }

    function paymentCard() {
        var def = defaultMethod();
        var cur = preferredCurrency();
        var aside = cur
            ? '<span class="rp-card__aside is-tip-end" tabindex="0" data-tip="The currency of your default method. Your bills are paid in it.">Preferred currency <strong>' +
              cur + "</strong></span>"
            : '<span class="rp-card__aside">Preferred currency <strong>' + (def ? "pending verification" : "not set") + "</strong></span>";
        var cards = PRO.payment
            .slice()
            .sort(function (a, b) {
                return (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0);
            })
            .map(methodCard)
            .concat(
                Object.keys(METHODS)
                    .filter(function (code) {
                        return !findMethod(code);
                    })
                    .map(addMethodCard)
            )
            .join("");

        return (
            '<section class="rp-card" id="payment">' + cardHead("wallet", "Payment method", aside) +
            '<div class="rp-card__body"><p class="rp-card__intro">Your bills are paid to your default method, in its currency. A new or changed method is used once our team verifies it.</p>' +
            '<div class="rp-paylist">' + cards + "</div></div></section>"
        );
    }

    /* ── Emails ──────────────────────────────────────────── */

    function snippet(m) {
        return m.body.slice(1).join(" ").replace(/\s+/g, " ");
    }

    function mailRow(m) {
        return (
            '<li><button type="button" class="rp-mail' + (m.unread ? " is-unread" : "") + '" data-act="mail" data-id="' + m.id + '">' +
            '<span class="rp-mail__icon" aria-hidden="true">' + icon(MAIL_ICON[m.cat] || "mail") + "</span>" +
            '<span class="rp-mail__text"><span class="rp-mail__subject">' + esc(m.subject) + '</span><span class="rp-mail__snippet">' + esc(m.from) +
            " — " + esc(snippet(m)) + "</span></span>" +
            '<span class="rp-mail__date">' + fmtWhen(m.at) + "</span>" + (m.unread ? '<span class="rp-sr-only">Unread</span>' : "") +
            "</button></li>"
        );
    }

    /* A page of eight at a time, found by search and filters, so the card is one size at 8 emails or 200 */
    function emailsCard() {
        var unread = unreadCount();
        return (
            '<section class="rp-card" id="emails">' +
            cardHead("mail", "Emails", unread ? '<span class="rp-card__aside" data-unread><strong>' + unread + "</strong> unread</span>" : "") +
            '<div class="rp-card__body">' + mailBar() + '<div data-mail-list>' + mailListMarkup() + "</div></div></section>"
        );
    }

    /* Search on the left; the topic and All / Unread, which shape the list, on the right — as Services & prices */
    function mailBar() {
        return (
            '<div class="rp-mailbar"><label class="rp-search">' + icon("search") +
            '<input type="search" placeholder="Search subject, sender or text" aria-label="Search your emails" data-mail-search autocomplete="off" value="' +
            esc(mailView.q) + '"></label>' +
            '<select class="rp-mailbar__topic" aria-label="Topic" data-mail-topic>' +
            MAIL_TOPICS.map(function (t) {
                return '<option value="' + t[0] + '"' + (t[0] === mailView.topic ? " selected" : "") + ">" + t[1] + "</option>";
            }).join("") +
            "</select>" +
            '<div class="rp-segmented" role="group" aria-label="Show" data-mail-show>' + mailShowMarkup() + "</div></div>"
        );
    }

    function mailShowMarkup() {
        var unread = unreadCount();
        return [["all", "All"], ["unread", "Unread"]]
            .map(function (s) {
                var on = mailView.show === s[0];
                return (
                    '<button type="button" class="rp-segment' + (on ? " is-active" : "") + '" data-act="mail-show" data-show="' + s[0] + '" aria-pressed="' + on + '">' +
                    s[1] + (s[0] === "unread" && unread ? '<span class="rp-segment-count">' + unread + "</span>" : "") + "</button>"
                );
            })
            .join("");
    }

    function mailMatches() {
        var q = mailView.q.trim().toLowerCase();
        return PRO.emails
            .filter(function (m) {
                if (mailView.show === "unread" && !m.unread) return false;
                if (mailView.topic !== "all" && m.cat !== mailView.topic) return false;
                return !q || (m.subject + " " + m.from + " " + m.body.join(" ")).toLowerCase().indexOf(q) > -1;
            })
            .sort(function (a, b) {
                return b.at - a.at;
            });
    }

    function mailEmpty() {
        var topic = MAIL_TOPICS.filter(function (t) {
            return t[0] === mailView.topic;
        })[0][1].toLowerCase();
        var q = mailView.q.trim();
        if (q) return "No emails match “" + esc(q) + "”" + (mailView.show !== "all" || mailView.topic !== "all" ? " with these filters." : ".");
        if (mailView.show === "unread") return "No unread emails" + (mailView.topic !== "all" ? " about " + topic : "") + ".";
        return "No emails about " + topic + ".";
    }

    function mailListMarkup() {
        var list = mailMatches();
        var pages = Math.max(1, Math.ceil(list.length / MAILS_PAGE));
        mailView.page = Math.min(mailView.page, pages);
        var start = (mailView.page - 1) * MAILS_PAGE;

        if (!list.length) return '<p class="rp-mails__empty">' + mailEmpty() + "</p>";
        return '<ul class="rp-mails">' + list.slice(start, start + MAILS_PAGE).map(mailRow).join("") + "</ul>" + mailPager(list.length, pages, start);
    }

    /* The tables' pagination at card size: where you are, then the first, the last and the pages either side */
    function mailPager(total, pages, start) {
        var cur = mailView.page;
        var nums = "";
        for (var p = 1; p <= pages; p++) {
            if (p !== 1 && p !== pages && Math.abs(p - cur) > 1) {
                if (p === 2 || p === pages - 1) nums += '<span class="cu-page-ellipsis">…</span>';
                continue;
            }
            nums +=
                '<button type="button" class="cu-page-nav-btn' + (p === cur ? " active" : "") + '" data-act="mail-page" data-page="' + p + '" aria-label="Page ' + p + '"' +
                (p === cur ? ' aria-current="page"' : "") + ">" + p + "</button>";
        }
        var step = function (to, name, iconName) {
            return (
                '<button type="button" class="cu-page-nav-btn" data-act="mail-page" data-page="' + to + '" aria-label="' + name + '"' +
                (to < 1 || to > pages ? " disabled" : "") + ">" + icon(iconName) + "</button>"
            );
        };
        return (
            '<div class="rp-mails__foot"><span class="cu-page-info"><strong>' + (start + 1) + "–" + Math.min(start + MAILS_PAGE, total) + "</strong> of <strong>" + total + "</strong></span>" +
            (pages > 1 ? '<nav class="cu-page-nav" aria-label="Email pages">' + step(cur - 1, "Previous page", "chevron-left") + nums + step(cur + 1, "Next page", "chevron-right") + "</nav>" : "") +
            "</div>"
        );
    }

    /* ── Aside ───────────────────────────────────────────── */

    function attentionItems() {
        var items = [];
        P.certificates.forEach(function (c) {
            var state = certState(c);
            var left = soonDays(c);
            if (state === "rejected") {
                items.push({ cls: "is-danger", icon: "circle-alert", text: "Your " + esc(c.name) + " was rejected — replace the file", act: 'data-act="edit-cert" data-id="' + c.id + '"' });
            } else if (state === "expired" && !c.renewedBy) {
                items.push({ cls: "is-danger", icon: "calendar-clock", text: "Your " + esc(c.name) + " has expired — add the renewed one", act: 'data-act="renew-cert" data-id="' + c.id + '"' });
            } else if (left) {
                items.push({ cls: "is-urgent", icon: "calendar-clock", text: "Your " + esc(c.name) + " expires in " + plural(left, "day"), act: 'data-act="renew-cert" data-id="' + c.id + '"' });
            }
        });

        var def = defaultMethod();
        if (!def) items.push({ cls: "is-urgent", icon: "wallet", text: "Add a payment method, so your bills can be paid", act: 'data-act="goto" data-target="payment"' });
        else if (!def.verified) items.push({ icon: "hourglass", text: METHODS[def.code].label + " is waiting for verification", act: 'data-act="goto" data-target="payment"' });
        if (!PRO.prices.length) items.push({ cls: "is-urgent", icon: "banknote", text: "Add the services you offer and your rates", act: 'data-act="add-services"' });
        if (!PRO.specialities.length) items.push({ icon: "tags", text: "Pick your specialities", act: 'data-act="edit" data-edit="specialities"' });
        return items;
    }

    function attentionCard() {
        var items = attentionItems();
        if (!items.length) return "";
        return (
            '<section class="rp-card rp-attn">' +
            cardHead("list-todo", "Needs your attention", '<span class="rp-card__aside"><strong>' + items.length + "</strong> " + (items.length === 1 ? "item" : "items") + "</span>") +
            '<div class="rp-card__body"><ul class="rp-todo">' +
            items
                .map(function (x) {
                    return (
                        '<li><button type="button" class="rp-todo__item' + (x.cls ? " " + x.cls : "") + '" ' + x.act + '><span class="rp-todo__icon" aria-hidden="true">' +
                        icon(x.icon) + '</span><span class="rp-todo__text">' + x.text + "</span>" + icon("chevron-right") + "</button></li>"
                    );
                })
                .join("") +
            "</ul></div></section>"
        );
    }

    function srow(label, value) {
        return '<div class="rp-srow"><dt>' + label + "</dt><dd>" + value + "</dd></div>";
    }

    /* The ID card leads, as Resource ID does on User Account: who the resource is, then their work */
    function glanceCard() {
        var pending = PRO.prices.filter(function (p) {
            return p.status === "pending";
        }).length;
        var verified = P.certificates.filter(function (c) {
            return certState(c) === "verified";
        }).length;
        var vm = PRO.vendorManager;
        var def = defaultMethod();
        var cur = preferredCurrency();
        var muted = function (text) {
            return '<span class="rp-srow__muted">' + text + "</span>";
        };
        var currency = cur
            ? esc(cur) + " " + muted("via " + METHODS[def.code].label)
            : def
            ? '<span class="rp-srow__pending">Pending verification</span>'
            : muted("Not set");

        return (
            '<section class="rp-card rp-glance">' + cardHead("id-card", "At a glance") +
            '<div class="rp-card__body">' +
            '<div class="rp-idcard"><div class="rp-idcard__id">' +
            '<div class="rp-idcard__head"><span class="rp-idcard__label">Resource ID</span>' +
            '<button type="button" class="rp-iconbtn" data-act="copy-id" aria-label="Copy resource ID" title="Copy">' + icon("copy") + "</button></div>" +
            '<p class="rp-idcard__no">' + resourceNo() + "</p>" +
            '<p class="rp-idcard__tags"><span class="rp-tag">' + esc(PRO.category) + "</span>" +
            (PRO.companyPreferred
                ? '<span class="rp-preferred is-tip-end" tabindex="0" data-tip="Bid requests reach you before they go out to all freelancers.">' + icon("star") +
                  "Company preferred</span>"
                : "") +
            "</p></div>" +
            '<dl class="rp-srows rp-idcard__facts">' +
            srow("Native language", esc(PRO.nativeLanguage)) +
            srow("Preferred currency", currency) +
            srow("Joining date", fmtDate(PRO.joined)) +
            "</dl></div>" +
            '<dl class="rp-srows rp-glance__work">' +
            srow("Language pairs", pairKeys().length + " " + muted("of " + PRO.pairLimit)) +
            srow("Services", PRO.prices.length + (pending ? " " + muted(pending + " pending") : "")) +
            srow("Certificates", P.certificates.length + " " + muted(verified + " verified")) +
            srow("Specialities", PRO.specialities.length + " " + muted("of " + MAX_SPECIALITIES)) +
            srow(
                "Vendor manager",
                esc(vm.name) + '<button type="button" class="rp-iconbtn" data-act="message-vm" aria-label="Message ' + esc(vm.name) + '" title="Message">' +
                    icon("messages") + "</button>"
            ) +
            "</dl></div></section>"
        );
    }

    /* ── Render ──────────────────────────────────────────── */

    var CARDS = {
        services: servicesCard,
        specialities: specialitiesCard,
        billing: billingCard,
        payment: paymentCard,
        emails: emailsCard
    };

    function currentSection() {
        var active = els.tabs.querySelector(".navigation-tabs-link.active");
        return active ? active.dataset.section : "services";
    }

    function asideMarkup() {
        var attn = attentionCard();
        els.pro.classList.toggle("has-attn", !!attn);
        return attn + glanceCard();
    }

    function renderAll() {
        els.head.innerHTML = headMarkup();
        els.tabs.innerHTML = tabsMarkup("services");
        var main = servicesCard() + specialitiesCard() + billingCard() + paymentCard() + emailsCard();
        els.pro.innerHTML = '<div class="rp-pro__main">' + main + '</div><aside class="rp-pro__aside" aria-label="Profile summary">' + asideMarkup() + "</aside>";
        paintCollapseAll();
        collectSections();
        fitAside();
    }

    /* Swaps one card in place, so the reader keeps their scroll */
    function refresh(id) {
        var el = document.getElementById(id);
        if (el) el.outerHTML = CARDS[id]();
        if (id === "services") paintCollapseAll();
        collectSections();
    }

    /* Tabs and aside read the same records the cards do */
    function refreshSummary() {
        els.tabs.innerHTML = tabsMarkup(currentSection());
        var aside = els.pro.querySelector(".rp-pro__aside");
        if (aside) aside.innerHTML = asideMarkup();
        fitAside();
    }

    function copyId() {
        var id = resourceNo();
        var done = function () {
            RP.toast("Resource ID " + id + " copied.", "success");
        };
        if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
            global.navigator.clipboard.writeText(id).then(done, done);
        } else {
            done();
        }
    }

    /* A sticky aside taller than the window would hide its own foot, so it only sticks while it fits */
    function fitAside() {
        var aside = els.pro.querySelector(".rp-pro__aside");
        if (!aside) return;
        aside.classList.remove("is-loose");
        var style = global.getComputedStyle(aside);
        if (style.display === "contents") return;
        aside.classList.toggle("is-loose", aside.offsetHeight + (parseFloat(style.top) || 0) + 16 > global.innerHeight);
    }

    /* The topbar scrolls away with the page, so it is brought back before its dropdown opens */
    function openAvailability() {
        global.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
        setTimeout(function () {
            var pill = document.getElementById("rpAvailabilityBtn");
            if (pill) pill.click();
        }, reduced() ? 0 : 380);
    }

    function paintAvatars() {
        document.querySelectorAll("[data-avatar], .rp-sidebar__account-avatar, .rp-profile__avatar, .rp-profile__identity-avatar").forEach(function (img) {
            img.src = RP.USER.photo;
        });
    }

    /* ── Section tabs: scroll-spy ────────────────────────── */

    function collectSections() {
        sections = sectionList()
            .map(function (s) {
                return { id: s.id, el: document.getElementById(s.id) };
            })
            .filter(function (s) {
                return !!s.el;
            });
    }

    function setActive(id) {
        els.tabs.querySelectorAll(".navigation-tabs-link").forEach(function (link) {
            var on = link.dataset.section === id;
            link.classList.toggle("active", on);
            if (on) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
        });
    }

    function spy() {
        spyQueued = false;
        if (!sections.length) return;

        var line = els.nav.getBoundingClientRect().bottom + 48;
        var current = sections[0];
        sections.forEach(function (s) {
            if (s.el.getBoundingClientRect().top <= line) current = s;
        });

        var atEnd = global.innerHeight + global.scrollY >= document.documentElement.scrollHeight - 4;
        setActive(atEnd ? sections[sections.length - 1].id : current.id);
    }

    function reduced() {
        return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function goTo(id, then) {
        var el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", "#" + id);
        setActive(id);
        if (then) setTimeout(then, reduced() ? 0 : 420);
    }

    /* After a save focus follows the row; from a link on load it stays put */
    function flash(id, keepFocus) {
        var el = document.getElementById(id);
        if (!el) return;
        var shut = el.closest(".rp-svcgroup.is-collapsed");
        if (shut) {
            setGroupOpen(shut, true);
            paintCollapseAll();
        }
        el.classList.remove("is-flagged");
        void el.offsetWidth;
        el.classList.add("is-flagged");
        el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
        var first = !keepFocus && el.querySelector("button");
        if (first) first.focus({ preventScroll: true });
    }

    /* ── Inline editors ──────────────────────────────────── */

    function focusField(section, fieldId) {
        var form = document.querySelector("#" + section + " form");
        var target =
            (fieldId && document.getElementById(fieldId)) ||
            (form && form.querySelector("input:not([readonly]):not([type=hidden]):not(:disabled), select:not(:disabled), textarea"));
        if (!target) return;
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
    }

    function startEdit(section, fieldId) {
        if (!editing[section]) {
            editing[section] = true;
            dirty[section] = false;
            if (section === "specialities") specDraft = PRO.specialities.slice();
            refresh(section);
        }
        focusField(section, fieldId);
    }

    function stopEdit(section) {
        editing[section] = false;
        dirty[section] = false;
        if (section === "specialities") specDraft = null;
        refresh(section);
    }

    function cancelEdit(section) {
        stopEdit(section);
        var chip = document.querySelector("#" + section + ' [data-act="edit"]');
        if (chip) chip.focus({ preventScroll: true });
    }

    function markDirty(section) {
        if (!editing[section]) return;
        dirty[section] = true;
        var note = document.querySelector('[data-note="' + section + '"]');
        if (note) {
            note.classList.remove("is-error");
            note.textContent = "You have unsaved changes.";
        }
    }

    function busy(btn, on) {
        btn.classList.toggle("is-busy", on);
        btn.disabled = on;
    }

    function val(form, id) {
        var el = form.querySelector("#" + id);
        return el ? el.value.trim() : "";
    }

    function clearInvalid(form) {
        form.querySelectorAll(".is-invalid").forEach(function (el) {
            el.classList.remove("is-invalid");
        });
    }

    function saveSpecialities() {
        var btn = document.querySelector('[data-save="specialities"]');
        busy(btn, true);
        setTimeout(function () {
            PRO.specialities = specDraft.slice();
            stopEdit("specialities");
            refreshSummary();
            RP.toast("Your specialities are saved.", "success");
        }, 500);
    }

    function saveBilling(form) {
        var note = document.querySelector('[data-note="billing"]');
        var btn = document.querySelector('[data-save="billing"]');
        var same = form.querySelector("[data-same-primary]").checked;
        clearInvalid(form);

        if (!same) {
            var missing = ["bill_country", "bill_address"]
                .map(function (id) {
                    return form.querySelector("#" + id);
                })
                .filter(function (el) {
                    return !el.value.trim();
                })[0];
            if (missing) {
                missing.classList.add("is-invalid");
                note.textContent = "Please fill in the highlighted field.";
                note.classList.add("is-error");
                missing.focus();
                return;
            }
        }

        busy(btn, true);
        setTimeout(function () {
            PRO.billing.sameAsPrimary = same;
            if (!same) {
                Object.keys(BILL_FIELDS).forEach(function (id) {
                    PRO.billing[BILL_FIELDS[id]] = val(form, id);
                });
            }
            stopEdit("billing");
            RP.toast("Your billing details are saved.", "success");
        }, 550);
    }

    /* ── Delete a rate, with User Account's confirm popover ── */

    function closeConfirm() {
        document.querySelectorAll(".rp-confirm").forEach(function (pop) {
            pop.remove();
        });
        document.querySelectorAll(".is-asking").forEach(function (btn) {
            btn.classList.remove("is-asking");
        });
    }

    function askDelete(btn) {
        var wasOpen = btn.classList.contains("is-asking");
        closeConfirm();
        if (wasOpen) return;

        btn.classList.add("is-asking");
        btn.parentNode.insertAdjacentHTML(
            "beforeend",
            '<div class="rp-confirm" role="alertdialog" aria-label="Delete this rate?"><span class="rp-confirm__text">Delete this rate?</span>' +
                '<button type="button" class="rp-mini is-yes" data-act="delete" data-id="' + btn.dataset.id + '">Delete</button>' +
                '<button type="button" class="rp-mini is-no" data-act="keep">Keep</button></div>'
        );
        btn.parentNode.querySelector(".rp-mini.is-no").focus({ preventScroll: true });
    }

    function deletePrice(id) {
        var row = document.getElementById("price-" + id);
        var p = find(PRO.prices, id);
        closeConfirm();
        if (row) row.classList.add("is-leaving");

        setTimeout(function () {
            PRO.prices = PRO.prices.filter(function (x) {
                return x.id !== id;
            });
            refresh("services");
            refreshSummary();
            RP.toast(serviceDef(p.service).name + " rate deleted.", "success");
        }, reduced() ? 0 : 260);
    }

    /* ── Modal ───────────────────────────────────────────── */

    function openModal(markup, variant) {
        /* A dialog opened from another keeps the first opener, so focus returns to the page */
        if (!els.modal.classList.contains("is-open")) lastFocus = document.activeElement;
        els.panel.innerHTML = markup;
        els.modal.className = "rp-modal is-open" + (variant ? " " + variant : "");
        els.modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("rp-no-scroll");

        var target =
            els.panel.querySelector("[data-autofocus]") ||
            els.panel.querySelector("input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea") ||
            els.panel.querySelector(".pd-modal-foot .pd-btn-primary") ||
            els.panel.querySelector("[data-close]");
        if (target) target.focus({ preventScroll: true });
    }

    function closeModal() {
        if (!els.modal.classList.contains("is-open")) return;
        els.modal.classList.remove("is-open");
        els.modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("rp-no-scroll");
        picked.photo = null;
        picked.file = null;
        staged = [];
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }

    function dialog(o) {
        var primary = o.submit
            ? '<button type="submit" class="pd-btn pd-btn-primary"' + (o.locked ? " disabled" : "") + ' data-dialog-save><span class="pd-spinner" aria-hidden="true"></span>' +
              '<span class="pd-btn-label">' + o.submit + "</span></button>"
            : o.action
            ? '<button type="button" class="pd-btn pd-btn-primary" ' + o.action.attrs + ">" + o.action.label + "</button>"
            : "";
        return (
            '<form class="pd-form" id="rpDialogForm" data-dialog="' + o.form + '"' + (o.id != null ? ' data-id="' + o.id + '"' : "") + " novalidate>" +
            '<div class="pd-modal-head"><div class="pd-modal-titles"><h2 class="pd-modal-title" id="rpModalTitle">' + o.title + "</h2>" +
            (o.note ? '<p class="pd-modal-note">' + o.note + "</p>" : "") + "</div>" +
            '<button type="button" class="pd-modal-close" data-close aria-label="Close">' + icon("close") + "</button></div>" +
            '<div class="pd-modal-body">' + o.body + "</div>" +
            '<div class="pd-modal-foot"><p class="pd-actions-note" data-dialog-note></p>' + (o.extraFoot || "") +
            (o.noCancel ? "" : '<button type="button" class="pd-btn pd-btn-secondary" data-close>' + (o.cancelLabel || (primary ? "Cancel" : "Close")) + "</button>") +
            primary + "</div></form>"
        );
    }

    function dialogNote(form, message, isError) {
        var note = form.querySelector("[data-dialog-note]");
        note.innerHTML = message || "";
        note.classList.toggle("is-error", !!isError);
    }

    function dialogFail(form, el, message) {
        (el.closest(".rp-drop") || el).classList.add("is-invalid");
        dialogNote(form, message, true);
        el.focus({ preventScroll: true });
    }

    function dialogDone(form, apply) {
        var btn = form.querySelector("[data-dialog-save]");
        busy(btn, true);
        setTimeout(function () {
            closeModal();
            apply();
        }, 550);
    }

    /* ── How it works (user_manual_modal.html, shortened) ── */

    function openHelp() {
        var parts = [
            ["Per pair, per language or once", "Most services are priced per language pair, such as English → Arabic. DTP and transcription are priced per language, and formatting once, whatever the language."],
            ["Active and pending approval", "A new rate waits for a vendor manager to approve it. Jobs use it as soon as it is active."],
            ["Certificates", "A certificate belongs to a language pair and one service. Once it is verified it cannot be changed; when it is renewed, add the new one."],
            [
                "Currency",
                "Rates are kept in NZD, the currency jobs are priced in. Type a rate in another currency and it is converted; the ≈ line shows it in that currency, or in USD. " +
                    "The time at the start of that line is when that rate's exchange rate was last updated."
            ],
            [
                "Up to " + PRO.pairLimit + " language pairs",
                "Freelancers can price up to " + PRO.pairLimit + " language pairs, and you price " + pairKeys().length + " now. To add more, " +
                    '<button type="button" class="rp-linkbtn" data-act="message-vm">message ' + esc(PRO.vendorManager.name) + "</button>, your vendor manager."
            ]
        ];
        openModal(
            dialog({
                title: "How services and prices work",
                form: "help",
                body:
                    '<div class="rp-help">' +
                    parts
                        .map(function (p) {
                            return '<div class="rp-help__part"><h3 class="rp-help__title">' + p[0] + '</h3><p class="rp-help__text">' + p[1] + "</p></div>";
                        })
                        .join("") +
                    "</div>",
                action: { label: "Got it", attrs: "data-close" },
                noCancel: true
            })
        );
    }

    /* ── Add services (addPriceForm.html: build a list, save it once) ── */

    var svcState = null;

    function freshSvcState(key) {
        var g = parseGroup(key);
        var s = { service: "", mode: RP.INTERPRETING.modes[0], type: RP.INTERPRETING.types[0], source: "", target: "", language: "", currency: BASE, amount: "" };
        if (g.kind === "pair") {
            s.source = g.source;
            s.target = g.target;
            /* Opened from a pair, it suggests the first service that pair has no rate for */
            var taken = PRO.prices.filter(function (p) {
                return p.source === g.source && p.target === g.target && !serviceDef(p.service).interpreting;
            }).map(function (p) {
                return p.service;
            });
            if (key) {
                var next = RP.SERVICES.filter(function (d) {
                    return d.base === "pair" && taken.indexOf(d.key) === -1;
                })[0];
                s.service = next ? next.key : "";
            }
        } else if (g.kind === "single") {
            s.language = g.language;
            s.service = "DTP";
        } else if (g.kind === "none") {
            s.service = "Formatting";
        }
        return s;
    }

    function convHint(code, amount) {
        var n = parseFloat(amount);
        if (!(n > 0)) return "Jobs are priced in NZD; a rate in another currency is converted.";
        if (code === BASE) return "≈ <strong>USD " + money(n * RP.FX.USD) + "</strong>";
        return "Saved as <strong>NZD " + money(n / RP.FX[code]) + "</strong>, the currency jobs are priced in.";
    }

    function rateField(code, amount, unit) {
        return (
            '<div class="pd-field pd-col-wide"><label for="svc_amount">Rate <span class="asterisk" aria-hidden="true">*</span></label>' +
            '<div class="rp-rate">' +
            select(
                "svc_currency",
                Object.keys(RP.FX).map(function (c) {
                    return [c, c];
                }),
                code,
                { label: "Currency" }
            ) +
            '<div class="rp-rate__amount">' +
            input("svc_amount", amount, { type: "number", min: 0, step: "0.0001", inputmode: "decimal", placeholder: "0.00", required: true }) +
            '<span class="rp-rate__unit" data-unit>per ' + unit + "</span></div></div>" +
            '<p class="pd-field-hint rp-rate__conv" data-conv>' + convHint(code, amount) + "</p></div>"
        );
    }

    function svcFields(s) {
        var def = serviceDef(s.service);
        var html = field(
            "svc_service",
            "Service",
            select(
                "svc_service",
                RP.SERVICES.map(function (d) {
                    return [d.key, d.name];
                }),
                s.service,
                { required: true, empty: "Select a service" }
            ),
            { required: true, cls: "pd-col-wide" }
        );

        if (def && def.interpreting) {
            html +=
                field("svc_mode", "Mode", select("svc_mode", RP.INTERPRETING.modes.map(function (m) { return [m, m]; }), s.mode)) +
                field("svc_type", "Type", select("svc_type", RP.INTERPRETING.types.map(function (t) { return [t, t]; }), s.type));
        }

        if (!def || def.base === "pair") {
            html +=
                '<div class="pd-field pd-col-wide"><span class="pd-field-label">Languages <span class="asterisk" aria-hidden="true">*</span></span>' +
                '<div class="rp-langpair">' +
                select("svc_source", languageOptions(), s.source, { empty: "From", label: "Source language" }) + icon("arrow-right") +
                select("svc_target", languageOptions(), s.target, { empty: "To", label: "Target language" }) + "</div></div>";
        } else if (def.base === "single") {
            html += field("svc_language", "Language", select("svc_language", languageOptions(), s.language, { empty: "Select a language", required: true }), { required: true });
        } else {
            html += '<p class="rp-svcform__none pd-col-wide">' + icon("globe") + "Priced once, whatever the language.</p>";
        }

        return html + rateField(s.currency, s.amount, def ? def.unit : "unit");
    }

    function stagedMarkup() {
        if (!staged.length) return "";
        return (
            '<div class="rp-staged__head"><p class="rp-staged__label">Ready to save · ' + staged.length + "</p></div>" +
            '<ul class="rp-staged__list">' +
            staged
                .map(function (s, i) {
                    var def = serviceDef(s.service);
                    return (
                        '<li class="rp-staged__item"><span class="rp-staged__text"><strong>' + esc(def.name) + "</strong>" +
                        (s.mode && def.interpreting ? "<span>" + esc(s.mode + " → " + s.type) + "</span>" : "") +
                        (s.source ? pairText(s.source, s.target) : s.language ? "<span>" + esc(s.language) + "</span>" : "<span>Any language</span>") +
                        '<span class="rp-staged__price">' + s.currency + " " + money(parseFloat(s.amount)) + " / " + def.unit + "</span></span>" +
                        '<button type="button" class="rp-iconbtn rp-iconbtn--bare" data-act="unstage" data-index="' + i + '" aria-label="Take ' + esc(def.name) +
                        ' off the list">' + icon("close") + "</button></li>"
                    );
                })
                .join("") +
            "</ul>"
        );
    }

    function saveLabel() {
        return staged.length > 1 ? "Save " + staged.length + " services" : "Save";
    }

    function openAddServices(key) {
        staged = [];
        svcState = freshSvcState(key);
        openModal(
            dialog({
                title: "Add services and prices",
                note: "Pick a service, its languages and your rate. Add a few to the list, then save them together.",
                form: "services",
                body:
                    '<div class="pd-grid rp-svcform" data-svcform>' + svcFields(svcState) + "</div>" +
                    '<div class="rp-svcform__more"><button type="button" class="pd-edit-btn" data-act="stage">' + icon("plus") + "Add to list</button></div>" +
                    '<div class="rp-staged" data-staged hidden></div>',
                submit: "Save"
            }),
            "rp-modal--wide"
        );
        var first = els.panel.querySelector(svcState.service ? "#svc_amount" : "#svc_service");
        if (first) first.focus({ preventScroll: true });
    }

    function readSvc(form) {
        return {
            service: val(form, "svc_service"),
            mode: val(form, "svc_mode") || svcState.mode,
            type: val(form, "svc_type") || svcState.type,
            source: val(form, "svc_source"),
            target: val(form, "svc_target"),
            language: val(form, "svc_language"),
            currency: val(form, "svc_currency") || BASE,
            amount: val(form, "svc_amount")
        };
    }

    /* A service change can swap the language fields, so the form is redrawn from what was typed */
    function repaintSvc(form, focusId) {
        var keep = readSvc(form);
        var def = serviceDef(keep.service);
        if (def && def.base === "single" && !keep.language) keep.language = keep.source || svcState.language;
        svcState = keep;
        form.querySelector("[data-svcform]").innerHTML = svcFields(svcState);
        var el = form.querySelector("#" + (focusId || "svc_service"));
        if (el) el.focus({ preventScroll: true });
    }

    function paintStaged(form) {
        var slot = form.querySelector("[data-staged]");
        slot.innerHTML = stagedMarkup();
        slot.hidden = !staged.length;
        form.querySelector("[data-dialog-save] .pd-btn-label").textContent = saveLabel();
    }

    function sameRate(a, b) {
        return (
            a.service === b.service &&
            (a.source || "") === (b.source || "") &&
            (a.target || "") === (b.target || "") &&
            (a.language || "") === (b.language || "") &&
            (!serviceDef(a.service).interpreting || (a.mode === b.mode && a.type === b.type))
        );
    }

    /* Checks the entry the way addResourcePrices does before it joins the list */
    function checkSvc(form, s) {
        var def = serviceDef(s.service);
        if (!def) return { el: form.querySelector("#svc_service"), msg: "Pick a service." };
        if (def.base === "pair") {
            if (!s.source) return { el: form.querySelector("#svc_source"), msg: "Pick the language you translate from." };
            if (!s.target) return { el: form.querySelector("#svc_target"), msg: "Pick the language you translate into." };
            if (s.source === s.target) return { el: form.querySelector("#svc_target"), msg: "Pick two different languages." };
        }
        if (def.base === "single" && !s.language) return { el: form.querySelector("#svc_language"), msg: "Pick the language." };
        if (!(parseFloat(s.amount) > 0)) return { el: form.querySelector("#svc_amount"), msg: "Enter a rate above zero." };

        var probe = {
            service: s.service,
            source: def.base === "pair" ? s.source : "",
            target: def.base === "pair" ? s.target : "",
            language: def.base === "single" ? s.language : "",
            mode: s.mode,
            type: s.type
        };
        var where = def.base === "pair" ? s.source + " → " + s.target : def.base === "single" ? s.language : "any language";
        if (PRO.prices.some(function (p) { return sameRate(p, probe); })) {
            return { el: form.querySelector("#svc_service"), msg: "You already have a " + esc(def.name) + " rate for " + esc(where) + ". Edit it in the list instead." };
        }
        if (staged.some(function (x) { return sameRate(x, probe); })) {
            return { el: form.querySelector("#svc_service"), msg: esc(def.name) + " for " + esc(where) + " is already on the list." };
        }
        if (def.base === "pair") {
            var key = s.source + "|" + s.target;
            var used = pairKeys(staged);
            if (used.indexOf(key) === -1 && used.length >= PRO.pairLimit) {
                return {
                    el: form.querySelector("#svc_source"),
                    msg: "Freelancers can price up to " + PRO.pairLimit + " language pairs. " +
                        '<button type="button" class="rp-linkbtn" data-act="message-vm">Message ' + esc(PRO.vendorManager.name) + "</button> to add more."
                };
            }
        }
        return null;
    }

    function stage(form) {
        clearInvalid(form);
        var s = readSvc(form);
        var problem = checkSvc(form, s);
        if (problem) {
            dialogFail(form, problem.el, problem.msg);
            return false;
        }
        var def = serviceDef(s.service);
        staged.push({
            service: s.service,
            mode: def.interpreting ? s.mode : null,
            type: def.interpreting ? s.type : null,
            source: def.base === "pair" ? s.source : null,
            target: def.base === "pair" ? s.target : null,
            language: def.base === "single" ? s.language : null,
            currency: s.currency,
            amount: s.amount
        });
        dialogNote(form, "");
        /* The languages stay, so a second service for the same pair is one pick and a rate */
        svcState = { service: "", mode: s.mode, type: s.type, source: s.source, target: s.target, language: s.language, currency: s.currency, amount: "" };
        form.querySelector("[data-svcform]").innerHTML = svcFields(svcState);
        paintStaged(form);
        form.querySelector("#svc_service").focus({ preventScroll: true });
        return true;
    }

    function unstage(form, index) {
        staged.splice(index, 1);
        paintStaged(form);
        form.querySelector("#svc_service").focus({ preventScroll: true });
    }

    function saveServices(form) {
        var s = readSvc(form);
        /* A filled form counts as the last entry, so one service needs no "Add to list" */
        var started = s.service || parseFloat(s.amount) > 0;
        if (started && !stage(form)) return;
        if (!staged.length) return dialogFail(form, form.querySelector("#svc_service"), "Add at least one service.");

        var list = staged.slice();
        dialogDone(form, function () {
            var ids = [];
            list.forEach(function (x) {
                var row = {
                    id: nextId(PRO.prices),
                    service: x.service,
                    price: parseFloat(x.amount) / RP.FX[x.currency],
                    entered: x.currency,
                    status: "pending",
                    rateUpdated: new Date()
                };
                if (x.source) {
                    row.source = x.source;
                    row.target = x.target;
                }
                if (x.language) row.language = x.language;
                if (x.mode) {
                    row.mode = x.mode;
                    row.type = x.type;
                }
                PRO.prices.push(row);
                ids.push(row.id);
            });
            view.q = "";
            view.status = "all";
            refresh("services");
            refreshSummary();
            flash("price-" + ids[0]);
            RP.toast(
                list.length === 1 ? "Service saved. It is waiting for approval." : list.length + " services saved. They are waiting for approval.",
                "success"
            );
        });
    }

    /* ── Edit one rate (editPriceForm.html) ──────────────── */

    function openEditPrice(id) {
        var p = find(PRO.prices, id);
        var def = serviceDef(p.service);
        var code = p.entered || BASE;
        var amount = inCurrency(p.price, code);
        var where = p.source ? pairText(p.source, p.target) : p.language ? esc(p.language) : "Any language";
        openModal(
            dialog({
                title: "Edit rate",
                note: esc(def.name) + (p.mode ? dot() + esc(p.mode + " → " + p.type) : "") + dot() + where,
                form: "price",
                id: p.id,
                body: '<div class="pd-grid">' + rateField(code, amount.toFixed(amount < 1 ? 4 : 2), def.unit) + "</div>",
                submit: "Save rate"
            }),
            "rp-modal--confirm"
        );
        var amountEl = els.panel.querySelector("#svc_amount");
        if (amountEl) {
            amountEl.focus({ preventScroll: true });
            amountEl.select();
        }
    }

    function saveEditPrice(form) {
        clearInvalid(form);
        var amountEl = form.querySelector("#svc_amount");
        var amount = parseFloat(amountEl.value);
        if (!(amount > 0)) return dialogFail(form, amountEl, "Enter a rate above zero.");
        var code = val(form, "svc_currency") || BASE;
        var p = find(PRO.prices, Number(form.dataset.id));
        dialogDone(form, function () {
            p.price = amount / RP.FX[code];
            p.entered = code;
            p.rateUpdated = new Date();
            refresh("services");
            flash("price-" + p.id);
            RP.toast(serviceDef(p.service).name + " rate updated.", "success");
        });
    }

    /* ── Certificates (the certified-language-pair modal) ── */

    function certifiableFor(source, target, keep) {
        var keys = [];
        PRO.prices.forEach(function (p) {
            if (p.source === source && p.target === target && serviceDef(p.service).certifiable && keys.indexOf(p.service) === -1) keys.push(p.service);
        });
        if (keep && keys.indexOf(keep) === -1) keys.push(keep);
        if (!keys.length) {
            keys = RP.SERVICES.filter(function (d) {
                return d.certifiable;
            }).map(function (d) {
                return d.key;
            });
        }
        return keys;
    }

    function certNameOptions(code) {
        return (RP.CERT_NAMES[code] || []).map(function (n) {
            return [n, n];
        });
    }

    function naatiNote(name) {
        if (!/^NAATI/.test(name || "")) return "";
        return (
            '<div class="rp-callout rp-callout--info">' + icon("info") +
            "<span>NAATI certificates are checked on the NAATI website with your CPN. The name on your profile, the service and the expiry date must match the certificate, or it is rejected.</span></div>"
        );
    }

    function dropzone(replacing) {
        if (picked.file) {
            return (
                '<div class="rp-fileitem"><span class="rp-fileitem__icon" aria-hidden="true">' + icon("file") + '</span><div class="rp-fileitem__text">' +
                '<span class="rp-fileitem__name">' + esc(picked.file.name) + '</span><span class="rp-fileitem__hint">' + esc(picked.file.size) +
                " · ready to upload</span></div>" +
                '<div class="rp-fileitem__actions"><button type="button" class="rp-iconbtn rp-iconbtn--ghost" data-act="unpick-file" aria-label="Remove this file" title="Remove">' +
                icon("close") + "</button></div></div>"
            );
        }
        return (
            '<label class="rp-drop" data-drop><input type="file" data-cert-file accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" aria-label="Choose the certificate file">' +
            '<span class="rp-drop__icon" aria-hidden="true">' + icon("cloud-upload") + '</span><span><span class="rp-drop__title">' +
            (replacing ? "Drop the new scan here, or <u>browse</u>" : "Drop the scan here, or <u>browse</u>") +
            '</span><span class="rp-drop__note">PDF, JPG, PNG, DOC or DOCX, up to 10 MB</span></span></label>'
        );
    }

    function paintDropslot() {
        var slot = els.panel.querySelector("[data-dropslot]");
        if (slot) slot.innerHTML = dropzone(!!slot.dataset.replacing);
    }

    function bytes(size) {
        return size >= 1e6 ? (size / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1e3)) + " KB";
    }

    /* o.id edits a certificate, o.renewOf adds the renewed one, o.group adds one to a pair */
    function openCertForm(o) {
        picked.file = null;
        var c = o.id ? find(P.certificates, o.id) : null;
        var from = c || (o.renewOf ? find(P.certificates, o.renewOf) : null);
        var pair = from ? { source: from.source, target: from.target } : parseGroup(o.group);
        var services = certifiableFor(pair.source, pair.target, from && from.service);
        var code = from ? countryCode(from.country) : "";
        var name = from ? from.name : "";
        var lifetime = c ? !c.expires : false;
        var rejected = c && c.status === "rejected";

        var title = c ? (rejected ? "Replace the rejected certificate" : "Edit certificate") : o.renewOf ? "Add your renewed certificate" : "Add a certificate";
        var body =
            (rejected && c.reason ? '<div class="rp-callout rp-callout--danger">' + icon("circle-alert") + "<span><strong>Why it was rejected:</strong> " + esc(c.reason) + "</span></div>" : "") +
            (o.renewOf ? '<div class="rp-callout rp-callout--info">' + icon("info") + "<span>Your current certificate stays on your profile until it expires. The renewed one is checked like any new certificate.</span></div>" : "") +
            '<div class="pd-grid">' +
            field("cert_country", "Country", select("cert_country", countryOptions(Object.keys(RP.CERT_NAMES)), code, { required: true, empty: "Select a country", autofocus: !c && !o.renewOf }), {
                required: true
            }) +
            field("cert_id", "Certification ID", input("cert_id", c ? c.certId : "", { required: true, maxlength: 40, placeholder: "As printed on the certificate", autofocus: !!o.renewOf }), {
                required: true
            }) +
            field("cert_name", "Certificate", select("cert_name", certNameOptions(code), name, { required: true, empty: code ? "Select a certificate" : "Select a country first", disabled: !code }), {
                required: true
            }) +
            field(
                "cert_service",
                "Service",
                select("cert_service", services.map(function (k) { return [k, serviceDef(k).name]; }), from ? from.service : services[0], { required: true, disabled: !!c }),
                { required: true, hint: c ? "A certificate covers one service; for another, add a new one." : "" }
            ) +
            '<div class="pd-col-wide" data-naati>' + naatiNote(name) + "</div>" +
            '<div class="pd-field pd-col-wide"><div class="rp-expiry"><label for="cert_expiry">Expiry date <span class="asterisk" aria-hidden="true" data-expiry-star' +
            (lifetime ? " hidden" : "") + '>*</span></label><label class="rp-checkline"><input type="checkbox" data-lifetime' + (lifetime ? " checked" : "") +
            ">Lifetime — no expiry</label></div>" +
            input("cert_expiry", c && c.expires ? isoDate(c.expires) : "", { type: "date", min: isoDate(new Date(Date.now() + DAY)), disabled: lifetime, label: "Expiry date" }) +
            "</div>" +
            '<div class="pd-field pd-col-wide"><span class="pd-field-label">' +
            (c ? (rejected ? 'New scan <span class="asterisk" aria-hidden="true">*</span>' : "Replace the file") : 'Certificate file <span class="asterisk" aria-hidden="true">*</span>') +
            '</span><div data-dropslot data-replacing="' + (c ? "1" : "") + '">' + dropzone(!!c) + "</div>" +
            (c ? '<p class="pd-field-hint">Current file: <strong>' + esc(c.file) + "</strong></p>" : "") + "</div>" +
            "</div>";

        openModal(
            dialog({
                title: title,
                note: pairText(pair.source, pair.target),
                form: "cert",
                id: c ? c.id : null,
                body: body,
                submit: "Send for verification"
            })
        );
        var form = els.panel.querySelector("#rpDialogForm");
        form.dataset.pair = pair.source + "|" + pair.target;
        if (o.renewOf) form.dataset.renews = o.renewOf;
    }

    function saveCert(form) {
        clearInvalid(form);
        var id = Number(form.dataset.id) || null;
        var c = id ? find(P.certificates, id) : null;
        var pair = form.dataset.pair.split("|");
        var lifetime = form.querySelector("[data-lifetime]").checked;
        var expiry = form.querySelector("#cert_expiry");

        var required = ["cert_country", "cert_id", "cert_name"];
        for (var i = 0; i < required.length; i++) {
            var el = form.querySelector("#" + required[i]);
            if (!el.value.trim()) return dialogFail(form, el, "Please fill in the highlighted field.");
        }
        if (!lifetime && !expiry.value) return dialogFail(form, expiry, "Add the expiry date, or tick Lifetime.");
        if (!lifetime && new Date(expiry.value) <= new Date()) return dialogFail(form, expiry, "This date has passed. Add a certificate that is still valid.");
        if ((!c || c.status === "rejected") && !picked.file) {
            return dialogFail(form, form.querySelector("[data-cert-file]") || form.querySelector("[data-dropslot]"), c ? "Upload the new scan." : "Upload the certificate file.");
        }

        var file = picked.file;
        var renews = Number(form.dataset.renews) || null;
        dialogDone(form, function () {
            var row = c || { id: nextId(P.certificates), source: pair[0], target: pair[1] };
            if (renews) find(P.certificates, renews).renewedBy = row.id;
            row.name = val(form, "cert_name");
            row.country = countryName(val(form, "cert_country"));
            row.certId = val(form, "cert_id");
            row.service = val(form, "cert_service") || row.service;
            row.expires = lifetime ? null : new Date(expiry.value + "T00:00:00");
            row.status = "pending";
            delete row.reason;
            if (file) row.file = file.name;
            if (!c) P.certificates.push(row);

            view.q = "";
            view.status = "all";
            refresh("services");
            refreshSummary();
            flash("cert-" + row.id);
            RP.toast("Certificate sent for verification.", "success");
        });
    }

    function fact(label, value, wide) {
        return "<div" + (wide ? ' class="rp-facts__wide"' : "") + "><dt>" + label + "</dt><dd>" + value + "</dd></div>";
    }

    function openCertDetails(id) {
        var c = find(P.certificates, id);
        var state = certState(c);
        var left = soonDays(c);
        var def = serviceDef(c.service);
        var callout = "";
        var action = null;

        if (state === "rejected") {
            callout = '<div class="rp-callout rp-callout--danger">' + icon("circle-alert") + "<span><strong>Rejection reason:</strong> " + esc(c.reason || "") + "</span></div>";
            action = { label: "Replace the file", attrs: 'data-act="edit-cert" data-id="' + c.id + '"' };
        } else if (c.renewedBy) {
            callout = '<div class="rp-callout rp-callout--info">' + icon("refresh-cw") + "<span>You sent the renewed certificate. It replaces this one once our team verifies it.</span></div>";
        } else if (state === "expired" || left) {
            callout =
                '<div class="rp-callout rp-callout--warn">' + icon("calendar-clock") + "<span>" +
                (state === "expired" ? "It has expired." : "It expires in " + plural(left, "day") + ".") +
                " Add the renewed certificate once you have it, so certified jobs keep coming.</span></div>";
            action = { label: "Add the renewed one", attrs: 'data-act="renew-cert" data-id="' + c.id + '"' };
        } else if (state === "pending") {
            callout = '<div class="rp-callout rp-callout--info">' + icon("info") + "<span>Our vendor team is checking it. You can still change it until then.</span></div>";
            action = { label: "Edit", attrs: 'data-act="edit-cert" data-id="' + c.id + '"' };
        } else {
            callout = '<div class="rp-callout">' + icon("lock") + "<span>Verified certificates cannot be changed. When it is renewed, add the new one.</span></div>";
        }

        var body =
            '<dl class="rp-facts">' +
            fact("Service", esc(def ? def.name : c.service)) +
            fact("Languages", pairText(c.source, c.target)) +
            fact("Country", esc(c.country)) +
            fact("Certification ID", esc(c.certId)) +
            fact("Expiry", c.expires ? fmtDate(c.expires) : "Lifetime") +
            fact("Status", pill(CERT_STATUS[state])) +
            fact(
                "File",
                '<ul class="rp-filelist"><li class="rp-fileitem"><span class="rp-fileitem__icon" aria-hidden="true">' + icon("file") +
                    '</span><div class="rp-fileitem__text"><span class="rp-fileitem__name">' + esc(c.file) + '</span><span class="rp-fileitem__hint">Certificate scan</span></div>' +
                    '<div class="rp-fileitem__actions"><button type="button" class="rp-iconbtn rp-iconbtn--ghost" data-act="view-file" data-name="' + esc(c.file) +
                    '" aria-label="View ' + esc(c.file) + '" title="View">' + icon("view") + "</button></div></li></ul>",
                true
            ) +
            "</dl>" + callout;

        openModal(dialog({ title: esc(c.name), note: pairText(c.source, c.target), form: "cert-details", body: body, action: action, cancelLabel: "Close" }));
    }

    /* ── Payment methods (preferred_payment_method.html) ── */

    function methodFields(code, m) {
        if (code === "PAYPAL") {
            return (
                field("pm_holder", "PayPal account holder", input("pm_holder", m.holder, { maxlength: 80 })) +
                field("pm_email", "PayPal email address", input("pm_email", m.email, { type: "email", required: true, placeholder: "e.g. john.doe@gmail.com" }), { required: true })
            );
        }
        if (code === "WISE") {
            return (
                field("pm_holder", "Account holder", input("pm_holder", m.holder, { required: true, maxlength: 80 }), { required: true }) +
                field("pm_email", "Wise account email", input("pm_email", m.email, { type: "email", required: true }), { required: true })
            );
        }
        return (
            field("pm_country", "Bank country", select("pm_country", countryOptions(), m.country || P.country, { required: true }), { required: true }) +
            '<div class="pd-field" data-bankcode>' + bankCodeField(m.country || P.country, m) + "</div>" +
            field("pm_name", "Full name", input("pm_name", m.holder, { required: true, maxlength: 80, placeholder: "As the bank has it" }), { required: true }) +
            field("pm_address", "Your address", input("pm_address", m.address || P.address, { required: true, maxlength: 160 }), { required: true }) +
            field("pm_bank", "Bank name", input("pm_bank", m.bank, { required: true, maxlength: 80, placeholder: "e.g. Emirates NBD" }), { required: true }) +
            field("pm_branch", "Bank branch address", input("pm_branch", m.branch, { required: true, maxlength: 160 }), { required: true }) +
            field("pm_swift", "SWIFT / BIC", input("pm_swift", m.swift, { required: true, maxlength: 11, placeholder: "e.g. EBILAEAD" }), { required: true }) +
            field("pm_account", "Account number", input("pm_account", m.account, { required: true, maxlength: 34 }), { required: true })
        );
    }

    /* wire.html asks a different code per country: BSB in Australia, sort code in the UK, IBAN elsewhere */
    function bankCodeField(country, m) {
        if (country === "AU") return '<label for="pm_code">BSB code <span class="asterisk" aria-hidden="true">*</span></label>' + input("pm_code", m.code2, { required: true, placeholder: "e.g. 062-000" });
        if (country === "GB") return '<label for="pm_code">Sort code <span class="asterisk" aria-hidden="true">*</span></label>' + input("pm_code", m.code2, { required: true, placeholder: "e.g. 20-45-67" });
        return '<label for="pm_code">IBAN <span class="asterisk" aria-hidden="true">*</span></label>' + input("pm_code", m.iban, { required: true, maxlength: 34, placeholder: "e.g. AE07 0331 2345 6789 0123 456" });
    }

    function openMethodForm(code) {
        var m = findMethod(code);
        var label = METHODS[code].label;
        var body =
            '<div class="pd-grid">' +
            field("pm_currency", "Account currency", select("pm_currency", Object.keys(RP.FX).map(function (c) { return [c, c]; }), m ? m.currency : "USD", { required: true }), {
                required: true,
                hint: "Bills paid to this method are paid in it."
            }) +
            methodFields(code, m || { holder: RP.USER.fullName }) +
            "</div>" +
            (m && m.isDefault
                ? ""
                : '<label class="rp-optout"><input type="checkbox" data-make-default' + (!defaultMethod() ? " checked" : "") +
                  "><span>Make it my default payment method</span></label>") +
            '<div class="rp-callout rp-callout--info">' + icon("info") + "<span>Our team verifies it before the first bill is paid to it.</span></div>";

        openModal(
            dialog({
                title: (m ? "Edit " : "Add ") + (code === "WIRE" && !m ? "a bank account" : label),
                note: m ? "Pending verification" : METHODS[code].add,
                form: "method",
                id: code,
                body: body,
                submit: m ? "Save changes" : "Add " + label
            })
        );
    }

    function saveMethod(form) {
        clearInvalid(form);
        var code = form.dataset.id;
        var missing = Array.prototype.filter.call(form.querySelectorAll("[required]"), function (el) {
            return !el.value.trim();
        })[0];
        if (missing) return dialogFail(form, missing, "Please fill in the highlighted field.");
        var email = form.querySelector("#pm_email");
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) return dialogFail(form, email, "Enter a valid email address.");

        var makeDefault = form.querySelector("[data-make-default]");
        var wantDefault = makeDefault ? makeDefault.checked : false;
        dialogDone(form, function () {
            var m = findMethod(code);
            var isNew = !m;
            if (isNew) {
                m = { code: code, added: new Date(), isDefault: false };
                PRO.payment.push(m);
            }
            m.verified = false;
            m.currency = val(form, "pm_currency");
            m.holder = val(form, "pm_holder") || val(form, "pm_name") || m.holder;
            if (code === "WIRE") {
                m.country = val(form, "pm_country");
                m.bank = val(form, "pm_bank");
                m.branch = val(form, "pm_branch");
                m.swift = val(form, "pm_swift");
                m.account = val(form, "pm_account");
                m.address = val(form, "pm_address");
                if (m.country === "AU" || m.country === "GB") m.code2 = val(form, "pm_code");
                else m.iban = val(form, "pm_code");
            } else {
                m.email = val(form, "pm_email");
            }
            if (wantDefault) setDefault(code);

            refresh("payment");
            refreshSummary();
            flash("method-" + code, true);
            RP.toast(METHODS[code].label + (isNew ? " added." : " updated.") + " It is used once our team verifies it.", "success");
        });
    }

    function setDefault(code) {
        PRO.payment.forEach(function (m) {
            m.isDefault = m.code === code;
        });
    }

    function openMethod(code) {
        var m = findMethod(code);
        if (!m) return openMethodForm(code);
        if (!m.verified) return openMethodForm(code);

        var def = METHODS[code];
        var vm = PRO.vendorManager;
        var body =
            '<dl class="rp-facts">' +
            methodFacts(m)
                .map(function (f) {
                    return fact(f[0], esc(f[1]));
                })
                .join("") +
            fact("Added", fmtDate(m.added)) +
            fact("Status", pill(CERT_STATUS.verified) + (m.isDefault ? '<span class="rp-default">Default</span>' : "")) +
            "</dl>" +
            '<div class="rp-callout">' + icon("lock") + "<span>Verified by our team, so it is locked. To change these details, " +
            '<button type="button" class="rp-linkbtn" data-act="message-vm">message ' + esc(vm.name) + "</button>, your vendor manager.</span></div>";

        openModal(
            dialog({
                title: def.label,
                note: "Verified on " + fmtDate(m.verifiedOn || m.added),
                form: "method-details",
                body: body,
                action: m.isDefault ? null : { label: "Make default", attrs: 'data-act="method-default" data-code="' + code + '"' },
                cancelLabel: "Close"
            })
        );
    }

    function askDefault(code) {
        var m = findMethod(code);
        var label = METHODS[code].label;
        var body = m.verified
            ? '<p class="rp-help__text">Your next bills will be paid to ' + label + ", in " + m.currency + ". " + m.currency + " becomes your preferred currency.</p>"
            : '<div class="rp-callout rp-callout--warn">' + icon("warning") + "<span>" + label +
              " is not verified yet. Your bills wait until our team verifies it.</span></div>";
        openModal(dialog({ title: "Make " + label + " your default?", form: "default", id: code, body: body, submit: "Make default" }), "rp-modal--confirm");
    }

    function saveDefault(form) {
        var code = form.dataset.id;
        dialogDone(form, function () {
            setDefault(code);
            refresh("payment");
            refreshSummary();
            flash("method-" + code, true);
            RP.toast(METHODS[code].label + " is now your default payment method.", "success");
        });
    }

    /* ── Emails ──────────────────────────────────────────── */

    /* Read in place: the row loses its unread weight, the counts follow */
    function paintUnread(id) {
        var btn = document.querySelector('.rp-mail[data-id="' + id + '"]');
        if (btn) {
            btn.classList.remove("is-unread");
            var sr = btn.querySelector(".rp-sr-only");
            if (sr) sr.remove();
        }
        var aside = document.querySelector("#emails [data-unread]");
        var n = unreadCount();
        if (aside && n) aside.innerHTML = "<strong>" + n + "</strong> unread";
        else if (aside) aside.remove();
        var show = document.querySelector("#emails [data-mail-show]");
        if (show) show.innerHTML = mailShowMarkup();
        els.tabs.innerHTML = tabsMarkup(currentSection());
    }

    function openMail(id) {
        var m = find(PRO.emails, id);
        var body =
            '<p class="rp-mailview__meta"><strong>' + esc(m.from) + "</strong><span>&lt;" + esc(m.fromEmail) + "&gt;</span>" + dot() + "<span>to you</span>" + dot() +
            "<span>" + fmtDate(m.at) + ", " + fmtTime(m.at) + "</span></p>" +
            '<div class="rp-mailview__body">' + m.body.map(function (p) {
                return "<p>" + esc(p) + "</p>";
            }).join("") + "</div>";
        openModal(dialog({ title: esc(m.subject), form: "mail", body: body, cancelLabel: "Close" }), "rp-modal--wide");
        if (m.unread) {
            m.unread = false;
            paintUnread(id);
        }
    }

    /* Only the list and pager repaint, so the search keeps its focus and caret; a pager button keeps focus by name */
    function paintMails(focusLabel) {
        var holder = document.querySelector("#emails [data-mail-list]");
        if (!holder) return;
        holder.innerHTML = mailListMarkup();
        if (!focusLabel) return;
        var again = holder.querySelector('.cu-page-nav-btn[aria-label="' + focusLabel + '"]:not(:disabled)') || holder.querySelector(".cu-page-nav-btn.active");
        if (again) again.focus({ preventScroll: true });
    }

    function setMailShow(show) {
        mailView.show = show;
        mailView.page = 1;
        var group = document.querySelector("#emails [data-mail-show]");
        group.innerHTML = mailShowMarkup();
        group.querySelector('[data-show="' + show + '"]').focus();
        paintMails();
    }

    /* ── Photo (User Account's dialog) ───────────────────── */

    function openPhoto() {
        picked.photo = null;
        var body =
            '<div class="rp-photo"><div class="rp-photo__stage"><img src="' + esc(RP.USER.photo) + '" alt="Preview of your profile photo" data-photo-img></div>' +
            '<label class="rp-photo__zoom">' + icon("image") +
            '<input type="range" min="1" max="2.5" step="0.05" value="1" data-photo-zoom aria-label="Zoom" disabled>' + icon("image") + "</label>" +
            '<div class="rp-photo__actions"><label class="pd-edit-btn">' + icon("upload") + 'Choose a photo<input type="file" accept="image/png, image/jpeg" data-photo-file data-autofocus></label>' +
            (P.photoIsPlaceholder ? "" : '<button type="button" class="pd-edit-btn is-danger" data-act="photo-remove">' + icon("trash-2") + "Remove photo</button>") +
            "</div>" +
            '<p class="pd-field-hint">JPG or PNG, at least 400 × 400 px. A clear, front-facing photo helps project managers recognise you.</p></div>';

        openModal(
            dialog({ title: "Profile photo", note: "Zoom in to crop it. The circle is what everyone sees.", form: "photo", body: body, submit: "Save photo", locked: true }),
            "rp-modal--photo"
        );
    }

    /* Draws the zoomed centre into a square, so the saved avatar matches the preview */
    function cropPhoto(img, zoom) {
        var size = 400;
        var canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        var side = Math.min(img.naturalWidth, img.naturalHeight) / zoom;
        var sx = (img.naturalWidth - side) / 2;
        var sy = (img.naturalHeight - side) / 2;
        canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);
        return canvas.toDataURL("image/jpeg", 0.9);
    }

    function readPhoto(file) {
        var form = els.panel.querySelector("#rpDialogForm");
        if (!file || !/^image\//.test(file.type)) return dialogFail(form, form.querySelector("[data-photo-file]"), "Choose a JPG or PNG image.");
        if (file.size > MAX_UPLOAD) return dialogFail(form, form.querySelector("[data-photo-file]"), "That photo is over 10 MB. Choose a smaller one.");

        var reader = new FileReader();
        reader.onload = function () {
            picked.photo = reader.result;
            var img = form.querySelector("[data-photo-img]");
            var zoom = form.querySelector("[data-photo-zoom]");
            img.src = reader.result;
            img.style.transform = "";
            zoom.value = 1;
            zoom.disabled = false;
            form.querySelector("[data-dialog-save]").disabled = false;
            dialogNote(form, "");
        };
        reader.readAsDataURL(file);
    }

    function savePhoto(form) {
        var img = form.querySelector("[data-photo-img]");
        var zoom = Number(form.querySelector("[data-photo-zoom]").value);
        dialogDone(form, function () {
            RP.USER.photo = cropPhoto(img, zoom);
            P.photoIsPlaceholder = false;
            paintAvatars();
            RP.toast("Your photo is updated.", "success");
        });
    }

    function removePhoto() {
        RP.USER.photo = PLACEHOLDER_PHOTO;
        P.photoIsPlaceholder = true;
        closeModal();
        paintAvatars();
        RP.toast("Your photo is removed.", "success");
    }

    /* ── Wiring ──────────────────────────────────────────── */

    function onAction(btn, e) {
        var act = btn.dataset.act;
        var id = Number(btn.dataset.id) || null;
        var form = btn.closest("form");

        if (act === "edit") return startEdit(btn.dataset.edit, btn.dataset.focusField);
        if (act === "cancel") return cancelEdit(btn.dataset.edit);
        if (act === "photo") return openPhoto();
        if (act === "photo-remove") return removePhoto();
        if (act === "help") return openHelp();
        if (act === "add-services") return openAddServices(btn.dataset.group);
        if (act === "stage") return stage(form);
        if (act === "unstage") return unstage(form, Number(btn.dataset.index));
        if (act === "svc-status") return setStatus(btn.dataset.status);
        if (act === "toggle-group") {
            /* A drag that selected the pair's name is not a click on the head */
            if (btn.tagName !== "BUTTON" && String(global.getSelection())) return;
            return toggleGroup(btn.closest(".rp-svcgroup"));
        }
        if (act === "toggle-all") return toggleAll();
        if (act === "svc-clear") return clearFilters();
        if (act === "edit-price") return openEditPrice(id);
        if (act === "ask-delete") return askDelete(btn);
        if (act === "delete") return deletePrice(id);
        if (act === "keep") {
            var ask = btn.closest(".rp-confirm-wrap").querySelector('[data-act="ask-delete"]');
            closeConfirm();
            return ask && ask.focus({ preventScroll: true });
        }
        if (act === "add-cert") return openCertForm({ group: btn.dataset.group });
        if (act === "edit-cert") return openCertForm({ id: id });
        if (act === "renew-cert") return openCertForm({ renewOf: id });
        if (act === "cert-details") return openCertDetails(id);
        if (act === "unpick-file") {
            picked.file = null;
            return paintDropslot();
        }
        if (act === "toggle-spec") return toggleSpec(btn);
        if (act === "method-view") return openMethod(btn.dataset.code);
        if (act === "method-add") return openMethodForm(btn.dataset.code);
        if (act === "method-default") return askDefault(btn.dataset.code);
        if (act === "mail") return openMail(id);
        if (act === "mail-show") return setMailShow(btn.dataset.show);
        if (act === "mail-page") {
            mailView.page = Number(btn.dataset.page);
            return paintMails(btn.getAttribute("aria-label"));
        }
        if (act === "goto") return goTo(btn.dataset.target);
        if (act === "availability") return openAvailability();
        if (act === "copy-id") return copyId();
        if (act === "message-vm") return RP.toast("A message to " + PRO.vendorManager.name + " would open in Messaging.", "info");
        if (act === "view-file") {
            e.preventDefault();
            return RP.toast(btn.dataset.name + " would open in the file viewer.", "info");
        }
    }

    function onSubmit(e) {
        var form = e.target;
        if (form.id === "rpSpecForm") {
            e.preventDefault();
            return saveSpecialities();
        }
        if (form.id === "rpBillingForm") {
            e.preventDefault();
            return saveBilling(form);
        }
        if (form.id === "rpDialogForm") {
            e.preventDefault();
            var kind = form.dataset.dialog;
            if (kind === "services") return saveServices(form);
            if (kind === "price") return saveEditPrice(form);
            if (kind === "cert") return saveCert(form);
            if (kind === "method") return saveMethod(form);
            if (kind === "default") return saveDefault(form);
            if (kind === "photo") return savePhoto(form);
        }
    }

    function onChange(e) {
        var t = e.target;
        var form = t.closest("form");

        if (t.matches("[data-same-primary]")) return setSame(form, t.checked);
        if (t.matches("[data-lifetime]")) {
            var date = form.querySelector("#cert_expiry");
            date.disabled = t.checked;
            date.classList.remove("is-invalid");
            if (t.checked) date.value = "";
            form.querySelector("[data-expiry-star]").hidden = t.checked;
            return;
        }
        if (t.id === "cert_country") {
            var names = form.querySelector("#cert_name");
            names.outerHTML = select("cert_name", certNameOptions(t.value), "", { required: true, empty: t.value ? "Select a certificate" : "Select a country first", disabled: !t.value });
            form.querySelector("[data-naati]").innerHTML = "";
            return;
        }
        if (t.id === "cert_name") {
            form.querySelector("[data-naati]").innerHTML = naatiNote(t.value);
            return;
        }
        if (t.matches("[data-mail-topic]")) {
            mailView.topic = t.value;
            mailView.page = 1;
            return paintMails();
        }
        if (t.id === "svc_service") return repaintSvc(form, "svc_service");
        if (t.id === "svc_currency") {
            form.querySelector("[data-conv]").innerHTML = convHint(t.value, val(form, "svc_amount"));
            return;
        }
        if (t.id === "pm_country") {
            form.querySelector("[data-bankcode]").innerHTML = bankCodeField(t.value, findMethod("WIRE") || {});
            return;
        }
        if (t.matches("[data-photo-file]")) return readPhoto(t.files[0]);
        if (t.matches("[data-cert-file]") && t.files.length) {
            var file = t.files[0];
            if (file.size > MAX_UPLOAD) return dialogFail(form, t, file.name + " is over 10 MB. Choose a smaller file.");
            picked.file = { name: file.name, size: bytes(file.size) };
            paintDropslot();
            dialogNote(form, "");
            return;
        }
        if (t.closest("#rpBillingForm")) markDirty("billing");
    }

    function onInput(e) {
        var t = e.target;
        if (t.classList.contains("is-invalid")) t.classList.remove("is-invalid");

        if (t.matches("[data-svc-search]")) {
            view.q = t.value;
            return paintGroups();
        }
        if (t.matches("[data-mail-search]")) {
            mailView.q = t.value;
            mailView.page = 1;
            return paintMails();
        }
        if (t.matches("[data-spec-search]")) return filterSpecs(t.value);
        if (t.id === "svc_amount") {
            var form = t.closest("form");
            form.querySelector("[data-conv]").innerHTML = convHint(val(form, "svc_currency") || BASE, t.value);
            return;
        }
        if (t.matches("[data-photo-zoom]")) {
            els.panel.querySelector("[data-photo-img]").style.transform = "scale(" + t.value + ")";
            return;
        }
        if (t.closest("#rpBillingForm")) markDirty("billing");
    }

    function typing(el) {
        return el && (el.matches("input, textarea, select") || el.isContentEditable);
    }

    function onKey(e) {
        if (e.key === "Escape") {
            if (document.querySelector(".rp-confirm")) {
                var ask = document.querySelector(".is-asking");
                closeConfirm();
                if (ask) ask.focus({ preventScroll: true });
                return;
            }
            return closeModal();
        }
        /* "/" jumps to the services search, as it does to the search on the table pages */
        if (e.key === "/" && !typing(e.target) && !els.modal.classList.contains("is-open")) {
            var search = document.querySelector("[data-svc-search]");
            if (search) {
                e.preventDefault();
                search.focus();
                search.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
            }
            return;
        }
        if (e.key === "Enter" && e.target.matches("[data-spec-search]")) {
            e.preventDefault();
            var first = document.querySelector("#rpSpecForm .rp-toggle:not([hidden]):not(:disabled)");
            if (first) toggleSpec(first);
            return;
        }
        /* Enter in the rate adds it to the list rather than saving half a form */
        if (e.key === "Enter" && e.target.id === "svc_amount" && e.target.closest('[data-dialog="services"]')) {
            e.preventDefault();
            stage(e.target.closest("form"));
        }
    }

    function wire() {
        document.addEventListener("click", function (e) {
            if (e.target.closest("[data-close]")) return closeModal();
            if (e.target === els.modal) return closeModal();
            if (!e.target.closest(".rp-confirm") && !e.target.closest('[data-act="ask-delete"]')) closeConfirm();

            var btn = e.target.closest("[data-act]");
            if (btn && !btn.disabled) onAction(btn, e);
        });

        els.tabs.addEventListener("click", function (e) {
            var link = e.target.closest("[data-section]");
            if (!link) return;
            e.preventDefault();
            goTo(link.dataset.section);
        });

        document.addEventListener("submit", onSubmit);
        document.addEventListener("change", onChange);
        document.addEventListener("input", onInput);
        document.addEventListener("keydown", onKey);

        ["dragenter", "dragover"].forEach(function (type) {
            document.addEventListener(type, function (e) {
                var drop = e.target.closest && e.target.closest("[data-drop]");
                if (drop) drop.classList.add("is-dragover");
            });
        });

        ["dragleave", "drop"].forEach(function (type) {
            document.addEventListener(type, function (e) {
                var drop = e.target.closest && e.target.closest("[data-drop]");
                if (drop) drop.classList.remove("is-dragover");
            });
        });

        global.addEventListener(
            "scroll",
            function () {
                if (spyQueued) return;
                spyQueued = true;
                global.requestAnimationFrame(spy);
            },
            { passive: true }
        );

        /* The sidebar's slide changes the width after resize has fired, so the layout itself is watched */
        if (global.ResizeObserver) new global.ResizeObserver(fitAside).observe(els.pro);
        global.addEventListener("resize", fitAside);

        global.addEventListener("beforeunload", function (e) {
            if (!dirty.specialities && !dirty.billing) return;
            e.preventDefault();
            e.returnValue = "";
        });
    }

    /* ── Boot ────────────────────────────────────────────── */

    function init() {
        els = {
            head: document.getElementById("rpProHead"),
            nav: document.getElementById("rpProNav"),
            tabs: document.getElementById("rpProTabs"),
            pro: document.getElementById("rpPro"),
            modal: document.getElementById("rpModal"),
            panel: document.getElementById("rpModalPanel")
        };
        if (!els.pro) return;

        renderAll();
        wire();

        var params = new URLSearchParams(global.location.search);
        var cert = params.get("highlight_cert");
        var hash = global.location.hash.slice(1);
        /* The old page's anchor, which User Account still links to */
        if (hash === "translator_prices") {
            hash = "services";
            history.replaceState(null, "", global.location.pathname + global.location.search + "#services");
        }

        if (cert && document.getElementById("cert-" + cert)) {
            setTimeout(function () {
                flash("cert-" + cert, true);
                setActive("services");
            }, 300);
        } else if (hash && document.getElementById(hash)) {
            document.getElementById(hash).scrollIntoView({ block: "start" });
            setActive(hash);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
