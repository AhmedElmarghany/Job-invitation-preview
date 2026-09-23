/* ============================================================
   JOB INVITATIONS
   Table render, search, sort, column resize, pagination and the
   expanded decision panel. All state is in memory — accepting or
   declining changes the demo data, nothing is sent anywhere.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;

    var COLUMNS = [
        { key: "col-id", label: "ID", width: 104, fixed: true, sticky: true, sort: "jobId" },
        { key: "col-project", label: "Project Name", width: 160, fixed: true, sticky: true, sort: "project" },
        // { key: "col-type", label: "Type", width: 132, sort: "type" },
        { key: "col-service", label: "Service", width: 120, sort: "service" },
        { key: "col-langs", label: "Languages", width: 168 },
        { key: "col-status", label: "Status", width: 132, sort: "status" },
        { key: "col-amount", label: "Amount", width: 120, sort: "amount", align: "right" },
        { key: "col-count", label: "Count", width: 145 },
        { key: "col-deadline", label: "Deadline", width: 175, sort: "deadline" },
        // { key: "col-invited", label: "Invited", width: 165, sort: "invitedAt" },
        { key: "col-specialty", label: "Specialty", width: 145, sort: "specialty" },
        { key: "col-actions", label: "Actions", width: 200 }
    ];

    var FILTERS = [
        { key: "all", label: "All" },
        { key: "action", label: "Needs action", match: ["new", "bid_requested"] },
        { key: "submitted", label: "Bid submitted", match: ["bid_submitted"] },
        { key: "accepted", label: "Accepted", match: ["accepted"] },
        { key: "closed", label: "Closed", match: ["declined", "expired"] }
    ];

    var state = {
        search: "",
        filter: "all",
        sort: { key: "invitedAt", dir: "desc" },
        page: 1,
        perPage: 10,
        expanded: {}
    };

    var rows = [];
    var els = {};
    var columnsModal = null;
    var pendingWidthSync = false;

    /* ── Formatting ──────────────────────────────────────── */

    function money(value) {
        return value == null
            ? "—"
            : value.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function number(value) {
        return value.toLocaleString("en-NZ");
    }

    function fmtDate(date) {
        return date.toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" });
    }

    function fmtTime(date) {
        return date.toLocaleTimeString("en-NZ", { hour: "numeric", minute: "2-digit" });
    }

    /* "2d 4h" / "5h 12m" / "18m" — the longest useful unit pair */
    function spread(ms) {
        var abs = Math.abs(ms);
        var mins = Math.floor(abs / 60000);
        var hours = Math.floor(mins / 60);
        var days = Math.floor(hours / 24);

        if (days > 0) return days + "d " + (hours % 24) + "h";
        if (hours > 0) return hours + "h " + (mins % 60) + "m";
        return mins + "m";
    }

    function clock(ms) {
        var total = Math.max(0, Math.floor(ms / 1000));
        var h = Math.floor(total / 3600);
        var m = Math.floor((total % 3600) / 60);
        var s = total % 60;
        var pad = function (n) {
            return n < 10 ? "0" + n : "" + n;
        };
        return pad(h) + ":" + pad(m) + ":" + pad(s);
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function initials(name) {
        return name
            .split(/\s+/)
            .slice(0, 2)
            .map(function (part) {
                return part.charAt(0);
            })
            .join("")
            .toUpperCase();
    }

    /* ── Derived bits ────────────────────────────────────── */

    function isOpen(row) {
        return row.status === "new" || row.status === "bid_requested";
    }

    function timeLeftChip(date) {
        var diff = date - Date.now();
        var tone = diff < 0 ? "passed" : diff < 12 * 3600000 ? "urgent" : diff < 48 * 3600000 ? "soon" : "";

        return (
            '<span class="rp-left' +
            (tone ? " rp-left--" + tone : "") +
            '">' +
            icon(diff < 0 ? "alert" : "clock") +
            (diff < 0 ? spread(diff) + " overdue" : spread(diff) + " left") +
            "</span>"
        );
    }

    function langCell(row) {
        if (!row.source && !row.target) {
            return '<span class="empty-cell">—</span>';
        }
        if (!row.target) {
            return '<span class="rp-langs">' + escapeHtml(row.source) + "</span>";
        }

        return (
            '<span class="rp-langs">' +
            escapeHtml(row.source) +
            icon("arrow-right") +
            escapeHtml(row.target) +
            "</span>"
        );
    }

    function statusPill(row) {
        var meta = RP.STATUS[row.status];
        return (
            '<span class="status-pill ' +
            meta.pill +
            '"><span class="status-dot"></span><span class="status-text">' +
            meta.label +
            "</span></span>"
        );
    }

    /* ── Table shell ─────────────────────────────────────── */

    /* Both return the *inner* markup: the <colgroup> and the header
       <tr> already exist in the page, only their contents are redrawn. */
    function colsMarkup() {
        return (
            COLUMNS.map(function (col) {
                return (
                    '<col class="col ' +
                    col.key +
                    '" style="width:' +
                    col.width +
                    'px" data-width-default="' +
                    col.width +
                    '">'
                );
            }).join("") + '<col class="col-filler">'
        );
    }

    /* Verbatim from templates/partials/_sorting_icon.html — same three
       path pairs, same class names. The inline display:none is gone:
       which pair shows is decided by .is-asc / .is-desc on the <th>,
       so both chevrons stay on screen and only the active one is lit. */
    var SORT_ICON =
        '<svg class="sorting-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path class="order-icon" d="M5.53057 5.53187L7.99994 3.0625L10.4693 5.5325C10.6102 5.67339 10.8013 5.75255 11.0006 5.75255C11.1998 5.75255 11.3909 5.67339 11.5318 5.5325C11.6727 5.3916 11.7519 5.2005 11.7519 5.00125C11.7519 4.80199 11.6727 4.61089 11.5318 4.47L8.53182 1.47C8.46214 1.40008 8.37935 1.3446 8.28818 1.30674C8.19702 1.26889 8.09928 1.2494 8.00057 1.2494C7.90186 1.2494 7.80412 1.26889 7.71295 1.30674C7.62179 1.3446 7.539 1.40008 7.46932 1.47L4.46932 4.47C4.32842 4.61089 4.24927 4.80199 4.24927 5.00125C4.24927 5.2005 4.32842 5.3916 4.46932 5.5325C4.61022 5.67339 4.80131 5.75255 5.00057 5.75255C5.19983 5.75255 5.39092 5.67339 5.53182 5.5325L5.53057 5.53187Z" fill="currentColor"/>' +
        '<path class="order-icon" d="M11.5306 10.4694C11.6005 10.5391 11.656 10.6219 11.6938 10.713C11.7317 10.8042 11.7512 10.9019 11.7512 11.0006C11.7512 11.0993 11.7317 11.1971 11.6938 11.2882C11.656 11.3794 11.6005 11.4622 11.5306 11.5319L8.5306 14.5319C8.46092 14.6018 8.37813 14.6573 8.28696 14.6951C8.1958 14.733 8.09806 14.7525 7.99935 14.7525C7.90064 14.7525 7.8029 14.733 7.71173 14.6951C7.62057 14.6573 7.53778 14.6018 7.4681 14.5319L4.4681 11.5319C4.3272 11.391 4.24805 11.1999 4.24805 11.0006C4.24805 10.8014 4.3272 10.6103 4.4681 10.4694C4.60899 10.3285 4.80009 10.2493 4.99935 10.2493C5.19861 10.2493 5.3897 10.3285 5.5306 10.4694L7.99997 12.9375L10.4693 10.4675C10.5391 10.3979 10.6219 10.3427 10.7131 10.3051C10.8042 10.2676 10.9018 10.2483 11.0004 10.2485C11.0989 10.2486 11.1965 10.2682 11.2875 10.3062C11.3784 10.3441 11.4611 10.3995 11.5306 10.4694Z" fill="currentColor"/>' +
        '<path class="down-triangle-icon" d="M5.53057 5.53187L7.99994 3.0625L10.4693 5.5325C10.6102 5.67339 10.8013 5.75255 11.0006 5.75255C11.1998 5.75255 11.3909 5.67339 11.5318 5.5325C11.6727 5.3916 11.7519 5.2005 11.7519 5.00125C11.7519 4.80199 11.6727 4.61089 11.5318 4.47L8.53182 1.47C8.46214 1.40008 8.37935 1.3446 8.28818 1.30674C8.19702 1.26889 8.09928 1.2494 8.00057 1.2494C7.90186 1.2494 7.80412 1.26889 7.71295 1.30674C7.62179 1.3446 7.539 1.40008 7.46932 1.47L4.46932 4.47C4.32842 4.61089 4.24927 4.80199 4.24927 5.00125C4.24927 5.2005 4.32842 5.3916 4.46932 5.5325C4.61022 5.67339 4.80131 5.75255 5.00057 5.75255C5.19983 5.75255 5.39092 5.67339 5.53182 5.5325L5.53057 5.53187Z" fill="#71717A"/>' +
        '<path class="down-triangle-icon" d="M11.5306 10.4694C11.6005 10.5391 11.656 10.6219 11.6938 10.713C11.7317 10.8042 11.7512 10.9019 11.7512 11.0006C11.7512 11.0993 11.7317 11.1971 11.6938 11.2882C11.656 11.3794 11.6005 11.4622 11.5306 11.5319L8.5306 14.5319C8.46092 14.6018 8.37813 14.6573 8.28696 14.6951C8.1958 14.733 8.09806 14.7525 7.99935 14.7525C7.90064 14.7525 7.8029 14.733 7.71173 14.6951C7.62057 14.6573 7.53778 14.6018 7.4681 14.5319L4.4681 11.5319C4.3272 11.391 4.24805 11.1999 4.24805 11.0006C4.24805 10.8014 4.3272 10.6103 4.4681 10.4694C4.60899 10.3285 4.80009 10.2493 4.99935 10.2493C5.19861 10.2493 5.3897 10.3285 5.5306 10.4694L7.99997 12.9375L10.4693 10.4675C10.5391 10.3979 10.6219 10.3427 10.7131 10.3051C10.8042 10.2676 10.9018 10.2483 11.0004 10.2485C11.0989 10.2486 11.1965 10.2682 11.2875 10.3062C11.3784 10.3441 11.4611 10.3995 11.5306 10.4694Z" fill="currentColor"/>' +
        '<path class="up-triangle-icon" d="M5.53057 5.53187L7.99994 3.0625L10.4693 5.5325C10.6102 5.67339 10.8013 5.75255 11.0006 5.75255C11.1998 5.75255 11.3909 5.67339 11.5318 5.5325C11.6727 5.3916 11.7519 5.2005 11.7519 5.00125C11.7519 4.80199 11.6727 4.61089 11.5318 4.47L8.53182 1.47C8.46214 1.40008 8.37935 1.3446 8.28818 1.30674C8.19702 1.26889 8.09928 1.2494 8.00057 1.2494C7.90186 1.2494 7.80412 1.26889 7.71295 1.30674C7.62179 1.3446 7.539 1.40008 7.46932 1.47L4.46932 4.47C4.32842 4.61089 4.24927 4.80199 4.24927 5.00125C4.24927 5.2005 4.32842 5.3916 4.46932 5.5325C4.61022 5.67339 4.80131 5.75255 5.00057 5.75255C5.19983 5.75255 5.39092 5.67339 5.53182 5.5325L5.53057 5.53187Z" fill="currentColor"/>' +
        '<path class="up-triangle-icon" d="M11.5306 10.4694C11.6005 10.5391 11.656 10.6219 11.6938 10.713C11.7317 10.8042 11.7512 10.9019 11.7512 11.0006C11.7512 11.0993 11.7317 11.1971 11.6938 11.2882C11.656 11.3794 11.6005 11.4622 11.5306 11.5319L8.5306 14.5319C8.46092 14.6018 8.37813 14.6573 8.28696 14.6951C8.1958 14.733 8.09806 14.7525 7.99935 14.7525C7.90064 14.7525 7.8029 14.733 7.71173 14.6951C7.62057 14.6573 7.53778 14.6018 7.4681 14.5319L4.4681 11.5319C4.3272 11.391 4.24805 11.1999 4.24805 11.0006C4.24805 10.8014 4.3272 10.6103 4.4681 10.4694C4.60899 10.3285 4.80009 10.2493 4.99935 10.2493C5.19861 10.2493 5.3897 10.3285 5.5306 10.4694L7.99997 12.9375L10.4693 10.4675C10.5391 10.3979 10.6219 10.3427 10.7131 10.3051C10.8042 10.2676 10.9018 10.2483 11.0004 10.2485C11.0989 10.2486 11.1965 10.2682 11.2875 10.3062C11.3784 10.3441 11.4611 10.3995 11.5306 10.4694Z" fill="#71717A"/>' +
        "</svg>";

    function headCellsMarkup() {
        var cells = COLUMNS.map(function (col, index) {
            var sorted = col.sort && state.sort.key === col.sort;
            var sortIcon = col.sort ? '<span class="rp-sort">' + SORT_ICON + "</span>" : "";

            return (
                "<th " +
                (col.sort ? 'class="order_by ' : 'class="') +
                col.key +
                (col.sticky ? " sticky-col" : "") +
                (sorted ? " is-sorted is-" + state.sort.dir : "") +
                '"' +
                (col.sort ? ' data-sort="' + col.sort + '"' : "") +
                (col.align === "right" ? ' style="text-align:right"' : "") +
                ' scope="col">' +
                '<span class="th-inner"><span class="label">' +
                col.label +
                "</span>" +
                sortIcon +
                "</span>" +
                '<div class="resizer" data-col="' +
                index +
                '"></div>' +
                "</th>"
            );
        }).join("");

        return cells + '<th class="col-filler-cell"></th>';
    }

    /* ── Row ─────────────────────────────────────────────── */

    function rowMarkup(row) {
        var type = RP.TYPE[row.type];
        var expanded = !!state.expanded[row.id];

        var cells = [
            '<td class="col-id sticky-col">' +
                '<span class="rp-id-cell">' +
                '<button class="rp-expand-btn" type="button" aria-expanded="' +
                expanded +
                '" aria-label="Show details for ' +
                row.id +
                '">' +
                icon("chevron-right") +
                "</button>" +
                '<span class="rp-job-id">' +
                row.id +
                "</span></span></td>",

            '<td class="col-project sticky-col" title="' +
                escapeHtml(row.project) +
                '">' +
                escapeHtml(row.project) +
                "</td>",

            // '<td class="col-type"><span class="rp-type">' + icon(type.icon) + type.label + "</span></td>",

            '<td class="col-service" title="' + escapeHtml(row.service) + '">' + escapeHtml(row.service) + "</td>",

            '<td class="col-langs">' + langCell(row) + "</td>",

            '<td class="col-status">' + statusPill(row) + "</td>",

            '<td class="col-amount right-aligned-td">' +
                (row.amount == null
                    ? '<span class="empty-cell">Your quote</span>'
                    : '<span class="price-row-unit">' +
                      row.currencyCode +
                      '</span> <span class="price-row-value">' +
                      money(row.amount) +
                      "</span>") +
                "</td>",

            '<td class="col-count"><span class="count-row-value">' +
                number(row.count.value) +
                '</span> <span class="count-row-unit">' +
                row.count.unit +
                "</span></td>",

            '<td class="col-deadline"><span class="rp-deadline"><span class="rp-deadline__date">' +
                fmtDate(row.deadline) +
                ", " +
                fmtTime(row.deadline) +
                "</span>" +
                timeLeftChip(row.deadline) +
                "</span></td>",

            // '<td class="col-invited"><span class="td-text-main">' +
            //     fmtDate(row.invitedAt) +
            //     '</span> <span class="td-text-sub">' +
            //     fmtTime(row.invitedAt) +
            //     "</span></td>",

            '<td class="col-specialty">' + escapeHtml(row.specialty) + "</td>",

            '<td class="col-actions actions-cell">' + rowActionsMarkup(row) + "</td>"
        ].join("");

        return (
            '<tr class="rp-row rp-row--' +
            row.status +
            (expanded ? " is-expanded" : "") +
            '" data-id="' +
            row.id +
            '">' +
            cells +
            '<td class="col-filler-cell"></td></tr>' +
            '<tr class="rp-subrow' +
            (expanded ? "" : " is-hidden") +
            '" data-detail="' +
            row.id +
            '"><td colspan="' +
            (COLUMNS.length + 1) +
            '">' +
            (expanded ? detailMarkup(row) : "") +
            "</td></tr>"
        );
    }

    function rowActionsMarkup(row) {
        if (row.status === "new") {
            return (
                '<div class="rp-row-actions">' +
                '<button class="rp-btn rp-btn--accept" type="button" data-action="accept">' +
                icon("check") +
                "Accept</button>" +
                '<button class="rp-btn rp-btn--decline" type="button" data-action="decline">' +
                icon("close") +
                "Decline</button></div>"
            );
        }

        if (row.status === "bid_requested") {
            return (
                '<div class="rp-row-actions">' +
                '<button class="rp-btn rp-btn--bid" type="button" data-action="open-bid">' +
                icon("bid") +
                "Place bid</button>" +
                '<button class="rp-btn rp-btn--decline" type="button" data-action="decline">' +
                icon("close") +
                "Decline</button></div>"
            );
        }

        if (row.status === "bid_submitted") {
            return (
                '<div class="rp-row-actions"><span class="rp-row-actions__done">Waiting on the PM</span></div>'
            );
        }

        if (row.status === "accepted") {
            return (
                '<div class="rp-row-actions">' +
                '<button class="rp-btn" type="button" data-demo="The Jobs page">' +
                icon("view") +
                "Open job</button></div>"
            );
        }

        return '<div class="rp-row-actions"><span class="rp-row-actions__done">No action left</span></div>';
    }

    /* ── Expanded panel ──────────────────────────────────────
       One card, not a stack of them. The head carries the identity,
       the left column everything a resource reads, the right column
       the money and the decision. Kept short on purpose: this has to
       fit a laptop screen under the rows it belongs to. */

    function fact(label, value, hint) {
        if (value == null || value === "") return "";
        return (
            '<div class="rp-fact"><dt>' +
            label +
            "</dt><dd>" +
            value +
            (hint ? '<span class="rp-fact__hint">' + hint + "</span>" : "") +
            "</dd></div>"
        );
    }

    function panelHead(row) {
        var type = RP.TYPE[row.type];

        return (
            '<header class="rp-panel__head">' +
            '<span class="rp-panel__mark">' +
            icon(type.icon) +
            "</span>" +
            '<div class="rp-panel__titles">' +
            '<h3 class="rp-panel__title">' +
            escapeHtml(row.project) +
            "</h3>" +
            '<p class="rp-panel__sub"><span class="rp-panel__id">' +
            row.id +
            "</span>" +
            escapeHtml(row.service) +
            '<span class="rp-dot"></span>' +
            escapeHtml(row.specialty) +
            "</p></div>" +
            '<span class="rp-panel__tags">' +
            statusPill(row) +
            "</span>" +
            "</header>"
        );
    }

    function factsMarkup(row) {
        var appt = row.appointment;
        var left = row.deadline - Date.now();

        var facts =
            fact(
                "Languages",
                row.source || row.target
                    ? escapeHtml(row.source || "—") +
                          " <span class=\"rp-fact__arrow\">→</span> " +
                          escapeHtml(row.target || "—")
                    : "Not language based"
            ) +
            fact("Count", number(row.count.value) + " " + row.count.unit) +
            fact("Document format", row.docFormat ? escapeHtml(row.docFormat) : null) +
            fact("Invited", fmtDate(row.invitedAt) + ", " + fmtTime(row.invitedAt)) +
            fact(
                "Deadline",
                fmtDate(row.deadline) + ", " + fmtTime(row.deadline),
                left < 0 ? spread(left) + " overdue" : spread(left) + " from now"
            );

        if (appt) {
            facts +=
                fact("Starts", fmtDate(appt.start) + ", " + fmtTime(appt.start)) +
                fact("Duration", appt.durationMin + " min", "ends " + fmtTime(appt.end)) +
                fact(
                    appt.mode.indexOf("Remote") === 0 ? "Joining" : "Address",
                    escapeHtml(appt.location)
                ) +
                fact(
                    "Speakers",
                    '<span class="rp-speakers">' +
                        appt.speakers
                            .map(function (speaker) {
                                return (
                                    '<span class="rp-speaker">' +
                                    escapeHtml(speaker.name) +
                                    ' <em>' +
                                    escapeHtml(speaker.lang) +
                                    "</em></span>"
                                );
                            })
                            .join("") +
                        "</span>"
                );
        }

        return '<dl class="rp-facts">' + facts + "</dl>";
    }

    function filesSection(row) {
        if (!row.files || !row.files.length) return "";

        var items = row.files
            .map(function (file) {
                return (
                    '<li class="rp-file' +
                    (file.locked ? " rp-file--locked" : "") +
                    '">' +
                    icon(file.locked ? "lock" : "file") +
                    '<span class="rp-file__name">' +
                    escapeHtml(file.name) +
                    "</span>" +
                    '<span class="rp-file__size">' +
                    file.size +
                    "</span>" +
                    '<span class="rp-file__tag">' +
                    file.tag +
                    "</span>" +
                    (file.locked
                        ? '<span class="rp-file__lockhint">unlocks on assignment</span>'
                        : '<button class="rp-file__dl" type="button" data-demo="File download" aria-label="Download ' +
                          escapeHtml(file.name) +
                          '">' +
                          icon("download") +
                          "</button>") +
                    "</li>"
                );
            })
            .join("");

        return (
            '<section class="rp-sec">' +
            '<h4 class="rp-sec__title">' +
            icon("folder") +
            "Files<span class=\"rp-sec__count\">" +
            row.files.length +
            "</span></h4>" +
            '<ul class="rp-files">' +
            items +
            "</ul></section>"
        );
    }

    function notesSection(row) {
        if (!row.notes) return "";

        return (
            '<section class="rp-sec">' +
            '<h4 class="rp-sec__title">' +
            icon("list-todo") +
            "Instructions</h4>" +
            '<p class="rp-note is-clamped" data-note>' +
            escapeHtml(row.notes) +
            "</p>" +
            '<button class="rp-more" type="button" data-note-toggle>Show more</button>' +
            "</section>"
        );
    }

    function pmStrip(row) {
        return (
            '<div class="rp-pm">' +
            '<span class="rp-pm__avatar">' +
            initials(row.pm.name) +
            "</span>" +
            '<span class="rp-pm__text">' +
            '<span class="rp-pm__role">Project manager</span>' +
            '<span class="rp-pm__name">' +
            escapeHtml(row.pm.name) +
            "</span></span>" +
            '<button class="rp-pm__msg" type="button" data-demo="Messaging" aria-label="Message ' +
            escapeHtml(row.pm.name) +
            '">' +
            icon("messages") +
            "</button></div>"
        );
    }

    function countdownMarkup(row) {
        if (!row.expiresAt || !isOpen(row)) return "";

        return (
            '<span class="rp-countdown" data-countdown="' +
            row.expiresAt.getTime() +
            '">' +
            icon("hourglass") +
            "<span>Expires in <strong>" +
            clock(row.expiresAt - Date.now()) +
            "</strong></span></span>"
        );
    }

    function paymentAlert(row) {
        if (!row.paymentMethodMissing || !isOpen(row)) return "";

        return (
            '<p class="rp-alert">' +
            icon("warning") +
            "<span>Add a payment method on your " +
            '<a href="professional-profile.html">professional profile</a> before accepting.</span></p>'
        );
    }

    function offerCard(row) {
        var head =
            row.amount == null
                ? '<span class="rp-offer__label">Suggested range</span>' +
                  '<p class="rp-offer__amount">' +
                  row.currencyCode +
                  " " +
                  money(row.bid.suggestedMin) +
                  "–" +
                  money(row.bid.suggestedMax) +
                  "</p>"
                : '<span class="rp-offer__label">' +
                  (row.status === "bid_submitted" ? "Your bid" : "Your payout") +
                  "</span>" +
                  '<p class="rp-offer__amount">' +
                  row.currencyCode +
                  " " +
                  money(row.amount) +
                  (row.usd ? '<span class="rp-offer__usd">≈ USD ' + money(row.usd) + "</span>" : "") +
                  "</p>";

        return (
            '<div class="rp-offer">' +
            '<div class="rp-offer__top">' +
            head +
            countdownMarkup(row) +
            "</div>" +
            '<p class="rp-offer__meta">' +
            escapeHtml(row.rate) +
            '<span class="rp-dot"></span>' +
            number(row.count.value) +
            " " +
            row.count.unit +
            '<span class="rp-dot"></span>due ' +
            fmtDate(row.deadline) +
            "</p>" +
            paymentAlert(row) +
            offerActions(row) +
            "</div>"
        );
    }

    function offerActions(row) {
        if (row.status === "new") {
            var blocked = !!row.paymentMethodMissing;
            return (
                '<div class="rp-offer__actions">' +
                '<button class="rp-cta rp-cta--primary" type="button" data-action="accept"' +
                (blocked ? " disabled" : "") +
                ">" +
                icon("check") +
                "Accept</button>" +
                '<button class="rp-cta rp-cta--ghost" type="button" data-action="decline">Decline</button>' +
                "</div>"
            );
        }

        if (row.status === "bid_requested") {
            return (
                '<form class="rp-bid" data-bid-form>' +
                '<span class="rp-bid__field">' +
                '<span class="rp-bid__prefix">' +
                row.currencyCode +
                "</span>" +
                '<input type="number" step="0.01" min="0" name="amount" placeholder="' +
                money(row.bid.suggestedMin) +
                '" aria-label="Your price" required>' +
                "</span>" +
                '<button class="rp-cta rp-cta--primary" type="submit">' +
                icon("bid") +
                "Submit bid</button>" +
                '<button class="rp-cta rp-cta--ghost rp-bid__skip" type="button" data-action="decline">Not interested</button>' +
                "</form>"
            );
        }

        if (row.status === "bid_submitted") {
            return (
                '<p class="rp-resolved">' +
                icon("hourglass") +
                "<span>Submitted — the project manager is comparing bids.</span></p>"
            );
        }

        if (row.status === "accepted") {
            return (
                '<div class="rp-offer__actions">' +
                '<button class="rp-cta rp-cta--primary" type="button" data-demo="The Jobs page">' +
                icon("view") +
                "Open in Jobs</button></div>" +
                '<p class="rp-resolved rp-resolved--ok">' +
                icon("success") +
                "<span>Accepted — files are unlocked on your Jobs page.</span></p>"
            );
        }

        if (row.status === "declined") {
            return (
                '<p class="rp-resolved rp-resolved--bad">' +
                icon("error") +
                "<span>" +
                escapeHtml(row.declineReason || "You declined this invitation.") +
                "</span></p>"
            );
        }

        return (
            '<p class="rp-resolved">' +
            icon("alert") +
            "<span>Expired — it went to another resource.</span></p>"
        );
    }

    function detailMarkup(row) {
        return (
            '<div class="rp-detail">' +
            '<article class="rp-panel">' +
            panelHead(row) +
            '<div class="rp-panel__body">' +
            '<div class="rp-panel__main">' +
            factsMarkup(row) +
            /* Files and instructions share a row on a wide screen — two
               short blocks stacked is height this panel cannot spare. */
            '<div class="rp-panel__cols">' +
            filesSection(row) +
            notesSection(row) +
            "</div>" +
            "</div>" +
            '<aside class="rp-panel__side">' +
            offerCard(row) +
            pmStrip(row) +
            "</aside>" +
            "</div></article></div>"
        );
    }

    /* ── Filtering, sorting, paging ──────────────────────── */

    function visibleRows() {
        var needle = state.search.trim().toLowerCase();
        var filter = FILTERS.filter(function (f) {
            return f.key === state.filter;
        })[0];

        var list = rows.filter(function (row) {
            if (filter && filter.match && filter.match.indexOf(row.status) === -1) return false;
            if (!needle) return true;

            return [row.id, row.project, row.service, row.specialty, row.source, row.target]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .indexOf(needle) > -1;
        });

        var key = state.sort.key;
        var dir = state.sort.dir === "asc" ? 1 : -1;

        return list.sort(function (a, b) {
            var av = a[key];
            var bv = b[key];

            if (av == null) return 1;
            if (bv == null) return -1;
            if (av instanceof Date) return (av - bv) * dir;
            if (typeof av === "number") return (av - bv) * dir;

            return String(av).localeCompare(String(bv)) * dir;
        });
    }

    function countFor(filter) {
        if (!filter.match) return rows.length;
        return rows.filter(function (row) {
            return filter.match.indexOf(row.status) > -1;
        }).length;
    }

    /* ── Render ──────────────────────────────────────────── */

    function render() {
        var list = visibleRows();
        var pages = Math.max(1, Math.ceil(list.length / state.perPage));
        if (state.page > pages) state.page = pages;

        var start = (state.page - 1) * state.perPage;
        var pageRows = list.slice(start, start + state.perPage);

        els.colgroup.innerHTML = colsMarkup();
        els.thead.innerHTML = headCellsMarkup();

        els.tbody.innerHTML = pageRows.length
            ? pageRows.map(rowMarkup).join("")
            : '<tr><td class="rp-empty-cell" colspan="' +
              (COLUMNS.length + 1) +
              '">' +
              emptyMarkup() +
              "</td></tr>";

        renderFilters();
        renderPagination(list.length, pages, start, pageRows.length);

        if (columnsModal) columnsModal.apply();
        syncStickyOffsets();
        syncTableHeight();
        wireResizers();
        tickCountdowns();
        hideIdleNoteToggles(els.tbody);
    }

    /* The table grows with its content and the page scrolls, so this
       only keeps the detail-row width in sync — no height is imposed. */
    function syncTableHeight() {
        syncDetailWidth();

        /* Measured again next frame: whether a scrollbar appears at all
           depends on the height and content just written. */
        if (!pendingWidthSync) {
            pendingWidthSync = true;
            global.requestAnimationFrame(function () {
                pendingWidthSync = false;
                syncDetailWidth();
            });
        }
    }

    /* clientWidth, so neither scrollbar is counted. */
    function syncDetailWidth() {
        var width = els.scroll.clientWidth;
        if (width > 0) els.scroll.style.setProperty("--rp-detail-w", width + "px");
    }

    function emptyMarkup() {
        var searching = state.search.trim() || state.filter !== "all";

        return (
            '<div class="rp-empty">' +
            '<span class="rp-empty__icon">' +
            icon(searching ? "search" : "empty-inbox") +
            "</span>" +
            '<span class="rp-empty__title">' +
            (searching ? "Nothing matches those filters" : "No invitations right now") +
            "</span>" +
            '<span class="rp-empty__note">' +
            (searching
                ? "Try a different job ID, project name or service type — or clear the filters."
                : "When a project manager invites you to a job, it lands here. Keep your availability up to date to receive more.") +
            "</span>" +
            (searching
                ? '<button class="rp-btn rp-empty__action" type="button" data-clear-filters>' +
                  icon("reset") +
                  "Clear filters</button>"
                : "") +
            "</div>"
        );
    }

    function renderFilters() {
        els.filters.innerHTML = FILTERS.map(function (filter) {
            return (
                '<button class="rp-segment' +
                (state.filter === filter.key ? " is-active" : "") +
                '" type="button" data-filter="' +
                filter.key +
                '">' +
                filter.label +
                '<span class="rp-segment-count">' +
                countFor(filter) +
                "</span></button>"
            );
        }).join("");
    }

    function renderPagination(total, pages, start, shown) {
        var buttons = "";

        for (var page = 1; page <= pages; page++) {
            var near = Math.abs(page - state.page) <= 1;
            var edge = page <= 1 || page >= pages;

            if (!near && !edge) {
                if (page === 2 || page === pages - 1) buttons += '<span class="cu-page-ellipsis">…</span>';
                continue;
            }

            buttons +=
                '<button class="cu-page-nav-btn' +
                (page === state.page ? " active" : "") +
                '" type="button" data-page="' +
                page +
                '" aria-label="Page ' +
                page +
                '">' +
                page +
                "</button>";
        }

        els.pagination.innerHTML =
            '<div class="cu-page-size-wrap">' +
            '<span class="cu-page-size-label">Records per page</span>' +
            '<select class="cu-page-size-select" id="rpPerPage" aria-label="Records per page">' +
            [5, 10, 20, 50]
                .map(function (size) {
                    return (
                        '<option value="' +
                        size +
                        '"' +
                        (size === state.perPage ? " selected" : "") +
                        ">" +
                        size +
                        "</option>"
                    );
                })
                .join("") +
            "</select>" +
            '<span class="cu-page-info">Showing <strong>' +
            (total ? start + 1 : 0) +
            "–" +
            (start + shown) +
            "</strong> of <strong>" +
            total +
            "</strong></span></div>" +
            (pages > 1
                ? '<div class="cu-page-nav" aria-label="Pagination">' +
                  '<button class="cu-page-nav-btn" type="button" data-page="' +
                  (state.page - 1) +
                  '"' +
                  (state.page === 1 ? " disabled" : "") +
                  ' aria-label="Previous page">' +
                  icon("chevron-left") +
                  "</button>" +
                  buttons +
                  '<button class="cu-page-nav-btn" type="button" data-page="' +
                  (state.page + 1) +
                  '"' +
                  (state.page === pages ? " disabled" : "") +
                  ' aria-label="Next page">' +
                  icon("chevron-right") +
                  "</button></div>"
                : "");
    }

    /* ── Sticky columns ──────────────────────────────────── */

    function syncStickyOffsets() {
        /* On a phone two frozen columns would eat the whole screen, so
           only the first one stays pinned. A sticky box with `left: auto`
           simply stops sticking. */
        var onePinnedOnly = global.innerWidth <= 767;
        var offset = 0;
        var pinned = 0;

        COLUMNS.forEach(function (col) {
            if (!col.sticky) return;

            var th = els.table.querySelector("thead th." + col.key);
            if (!th || th.style.display === "none") return;

            var drop = onePinnedOnly && pinned > 0;

            /* Only the sticky cells: every body <td> is position:relative,
               so a stray `left` would shift it sideways instead. */
            els.table.querySelectorAll("." + col.key + ".sticky-col").forEach(function (cell) {
                cell.style.left = drop ? "" : offset + "px";
            });

            if (!drop) offset += th.offsetWidth;
            pinned++;
        });
    }

    /* ── Column resize ───────────────────────────────────── */

    function wireResizers() {
        els.table.querySelectorAll("th .resizer").forEach(function (handle) {
            handle.addEventListener("mousedown", function (event) {
                event.preventDefault();
                event.stopPropagation();

                var th = handle.parentElement;
                var col = els.colgroup.children[Array.prototype.indexOf.call(th.parentElement.children, th)];
                var startX = event.pageX;
                var startWidth = th.offsetWidth;

                function move(moveEvent) {
                    var width = Math.max(70, startWidth + moveEvent.pageX - startX);
                    col.style.width = width + "px";
                    syncStickyOffsets();
                }

                function stop() {
                    document.removeEventListener("mousemove", move);
                    document.removeEventListener("mouseup", stop);
                    document.body.style.userSelect = "";
                }

                document.body.style.userSelect = "none";
                document.addEventListener("mousemove", move);
                document.addEventListener("mouseup", stop);
            });
        });
    }

    /* ── Countdowns ──────────────────────────────────────── */

    function tickCountdowns() {
        document.querySelectorAll("[data-countdown]").forEach(function (el) {
            var left = Number(el.dataset.countdown) - Date.now();
            var strong = el.querySelector("strong");
            if (!strong) return;

            if (left <= 0) {
                el.classList.remove("rp-countdown--urgent");
                el.classList.add("rp-countdown--over");
                strong.textContent = "expired";
                el.lastElementChild.innerHTML = "Offer window <strong>closed</strong>";
                return;
            }

            el.classList.toggle("rp-countdown--urgent", left < 3600000);
            strong.textContent = clock(left);
        });
    }

    /* ── Row expand ──────────────────────────────────────── */

    function toggleRow(id, force) {
        var tr = els.tbody.querySelector('tr.rp-row[data-id="' + id + '"]');
        var detail = els.tbody.querySelector('tr.rp-subrow[data-detail="' + id + '"]');
        if (!tr || !detail) return;

        var open = force != null ? force : detail.classList.contains("is-hidden");

        if (open && !detail.firstElementChild.innerHTML.trim()) {
            detail.firstElementChild.innerHTML = detailMarkup(findRow(id));
            hideIdleNoteToggles(detail);
        }

        detail.classList.toggle("is-hidden", !open);
        tr.classList.toggle("is-expanded", open);
        tr.querySelector(".rp-expand-btn").setAttribute("aria-expanded", String(open));

        if (open) {
            state.expanded[id] = true;
        } else {
            delete state.expanded[id];
        }

        syncTableHeight();
        tickCountdowns();
    }

    /* "Show more" only earns its place when the note is actually
       clipped, which is a rendered fact, not a length in characters. */
    function hideIdleNoteToggles(scope) {
        scope.querySelectorAll("[data-note]").forEach(function (note) {
            var btn = note.nextElementSibling;
            if (btn && note.scrollHeight <= note.clientHeight + 2) btn.style.display = "none";
        });
    }

    function findRow(id) {
        return rows.filter(function (row) {
            return row.id === id;
        })[0];
    }

    /* ── Actions ─────────────────────────────────────────── */

    function accept(row) {
        if (row.paymentMethodMissing) {
            RP.toast("Add a payment method before accepting this invitation.", "danger");
            return;
        }

        row.status = "accepted";
        RP.toast(row.id + " accepted — it is now on your Jobs page.", "success");
        refreshAfterAction(row);
    }

    function decline(row) {
        row.status = "declined";
        row.declineReason = "Declined from the invitations list.";
        RP.toast(row.id + " declined.", "danger");
        refreshAfterAction(row);
    }

    function submitBid(row, amount) {
        row.status = "bid_submitted";
        row.amount = amount;
        row.usd = Math.round(amount * 0.6073 * 100) / 100;
        RP.toast("Bid of " + row.currencyCode + " " + money(amount) + " submitted for " + row.id + ".", "success");
        refreshAfterAction(row);
    }

    function refreshAfterAction(row) {
        RP.USER.invitationCount = rows.filter(isOpen).length;
        updateSidebarBadge();
        render();
        if (state.expanded[row.id]) toggleRow(row.id, true);
    }

    function updateSidebarBadge() {
        var badge = document.querySelector('.rp-sidebar__nav-item[href="invitations.html"] .rp-sidebar__nav-item-badge');
        if (!badge) return;

        if (RP.USER.invitationCount) {
            badge.textContent = RP.USER.invitationCount;
            badge.style.display = "";
        } else {
            badge.style.display = "none";
        }
    }

    /* ── Wiring ──────────────────────────────────────────── */

    function wire() {
        /* Search */
        var debounce;
        els.search.addEventListener("input", function () {
            clearTimeout(debounce);
            els.clearSearch.classList.toggle("is-visible", !!els.search.value);

            debounce = setTimeout(function () {
                state.search = els.search.value;
                state.page = 1;
                render();
            }, 180);
        });

        els.clearSearch.addEventListener("click", function () {
            els.search.value = "";
            els.clearSearch.classList.remove("is-visible");
            state.search = "";
            state.page = 1;
            render();
            els.search.focus();
        });

        /* "/" jumps to search, Escape leaves it */
        document.addEventListener("keydown", function (e) {
            if (e.key === "/" && document.activeElement !== els.search && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
                e.preventDefault();
                els.search.focus();
                els.search.select();
            }

            if (e.key === "Escape" && document.activeElement === els.search) {
                els.search.blur();
            }
        });

        /* Status filter */
        els.filters.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-filter]");
            if (!btn) return;

            state.filter = btn.dataset.filter;
            state.page = 1;
            render();
        });

        /* Sorting */
        els.thead.addEventListener("click", function (e) {
            if (e.target.closest(".resizer")) return;

            var th = e.target.closest("th[data-sort]");
            if (!th) return;

            var key = th.dataset.sort;
            if (state.sort.key === key) {
                state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
            } else {
                state.sort = { key: key, dir: "asc" };
            }

            render();
        });

        /* Row clicks: expand, or run an action */
        els.tbody.addEventListener("click", function (e) {
            if (e.target.closest("[data-clear-filters]")) {
                state.search = "";
                state.filter = "all";
                els.search.value = "";
                els.clearSearch.classList.remove("is-visible");
                state.page = 1;
                render();
                return;
            }

            var noteToggle = e.target.closest("[data-note-toggle]");
            if (noteToggle) {
                e.stopPropagation();
                var note = noteToggle.previousElementSibling;
                var clamped = note.classList.toggle("is-clamped");
                noteToggle.textContent = clamped ? "Show more" : "Show less";
                syncTableHeight();
                return;
            }

            var actionBtn = e.target.closest("[data-action]");
            if (actionBtn) {
                e.stopPropagation();
                var holder = actionBtn.closest("tr");
                var id = holder.dataset.id || holder.dataset.detail;
                var row = findRow(id);
                var action = actionBtn.dataset.action;

                if (action === "accept") accept(row);
                if (action === "decline") decline(row);
                if (action === "open-bid") {
                    toggleRow(id, true);
                    var input = els.tbody.querySelector(
                        'tr[data-detail="' + id + '"] [data-bid-form] input'
                    );
                    if (input) input.focus();
                }
                return;
            }

            /* Anything genuinely interactive keeps its own click */
            if (e.target.closest("a, button, input, select, label")) {
                var expandBtn = e.target.closest(".rp-expand-btn");
                if (expandBtn) toggleRow(expandBtn.closest("tr").dataset.id);
                return;
            }

            var tr = e.target.closest("tr.rp-row");
            if (tr) toggleRow(tr.dataset.id);
        });

        /* Bid form */
        els.tbody.addEventListener("submit", function (e) {
            var form = e.target.closest("[data-bid-form]");
            if (!form) return;

            e.preventDefault();
            var id = form.closest("tr").dataset.detail;
            var amount = parseFloat(form.querySelector('input[name="amount"]').value);

            if (!amount || amount <= 0) {
                RP.toast("Enter a price before submitting your bid.", "danger");
                return;
            }

            submitBid(findRow(id), amount);
        });

        /* Pagination */
        els.pagination.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-page]");
            if (!btn || btn.disabled) return;

            state.page = Number(btn.dataset.page);
            render();
            els.scroll.scrollTop = 0;
        });

        els.pagination.addEventListener("change", function (e) {
            if (e.target.id !== "rpPerPage") return;
            state.perPage = Number(e.target.value);
            state.page = 1;
            render();
        });

        /* Columns */
        els.columnsBtn.addEventListener("click", function () {
            columnsModal.open();
        });

        /* Reset demo */
        els.resetBtn.addEventListener("click", function () {
            location.reload();
        });

        /* Shadow on the sticky columns once the table is scrolled sideways */
        els.scroll.addEventListener("scroll", function () {
            els.scroll.classList.toggle("scrolled-x", els.scroll.scrollLeft > 0);
        });

        document.addEventListener("rp:layout-change", function () {
            syncStickyOffsets();
            syncTableHeight();
        });

        global.addEventListener("resize", function () {
            syncStickyOffsets();
            syncTableHeight();
        });

        /* Catches everything a resize event does not: the sidebar
           animating, a scrollbar appearing, the tab being shown for the
           first time after rendering at zero width. */
        if (global.ResizeObserver) {
            new global.ResizeObserver(function () {
                syncDetailWidth();
                syncStickyOffsets();
            }).observe(els.scroll);
        }

        setInterval(tickCountdowns, 1000);
    }

    /* ── Boot ────────────────────────────────────────────── */

    function init() {
        if (!document.getElementById("rp-invitations-table")) return;

        rows = RP.INVITATIONS.map(function (row) {
            row.currencyCode = RP.USER.currency;
            return row;
        });

        els = {
            table: document.getElementById("new-customized-table"),
            colgroup: document.querySelector("#new-customized-table colgroup"),
            thead: document.querySelector("#new-customized-table thead tr"),
            tbody: document.querySelector("#new-customized-table tbody"),
            scroll: document.getElementById("scrollContainer"),
            search: document.getElementById("search-input"),
            clearSearch: document.getElementById("rpClearSearch"),
            filters: document.getElementById("rpFilters"),
            pagination: document.getElementById("rpPagination"),
            columnsBtn: document.getElementById("rpColumnsBtn"),
            resetBtn: document.getElementById("rpResetBtn")
        };

        columnsModal = new RP.ColumnsModal({
            table: "#new-customized-table",
            columns: COLUMNS,
            storageKey: "rp_invitations_columns",
            onChange: syncStickyOffsets
        });

        wire();
        render();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
