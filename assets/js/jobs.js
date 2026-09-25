/* ============================================================
   MY JOBS
   One page, three tabs — Active, Waiting, Completed. The tabs are
   the customer Orders nav (navigation-tabs.css), and each one
   carries its own column set the way my_jobs.html does: Completed
   adds Bill ID, Status, Delivered At and the Job Slip.
   Everything is in memory; nothing is sent anywhere.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;

    /* Shared by all three tabs, in the order my_jobs.html lists them.
       `fixed` means the Customize Columns modal cannot hide it. */
    var BASE = {
        id: { key: "col-id", label: "Job ID", width: 112, fixed: true, sticky: true, sort: "jobId" },
        project: { key: "col-project", label: "Project Name", width: 200, fixed: true, sticky: true, sort: "project" },
        bill: { key: "col-bill", label: "Bill ID", width: 104, sort: "billId" },
        service: { key: "col-service", label: "Service", width: 120, sort: "service" },
        langs: { key: "col-langs", label: "Languages", width: 168 },
        progress: { key: "col-progress", label: "Progress", width: 120, sort: "progress" },
        status: { key: "col-status", label: "Status", width: 132, sort: "jobStatus" },
        amount: { key: "col-amount", label: "Amount", width: 124, sort: "amount", align: "right" },
        count: { key: "col-count", label: "Count", width: 130 },
        deadline: { key: "col-deadline", label: "Deadline", width: 182, sort: "deadline" },
        accepted: { key: "col-accepted", label: "Accepted", width: 182, sort: "acceptedAt" },
        delivered: { key: "col-delivered", label: "Delivered At", width: 182, sort: "deliveredAt" },
        specialty: { key: "col-specialty", label: "Specialty", width: 140, sort: "specialty" },
        pm: { key: "col-pm", label: "Project Manager", width: 160, sort: "pmName" },
        slip: { key: "col-slip", label: "Job Slip", width: 96 },
        actions: { key: "col-actions", label: "Actions", width: 96 }
    };

    var COLUMNS = {
        active: [
            BASE.id, BASE.project, BASE.service, BASE.langs, BASE.progress, BASE.amount,
            BASE.count, BASE.deadline, BASE.accepted, BASE.specialty, BASE.pm, BASE.actions
        ],
        waiting: [
            BASE.id, BASE.project, BASE.service, BASE.langs, BASE.progress, BASE.amount,
            BASE.count, BASE.deadline, BASE.accepted, BASE.specialty, BASE.pm, BASE.actions
        ],
        completed: [
            BASE.id, BASE.project, BASE.bill, BASE.service, BASE.langs, BASE.progress,
            BASE.status, BASE.amount, BASE.count, BASE.deadline, BASE.accepted,
            BASE.delivered, BASE.specialty, BASE.pm, BASE.slip, BASE.actions
        ]
    };

    /* Newest first on the open tabs; last delivered first on Completed. */
    var DEFAULT_SORT = {
        active: { key: "deadline", dir: "asc" },
        waiting: { key: "deadline", dir: "asc" },
        completed: { key: "deliveredAt", dir: "desc" }
    };

    var state = {
        tab: "active",
        search: "",
        sort: { key: "deadline", dir: "asc" },
        page: 1,
        perPage: 20
    };

    var rows = [];
    var els = {};
    var columnsModal = null;
    var pendingWidthSync = false;

    function cols() {
        return COLUMNS[state.tab];
    }

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

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    /* ── Cells ───────────────────────────────────────────── */

    function langCell(row) {
        if (!row.source && !row.target) return '<span class="empty-cell">—</span>';
        if (!row.target) return '<span class="rp-langs">' + escapeHtml(row.source) + "</span>";

        return (
            '<span class="rp-langs">' +
            escapeHtml(row.source) +
            icon("arrow-right") +
            escapeHtml(row.target) +
            "</span>"
        );
    }

    /* Same widget as accounting/customer/tables/customer_orders.html —
       percentage above, bar below, both from table.css. */
    function progressCell(row) {
        if (row.tab === "waiting") {
            return '<span class="rp-not-ready">' + icon("hourglass") + "Not ready</span>";
        }

        return (
            '<div class="progress-widget">' +
            '<div class="progress-widget__label">' +
            '<span class="progress-widget__pct">' +
            row.progress +
            "%</span></div>" +
            '<progress class="progress-widget__bar" value="' +
            row.progress +
            '" max="100"></progress></div>'
        );
    }

    function statusCell(row) {
        var meta = RP.JOB_STATUS[row.jobStatus];
        if (!meta) return '<span class="empty-cell">—</span>';

        return (
            '<span class="status-pill ' +
            meta.pill +
            '"><span class="status-dot"></span><span class="status-text">' +
            meta.label +
            "</span></span>"
        );
    }

    /* Red, the way Due Date reads in the orders table. */
    function deadlineCell(date) {
        return (
            '<span title="' +
            fmtDate(date) +
            ", " +
            fmtTime(date) +
            '"><span class="col-due-date">' +
            fmtDate(date) +
            '</span> <span class="col-due-date-time">' +
            fmtTime(date) +
            "</span></span>"
        );
    }

    function dateCell(date) {
        if (!date) return '<span class="empty-cell">—</span>';

        return (
            '<span class="td-text-main">' +
            fmtDate(date) +
            '</span> <span class="td-text-sub">' +
            fmtTime(date) +
            "</span>"
        );
    }

    function slipCell(row) {
        if (!row.jobSlip) return '<span class="empty-cell">—</span>';

        return (
            '<div class="tooltip-wrap">' +
            '<button class="btn-action btn-view rp-slip" type="button" data-action="slip" aria-label="Open Job Slip ' +
            row.id +
            '">' +
            icon("file-pdf") +
            "</button>" +
            '<span class="tooltip">Job Slip PDF</span></div>'
        );
    }

    function actionsCell(row) {
        return (
            '<div class="actions-wrap">' +
            '<div class="tooltip-wrap">' +
            '<button class="btn-action btn-view" type="button" data-action="open" aria-label="Open job ' +
            row.id +
            '">' +
            icon("view") +
            "</button>" +
            '<span class="tooltip">Open job</span></div></div>'
        );
    }

    var CELL = {
        "col-id": function (row) {
            return '<a class="rp-job-id" href="#" data-action="open">' + row.id + "</a>";
        },
        "col-project": function (row) {
            return '<span title="' + escapeHtml(row.project) + '">' + escapeHtml(row.project) + "</span>";
        },
        "col-bill": function (row) {
            return row.billId
                ? '<a class="rp-job-id" href="#" data-action="bill">' + row.billId + "</a>"
                : '<span class="empty-cell">—</span>';
        },
        "col-service": function (row) {
            return '<span title="' + escapeHtml(row.service) + '">' + escapeHtml(row.service) + "</span>";
        },
        "col-langs": langCell,
        "col-progress": progressCell,
        "col-status": statusCell,
        "col-amount": function (row) {
            return (
                '<span class="price-row-unit">' +
                row.currencyCode +
                '</span> <span class="price-row-value">' +
                money(row.amount) +
                "</span>"
            );
        },
        "col-count": function (row) {
            return (
                '<span class="count-row-value">' +
                number(row.count.value) +
                '</span> <span class="count-row-unit">' +
                row.count.unit +
                "</span>"
            );
        },
        "col-deadline": function (row) {
            return deadlineCell(row.deadline);
        },
        "col-accepted": function (row) {
            return dateCell(row.acceptedAt);
        },
        "col-delivered": function (row) {
            return dateCell(row.deliveredAt);
        },
        "col-specialty": function (row) {
            return escapeHtml(row.specialty);
        },
        "col-pm": function (row) {
            return '<span title="' + escapeHtml(row.pmName) + '">' + escapeHtml(row.pmName) + "</span>";
        },
        "col-slip": slipCell,
        "col-actions": actionsCell
    };

    /* ── Table shell ─────────────────────────────────────── */

    function colsMarkup() {
        return (
            cols()
                .map(function (col) {
                    return (
                        '<col class="col ' +
                        col.key +
                        '" style="width:' +
                        col.width +
                        'px" data-width-default="' +
                        col.width +
                        '">'
                    );
                })
                .join("") + '<col class="col-filler">'
        );
    }

    /* Verbatim from templates/partials/_sorting_icon.html — same three
       path pairs, same class names. The inline display:none is gone:
       .is-asc / .is-desc on the <th> picks the pair. */
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
        var cells = cols()
            .map(function (col, index) {
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
            })
            .join("");

        return cells + '<th class="col-filler-cell"></th>';
    }

    function rowMarkup(row) {
        var cells = cols()
            .map(function (col) {
                return (
                    '<td class="' +
                    col.key +
                    (col.sticky ? " sticky-col" : "") +
                    (col.align === "right" ? " right-aligned-td" : "") +
                    (col.key === "col-actions" || col.key === "col-slip" ? " actions-cell" : "") +
                    '">' +
                    CELL[col.key](row) +
                    "</td>"
                );
            })
            .join("");

        return (
            '<tr class="rp-row" data-id="' + row.id + '">' + cells + '<td class="col-filler-cell"></td></tr>'
        );
    }

    /* ── Tabs ────────────────────────────────────────────── */

    function countFor(tab) {
        return rows.filter(function (row) {
            return row.tab === tab;
        }).length;
    }

    function renderTabs() {
        els.tabs.innerHTML = RP.JOB_TABS.map(function (tab) {
            return (
                '<button class="navigation-tabs-link' +
                (state.tab === tab.key ? " active" : "") +
                '" type="button" role="tab" aria-selected="' +
                (state.tab === tab.key) +
                '" data-tab="' +
                tab.key +
                '">' +
                '<span class="navigation-tabs-icon">' +
                icon(tab.icon) +
                "</span>" +
                tab.label +
                '<span class="navigation-tabs-badge">' +
                countFor(tab.key) +
                "</span></button>"
            );
        }).join("");
    }

    /* ── Filtering, sorting, paging ──────────────────────── */

    function visibleRows() {
        var needle = state.search.trim().toLowerCase();

        var list = rows.filter(function (row) {
            if (row.tab !== state.tab) return false;
            if (!needle) return true;

            return (
                [row.id, row.billId, row.project, row.service, row.specialty, row.source, row.target, row.pmName]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .indexOf(needle) > -1
            );
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
              (cols().length + 1) +
              '">' +
              emptyMarkup() +
              "</td></tr>";

        renderTabs();
        renderPagination(list.length, pages, start, pageRows.length);

        if (columnsModal) columnsModal.apply();
        syncStickyOffsets();
        syncWidths();
        wireResizers();
    }

    /* The table grows with its content and the page scrolls, so this only
       keeps the empty-state width in sync — no height is imposed. */
    function syncWidths() {
        syncDetailWidth();

        /* Measured again next frame: whether a scrollbar appears at all
           depends on the content just written. */
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

    var EMPTY = {
        active: {
            title: "No active jobs",
            note: "Jobs you accept land here once the project manager releases the files."
        },
        waiting: {
            title: "Nothing waiting",
            note: "A job sits here while the project manager is still preparing its files. You will be notified when one is ready to start."
        },
        completed: {
            title: "No completed jobs yet",
            note: "Delivered work moves here, together with its bill and job slip."
        }
    };

    function emptyMarkup() {
        var searching = !!state.search.trim();
        var copy = EMPTY[state.tab];

        return (
            '<div class="rp-empty">' +
            '<span class="rp-empty__icon">' +
            icon(searching ? "search" : "empty-inbox") +
            "</span>" +
            '<span class="rp-empty__title">' +
            (searching ? "Nothing matches that search" : copy.title) +
            "</span>" +
            '<span class="rp-empty__note">' +
            (searching
                ? "Try a different job ID, project name, service or language — or clear the search."
                : copy.note) +
            "</span>" +
            (searching
                ? '<button class="rp-empty__action" type="button" data-clear-search>' +
                  icon("reset") +
                  "Clear search</button>"
                : "") +
            "</div>"
        );
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

        cols().forEach(function (col) {
            if (!col.sticky) return;

            var th = els.table.querySelector("thead th." + col.key);
            if (!th || th.style.display === "none") return;

            var drop = onePinnedOnly && pinned > 0;

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

    /* ── Tab switching ───────────────────────────────────── */

    /* Each tab owns a different column set, so the modal is thrown away
       and rebuilt with that tab's list and its own saved choice. */
    function buildColumnsModal() {
        if (columnsModal) columnsModal.destroy();

        columnsModal = new RP.ColumnsModal({
            table: "#new-customized-table",
            columns: cols(),
            storageKey: "rp_jobs_columns_" + state.tab,
            onChange: syncStickyOffsets
        });
    }

    function selectTab(tab) {
        if (tab === state.tab) return;

        state.tab = tab;
        state.sort = Object.assign({}, DEFAULT_SORT[tab]);
        state.page = 1;

        buildColumnsModal();
        render();
        els.scroll.scrollLeft = 0;
    }

    /* ── Wiring ──────────────────────────────────────────── */

    function wire() {
        /* Tabs */
        els.tabs.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-tab]");
            if (btn) selectTab(btn.dataset.tab);
        });

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

        els.clearSearch.addEventListener("click", clearSearch);

        /* "/" jumps to search, Escape leaves it */
        document.addEventListener("keydown", function (e) {
            if (
                e.key === "/" &&
                document.activeElement !== els.search &&
                !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)
            ) {
                e.preventDefault();
                els.search.focus();
                els.search.select();
            }

            if (e.key === "Escape" && document.activeElement === els.search) els.search.blur();
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

        /* Row actions — nothing is wired to a real page, so each one
           only says what it would have opened. */
        els.tbody.addEventListener("click", function (e) {
            if (e.target.closest("[data-clear-search]")) {
                clearSearch();
                return;
            }

            var trigger = e.target.closest("[data-action]");
            if (!trigger) return;

            e.preventDefault();
            var row = findRow(trigger.closest("tr").dataset.id);
            var action = trigger.dataset.action;

            if (action === "bill") RP.toast("Bill " + row.billId + " would open here.", "info");
            else if (action === "slip") RP.toast("Job slip for " + row.id + " would download here.", "info");
            else RP.toast(row.id + " would open on its job page.", "info");
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

        /* Shadow on the sticky columns once the table is scrolled sideways */
        els.scroll.addEventListener("scroll", function () {
            els.scroll.classList.toggle("scrolled-x", els.scroll.scrollLeft > 0);
        });

        document.addEventListener("rp:layout-change", function () {
            syncStickyOffsets();
            syncWidths();
        });

        global.addEventListener("resize", function () {
            syncStickyOffsets();
            syncWidths();
        });

        /* Catches what resize does not: the sidebar animating, a scrollbar
           appearing, the table first rendering at zero width. */
        if (global.ResizeObserver) {
            new global.ResizeObserver(function () {
                syncDetailWidth();
                syncStickyOffsets();
            }).observe(els.scroll);
        }
    }

    function clearSearch() {
        els.search.value = "";
        els.clearSearch.classList.remove("is-visible");
        state.search = "";
        state.page = 1;
        render();
        els.search.focus();
    }

    function findRow(id) {
        return rows.filter(function (row) {
            return row.id === id;
        })[0];
    }

    /* ── Boot ────────────────────────────────────────────── */

    function init() {
        if (!document.getElementById("rp-jobs-table")) return;

        rows = RP.JOBS.map(function (row) {
            row.currencyCode = RP.USER.currency;
            row.pmName = row.pm ? row.pm.name : "N/A";
            return row;
        });

        state.sort = Object.assign({}, DEFAULT_SORT[state.tab]);

        els = {
            table: document.getElementById("new-customized-table"),
            colgroup: document.querySelector("#new-customized-table colgroup"),
            thead: document.querySelector("#new-customized-table thead tr"),
            tbody: document.querySelector("#new-customized-table tbody"),
            scroll: document.getElementById("scrollContainer"),
            tabs: document.getElementById("rpJobTabs"),
            search: document.getElementById("search-input"),
            clearSearch: document.getElementById("rpClearSearch"),
            pagination: document.getElementById("rpPagination"),
            columnsBtn: document.getElementById("rpColumnsBtn")
        };

        buildColumnsModal();
        wire();
        render();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
