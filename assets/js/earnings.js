/* ============================================================
   MY EARNINGS — earnings.html
   The resource's bills, paid and pending in one table, where the
   old dashboard split them into My Earnings and My Payments. The
   totals add up every bill the period, status and search let
   through, on all pages; a row opens to the jobs its bill pays.
   Everything is in memory; nothing is sent anywhere.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;
    var LOCALE = "en-NZ";

    /* min: the narrowest a column goes before the table scrolls instead — its header and longest value still whole */
    var COLUMNS = [
        { key: "col-serial", label: "Sr No.", width: 84, min: 78, fixed: true },
        { key: "col-bill", label: "Bill No.", width: 140, min: 104, fixed: true, sticky: true, sort: "num" },
        { key: "col-period", label: "Period", width: 210, min: 204, sort: "from" },
        { key: "col-jobs", label: "Job Count", width: 190, min: 124, sort: "jobCount" },
        { key: "col-amount", label: "Amount", width: 160, min: 114, sort: "amount", align: "right" },
        { key: "col-status", label: "Payment Status", width: 180, min: 162, sort: "rank" }
    ];

    var PRESETS = [
        { key: "all", label: "All time" },
        { key: "last-3", label: "Last 3 months", months: 3 },
        { key: "last-6", label: "Last 6 months", months: 6 },
        { key: "last-12", label: "Last 12 months", months: 12 }
    ];

    var STATUSES = [
        { key: "all", label: "All" },
        { key: "pending", label: "Pending" },
        { key: "paid", label: "Paid" }
    ];

    var TOTALS = [
        {
            key: "jobs", label: "Total Job Count", icon: "briefcase-business",
            tip: "Jobs in every bill listed above, on all pages. It follows the period, status and search."
        },
        {
            key: "earned", label: "Total Earned", icon: "wallet",
            tip: "What the bills listed above are worth, paid and pending, with bonuses and deductions."
        },
        {
            key: "paid", label: "Total Paid", icon: "credit-card-check",
            tip: "What the paid bills listed above have paid out. The rest is still pending."
        }
    ];

    var state = {
        search: "",
        period: { key: "all" },
        status: "all",
        sort: { key: "from", dir: "desc" },
        page: 1,
        perPage: 10,
        expanded: {}
    };

    var rows = [];
    var listed = [];
    var hits = {};
    var shown = {};
    var els = {};
    var columnsModal = null;
    var periodOpen = false;
    var pendingWidthSync = false;
    var tipOwner = null;
    var tipPinned = false;
    var flashId = null;
    var userSized = false;

    /* ── Formatting ──────────────────────────────────────── */

    function money(value) {
        return value.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function number(value) {
        return Math.round(value).toLocaleString(LOCALE);
    }

    function plural(n, one, many) {
        return n === 1 ? one : many;
    }

    function monthShort(date) {
        return date.toLocaleDateString(LOCALE, { month: "short" });
    }

    function fmtDate(date) {
        return date.getDate() + " " + monthShort(date) + " " + date.getFullYear();
    }

    function fmtMonth(date) {
        return monthShort(date) + " " + date.getFullYear();
    }

    /* Both dates in full, "1 Feb 2025 – 28 Feb 2025": a bare "1 – 31 Aug 2026" read as confusing */
    function fmtPeriod(from, to) {
        return fmtDate(from) + " – " + fmtDate(to);
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function dot() {
        return '<span class="rp-dot" aria-hidden="true"></span>';
    }

    function reduced() {
        return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    /* No motion when it is asked for, or when nobody can see the tab */
    function still() {
        return reduced() || document.hidden;
    }

    /* ── Period ──────────────────────────────────────────── */

    function presetFor(key) {
        return PRESETS.filter(function (preset) {
            return preset.key === key;
        })[0];
    }

    function monthOf(value) {
        var parts = value.split("-");
        return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }

    function monthValue(date) {
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
    }

    function periodRange(period) {
        var now = new Date();
        var month = new Date(now.getFullYear(), now.getMonth(), 1);

        if (period.key === "year") return { start: new Date(period.year, 0, 1), end: new Date(period.year, 11, 31) };
        if (period.key === "range") {
            var last = monthOf(period.to);
            return { start: monthOf(period.from), end: new Date(last.getFullYear(), last.getMonth() + 1, 0) };
        }

        var preset = presetFor(period.key);
        if (!preset || !preset.months) return null;
        return {
            start: new Date(month.getFullYear(), month.getMonth() - preset.months, 1),
            end: new Date(month.getFullYear(), month.getMonth() + 1, 0)
        };
    }

    function periodLabel(period) {
        if (period.key === "year") return String(period.year);
        if (period.key === "range") {
            var from = monthOf(period.from);
            var to = monthOf(period.to);
            if (period.from === period.to) return fmtMonth(from);
            if (from.getFullYear() === to.getFullYear()) return monthShort(from) + " – " + fmtMonth(to);
            return fmtMonth(from) + " – " + fmtMonth(to);
        }
        return presetFor(period.key).label;
    }

    function periodParam(period) {
        if (period.key === "year") return String(period.year);
        if (period.key === "range") return period.from + "_" + period.to;
        return period.key;
    }

    function readPeriodParam(value) {
        if (!value) return null;
        if (/^\d{4}$/.test(value)) return { key: "year", year: Number(value) };
        var range = /^(\d{4}-\d{2})_(\d{4}-\d{2})$/.exec(value);
        if (range) return { key: "range", from: range[1], to: range[2] };
        return presetFor(value) ? { key: value } : null;
    }

    function billMonths() {
        return rows
            .map(function (bill) {
                return bill.from;
            })
            .sort(function (a, b) {
                return b - a;
            });
    }

    function billYears() {
        var seen = {};
        return billMonths()
            .map(function (date) {
                return date.getFullYear();
            })
            .filter(function (year) {
                if (seen[year]) return false;
                seen[year] = true;
                return true;
            });
    }

    /* ── Search ──────────────────────────────────────────── */

    /* "B-2209", "b2209" and "2209" all find the bill; "J-47894" or "47894" finds the job's bill */
    function parseQuery(raw) {
        var q = raw.trim().toLowerCase().replace(/[\s-]/g, "");
        if (!q) return null;

        var lead = q.charAt(0);
        var kind = lead === "b" ? "bill" : lead === "j" ? "job" : "any";
        var digits = kind === "any" ? q : q.slice(1);

        return { kind: kind, digits: digits, valid: /^\d*$/.test(digits) };
    }

    function matchBill(bill, q) {
        if (!q) return { bill: false, jobs: [] };
        if (!q.valid) return null;
        if (!q.digits) return { bill: false, jobs: [] };

        var billHit = q.kind !== "job" && String(bill.num).indexOf(q.digits) > -1;
        var jobs =
            q.kind === "bill"
                ? []
                : bill.jobs.filter(function (job) {
                      return job.id.slice(2).indexOf(q.digits) > -1;
                  });

        return billHit || jobs.length ? { bill: billHit, jobs: jobs } : null;
    }

    function mark(text, digits) {
        var at = digits ? text.indexOf(digits) : -1;
        if (at === -1) return escapeHtml(text);

        return (
            escapeHtml(text.slice(0, at)) +
            '<mark class="rp-mark">' +
            escapeHtml(digits) +
            "</mark>" +
            escapeHtml(text.slice(at + digits.length))
        );
    }

    function queryDigits() {
        var q = parseQuery(state.search);
        return q && q.valid ? q.digits : "";
    }

    /* ── Filtering, sorting ──────────────────────────────── */

    /* Status is left out on request, so the status filter can count what each choice would show */
    function select(withStatus) {
        var q = parseQuery(state.search);
        var range = periodRange(state.period);
        var list = [];

        rows.forEach(function (bill) {
            if (range && (bill.from > range.end || bill.to < range.start)) return;
            if (withStatus && state.status !== "all" && bill.status !== state.status) return;

            var hit = matchBill(bill, q);
            if (!hit) return;

            hits[bill.id] = hit;
            list.push(bill);
        });

        return list;
    }

    function sortRows(list) {
        var key = state.sort.key;
        var dir = state.sort.dir === "asc" ? 1 : -1;

        return list.sort(function (a, b) {
            return (a[key] - b[key]) * dir || b.from - a.from;
        });
    }

    function totalsOf(list) {
        var t = { bills: list.length, jobs: 0, earned: 0, paid: 0, pending: 0 };

        list.forEach(function (bill) {
            t.jobs += bill.jobs.length;
            t.earned += bill.amount;
            if (bill.status === "paid") t.paid += bill.amount;
            else t.pending += bill.amount;
        });

        return t;
    }

    /* ── Shared pieces ───────────────────────────────────── */

    function info(text, label) {
        return (
            '<button type="button" class="rp-info" data-tip="' +
            escapeHtml(text) +
            '" aria-label="' +
            escapeHtml(label) +
            '" aria-expanded="false">' +
            icon("info") +
            "</button>"
        );
    }

    function counter(value, key, decimals) {
        return (
            '<span data-count="' +
            value +
            '" data-key="' +
            key +
            '"' +
            (decimals ? ' data-decimals="' + decimals + '"' : "") +
            ">" +
            (decimals ? money(value) : number(value)) +
            "</span>"
        );
    }

    function pill(bill, withTip) {
        var meta = RP.BILL_STATUS[bill.status];
        var tip =
            bill.status === "paid"
                ? "Paid on " + fmtDate(bill.paidOn) + (bill.method ? " · " + bill.method : "")
                : "Due " + fmtDate(bill.due);

        return (
            '<span class="status-pill ' +
            meta.pill +
            '"' +
            (withTip ? ' data-tip="' + escapeHtml(tip) + '"' : "") +
            '><span class="status-dot"></span><span class="status-text">' +
            meta.label +
            "</span></span>"
        );
    }

    /* ── Totals ──────────────────────────────────────────── */

    /* The dashboard's tile, value then unit; only the Amount column leads with the currency */
    function tileMarkup(def, t) {
        var currency = escapeHtml(RP.USER.currency);
        var unit = function (text) {
            return '<span class="rp-stat__unit">' + text + "</span>";
        };
        var value, words;

        if (def.key === "jobs") {
            value = counter(t.jobs, "jobs") + unit(plural(t.jobs, "job", "jobs"));
            words = "in <strong>" + counter(t.bills, "bills") + "</strong> " + plural(t.bills, "bill", "bills");
        } else if (def.key === "earned") {
            value = counter(t.earned, "earned", 2) + unit(currency);
            words = "≈ " + counter(t.earned * RP.USD_RATE, "earned-usd", 2) + " USD";
        } else {
            value = counter(t.paid, "paid", 2) + unit(currency);
            words =
                t.pending > 0.004
                    ? "<strong>" + counter(t.pending, "pending", 2) + "</strong> " + currency + " pending"
                    : "Nothing pending";
        }

        return (
            '<section class="rp-stat rp-stat--' +
            def.key +
            '" id="total-' +
            def.key +
            '" aria-labelledby="total-' +
            def.key +
            '-label">' +
            '<div class="rp-stat__well"><div class="rp-stat__head">' +
            '<span class="rp-stat__icon" aria-hidden="true">' +
            icon(def.icon) +
            "</span>" +
            '<h2 class="rp-stat__label" id="total-' +
            def.key +
            '-label">' +
            def.label +
            "</h2>" +
            info(def.tip, "About " + def.label.toLowerCase()) +
            "</div>" +
            '<p class="rp-stat__value">' +
            value +
            "</p>" +
            '<p class="rp-stat__words">' +
            words +
            "</p></div></section>"
        );
    }

    function renderTotals(list) {
        var t = totalsOf(list);
        els.totals.innerHTML = TOTALS.map(function (def) {
            return tileMarkup(def, t);
        }).join("");
        countUp(els.totals);
    }

    function countUp(root) {
        root.querySelectorAll("[data-count]").forEach(function (el) {
            var to = Number(el.dataset.count);
            var key = el.dataset.key;
            var from = key in shown ? shown[key] : 0;
            var decimals = Number(el.dataset.decimals || 0);
            var fmt = function (v) {
                return v.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            };

            shown[key] = to;
            if (still() || from === to) {
                el.textContent = fmt(to);
                return;
            }

            var start = null;
            var done = false;
            function step(t) {
                if (done) return;
                if (start === null) start = t;
                var k = Math.min(1, (t - start) / 600);
                el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3)));
                if (k < 1) global.requestAnimationFrame(step);
                else done = true;
            }
            el.textContent = fmt(from);
            global.requestAnimationFrame(step);

            /* Frames stop in a hidden tab; the number must still land */
            global.setTimeout(function () {
                if (done) return;
                done = true;
                el.textContent = fmt(to);
            }, 800);
        });
    }

    /* ── Status filter ───────────────────────────────────── */

    function renderStatus(base) {
        var count = { all: base.length, pending: 0, paid: 0 };
        base.forEach(function (bill) {
            count[bill.status] += 1;
        });

        var hadFocus = els.status.contains(document.activeElement);

        els.status.innerHTML = STATUSES.map(function (status) {
            var on = state.status === status.key;
            return (
                '<button class="rp-segment' +
                (on ? " is-active" : "") +
                '" type="button" data-status="' +
                status.key +
                '" aria-pressed="' +
                on +
                '">' +
                (status.key === "all"
                    ? ""
                    : '<span class="rp-status-dot ' +
                      RP.BILL_STATUS[status.key].pill +
                      '" aria-hidden="true"><span class="status-dot"></span></span>') +
                status.label +
                /* Only Pending carries a number: it is the one still waiting on money */
                (status.key === "pending" ? '<span class="rp-segment-count">' + count.pending + "</span>" : "") +
                "</button>"
            );
        }).join("");

        if (hadFocus) els.status.querySelector(".is-active").focus();
    }

    /* ── Period filter ───────────────────────────────────── */

    function monthSelect(id, label, months, value) {
        return (
            '<label class="rp-period-field" for="' +
            id +
            '"><span class="rp-period-field__label">' +
            label +
            "</span>" +
            '<select class="rp-period-select" id="' +
            id +
            '">' +
            months
                .map(function (date) {
                    var v = monthValue(date);
                    return '<option value="' + v + '"' + (v === value ? " selected" : "") + ">" + fmtMonth(date) + "</option>";
                })
                .join("") +
            "</select></label>"
        );
    }

    function popMarkup() {
        var period = state.period;
        var months = billMonths();

        var presets = PRESETS.map(function (preset) {
            var on = period.key === preset.key;
            return (
                '<button class="rp-period-opt' +
                (on ? " is-active" : "") +
                '" type="button" data-period="' +
                preset.key +
                '" aria-pressed="' +
                on +
                '"><span>' +
                preset.label +
                "</span>" +
                icon("check") +
                "</button>"
            );
        }).join("");

        var years = billYears()
            .map(function (year) {
                var on = period.key === "year" && period.year === year;
                return (
                    '<button class="rp-period-year' +
                    (on ? " is-active" : "") +
                    '" type="button" data-period="year:' +
                    year +
                    '" aria-pressed="' +
                    on +
                    '">' +
                    year +
                    "</button>"
                );
            })
            .join("");

        var from = period.key === "range" ? period.from : monthValue(months[Math.min(5, months.length - 1)]);
        var to = period.key === "range" ? period.to : monthValue(months[0]);

        return (
            '<div class="rp-period-pop__list">' +
            presets +
            "</div>" +
            '<p class="rp-period-pop__title">By year</p>' +
            '<div class="rp-period-years">' +
            years +
            "</div>" +
            '<p class="rp-period-pop__title">Custom range</p>' +
            '<div class="rp-period-range' +
            (period.key === "range" ? " is-active" : "") +
            '">' +
            monthSelect("rpRangeFrom", "From", months, from) +
            monthSelect("rpRangeTo", "To", months, to) +
            "</div>" +
            '<button class="rp-period-apply" type="button" data-period-apply>Apply range</button>'
        );
    }

    function renderPeriod() {
        var set = state.period.key !== "all";
        var hadFocus = els.period.contains(document.activeElement);

        els.period.classList.toggle("is-set", set);
        els.period.classList.toggle("is-open", periodOpen);
        els.period.innerHTML =
            '<button class="dashboard_toolbar-btn rp-period-btn" id="rpPeriodBtn" type="button" aria-haspopup="dialog" aria-expanded="' +
            periodOpen +
            '" aria-controls="rpPeriodPop">' +
            icon("calendar-range") +
            '<span class="rp-period-btn__label">Period</span>' +
            '<span class="rp-period-btn__value">' +
            periodLabel(state.period) +
            "</span>" +
            icon("chevron-down", "rp-period-btn__caret") +
            "</button>" +
            (set
                ? '<button class="rp-period-clear" type="button" data-period-clear aria-label="Clear the period filter" title="Show all periods">' +
                  icon("close") +
                  "</button>"
                : "") +
            '<div class="rp-period-pop" id="rpPeriodPop" role="dialog" aria-label="Choose a period"' +
            (periodOpen ? "" : " hidden") +
            ">" +
            popMarkup() +
            "</div>";

        if (hadFocus && !periodOpen) document.getElementById("rpPeriodBtn").focus();
    }

    /* Toggled in place: rewriting the button would detach the very node that was clicked */
    function setPeriodOpen(open) {
        periodOpen = open;
        els.period.classList.toggle("is-open", open);
        document.getElementById("rpPeriodBtn").setAttribute("aria-expanded", String(open));
        document.getElementById("rpPeriodPop").hidden = !open;
    }

    function openPeriod() {
        hideTip();
        document.getElementById("rpPeriodPop").innerHTML = popMarkup();
        setPeriodOpen(true);
        var current =
            els.period.querySelector(".rp-period-pop button.is-active") ||
            (state.period.key === "range" ? document.getElementById("rpRangeFrom") : els.period.querySelector(".rp-period-opt"));
        if (current) current.focus();
    }

    function closePeriod(returnFocus) {
        if (!periodOpen) return;
        setPeriodOpen(false);
        if (returnFocus) document.getElementById("rpPeriodBtn").focus();
    }

    function setPeriod(period) {
        state.period = period;
        state.page = 1;
        var wasOpen = periodOpen;
        periodOpen = false;
        render();
        syncUrl();
        if (wasOpen) document.getElementById("rpPeriodBtn").focus();
    }

    function applyRange() {
        var from = document.getElementById("rpRangeFrom").value;
        var to = document.getElementById("rpRangeTo").value;
        if (from > to) {
            var swap = from;
            from = to;
            to = swap;
        }
        setPeriod({ key: "range", from: from, to: to });
    }

    /* ── Cells ───────────────────────────────────────────── */

    var CELL = {
        "col-serial": function (bill, serial) {
            return '<span class="rp-serial">' + serial + "</span>";
        },
        "col-bill": function (bill) {
            var hit = hits[bill.id];
            var open = !!state.expanded[bill.id];
            return (
                '<span class="rp-id-cell">' +
                '<button class="rp-expand-btn" type="button" aria-expanded="' +
                open +
                '" aria-label="Show the jobs in bill ' +
                bill.id +
                '">' +
                icon("chevron-right") +
                "</button>" +
                '<a class="rp-job-id" href="#" data-action="bill">B-' +
                (hit && hit.bill ? mark(String(bill.num), queryDigits()) : bill.num) +
                "</a></span>"
            );
        },
        "col-period": function (bill) {
            return '<span class="td-text-main">' + fmtPeriod(bill.from, bill.to) + "</span>";
        },
        "col-jobs": function (bill) {
            var found = hits[bill.id] && !hits[bill.id].bill ? hits[bill.id].jobs : [];
            return (
                '<span class="rp-jobcount"><span class="count-row-value">' +
                number(bill.jobs.length) +
                '</span> <span class="count-row-unit">' +
                plural(bill.jobs.length, "job", "jobs") +
                "</span>" +
                (found.length
                    ? '<span class="rp-match" title="' +
                      escapeHtml(
                          found
                              .map(function (job) {
                                  return job.id;
                              })
                              .join(", ")
                      ) +
                      '"><span>J-' +
                      mark(found[0].id.slice(2), queryDigits()) +
                      "</span>" +
                      (found.length > 1 ? '<span class="rp-match__more">+' + (found.length - 1) + "</span>" : "") +
                      "</span>"
                    : "") +
                "</span>"
            );
        },
        "col-amount": function (bill) {
            return (
                '<span title="≈ USD ' +
                money(bill.amount * RP.USD_RATE) +
                '"><span class="price-row-unit">' +
                escapeHtml(RP.USER.currency) +
                '</span> <span class="price-row-value">' +
                money(bill.amount) +
                "</span></span>"
            );
        },
        "col-status": function (bill) {
            return pill(bill, true);
        }
    };

    /* ── Table shell ─────────────────────────────────────── */

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

    /* Verbatim from templates/partials/_sorting_icon.html, as on My Jobs */
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
        return (
            COLUMNS.map(function (col, index) {
                var sorted = col.sort && state.sort.key === col.sort;
                return (
                    "<th " +
                    (col.sort ? 'class="order_by ' : 'class="') +
                    col.key +
                    (col.sticky ? " sticky-col" : "") +
                    (sorted ? " is-sorted is-" + state.sort.dir : "") +
                    '"' +
                    (col.sort ? ' data-sort="' + col.sort + '"' : "") +
                    (sorted ? ' aria-sort="' + (state.sort.dir === "asc" ? "ascending" : "descending") + '"' : "") +
                    ' scope="col">' +
                    '<span class="th-inner"><span class="label">' +
                    col.label +
                    "</span>" +
                    (col.sort ? '<span class="rp-sort">' + SORT_ICON + "</span>" : "") +
                    "</span>" +
                    '<div class="resizer" data-col="' +
                    index +
                    '"></div>' +
                    "</th>"
                );
            }).join("") + '<th class="col-filler-cell"></th>'
        );
    }

    function rowMarkup(bill, serial) {
        var open = !!state.expanded[bill.id];
        var cells = COLUMNS.map(function (col) {
            return (
                '<td class="' +
                col.key +
                (col.sticky ? " sticky-col" : "") +
                (col.align === "right" ? " right-aligned-td" : "") +
                '">' +
                CELL[col.key](bill, serial) +
                "</td>"
            );
        }).join("");

        return (
            '<tr class="rp-row' +
            (open ? " is-expanded" : "") +
            (flashId === bill.id ? " is-flash" : "") +
            '" data-id="' +
            bill.id +
            '">' +
            cells +
            '<td class="col-filler-cell"></td></tr>' +
            '<tr class="rp-subrow' +
            (open ? "" : " is-hidden") +
            '" data-detail="' +
            bill.id +
            '"><td colspan="' +
            (COLUMNS.length + 1) +
            '">' +
            (open ? detailMarkup(bill) : "") +
            "</td></tr>"
        );
    }

    /* ── The open row: the bill's jobs and its summary ───── */

    function jobsMarkup(bill) {
        var hit = hits[bill.id];
        var found = {};
        (hit && !hit.bill ? hit.jobs : []).forEach(function (job) {
            found[job.id] = true;
        });
        var digits = queryDigits();

        var list = bill.jobs
            .map(function (job) {
                var isHit = !!found[job.id];
                return (
                    '<div class="rp-jobs__row' +
                    (isHit ? " is-hit" : "") +
                    '" role="row">' +
                    '<span role="cell"><a class="rp-job-id" href="' +
                    (job.real ? "job.html?id=" + job.id : "#") +
                    '" data-job="' +
                    job.id +
                    '">J-' +
                    (isHit ? mark(job.id.slice(2), digits) : job.id.slice(2)) +
                    "</a></span>" +
                    '<span class="rp-jobs__project" role="cell" title="' +
                    escapeHtml(job.project) +
                    '">' +
                    escapeHtml(job.project) +
                    "</span>" +
                    '<span class="rp-jobs__service" role="cell">' +
                    escapeHtml(job.service) +
                    "</span>" +
                    '<span class="rp-jobs__amount" role="cell">' +
                    money(job.amount) +
                    "</span></div>"
                );
            })
            .join("");

        return (
            '<div class="rp-jobs">' +
            '<p class="rp-section-title">Jobs in this bill<span class="rp-section-count">' +
            bill.jobs.length +
            "</span></p>" +
            '<div class="rp-jobs__table" role="table" aria-label="Jobs in bill ' +
            bill.id +
            '">' +
            '<div class="rp-jobs__row rp-jobs__row--head" role="row">' +
            '<span role="columnheader">Job No.</span>' +
            '<span role="columnheader">Project</span>' +
            '<span class="rp-jobs__service" role="columnheader">Service</span>' +
            '<span class="rp-jobs__amount" role="columnheader">Amount (' +
            escapeHtml(RP.USER.currency) +
            ")</span></div>" +
            '<div role="rowgroup">' +
            list +
            "</div></div></div>"
        );
    }

    function summaryMarkup(bill) {
        var currency = escapeHtml(RP.USER.currency);
        var adjusted = bill.bonus || bill.deduction;
        var subtotal = bill.amount - bill.bonus + bill.deduction;

        var facts =
            '<div class="rp-fact"><dt>Issued</dt><dd>' +
            fmtDate(bill.issued) +
            "</dd></div>" +
            (bill.status === "paid"
                ? '<div class="rp-fact"><dt>Paid on</dt><dd>' +
                  fmtDate(bill.paidOn) +
                  "</dd></div>" +
                  '<div class="rp-fact"><dt>Paid by</dt><dd>' +
                  escapeHtml(bill.method) +
                  "</dd></div>"
                : '<div class="rp-fact"><dt>Due</dt><dd>' + fmtDate(bill.due) + "</dd></div>");

        var lines = adjusted
            ? '<div class="rp-sum__row"><dt>Jobs</dt><dd>' +
              money(subtotal) +
              "</dd></div>" +
              (bill.bonus
                  ? '<div class="rp-sum__row"><dt>Bonus <span class="rp-sum__note">' +
                    escapeHtml(bill.bonusNote) +
                    "</span></dt><dd>+" +
                    money(bill.bonus) +
                    "</dd></div>"
                  : "") +
              (bill.deduction
                  ? '<div class="rp-sum__row"><dt>Deduction <span class="rp-sum__note">' +
                    escapeHtml(bill.deductionNote) +
                    "</span></dt><dd>−" +
                    money(bill.deduction) +
                    "</dd></div>"
                  : "")
            : "";

        return (
            '<div class="rp-billsum">' +
            '<p class="rp-section-title">Summary</p>' +
            '<dl class="rp-facts">' +
            facts +
            "</dl>" +
            '<dl class="rp-sum">' +
            lines +
            '<div class="rp-sum__row rp-sum__row--total"><dt>Total</dt><dd>' +
            '<span class="rp-sum__unit">' +
            currency +
            "</span> " +
            money(bill.amount) +
            "</dd></div></dl>" +
            '<p class="rp-sum__usd">≈ USD ' +
            money(bill.amount * RP.USD_RATE) +
            "</p></div>"
        );
    }

    function detailMarkup(bill) {
        return (
            '<div class="rp-detail"><div class="rp-panel">' +
            '<div class="rp-panel__head">' +
            '<span class="rp-panel__mark" aria-hidden="true">' +
            icon("receipt-filled") +
            "</span>" +
            '<div class="rp-panel__titles">' +
            '<p class="rp-panel__title">Bill ' +
            bill.id +
            "</p>" +
            '<p class="rp-panel__sub">' +
            fmtPeriod(bill.from, bill.to) +
            dot() +
            bill.jobs.length +
            plural(bill.jobs.length, " job", " jobs") +
            "</p></div>" +
            pill(bill, false) +
            '<div class="rp-panel__actions">' +
            '<button class="rp-btn rp-btn--ghost" type="button" data-action="pdf">' +
            icon("download") +
            "PDF</button>" +
            '<button class="rp-btn rp-btn--primary" type="button" data-action="bill">' +
            icon("external-link") +
            "Open bill</button></div></div>" +
            '<div class="rp-panel__body">' +
            '<div class="rp-panel__main">' +
            jobsMarkup(bill) +
            "</div>" +
            '<div class="rp-panel__side">' +
            summaryMarkup(bill) +
            "</div></div></div></div>"
        );
    }

    /* A matched job can sit far down a long bill, so its list scrolls it into view */
    function revealHits(scope) {
        scope.querySelectorAll(".rp-jobs__table").forEach(function (list) {
            var hit = list.querySelector(".is-hit");
            var head = list.querySelector(".rp-jobs__row--head");
            if (hit) list.scrollTop = Math.max(0, hit.offsetTop - head.offsetHeight - 6);
        });
    }

    /* ── Render ──────────────────────────────────────────── */

    function render() {
        hideTip();
        hits = {};

        var base = select(false);
        listed = sortRows(
            base.filter(function (bill) {
                return state.status === "all" || bill.status === state.status;
            })
        );

        var pages = Math.max(1, Math.ceil(listed.length / state.perPage));
        if (state.page > pages) state.page = pages;
        var start = (state.page - 1) * state.perPage;
        var pageRows = listed.slice(start, start + state.perPage);

        renderTotals(listed);
        renderStatus(base);
        renderPeriod();

        els.colgroup.innerHTML = colsMarkup();
        els.thead.innerHTML = headCellsMarkup();
        els.tbody.innerHTML = pageRows.length
            ? pageRows
                  .map(function (bill, i) {
                      return rowMarkup(bill, start + i + 1);
                  })
                  .join("")
            : '<tr><td class="rp-empty-cell" colspan="' + (COLUMNS.length + 1) + '">' + emptyMarkup() + "</td></tr>";

        renderPagination(listed.length, pages, start, pageRows.length);

        if (columnsModal) columnsModal.apply();
        fitColumns();
        revealHits(els.tbody);
        syncWidths();
        wireResizers();
    }

    /* Six columns fit a laptop if each gives back its slack first; a hand-resized table is left alone */
    function fitColumns() {
        if (userSized || !els.colgroup) return;

        var shownCols = COLUMNS.filter(function (col) {
            var el = els.colgroup.querySelector("col." + col.key);
            return el && el.style.display !== "none";
        });
        var full = 0;
        var least = 0;
        shownCols.forEach(function (col) {
            full += col.width;
            least += col.min;
        });

        var avail = els.scroll.clientWidth;
        if (!avail) return;
        var k = avail >= full ? 1 : avail <= least ? 0 : (avail - least) / (full - least);

        shownCols.forEach(function (col) {
            els.colgroup.querySelector("col." + col.key).style.width = Math.floor(col.min + (col.width - col.min) * k) + "px";
        });
    }

    function syncWidths() {
        syncDetailWidth();

        /* Measured again next frame: whether a scrollbar appears depends on what was just written */
        if (!pendingWidthSync) {
            pendingWidthSync = true;
            global.requestAnimationFrame(function () {
                pendingWidthSync = false;
                syncDetailWidth();
            });
        }
    }

    /* clientWidth, so neither scrollbar is counted */
    function syncDetailWidth() {
        var width = els.scroll.clientWidth;
        if (width > 0) els.scroll.style.setProperty("--rp-detail-w", width + "px");
    }

    function filtersOn() {
        return !!state.search.trim() || state.period.key !== "all" || state.status !== "all";
    }

    function emptyMarkup() {
        var q = parseQuery(state.search);
        var title, note;

        if (!rows.length) {
            title = "No bills yet";
            note = "Approved jobs are billed on the 1st of each month, and every bill lands here.";
        } else if (q && !q.valid) {
            title = "Search by bill or job number";
            note = "Try a bill number like " + rows[0].id + " or a job number like " + rows[0].jobs[0].id + ".";
        } else if (q) {
            title = "Nothing matches “" + escapeHtml(state.search.trim()) + "”";
            note =
                state.period.key !== "all" || state.status !== "all"
                    ? "No bill or job number in this period and status contains it. Widen the filters or clear them."
                    : "No bill or job number contains it. Check the number, or clear the search.";
        } else {
            title = "No bills in " + (state.period.key === "all" ? "this view" : escapeHtml(periodLabel(state.period)));
            note = "Try another period or payment status.";
        }

        return (
            '<div class="rp-empty">' +
            '<span class="rp-empty__icon">' +
            icon(filtersOn() ? "search" : "empty-inbox") +
            "</span>" +
            '<span class="rp-empty__title">' +
            title +
            "</span>" +
            '<span class="rp-empty__note">' +
            note +
            "</span>" +
            (filtersOn()
                ? '<button class="rp-empty__action" type="button" data-clear-filters>' + icon("reset") + "Clear filters</button>"
                : "") +
            "</div>"
        );
    }

    function renderPagination(total, pages, start, shownRows) {
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
                '"' +
                (page === state.page ? ' aria-current="page"' : "") +
                ">" +
                page +
                "</button>";
        }

        els.pagination.innerHTML =
            '<div class="cu-page-size-wrap">' +
            '<span class="cu-page-size-label">Records per page</span>' +
            '<select class="cu-page-size-select" id="rpPerPage" aria-label="Records per page">' +
            [5, 10, 20, 50]
                .map(function (size) {
                    return '<option value="' + size + '"' + (size === state.perPage ? " selected" : "") + ">" + size + "</option>";
                })
                .join("") +
            "</select>" +
            '<span class="cu-page-info">Showing <strong>' +
            (total ? start + 1 : 0) +
            "–" +
            (start + shownRows) +
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

    /* ── Row expand ──────────────────────────────────────── */

    function toggleRow(id, force) {
        var tr = els.tbody.querySelector('tr.rp-row[data-id="' + id + '"]');
        var detail = els.tbody.querySelector('tr.rp-subrow[data-detail="' + id + '"]');
        if (!tr || !detail) return;

        var open = force != null ? force : detail.classList.contains("is-hidden");

        if (open && !detail.firstElementChild.innerHTML.trim()) {
            detail.firstElementChild.innerHTML = detailMarkup(findBill(id));
        }

        detail.classList.toggle("is-hidden", !open);
        tr.classList.toggle("is-expanded", open);
        tr.querySelector(".rp-expand-btn").setAttribute("aria-expanded", String(open));

        if (open) {
            state.expanded[id] = true;
            revealHits(detail);
        } else {
            delete state.expanded[id];
        }
    }

    /* ── Column resize ───────────────────────────────────── */

    function wireResizers() {
        els.table.querySelectorAll("th .resizer").forEach(function (handle) {
            handle.addEventListener("mousedown", function (event) {
                event.preventDefault();
                event.stopPropagation();
                userSized = true;

                var th = handle.parentElement;
                var col = els.colgroup.children[Array.prototype.indexOf.call(th.parentElement.children, th)];
                var startX = event.pageX;
                var startWidth = th.offsetWidth;

                function move(moveEvent) {
                    col.style.width = Math.max(70, startWidth + moveEvent.pageX - startX) + "px";
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

    /* ── Tooltip — the dashboard's, for the info buttons and the pills ── */

    function showTip(owner, pinned) {
        if (tipOwner && tipOwner !== owner) hideTip();
        var tip = els.tip;
        tip.textContent = owner.dataset.tip;
        tip.hidden = false;

        var r = owner.getBoundingClientRect();
        var t = tip.getBoundingClientRect();
        var left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), global.innerWidth - t.width - 8);
        var top = r.top - t.height - 8;
        if (top < 8) top = r.bottom + 8;
        tip.style.left = Math.round(left) + "px";
        tip.style.top = Math.round(top) + "px";
        tip.classList.add("is-shown");

        owner.setAttribute("aria-describedby", "rpTip");
        if (owner.classList.contains("rp-info")) owner.setAttribute("aria-expanded", "true");
        tipOwner = owner;
        tipPinned = !!pinned;
    }

    function hideTip() {
        if (!tipOwner) return;
        tipOwner.removeAttribute("aria-describedby");
        if (tipOwner.classList.contains("rp-info")) tipOwner.setAttribute("aria-expanded", "false");
        els.tip.classList.remove("is-shown");
        tipOwner = null;
        tipPinned = false;
    }

    function tipTarget(node) {
        return node && node.closest ? node.closest("[data-tip]") : null;
    }

    /* ── URL ─────────────────────────────────────────────── */

    /* The view lives in the URL, so a reload or a shared link opens the same bills */
    function syncUrl() {
        var params = new URLSearchParams();
        if (state.period.key !== "all") params.set("period", periodParam(state.period));
        if (state.status !== "all") params.set("status", state.status);
        if (state.search.trim()) params.set("q", state.search.trim());

        var qs = params.toString();
        global.history.replaceState(null, "", qs ? "?" + qs : global.location.pathname);
    }

    /* ── Actions ─────────────────────────────────────────── */

    /* A job-number search has one answer, so its bill opens with the job already marked */
    function openLoneMatch() {
        var only = listed.length === 1 ? listed[0] : null;
        if (only && !hits[only.id].bill && hits[only.id].jobs.length) toggleRow(only.id, true);
    }

    function applySearch(value) {
        state.search = value;
        state.page = 1;
        render();
        syncUrl();
        openLoneMatch();
    }

    function clearSearch() {
        els.search.value = "";
        els.clearSearch.classList.remove("is-visible");
        applySearch("");
        els.search.focus();
    }

    function clearFilters() {
        els.search.value = "";
        els.clearSearch.classList.remove("is-visible");
        state.search = "";
        state.period = { key: "all" };
        state.status = "all";
        state.page = 1;
        render();
        syncUrl();
    }

    function findBill(id) {
        return rows.filter(function (bill) {
            return bill.id === id;
        })[0];
    }

    function runAction(action, bill, trigger) {
        if (action === "bill") RP.toast("Bill " + bill.id + " would open here.", "info");
        if (action === "pdf") RP.toast("Bill " + bill.id + " would download as a PDF here.", "info");
        /* Only the jobs My Jobs still lists have a page; older ones only say where they would go */
        if (action === "job") {
            var job = trigger.dataset.job;
            var known = bill.jobs.some(function (row) {
                return row.id === job && row.real;
            });
            if (known) global.location.href = "job.html?id=" + encodeURIComponent(job);
            else RP.toast("Job " + job + " would open here.", "info");
        }
    }

    /* ── Wiring ──────────────────────────────────────────── */

    function wire() {
        var debounce;
        els.search.addEventListener("input", function () {
            clearTimeout(debounce);
            els.clearSearch.classList.toggle("is-visible", !!els.search.value);
            debounce = setTimeout(function () {
                applySearch(els.search.value);
            }, 180);
        });

        els.clearSearch.addEventListener("click", clearSearch);

        els.status.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-status]");
            if (!btn || btn.dataset.status === state.status) return;
            state.status = btn.dataset.status;
            state.page = 1;
            render();
            syncUrl();
        });

        els.period.addEventListener("click", function (e) {
            if (e.target.closest("#rpPeriodBtn")) {
                if (periodOpen) closePeriod(false);
                else openPeriod();
                return;
            }
            if (e.target.closest("[data-period-clear]")) return setPeriod({ key: "all" });
            if (e.target.closest("[data-period-apply]")) return applyRange();

            var option = e.target.closest("[data-period]");
            if (!option) return;
            var value = option.dataset.period;
            setPeriod(value.indexOf("year:") === 0 ? { key: "year", year: Number(value.slice(5)) } : { key: value });
        });

        /* composedPath, since a click inside the picker may re-render the node it started on */
        document.addEventListener("click", function (e) {
            if (periodOpen && e.composedPath().indexOf(els.period) === -1) closePeriod(false);
        });

        els.thead.addEventListener("click", function (e) {
            if (e.target.closest(".resizer")) return;
            var th = e.target.closest("th[data-sort]");
            if (!th) return;

            var key = th.dataset.sort;
            if (state.sort.key === key) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
            else state.sort = { key: key, dir: key === "rank" ? "asc" : "desc" };
            render();
        });

        els.tbody.addEventListener("click", function (e) {
            if (e.target.closest("[data-clear-filters]")) return clearFilters();

            var holder = e.target.closest("tr");
            var id = holder && (holder.dataset.id || holder.dataset.detail);

            var jobLink = e.target.closest("[data-job]");
            if (jobLink) {
                e.preventDefault();
                return runAction("job", findBill(id), jobLink);
            }

            var actionBtn = e.target.closest("[data-action]");
            if (actionBtn) {
                e.preventDefault();
                return runAction(actionBtn.dataset.action, findBill(id), actionBtn);
            }

            var expandBtn = e.target.closest(".rp-expand-btn");
            if (expandBtn) return toggleRow(id);

            if (e.target.closest("a, button, input, select, label")) return;

            var tr = e.target.closest("tr.rp-row");
            if (tr) toggleRow(tr.dataset.id);
        });

        els.pagination.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-page]");
            if (!btn || btn.disabled) return;
            state.page = Number(btn.dataset.page);
            render();
            if (els.toolbar.getBoundingClientRect().top < 0) {
                els.toolbar.scrollIntoView({ block: "start", behavior: still() ? "auto" : "smooth" });
            }
        });

        els.pagination.addEventListener("change", function (e) {
            if (e.target.id !== "rpPerPage") return;
            state.perPage = Number(e.target.value);
            state.page = 1;
            render();
        });

        els.columnsBtn.addEventListener("click", function () {
            columnsModal.open();
        });

        /* The shadow says columns have slid under the pinned Bill No. */
        els.scroll.addEventListener("scroll", function () {
            els.scroll.classList.toggle("scrolled-x", els.scroll.scrollLeft > 0);
            hideTip();
        });

        document.addEventListener("rp:layout-change", function () {
            fitColumns();
            syncWidths();
        });
        global.addEventListener("resize", function () {
            fitColumns();
            syncWidths();
            hideTip();
        });

        /* Catches what resize does not: the sidebar animating, a scrollbar appearing */
        if (global.ResizeObserver) {
            new global.ResizeObserver(function () {
                fitColumns();
                syncDetailWidth();
            }).observe(els.scroll);
        }

        /* Escape closes the innermost thing first: the period picker, then the search */
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                hideTip();
                if (periodOpen) return closePeriod(true);
                if (document.activeElement === els.search) els.search.blur();
                return;
            }

            if (
                e.key === "/" &&
                document.activeElement !== els.search &&
                !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)
            ) {
                e.preventDefault();
                els.search.focus();
                els.search.select();
            }
        });

        /* A tap pins the tip, so it works where there is no hover */
        document.addEventListener("click", function (e) {
            var infoBtn = e.target.closest(".rp-info");
            if (infoBtn) {
                if (tipOwner === infoBtn && tipPinned) return hideTip();
                return showTip(infoBtn, true);
            }
            if (tipPinned) hideTip();
        });

        document.addEventListener("pointerover", function (e) {
            if (e.pointerType === "touch") return;
            var owner = tipTarget(e.target);
            if (owner && !tipPinned) showTip(owner);
        });

        document.addEventListener("pointerout", function (e) {
            if (tipPinned) return;
            var owner = tipTarget(e.target);
            if (owner && owner === tipOwner && !owner.contains(e.relatedTarget)) hideTip();
        });

        document.addEventListener("focusin", function (e) {
            var owner = tipTarget(e.target);
            if (owner) showTip(owner);
        });

        document.addEventListener("focusout", function (e) {
            if (tipOwner && e.target === tipOwner) hideTip();
        });

        global.addEventListener("scroll", hideTip, { passive: true });
    }

    /* ── Deep link: earnings.html?bill=B-2201 ────────────── */

    /* The bill opens in its place in the full list, so its neighbours stay in view */
    function openFromLink(id) {
        var bill = findBill(id);
        if (!bill) return null;

        hits = {};
        var at = sortRows(select(true)).indexOf(bill);
        if (at === -1) {
            state.search = "";
            state.period = { key: "all" };
            state.status = "all";
            els.search.value = "";
            hits = {};
            at = sortRows(select(true)).indexOf(bill);
        }

        state.page = Math.floor(at / state.perPage) + 1;
        state.expanded[bill.id] = true;
        flashId = bill.id;
        return bill;
    }

    /* Only as far as needed, so the toolbar stays in view when the bill is near the top */
    function revealLinked(bill) {
        var tr = els.tbody.querySelector('tr.rp-row[data-id="' + bill.id + '"]');
        if (!tr) return;

        /* A timeout, not a frame: frames stop in a hidden tab and the scroll must still happen */
        global.setTimeout(function () {
            var top = tr.getBoundingClientRect().top;
            var bottom = tr.nextElementSibling.getBoundingClientRect().bottom;
            var by = top < 0 ? top - 16 : Math.max(0, Math.min(bottom - global.innerHeight + 16, top - 16));
            if (by) global.scrollBy({ top: by, behavior: still() ? "auto" : "smooth" });
        }, 60);
        global.setTimeout(function () {
            flashId = null;
            tr.classList.remove("is-flash");
        }, 2400);
    }

    /* ── Boot ────────────────────────────────────────────── */

    function init() {
        if (!document.getElementById("rp-earnings-table") || !RP.BILLS) return;

        rows = RP.BILLS.map(function (bill) {
            return Object.assign({}, bill, {
                jobCount: bill.jobs.length,
                rank: bill.status === "pending" ? 0 : 1
            });
        });

        els = {
            totals: document.getElementById("rpTotals"),
            toolbar: document.querySelector(".rp-earn-toolbar"),
            table: document.getElementById("new-customized-table"),
            colgroup: document.querySelector("#new-customized-table colgroup"),
            thead: document.querySelector("#new-customized-table thead tr"),
            tbody: document.querySelector("#new-customized-table tbody"),
            scroll: document.getElementById("scrollContainer"),
            search: document.getElementById("search-input"),
            clearSearch: document.getElementById("rpClearSearch"),
            period: document.getElementById("rpPeriod"),
            status: document.getElementById("rpStatus"),
            pagination: document.getElementById("rpPagination"),
            columnsBtn: document.getElementById("rpColumnsBtn"),
            tip: document.getElementById("rpTip")
        };

        var params = new URLSearchParams(global.location.search);
        state.period = readPeriodParam(params.get("period")) || state.period;
        if (/^(pending|paid)$/.test(params.get("status") || "")) state.status = params.get("status");
        if (params.get("q")) {
            state.search = params.get("q");
            els.search.value = state.search;
            els.clearSearch.classList.add("is-visible");
        }

        var linked = params.get("bill") ? openFromLink(params.get("bill").toUpperCase()) : null;

        columnsModal = new RP.ColumnsModal({
            table: "#new-customized-table",
            columns: COLUMNS,
            storageKey: "rp_earnings_columns",
            onChange: fitColumns
        });

        wire();
        render();
        if (linked) revealLinked(linked);
        else openLoneMatch();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
