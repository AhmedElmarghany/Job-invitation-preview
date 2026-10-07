/* ============================================================
   PRODUCTIVITY — productivity.html
   The work the resource delivered, a row a month or a year: jobs,
   words, hours, documents and what they earned. Their totals lead
   in one strip, one chart reads the same rows left to right, and a
   row opens to its services.
   Everything is in memory; nothing is sent anywhere.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;
    var LOCALE = "en-NZ";

    var SERVICE_ICON = {
        Translation: "languages",
        Certified: "badge-check",
        Proofreading: "spell-check",
        DTP: "pen-tool",
        Subtitling: "captions",
        Interpreting: "interpreting",
        Attestation: "stamp",
        Transcreation: "pen-line"
    };

    /* min: the narrowest a column goes before the table scrolls instead — its header and longest value still whole */
    var COLUMNS = [
        { key: "col-period", label: "Month", yearLabel: "Year", width: 200, min: 186, fixed: true, sticky: true, sort: "period" },
        { key: "col-jobs", label: "Job Count", width: 140, min: 130, sort: "jobs" },
        { key: "col-words", label: "Word Count", width: 156, min: 140, sort: "words" },
        {
            key: "col-hours", label: "Hours", width: 132, min: 124, sort: "hours",
            tip: "Interpreting and hourly work, with per-minute work such as subtitling counted in hours."
        },
        { key: "col-documents", label: "Documents", width: 146, min: 138, sort: "documents" },
        {
            key: "col-earnings", label: "Earnings", width: 196, min: 144, sort: "earnings", align: "right",
            tip: "What the jobs delivered in that period are worth. Bonuses and deductions are added on the bill."
        }
    ];

    var VIEWS = [
        { key: "monthly", label: "Monthly", unit: ["month", "months"] },
        { key: "yearly", label: "Yearly", unit: ["year", "years"] }
    ];

    /* optional: only offered while the periods in view have some */
    var METRICS = [
        { key: "earnings", label: "Earnings", money: true },
        { key: "jobs", label: "Jobs", unit: ["job", "jobs"], whole: true },
        { key: "words", label: "Words", unit: ["word", "words"], whole: true },
        { key: "hours", label: "Hours", unit: ["hour", "hours"], optional: true },
        { key: "documents", label: "Documents", unit: ["document", "documents"], whole: true, optional: true }
    ];

    /* Rolling, this month included — the dashboard's Last 3 months is August, September and October */
    var PRESETS = [
        { key: "all", label: "All time" },
        { key: "last-3", label: "Last 3 months", months: 3 },
        { key: "last-6", label: "Last 6 months", months: 6 },
        { key: "last-12", label: "Last 12 months", months: 12 }
    ];

    var TOTALS = [
        {
            key: "jobs", label: "Total Job Count", icon: "briefcase-business",
            tip: "Jobs delivered in the periods listed below, on all pages. It follows the period."
        },
        {
            key: "words", label: "Total Word Count", icon: "whole-word",
            tip: "Words in those jobs. Hours and documents are counted in their own units."
        },
        {
            key: "earned", label: "Total Earned", icon: "wallet",
            tip: "What those jobs are worth, before the bonuses and deductions a bill adds."
        }
    ];

    /* ── A full-timer's page: productivity.html?as=fulltimer, fulltimer_productivity_table.html redesigned ── */
    /* Months only, as before: pay is worked out a month at a time */
    var FT_COLUMNS = [
        { key: "col-period", label: "Month", width: 190, min: 186, fixed: true, sticky: true, sort: "period" },
        { key: "col-jobs", group: "Work", label: "Job Count", width: 132, min: 130, sort: "jobs" },
        { key: "col-translation", group: "Work", label: "Translation WC", width: 166, min: 162, sort: "translation" },
        { key: "col-revision", group: "Work", label: "Revision WC", width: 148, min: 144, sort: "revision" },
        { key: "col-legalization", group: "Work", label: "Legalization PC", width: 168, min: 164, sort: "pages" },
        { key: "col-hours", group: "Work", label: "Hours", width: 132, min: 124, sort: "hours", tip: "ftHours" },
        { key: "col-net", group: "Words counted", label: "Net WC", width: 140, min: 134, sort: "net", tip: "ftNet" },
        { key: "col-excess", group: "Words counted", label: "Excess Words", width: 178, min: 176, sort: "excess", tip: "ftExcess" },
        { key: "col-excess-pay", group: "Pay", label: "Excess Pay", width: 164, min: 158, sort: "excessPay", align: "right", tip: "ftExcessPay" },
        { key: "col-pay", group: "Pay", label: "Monthly Pay", width: 170, min: 166, sort: "pay", align: "right", tip: "ftPay" },
        { key: "col-pay-local", group: "Pay", label: "Monthly Pay (AED)", width: 192, min: 186, sort: "payLocal", align: "right" }
    ];

    /* base: the monthly line the bars are read against, instead of their average */
    var FT_METRICS = [
        { key: "net", label: "Net words", unit: ["word", "words"], whole: true, base: "words" },
        { key: "pay", label: "Pay", money: true, currency: "USD", base: "salary" },
        { key: "jobs", label: "Jobs", unit: ["job", "jobs"], whole: true }
    ];

    var FT_TOTALS = [
        {
            key: "jobs", label: "Total Job Count", icon: "briefcase-business",
            tip: "Jobs delivered in the months listed below, on all pages. It follows the period."
        },
        {
            key: "net", label: "Total Net WC", icon: "whole-word",
            tip: "Weighted words in those months, and how many of them went past each month's base."
        },
        {
            key: "pay", label: "Total Pay", icon: "wallet",
            tip: "Base salary and excess pay for those months, in USD."
        }
    ];

    var PAGE_SIZES = [12, 24, 48];

    /* Set at boot: the freelancer's page, or the full-timer's */
    var MODEL = null;
    var FT = null;

    var state = {
        view: "monthly",
        period: { key: "all" },
        metric: "earnings",
        sort: { key: "period", dir: "desc" },
        page: 1,
        perPage: 12,
        expanded: {}
    };

    var months = [];
    var years = [];
    var listed = [];
    var els = {};
    var shown = {};
    var hiddenCols = [];
    var colsOpen = false;
    var periodOpen = false;
    var exportOpen = false;
    var pendingWidthSync = false;
    var tipOwner = null;
    var tipPinned = false;
    var flashId = null;
    var userSized = false;
    var chartIds = "";

    /* ── Formatting ──────────────────────────────────────── */

    function money(value) {
        return value.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function number(value) {
        return Math.round(value).toLocaleString(LOCALE);
    }

    /* Two places in a column, so the figures line up; prose drops the zeros */
    function hours(value, prose) {
        return value.toLocaleString(LOCALE, { minimumFractionDigits: prose ? 0 : 2, maximumFractionDigits: 2 });
    }

    function plural(n, one, many) {
        return n === 1 ? one : many;
    }

    function monthShort(date) {
        return date.toLocaleDateString(LOCALE, { month: "short" });
    }

    function monthLong(date) {
        return date.toLocaleDateString(LOCALE, { month: "long" });
    }

    function fmtDate(date) {
        return date.getDate() + " " + monthShort(date) + " " + date.getFullYear();
    }

    function fmtMonth(date) {
        return monthShort(date) + " " + date.getFullYear();
    }

    /* Both ends in full, "1 Feb 2025 – 28 Feb 2025", as on My Earnings */
    function fmtRange(from, to) {
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

    function sum(list, key) {
        return list.reduce(function (total, row) {
            return total + row[key];
        }, 0);
    }

    function cents(value) {
        return Math.round(value * 100) / 100;
    }

    function reduced() {
        return global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    /* No motion when it is asked for, or when nobody can see the tab */
    function still() {
        return reduced() || document.hidden;
    }

    function viewDef() {
        return VIEWS.filter(function (v) {
            return v.key === state.view;
        })[0];
    }

    function columns() {
        return MODEL.columns;
    }

    function metricDef(key) {
        return MODEL.metrics.filter(function (m) {
            return m.key === key;
        })[0];
    }

    function currencyOf(m) {
        return m.currency || RP.USER.currency;
    }

    function metricText(m, value) {
        if (m.money) return money(value);
        if (m.key === "hours") return hours(value, true);
        return number(value);
    }

    function metricWords(m, value) {
        if (m.money) return metricText(m, value) + " " + currencyOf(m);
        return metricText(m, value) + " " + plural(value, m.unit[0], m.unit[1]);
    }

    /* The full-timer's header tips carry the company's own weights and the resource's base */
    function tipText(tip) {
        if (!FT) return tip;
        var c = FT.config;
        var w = c.weights;
        return (
            {
                ftHours: "Hours and minutes of every service, such as interpreting, voice-over and video, counted in hours.",
                ftNet:
                    "Translation at " + w.translation + "%, revision at " + w.revision + "%, legalization at " + w.legalization +
                    "% (" + c.wordsPerPage + " words a page), hours at " + w.hours + "% (" + c.wordsPerHour +
                    " words an hour), and other services such as DTP at " + w.other + "%.",
                ftExcess: "Net words past your base of " + number(c.baseWords) + " a month.",
                ftExcessPay: "Your own prices for the excess words, paid on top of your base salary.",
                ftPay: "Your base salary of USD " + money(c.baseSalary) + ", plus any excess pay."
            }[tip] || tip
        );
    }

    /* ── Rows: the months as data.js files them, the years added up from them ── */

    function monthRow(m) {
        return Object.assign({}, m, {
            id: m.key,
            kind: "month",
            sortKey: m.from.getTime(),
            label: fmtMonth(m.from),
            title: monthLong(m.from) + " " + m.from.getFullYear()
        });
    }

    function buildYears() {
        var byYear = {};
        var order = [];

        months.forEach(function (m) {
            var y = m.from.getFullYear();
            if (!byYear[y]) {
                byYear[y] = {
                    id: String(y), kind: "year", year: y, sortKey: new Date(y, 0, 1).getTime(),
                    label: String(y), title: String(y), from: m.from, to: m.to, current: false,
                    jobs: 0, words: 0, hours: 0, documents: 0, earnings: 0, monthCount: 0, services: {}
                };
                order.push(y);
            }
            var Y = byYear[y];
            Y.to = m.to;
            Y.jobs += m.jobs;
            Y.words += m.words;
            Y.hours += m.hours;
            Y.documents += m.documents;
            Y.earnings += m.earnings;
            Y.monthCount += 1;
            if (m.current) Y.current = true;
            m.services.forEach(function (s) {
                var row = Y.services[s.service] || (Y.services[s.service] = { service: s.service, jobs: 0, words: 0, hours: 0, documents: 0, pages: 0, earnings: 0 });
                row.jobs += s.jobs;
                row.words += s.words;
                row.hours += s.hours;
                row.documents += s.documents;
                row.pages += s.pages;
                row.earnings += s.earnings;
            });
        });

        return order.map(function (y) {
            var Y = byYear[y];
            Y.hours = cents(Y.hours);
            Y.earnings = cents(Y.earnings);
            /* The first year began when the resource joined, so it is shorter but not still running */
            Y.startedLate = !Y.current && Y.from.getMonth() !== 0;
            Y.services = Object.keys(Y.services)
                .map(function (key) {
                    var s = Y.services[key];
                    s.hours = cents(s.hours);
                    s.earnings = cents(s.earnings);
                    return s;
                })
                .sort(function (a, b) {
                    return b.earnings - a.earnings;
                });
            return Y;
        });
    }

    function rowsOfView() {
        return state.view === "yearly" ? years : months;
    }

    function findRow(id) {
        return (/^\d{4}$/.test(id) ? years : months).filter(function (row) {
            return row.id === id;
        })[0];
    }

    /* The period before, from all the data rather than the filtered list */
    function previousOf(row) {
        var list = row.kind === "year" ? years : months;
        var at = list.indexOf(row);
        return at > 0 ? list[at - 1] : null;
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

    function currentMonth() {
        return months[months.length - 1].from;
    }

    /* Compared by each month's 1st */
    function periodRange(period) {
        var last = currentMonth();

        if (period.key === "year") return { start: new Date(period.year, 0, 1), end: new Date(period.year, 11, 1) };
        if (period.key === "range") return { start: monthOf(period.from), end: monthOf(period.to) };

        var preset = presetFor(period.key);
        if (!preset || !preset.months) return null;
        return { start: new Date(last.getFullYear(), last.getMonth() - (preset.months - 1), 1), end: last };
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

    /* The rows the view shows, oldest first; Yearly always shows every year */
    function inView() {
        if (state.view === "yearly") return years.slice();
        var range = periodRange(state.period);
        return months.filter(function (m) {
            return !range || (m.from >= range.start && m.from <= range.end);
        });
    }

    function sortRows(list) {
        var key = state.sort.key === "period" ? "sortKey" : state.sort.key;
        var dir = state.sort.dir === "asc" ? 1 : -1;

        return list.slice().sort(function (a, b) {
            return (a[key] - b[key]) * dir || b.sortKey - a.sortKey;
        });
    }

    function totalsOf(list) {
        if (FT) {
            return {
                count: list.length,
                jobs: sum(list, "jobs"),
                net: sum(list, "net"),
                excess: sum(list, "excess"),
                pay: cents(sum(list, "pay")),
                excessPay: cents(sum(list, "excessPay"))
            };
        }
        return {
            count: list.length,
            jobs: sum(list, "jobs"),
            words: sum(list, "words"),
            hours: cents(sum(list, "hours")),
            documents: sum(list, "documents"),
            earnings: cents(sum(list, "earnings"))
        };
    }

    /* "12 months" and their first and last day, for the export menu */
    function scopeOf(list) {
        if (!list.length) return { count: "Nothing", range: "" };
        var unit = viewDef().unit;
        return {
            count: list.length + " " + plural(list.length, unit[0], unit[1]),
            range: fmtRange(list[0].from, list[list.length - 1].to)
        };
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
            (decimals ? value.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : number(value)) +
            "</span>"
        );
    }

    function soFar(row) {
        return row.current ? '<span class="rp-scope rp-scope--live">So far</span>' : "";
    }

    /* Signed, against the period before; small counts read better as a difference than a percentage */
    function delta(now, before, asPercent) {
        if (before == null) return "";
        var diff = now - before;
        var dir = diff > 0.004 ? "up" : diff < -0.004 ? "down" : "flat";
        var sign = dir === "up" ? "+" : dir === "down" ? "−" : "±";
        var text =
            dir === "flat"
                ? "±0"
                : (asPercent || before >= 20) && before > 0
                  ? sign + Math.abs(Math.round((diff / before) * 100)) + "%"
                  : sign + number(Math.abs(diff));

        return (
            '<span class="rp-delta' +
            (dir === "up" ? " rp-delta--good" : dir === "down" ? " rp-delta--bad" : "") +
            '">' +
            (dir === "up" ? icon("trending-up") : dir === "down" ? icon("trending-down") : "") +
            text +
            "</span>"
        );
    }

    /* ── Toolbar: Monthly / Yearly ───────────────────────── */

    function renderView() {
        /* A full-timer's pay is worked out a month at a time, so there is no year view; their base takes its place */
        els.view.hidden = !!FT;
        els.base.hidden = !FT;
        if (FT) {
            els.base.innerHTML =
                "Base <strong>" +
                number(FT.config.baseWords) +
                "</strong> words" +
                dot() +
                "<strong>" +
                money(FT.config.baseSalary) +
                "</strong> USD a month";
            return;
        }

        var hadFocus = els.view.contains(document.activeElement);

        els.view.innerHTML = VIEWS.map(function (v) {
            var on = state.view === v.key;
            return (
                '<button class="rp-segment' +
                (on ? " is-active" : "") +
                '" type="button" data-view="' +
                v.key +
                '" aria-pressed="' +
                on +
                '">' +
                v.label +
                "</button>"
            );
        }).join("");

        if (hadFocus) els.view.querySelector(".is-active").focus();
    }

    /* ── Period filter — My Earnings' picker ─────────────── */

    function monthSelect(id, label, list, value) {
        return (
            '<label class="rp-period-field" for="' +
            id +
            '"><span class="rp-period-field__label">' +
            label +
            "</span>" +
            '<select class="rp-period-select" id="' +
            id +
            '">' +
            list
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
        var newest = months
            .map(function (m) {
                return m.from;
            })
            .reverse();

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

        /* From the months, newest first: a full-timer has no year rows to read them off */
        var yearChips = newest
            .map(function (date) {
                return date.getFullYear();
            })
            .filter(function (year, at, all) {
                return all.indexOf(year) === at;
            })
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

        var from = period.key === "range" ? period.from : monthValue(newest[Math.min(5, newest.length - 1)]);
        var to = period.key === "range" ? period.to : monthValue(newest[0]);

        return (
            '<div class="rp-period-pop__list">' +
            presets +
            "</div>" +
            '<p class="rp-period-pop__title">By year</p>' +
            '<div class="rp-period-years">' +
            yearChips +
            "</div>" +
            '<p class="rp-period-pop__title">Custom range</p>' +
            '<div class="rp-period-range' +
            (period.key === "range" ? " is-active" : "") +
            '">' +
            monthSelect("rpRangeFrom", "From", newest, from) +
            monthSelect("rpRangeTo", "To", newest, to) +
            "</div>" +
            '<button class="rp-period-apply" type="button" data-period-apply>Apply range</button>'
        );
    }

    function renderPeriod() {
        var set = state.period.key !== "all";
        var hadFocus = els.period.contains(document.activeElement);

        /* Yearly shows every year, so a period of months has nothing to narrow there */
        els.period.hidden = state.view === "yearly";
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
                ? '<button class="rp-period-clear" type="button" data-period-clear aria-label="Clear the period filter" title="Show all months">' +
                  icon("close") +
                  "</button>"
                : "") +
            '<div class="rp-period-pop" id="rpPeriodPop" role="dialog" aria-label="Choose a period"' +
            (periodOpen ? "" : " hidden") +
            ">" +
            popMarkup() +
            "</div>";

        if (hadFocus && !periodOpen && !els.period.hidden) document.getElementById("rpPeriodBtn").focus();
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
        closeExport(false);
        closeCols(false);
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

    /* ── Export ──────────────────────────────────────────── */

    function renderExport() {
        els.exp.innerHTML =
            '<button class="dashboard_toolbar-btn rp-export-btn" id="rpExportBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="rpExportMenu">' +
            icon("download") +
            '<span class="text-label">Export</span>' +
            icon("chevron-down", "rp-export-btn__caret") +
            "</button>" +
            '<div class="rp-export-menu" id="rpExportMenu" role="menu" aria-labelledby="rpExportBtn" hidden></div>';
    }

    /* Says what will be exported — the rows the view and the period let through, every page */
    function exportMenuMarkup() {
        var scope = scopeOf(inView());
        var item = function (format, iconName, label) {
            return (
                '<button class="rp-export-item" type="button" role="menuitem" data-export="' +
                format +
                '" tabindex="-1">' +
                '<span class="rp-export-item__icon" aria-hidden="true">' +
                icon(iconName) +
                "</span>" +
                '<span class="rp-export-item__label">' +
                label +
                "</span>" +
                icon("download", "rp-export-item__go") +
                "</button>"
            );
        };

        return (
            '<div class="rp-export-menu__head">' +
            '<p class="rp-export-menu__title">Export ' +
            scope.count +
            "</p>" +
            (scope.range ? '<p class="rp-export-menu__scope">' + scope.range + "</p>" : "") +
            "</div>" +
            '<div class="rp-export-menu__list">' +
            item("pdf", "file-chart-column", "PDF report") +
            item("csv", "file-spreadsheet", "Excel (CSV)") +
            "</div>"
        );
    }

    function openExport() {
        hideTip();
        closePeriod(false);
        closeCols(false);
        var menu = document.getElementById("rpExportMenu");
        menu.innerHTML = exportMenuMarkup();
        menu.hidden = false;
        exportOpen = true;
        els.exp.classList.add("is-open");
        document.getElementById("rpExportBtn").setAttribute("aria-expanded", "true");
        menu.querySelector(".rp-export-item").focus();
    }

    function closeExport(returnFocus) {
        if (!exportOpen) return;
        exportOpen = false;
        els.exp.classList.remove("is-open");
        document.getElementById("rpExportMenu").hidden = true;
        document.getElementById("rpExportBtn").setAttribute("aria-expanded", "false");
        if (returnFocus) document.getElementById("rpExportBtn").focus();
    }

    function runExport(format) {
        var list = inView();
        closeExport(true);
        if (!list.length) return RP.toast("There is nothing in this view to export.", "info");

        var span =
            state.view === "yearly"
                ? list[0].label + " – " + list[list.length - 1].label
                : list.length === 1
                  ? list[0].label
                  : list[0].label + " – " + list[list.length - 1].label;
        RP.toast(
            "Productivity for " + span + " would download " + (format === "pdf" ? "as a PDF report" : "as an Excel file (CSV)") + " here.",
            "info"
        );
    }

    /* ── Columns — a popover of this page's own, in place of the shared modal ── */

    function optionalCols() {
        return columns().filter(function (col) {
            return !col.fixed;
        });
    }

    /* Storage throws in some browsers when the page is opened straight off disk */
    function loadHidden() {
        try {
            var saved = JSON.parse(global.localStorage.getItem(MODEL.storageKey));
            if (!Array.isArray(saved)) return [];
            return saved.filter(function (key) {
                return optionalCols().some(function (col) {
                    return col.key === key;
                });
            });
        } catch (err) {
            return [];
        }
    }

    function saveHidden() {
        try {
            global.localStorage.setItem(MODEL.storageKey, JSON.stringify(hiddenCols));
        } catch (err) {
            /* the choice just does not persist */
        }
    }

    /* Header, cells and <col> alike, as the shared modal hid them, so fitColumns can tell what is shown */
    function applyColumns() {
        columns().forEach(function (col) {
            var off = !col.fixed && hiddenCols.indexOf(col.key) > -1;
            els.table.querySelectorAll("." + col.key).forEach(function (cell) {
                cell.style.display = off ? "none" : "";
            });
        });
    }

    function renderCols() {
        els.cols.innerHTML =
            '<button class="dashboard_toolbar-btn rp-cols-btn" id="rpColumnsBtn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="rpColsPop">' +
            icon("columns") +
            '<span class="text-label">Columns</span>' +
            '<span class="rp-cols-btn__count" id="rpColsCount" hidden></span>' +
            icon("chevron-down", "rp-cols-btn__caret") +
            "</button>" +
            '<div class="rp-cols-pop" id="rpColsPop" role="dialog" aria-labelledby="rpColsTitle" hidden></div>';
        syncColsButton();
    }

    /* The button says how many are shown only once some are not, so a missing column is never a mystery */
    function syncColsButton() {
        var total = columns().length;
        var count = document.getElementById("rpColsCount");
        count.hidden = !hiddenCols.length;
        count.textContent = total - hiddenCols.length + "/" + total;
        count.title = hiddenCols.length + plural(hiddenCols.length, " column", " columns") + " hidden";
        els.cols.classList.toggle("is-set", hiddenCols.length > 0);
    }

    function colsPopMarkup() {
        var group = null;
        var list = columns()
            .map(function (col) {
                var label = col.yearLabel && state.view === "yearly" ? col.yearLabel : col.label;
                var title = "";
                if (col.group && col.group !== group) {
                    group = col.group;
                    title = '<p class="rp-cols-pop__group">' + col.group + "</p>";
                }
                if (col.fixed) {
                    return (
                        title +
                        '<label class="rp-check is-locked" title="Always shown"><input type="checkbox" checked disabled>' +
                        '<span class="rp-check__label">' +
                        label +
                        "</span>" +
                        icon("lock", "rp-check__lock") +
                        "</label>"
                    );
                }
                return (
                    title +
                    '<label class="rp-check"><input type="checkbox" data-col="' +
                    col.key +
                    '"' +
                    (hiddenCols.indexOf(col.key) === -1 ? " checked" : "") +
                    '><span class="rp-check__label">' +
                    label +
                    "</span></label>"
                );
            })
            .join("");

        return (
            '<div class="rp-cols-pop__head">' +
            '<p class="rp-cols-pop__title" id="rpColsTitle">Columns</p>' +
            '<button class="rp-cols-pop__action" type="button" data-cols-all>Select all</button>' +
            "</div>" +
            '<div class="rp-cols-pop__list" role="group" aria-labelledby="rpColsTitle">' +
            list +
            "</div>" +
            '<div class="rp-cols-pop__foot">' +
            '<span class="rp-cols-pop__count" id="rpColsShown" aria-live="polite"></span>' +
            '<button class="rp-cols-pop__action" type="button" data-cols-reset title="The default columns, at their default widths">' +
            icon("reset") +
            "Reset</button>" +
            "</div>"
        );
    }

    /* Select all has nothing to do once all are shown; Reset also undoes columns resized by hand */
    function syncColsPop() {
        if (!colsOpen) return;
        var pop = document.getElementById("rpColsPop");
        var total = columns().length;
        document.getElementById("rpColsShown").innerHTML = "<strong>" + (total - hiddenCols.length) + "</strong> of " + total + " shown";
        pop.querySelector("[data-cols-all]").disabled = !hiddenCols.length;
        pop.querySelector("[data-cols-reset]").disabled = !hiddenCols.length && !userSized;
        pop.querySelectorAll("input[data-col]").forEach(function (input) {
            input.checked = hiddenCols.indexOf(input.dataset.col) === -1;
        });
    }

    function openCols() {
        hideTip();
        closePeriod(false);
        closeExport(false);
        var pop = document.getElementById("rpColsPop");
        pop.innerHTML = colsPopMarkup();
        pop.hidden = false;
        colsOpen = true;
        els.cols.classList.add("is-open");
        document.getElementById("rpColumnsBtn").setAttribute("aria-expanded", "true");
        syncColsPop();
        focusFirstCheck();
    }

    function closeCols(returnFocus) {
        if (!colsOpen) return;
        colsOpen = false;
        els.cols.classList.remove("is-open");
        document.getElementById("rpColsPop").hidden = true;
        document.getElementById("rpColumnsBtn").setAttribute("aria-expanded", "false");
        if (returnFocus) document.getElementById("rpColumnsBtn").focus();
    }

    /* Moved before a pressed button disables itself, or focus would fall out of the popover */
    function focusFirstCheck() {
        var first = document.querySelector("#rpColsPop input:not(:disabled)");
        if (first) first.focus();
    }

    /* Applied as you tick, so there is nothing to confirm */
    function setHidden(list) {
        hiddenCols = list;
        saveHidden();
        applyColumns();
        fitColumns();
        syncWidths();
        syncColsButton();
        syncColsPop();
    }

    function toggleColumn(key, show) {
        var next = hiddenCols.filter(function (k) {
            return k !== key;
        });
        if (!show) next.push(key);
        setHidden(next);
    }

    function resetCols() {
        userSized = false;
        hiddenCols = [];
        saveHidden();
        render();
        syncColsButton();
        syncColsPop();
    }

    /* ── Trend chart ─────────────────────────────────────── */

    /* Only the measures the periods in view have; Earnings, Jobs and Words always */
    function chartMetrics(rows) {
        return MODEL.metrics.filter(function (m) {
            return (
                !m.optional ||
                rows.some(function (row) {
                    return row[m.key] > 0;
                })
            );
        });
    }

    /* Four or five clean ticks, with room over the tallest bar for its label */
    function niceScale(max, whole) {
        if (max <= 0) return { top: whole ? 4 : 1, ticks: whole ? [0, 2, 4] : [0, 0.5, 1] };
        var room = max * 1.1;
        var rough = room / 4;
        var pow = Math.pow(10, Math.floor(Math.log10(rough)));
        var steps = whole ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
        var step = pow * 10;
        for (var i = 0; i < steps.length; i++) {
            if (steps[i] * pow >= rough) {
                step = steps[i] * pow;
                break;
            }
        }
        if (whole) step = Math.max(1, Math.round(step));
        var top = Math.ceil(room / step) * step;
        var ticks = [];
        for (var v = 0; v <= top + step / 1000; v += step) ticks.push(cents(v));
        return { top: top, ticks: ticks };
    }

    function tickText(value) {
        if (value >= 10000) return (value / 1000).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) + "k";
        return value.toLocaleString(LOCALE, { maximumFractionDigits: 2 });
    }

    /* A few months spell each one out; many keep only the years */
    function xLabel(row, at, rows) {
        if (row.kind === "year") return row.label;
        var first = at === 0;
        var january = row.from.getMonth() === 0;
        if (rows.length > 18) return first || january ? String(row.from.getFullYear()) : "";
        return monthShort(row.from) + (first || january ? '<span class="rp-chart__x-year">' + row.from.getFullYear() + "</span>" : "");
    }

    function barTip(row, m) {
        var parts = [row.label + (row.current ? " · so far" : "")];
        if (m.key !== "jobs") parts.push(number(row.jobs) + plural(row.jobs, " job", " jobs"));
        if (FT) {
            if (m.key === "net" && row.excess) parts.push(number(row.excess) + " over the base");
            if (m.key === "net" && !row.excess && !row.current) parts.push(number(FT.config.baseWords - row.net) + " under the base");
            if (m.key === "pay" && row.excessPay) parts.push(money(row.excessPay) + " USD excess pay");
            if (m.key === "jobs") parts.push(number(row.net) + " net words");
            return parts.join(" · ");
        }
        if (m.key !== "words" && row.words) parts.push(number(row.words) + " words");
        if (m.key !== "earnings") parts.push(money(row.earnings) + " " + RP.USER.currency);
        return parts.join(" · ");
    }

    function averageOf(rows, m) {
        var complete = rows.filter(function (row) {
            return !row.current && !row.startedLate;
        });
        if (complete.length < 2) return null;
        return sum(complete, m.key) / complete.length;
    }

    /* The line a measure is read against: a full-timer's base where it has one, else the average */
    function referenceOf(rows, m) {
        if (FT && m.base) {
            return { kind: "base", value: m.base === "words" ? FT.config.baseWords : FT.config.baseSalary };
        }
        var avg = averageOf(rows, m);
        return avg == null ? null : { kind: "avg", value: avg };
    }

    function trendHeadMarkup(rows) {
        var metrics = chartMetrics(rows);
        var m = metricDef(state.metric);
        return (
            '<h2 class="rp-card__title" id="rpTrendTitle">' +
            icon("chart-column") +
            '<span id="rpTrendName">' +
            m.label +
            (state.view === "yearly" ? " by year" : " by month") +
            "</span></h2>" +
            '<div class="rp-segmented rp-metric-switch" id="rpMetric" role="group" aria-label="Measure in the chart">' +
            metrics
                .map(function (def) {
                    var on = def.key === state.metric;
                    return (
                        '<button class="rp-segment' +
                        (on ? " is-active" : "") +
                        '" type="button" data-metric="' +
                        def.key +
                        '" aria-pressed="' +
                        on +
                        '">' +
                        def.label +
                        "</button>"
                    );
                })
                .join("") +
            "</div>"
        );
    }

    /* The keys for what is not a plain bar: the dashed average and a period still running */
    function keyMarkup(rows, m) {
        var ref = referenceOf(rows, m);
        var running = rows.some(function (row) {
            return row.current;
        });
        var unit = state.view === "yearly" ? "a year" : "a month";
        var parts = [];

        if (ref) {
            /* A count averages to a fraction; one place says 22.6 jobs without pretending to more */
            var figure = m.money
                ? money(ref.value)
                : ref.value < 100
                  ? ref.value.toLocaleString(LOCALE, { maximumFractionDigits: 1 })
                  : number(ref.value);
            var name = ref.kind === "base" ? (m.money ? "Base salary" : "Base") : "Average";
            parts.push(
                '<span class="rp-chart-key__item"><span class="rp-chart-key__' +
                    ref.kind +
                    '" aria-hidden="true"></span>' +
                    name +
                    " <strong>" +
                    figure +
                    "</strong> " +
                    (m.money ? escapeHtml(currencyOf(m)) : m.unit[1]) +
                    " " +
                    unit +
                    "</span>"
            );
        }
        if (running) {
            parts.push(
                '<span class="rp-chart-key__item"><span class="rp-chart-key__swatch" aria-hidden="true"></span>' +
                    (state.view === "yearly" ? "This year" : "This month") +
                    " so far</span>"
            );
        }
        return parts.join("");
    }

    function chartMarkup(rows, m) {
        var n = rows.length;
        var ref = referenceOf(rows, m);
        /* A base the bars fall short of still has to be on the chart */
        var max = Math.max.apply(
            null,
            rows.map(function (row) {
                return row[m.key];
            }).concat([0, ref && ref.kind === "base" ? ref.value : 0])
        );
        var scale = niceScale(max, m.whole);
        var pct = function (v) {
            return Math.min(100, (v / scale.top) * 100);
        };

        /* The one direct label: the best complete period, on its cap */
        var peak = -1;
        rows.forEach(function (row, at) {
            if (!row.current && row[m.key] > 0 && (peak === -1 || row[m.key] > rows[peak][m.key])) peak = at;
        });

        var grid = scale.ticks
            .map(function (v) {
                return '<span class="rp-chart__grid" style="bottom:' + pct(v) + '%"></span>';
            })
            .join("");

        var ticks = scale.ticks
            .map(function (v) {
                return '<span class="rp-chart__tick" style="bottom:' + pct(v) + '%">' + tickText(v) + "</span>";
            })
            .join("");

        var bars = rows
            .map(function (row, at) {
                var value = row[m.key];
                return (
                    '<button class="rp-bar' +
                    (row.current ? " is-partial" : "") +
                    (at === peak ? " is-peak" : "") +
                    '" type="button" data-id="' +
                    row.id +
                    '" style="--h:' +
                    pct(value).toFixed(2) +
                    '%" tabindex="' +
                    (at === n - 1 ? 0 : -1) +
                    '" aria-label="' +
                    escapeHtml(row.label + (row.current ? ", so far" : "") + ": " + metricWords(m, value)) +
                    '" data-tip-value="' +
                    escapeHtml(metricWords(m, value)) +
                    '" data-tip-label="' +
                    escapeHtml(barTip(row, m)) +
                    '"><span class="rp-bar__fill"></span></button>'
                );
            })
            .join("");

        var labels = rows
            .map(function (row, at) {
                return '<span class="rp-chart__x-slot"><span class="rp-chart__x-label">' + xLabel(row, at, rows) + "</span></span>";
            })
            .join("");

        /* A label on the first or last bar hangs inward, never past the plot */
        var peakAt = (peak + 0.5) / n;
        var peakLabel =
            peak > -1
                ? '<span class="rp-chart__peak' +
                  (peakAt < 0.06 ? " is-start" : peakAt > 0.94 ? " is-end" : "") +
                  '" style="left:' +
                  (peakAt * 100).toFixed(3) +
                  "%;bottom:" +
                  pct(rows[peak][m.key]).toFixed(2) +
                  '%" aria-hidden="true">' +
                  metricText(m, rows[peak][m.key]) +
                  "</span>"
                : "";

        return (
            '<div class="rp-chart' +
            (n > 36 ? " is-dense" : n > 18 ? " is-busy" : "") +
            '" style="--n:' +
            n +
            '">' +
            '<div class="rp-chart__y" aria-hidden="true">' +
            ticks +
            "</div>" +
            '<div class="rp-chart__plot">' +
            grid +
            (ref
                ? '<span class="rp-chart__' + ref.kind + '" style="bottom:' + pct(ref.value).toFixed(2) + '%" aria-hidden="true"></span>'
                : "") +
            '<div class="rp-chart__bars" role="group" aria-label="' +
            escapeHtml(m.label + (state.view === "yearly" ? " by year" : " by month") + ". Arrow keys move between periods, Enter opens one") +
            '">' +
            bars +
            "</div>" +
            peakLabel +
            "</div>" +
            '<div class="rp-chart__x" aria-hidden="true">' +
            labels +
            "</div>" +
            "</div>"
        );
    }

    function renderTrend(rows) {
        if (!rows.length) {
            els.trend.hidden = true;
            chartIds = "";
            return;
        }
        els.trend.hidden = false;

        var metrics = chartMetrics(rows);
        if (!metrics.some(function (m) {
            return m.key === state.metric;
        })) state.metric = MODEL.defaultMetric;

        var m = metricDef(state.metric);
        var ids = state.view + ":" + rows.map(function (row) {
            return row.id;
        }).join(",");
        var grow = ids !== chartIds;
        chartIds = ids;

        els.trend.innerHTML =
            '<div class="rp-card__head">' +
            trendHeadMarkup(rows) +
            "</div>" +
            '<div class="rp-card__body">' +
            '<p class="rp-chart-key">' +
            keyMarkup(rows, m) +
            "</p>" +
            chartMarkup(rows, m) +
            "</div>";

        /* New periods grow from the baseline; a new measure only moves the bars it has */
        var chart = els.trend.querySelector(".rp-chart");
        if (grow && !still()) {
            chart.classList.add("is-growing");
            global.requestAnimationFrame(function () {
                global.requestAnimationFrame(function () {
                    chart.classList.remove("is-growing");
                });
            });
        }

        /* Sideways only: scrollIntoView would also pull the page back up to the chart */
        var bar = els.trend.querySelector(".rp-metric-switch");
        var active = bar && bar.querySelector(".is-active");
        if (active && bar.scrollWidth > bar.clientWidth) {
            var a = active.getBoundingClientRect();
            var b = bar.getBoundingClientRect();
            if (a.right > b.right) bar.scrollLeft += a.right - b.right + 12;
            else if (a.left < b.left) bar.scrollLeft -= b.left - a.left + 12;
        }
        syncMetricEdge();
    }

    /* On a phone the measures scroll sideways; a fade on the side with more says so */
    function syncMetricEdge() {
        var bar = els.trend && els.trend.querySelector(".rp-metric-switch");
        if (!bar) return;
        var more = bar.scrollWidth - bar.clientWidth;
        bar.classList.toggle("is-more-end", more > 1 && bar.scrollLeft < more - 1);
        bar.classList.toggle("is-more-start", more > 1 && bar.scrollLeft > 1);
    }

    /* Switching the measure keeps the bars and moves them, so the change reads as one */
    function setMetric(key) {
        if (key === state.metric) return;
        var rows = inView();
        var before = {};
        els.trend.querySelectorAll(".rp-bar").forEach(function (bar) {
            before[bar.dataset.id] = bar.style.getPropertyValue("--h");
        });

        state.metric = key;
        renderTrend(rows);
        syncUrl();

        if (still()) return;
        var bars = els.trend.querySelectorAll(".rp-bar");
        bars.forEach(function (bar) {
            var next = bar.style.getPropertyValue("--h");
            if (before[bar.dataset.id] == null) return;
            bar.classList.add("is-instant");
            bar.style.setProperty("--h", before[bar.dataset.id]);
            bar.dataset.next = next;
        });
        void els.trend.offsetWidth;
        bars.forEach(function (bar) {
            bar.classList.remove("is-instant");
            if (bar.dataset.next) bar.style.setProperty("--h", bar.dataset.next);
            delete bar.dataset.next;
        });
        var active = els.trend.querySelector('[data-metric="' + key + '"]');
        if (active) active.focus({ preventScroll: true });
    }

    function hotBar(id, on) {
        var bar = id && els.trend.querySelector('.rp-bar[data-id="' + id + '"]');
        if (bar) bar.classList.toggle("is-hot", on);
    }

    function hotRow(id, on) {
        var tr = id && els.tbody.querySelector('tr.rp-row[data-id="' + id + '"]');
        if (tr) tr.classList.toggle("is-hot", on);
    }

    /* ── Cells ───────────────────────────────────────────── */

    function figure(value, text) {
        return value > 0 ? '<span class="rp-num">' + text + "</span>" : '<span class="rp-nil" aria-label="None">—</span>';
    }

    var CELL = {
        "col-period": function (row) {
            var open = !!state.expanded[row.id];
            return (
                '<span class="rp-id-cell">' +
                '<button class="rp-expand-btn" type="button" aria-expanded="' +
                open +
                '" aria-label="Show the details of ' +
                escapeHtml(row.label) +
                '">' +
                icon("chevron-right") +
                "</button>" +
                '<span class="rp-period-name">' +
                row.label +
                "</span>" +
                soFar(row) +
                (row.startedLate ? '<span class="rp-period-note">from ' + monthShort(row.from) + "</span>" : "") +
                "</span>"
            );
        },
        "col-jobs": function (row) {
            return figure(row.jobs, number(row.jobs));
        },
        "col-words": function (row) {
            return figure(row.words, number(row.words));
        },
        "col-hours": function (row) {
            return figure(row.hours, hours(row.hours));
        },
        "col-documents": function (row) {
            return figure(row.documents, number(row.documents));
        },
        "col-earnings": function (row) {
            return (
                '<span class="rp-amount" data-tip="≈ USD ' +
                money(row.earnings * RP.USD_RATE) +
                '"><span class="price-row-unit">' +
                escapeHtml(RP.USER.currency) +
                '</span> <span class="price-row-value">' +
                money(row.earnings) +
                "</span></span>"
            );
        }
    };

    /* Currency first in a cell, as on My Earnings; nothing earned reads as a dash, not "USD 0.00" */
    function priced(currency, value, strong) {
        if (!(value > 0)) return '<span class="rp-nil" aria-label="None">—</span>';
        return (
            '<span class="rp-amount"><span class="price-row-unit">' +
            currency +
            '</span> <span class="' +
            (strong ? "price-row-value" : "rp-num") +
            '">' +
            money(value) +
            "</span></span>"
        );
    }

    var FT_CELL = {
        "col-period": CELL["col-period"],
        "col-jobs": CELL["col-jobs"],
        "col-translation": function (row) {
            return figure(row.translation, number(row.translation));
        },
        "col-revision": function (row) {
            return figure(row.revision, number(row.revision));
        },
        "col-legalization": function (row) {
            return figure(row.pages, number(row.pages));
        },
        "col-hours": function (row) {
            return figure(row.hours, hours(row.hours));
        },
        "col-net": function (row) {
            return '<span class="rp-num rp-num--key">' + number(row.net) + "</span>";
        },
        "col-excess": function (row) {
            return figure(row.excess, number(row.excess));
        },
        "col-excess-pay": function (row) {
            return priced("USD", row.excessPay);
        },
        "col-pay": function (row) {
            return priced("USD", row.pay, true);
        },
        "col-pay-local": function (row) {
            return priced(escapeHtml(FT.config.currency), row.payLocal);
        }
    };

    /* ── Table shell ─────────────────────────────────────── */

    function colsMarkup() {
        return (
            columns().map(function (col) {
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

    /* Verbatim from templates/partials/_sorting_icon.html, as on My Jobs and My Earnings */
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
            columns().map(function (col, index) {
                var sorted = col.sort && state.sort.key === col.sort;
                var label = col.yearLabel && state.view === "yearly" ? col.yearLabel : col.label;
                return (
                    "<th " +
                    (col.sort ? 'class="order_by ' : 'class="') +
                    col.key +
                    (col.sticky ? " sticky-col" : "") +
                    (col.align === "right" ? " is-right" : "") +
                    (sorted ? " is-sorted is-" + state.sort.dir : "") +
                    '"' +
                    (col.sort ? ' data-sort="' + col.sort + '"' : "") +
                    (sorted ? ' aria-sort="' + (state.sort.dir === "asc" ? "ascending" : "descending") + '"' : "") +
                    ' scope="col">' +
                    '<span class="th-inner"><span class="label">' +
                    label +
                    "</span>" +
                    (col.tip ? info(tipText(col.tip), "About " + col.label.toLowerCase()) : "") +
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

    function rowMarkup(row) {
        var open = !!state.expanded[row.id];
        var cells = columns().map(function (col) {
            return (
                '<td class="' +
                col.key +
                (col.sticky ? " sticky-col" : "") +
                (col.align === "right" ? " right-aligned-td" : "") +
                '">' +
                MODEL.cells[col.key](row) +
                "</td>"
            );
        }).join("");

        return (
            '<tr class="rp-row' +
            (open ? " is-expanded" : "") +
            (row.current ? " is-current" : "") +
            (flashId === row.id ? " is-flash" : "") +
            '" data-id="' +
            row.id +
            '">' +
            cells +
            '<td class="col-filler-cell"></td></tr>' +
            '<tr class="rp-subrow' +
            (open ? "" : " is-hidden") +
            '" data-detail="' +
            row.id +
            '"><td colspan="' +
            (columns().length + 1) +
            '">' +
            (open ? detailMarkup(row) : "") +
            "</td></tr>"
        );
    }

    /* ── The open row: the period's services and its summary ─── */

    function volumeText(s) {
        var parts = [];
        if (s.words) parts.push(number(s.words) + " words");
        if (s.hours) parts.push(hours(s.hours, true) + plural(s.hours, " hour", " hours"));
        if (s.documents) parts.push(number(s.documents) + plural(s.documents, " document", " documents"));
        if (s.pages) parts.push(number(s.pages) + plural(s.pages, " page", " pages"));
        return parts.join(" · ") || "—";
    }

    function servicesMarkup(row) {
        var whole = row.earnings || 1;
        var list = row.services
            .map(function (s) {
                var share = Math.round((s.earnings / whole) * 100);
                return (
                    '<div class="rp-svc__row" role="row">' +
                    '<span class="rp-svc__name" role="cell"><span class="rp-svc__icon" aria-hidden="true">' +
                    icon(SERVICE_ICON[s.service] || "jobs") +
                    "</span>" +
                    escapeHtml(s.service) +
                    "</span>" +
                    '<span class="rp-svc__jobs" role="cell">' +
                    number(s.jobs) +
                    "</span>" +
                    '<span class="rp-svc__volume" role="cell">' +
                    volumeText(s) +
                    "</span>" +
                    '<span class="rp-svc__amount" role="cell">' +
                    money(s.earnings) +
                    "</span>" +
                    '<span class="rp-svc__share" role="cell"><span class="rp-share" aria-hidden="true"><span style="width:' +
                    Math.max(2, share) +
                    '%"></span></span><span class="rp-share__pct">' +
                    share +
                    "%</span></span>" +
                    "</div>"
                );
            })
            .join("");

        return (
            '<div class="rp-svc">' +
            '<p class="rp-section-title">By service<span class="rp-section-count">' +
            row.services.length +
            "</span></p>" +
            '<div class="rp-svc__table" role="table" aria-label="Services in ' +
            escapeHtml(row.label) +
            '">' +
            '<div class="rp-svc__row rp-svc__row--head" role="row">' +
            '<span role="columnheader">Service</span>' +
            '<span class="rp-svc__jobs" role="columnheader">Jobs</span>' +
            '<span class="rp-svc__volume" role="columnheader">Volume</span>' +
            '<span class="rp-svc__amount" role="columnheader">Earnings (' +
            escapeHtml(RP.USER.currency) +
            ")</span>" +
            '<span class="rp-svc__share" role="columnheader">Share</span>' +
            "</div>" +
            '<div role="rowgroup">' +
            list +
            "</div></div></div>"
        );
    }

    function summaryMarkup(row) {
        var prev = row.current ? null : previousOf(row);
        /* A first year that began in March is no fair measure for the next one */
        if (prev && prev.startedLate) prev = null;
        var currency = escapeHtml(RP.USER.currency);
        var note = row.current
            ? '<span class="rp-scope rp-scope--live">So far</span>'
            : prev
              ? '<span class="rp-section-note">vs ' + prev.label + "</span>"
              : "";

        var fact = function (label, value, change) {
            return '<div class="rp-fact"><dt>' + label + "</dt><dd>" + value + (change || "") + "</dd></div>";
        };

        return (
            '<div class="rp-periodsum">' +
            '<p class="rp-section-title">Summary' +
            note +
            "</p>" +
            '<dl class="rp-facts">' +
            fact("Job Count", number(row.jobs), prev ? delta(row.jobs, prev.jobs) : "") +
            fact("Word Count", number(row.words), prev ? delta(row.words, prev.words, true) : "") +
            fact("Hours", row.hours ? hours(row.hours, true) : '<span class="rp-nil">—</span>') +
            fact("Documents", row.documents ? number(row.documents) : '<span class="rp-nil">—</span>') +
            "</dl>" +
            '<dl class="rp-sum">' +
            '<div class="rp-sum__row rp-sum__row--total"><dt>Earnings' +
            (prev ? delta(row.earnings, prev.earnings, true) : "") +
            "</dt><dd>" +
            '<span class="rp-sum__unit">' +
            currency +
            "</span> " +
            money(row.earnings) +
            "</dd></div></dl>" +
            '<p class="rp-sum__usd">≈ USD ' +
            money(row.earnings * RP.USD_RATE) +
            "</p></div>"
        );
    }

    /* ── A full-timer's open month: how the net words were made, then the pay ── */

    function netMarkup(row) {
        var c = FT.config;
        var w = c.weights;
        var lines = [
            { name: "Translation", icon: "languages", actual: row.translation ? number(row.translation) + " words" : "", weight: w.translation, counted: row.counted.translation },
            { name: "Revision", icon: "spell-check", actual: row.revision ? number(row.revision) + " words" : "", weight: w.revision, counted: row.counted.revision },
            {
                name: "Legalization", icon: "stamp", note: number(c.wordsPerPage) + " words a page",
                actual: row.pages ? number(row.pages) + plural(row.pages, " page", " pages") : "", weight: w.legalization, counted: row.counted.legalization
            },
            {
                name: "Hours", icon: "clock", note: number(c.wordsPerHour) + " words an hour",
                actual: row.hours ? hours(row.hours, true) + plural(row.hours, " hour", " hours") : "", weight: w.hours, counted: row.counted.hours
            },
            {
                name: "Other services", icon: "pen-tool", note: "DTP, typing and the like",
                actual: row.other ? number(row.other) + " words" : "", weight: w.other, counted: row.counted.other
            }
        ];

        var body = lines
            .map(function (line) {
                var none = !line.actual;
                return (
                    '<div class="rp-svc__row rp-net__row' +
                    (none ? " is-none" : "") +
                    '" role="row">' +
                    '<span class="rp-svc__name" role="cell"><span class="rp-svc__icon" aria-hidden="true">' +
                    icon(line.icon) +
                    '</span><span class="rp-net__name">' +
                    line.name +
                    (line.note ? '<span class="rp-net__note">' + line.note + "</span>" : "") +
                    "</span></span>" +
                    '<span class="rp-svc__volume" role="cell">' +
                    (line.actual || '<span class="rp-nil">—</span>') +
                    "</span>" +
                    '<span class="rp-net__weight" role="cell">' +
                    line.weight +
                    "%</span>" +
                    '<span class="rp-net__counted" role="cell">' +
                    (line.counted ? number(line.counted) : '<span class="rp-nil">—</span>') +
                    "</span></div>"
                );
            })
            .join("");

        return (
            '<div class="rp-svc rp-net">' +
            '<p class="rp-section-title">How your net words were counted</p>' +
            '<div class="rp-svc__table" role="table" aria-label="Net words in ' +
            escapeHtml(row.label) +
            '">' +
            '<div class="rp-svc__row rp-net__row rp-svc__row--head" role="row">' +
            '<span role="columnheader">Work</span>' +
            '<span class="rp-svc__volume" role="columnheader">Actual</span>' +
            '<span class="rp-net__weight" role="columnheader">Weight</span>' +
            '<span class="rp-net__counted" role="columnheader">Counted</span>' +
            "</div>" +
            '<div role="rowgroup">' +
            body +
            "</div>" +
            '<div class="rp-svc__row rp-net__row rp-net__row--total" role="row">' +
            '<span role="rowheader">Net words</span><span class="rp-svc__volume"></span><span class="rp-net__weight"></span>' +
            '<span class="rp-net__counted" role="cell">' +
            number(row.net) +
            "</span></div>" +
            "</div></div>"
        );
    }

    function payMarkup(row) {
        var c = FT.config;
        var prev = row.current ? null : previousOf(row);
        var over = row.net - c.baseWords;
        var fill = Math.min(100, (row.net / c.baseWords) * 100);
        var note = row.current
            ? over > 0
              ? number(over) + " over the base so far"
              : number(-over) + " to go before excess pay"
            : over > 0
              ? number(over) + " over the base"
              : over < 0
                ? number(-over) + " under the base"
                : "Right on the base";
        var head = row.current
            ? '<span class="rp-scope rp-scope--live">So far</span>'
            : prev
              ? '<span class="rp-section-note">vs ' + prev.label + "</span>"
              : "";

        return (
            '<div class="rp-periodsum">' +
            '<p class="rp-section-title">Pay' +
            head +
            "</p>" +
            '<div class="rp-basebar">' +
            '<div class="rp-basebar__top"><span class="rp-basebar__label">Net words</span>' +
            (prev ? delta(row.net, prev.net, true) : "") +
            '<span class="rp-basebar__value">' +
            number(row.net) +
            '<small> of ' +
            number(c.baseWords) +
            "</small></span></div>" +
            '<div class="rp-basebar__track' +
            (over > 0 ? " is-over" : "") +
            '" role="meter" aria-valuemin="0" aria-valuemax="' +
            c.baseWords +
            '" aria-valuenow="' +
            Math.min(row.net, c.baseWords) +
            '" aria-label="Net words against the base of ' +
            number(c.baseWords) +
            '"><span class="rp-basebar__fill" style="width:' +
            fill.toFixed(1) +
            '%"></span></div>' +
            '<p class="rp-basebar__note">' +
            note +
            "</p></div>" +
            '<dl class="rp-sum">' +
            '<div class="rp-sum__row"><dt>Base salary</dt><dd>USD ' +
            money(c.baseSalary) +
            "</dd></div>" +
            '<div class="rp-sum__row"><dt>Excess pay</dt><dd>' +
            (row.excessPay ? "USD " + money(row.excessPay) : '<span class="rp-nil">—</span>') +
            "</dd></div>" +
            '<div class="rp-sum__row rp-sum__row--total"><dt>Monthly pay' +
            (prev ? delta(row.pay, prev.pay, true) : "") +
            '</dt><dd><span class="rp-sum__unit">USD</span> ' +
            money(row.pay) +
            "</dd></div></dl>" +
            '<p class="rp-sum__usd">≈ ' +
            escapeHtml(c.currency) +
            " " +
            money(row.payLocal) +
            "</p></div>"
        );
    }

    function detailMarkup(row) {
        return (
            '<div class="rp-detail"><div class="rp-panel">' +
            '<div class="rp-panel__head">' +
            '<span class="rp-panel__mark" aria-hidden="true">' +
            icon("calendar-range") +
            "</span>" +
            '<div class="rp-panel__titles">' +
            '<p class="rp-panel__title">' +
            row.title +
            soFar(row) +
            "</p>" +
            '<p class="rp-panel__sub">' +
            fmtRange(row.from, row.to) +
            dot() +
            number(row.jobs) +
            plural(row.jobs, " job", " jobs") +
            "</p></div>" +
            '<div class="rp-panel__actions">' +
            '<button class="rp-btn rp-btn--ghost" type="button" data-action="pdf">' +
            icon("download") +
            "PDF</button>" +
            '<button class="rp-btn rp-btn--primary" type="button" data-action="jobs">' +
            "View jobs" +
            icon("arrow-right") +
            "</button></div></div>" +
            '<div class="rp-panel__body">' +
            '<div class="rp-panel__main">' +
            MODEL.main(row) +
            "</div>" +
            '<div class="rp-panel__side">' +
            MODEL.side(row) +
            "</div></div></div></div>"
        );
    }

    /* ── Totals ──────────────────────────────────────────── */

    /* One cell of the band: label and tip, then the figure, value then unit; no mark, the figures carry it */
    function cellMarkup(def, t) {
        var unit = function (text) {
            return '<span class="rp-sumbar__unit">' + text + "</span>";
        };
        var value, sub = "";

        if (def.key === "jobs") {
            var span = viewDef().unit;
            value = counter(t.jobs, "jobs") + unit(plural(t.jobs, "job", "jobs"));
            sub = "in <strong>" + counter(t.count, "count") + "</strong> " + plural(t.count, span[0], span[1]);
        } else if (def.key === "words") {
            var extra = [];
            if (t.hours) extra.push("<strong>" + hours(t.hours, true) + "</strong> " + plural(t.hours, "hour", "hours"));
            if (t.documents) extra.push("<strong>" + number(t.documents) + "</strong> " + plural(t.documents, "document", "documents"));
            value = counter(t.words, "words") + unit("words");
            sub = extra.length ? "and " + extra.join(", ") : "No hours or documents";
        } else if (def.key === "net") {
            value = counter(t.net, "net") + unit("words");
            sub = t.excess ? "<strong>" + counter(t.excess, "excess") + "</strong> past the base" : "None past the base";
        } else if (def.key === "pay") {
            value = counter(t.pay, "pay", 2) + unit("USD");
            sub = t.excessPay
                ? "with <strong>" + counter(t.excessPay, "excess-pay", 2) + "</strong> USD excess pay"
                : "Base salary only";
        } else {
            value = counter(t.earnings, "earned", 2) + unit(escapeHtml(RP.USER.currency));
            sub = "≈ " + counter(cents(t.earnings * RP.USD_RATE), "earned-usd", 2) + " USD";
        }

        return (
            '<section class="rp-sumbar__cell" id="total-' +
            def.key +
            '" aria-labelledby="total-' +
            def.key +
            '-label">' +
            '<div class="rp-sumbar__head">' +
            '<h2 class="rp-sumbar__label" id="total-' +
            def.key +
            '-label">' +
            def.label +
            "</h2>" +
            info(def.tip, "About " + def.label.toLowerCase()) +
            "</div>" +
            '<p class="rp-sumbar__value">' +
            value +
            "</p>" +
            (sub ? '<p class="rp-sumbar__sub">' + sub + "</p>" : "") +
            "</section>"
        );
    }

    /* The cell count drives the strip's columns */
    function renderTotals(list) {
        var t = totalsOf(list);
        els.totals.dataset.cells = MODEL.totals.length;
        els.totals.style.setProperty("--cells", MODEL.totals.length);
        els.totals.innerHTML = MODEL.totals.map(function (def) {
            return cellMarkup(def, t);
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

    /* ── Render ──────────────────────────────────────────── */

    function render() {
        hideTip();

        var rows = inView();
        listed = sortRows(rows);

        var pages = Math.max(1, Math.ceil(listed.length / state.perPage));
        if (state.page > pages) state.page = pages;
        var start = (state.page - 1) * state.perPage;
        var pageRows = listed.slice(start, start + state.perPage);

        renderView();
        renderPeriod();
        renderTrend(rows);
        renderTotals(rows);

        els.colgroup.innerHTML = colsMarkup();
        els.thead.innerHTML = headCellsMarkup();
        els.tbody.innerHTML = pageRows.length
            ? pageRows.map(rowMarkup).join("")
            : '<tr><td class="rp-empty-cell" colspan="' + (columns().length + 1) + '">' + emptyMarkup() + "</td></tr>";

        renderPagination(listed.length, pages, start, pageRows.length);

        applyColumns();
        fitColumns();
        syncWidths();
        wireResizers();
    }

    /* Every column gives back its slack before the table scrolls; a hand-resized table is left alone */
    function fitColumns() {
        if (userSized || !els.colgroup) return;

        var shownCols = columns().filter(function (col) {
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

    function emptyMarkup() {
        return (
            '<div class="rp-empty">' +
            '<span class="rp-empty__icon">' +
            icon(state.period.key !== "all" ? "calendar-range" : "empty-inbox") +
            "</span>" +
            '<span class="rp-empty__title">' +
            (months.length ? "No delivered work in " + escapeHtml(periodLabel(state.period)) : "No delivered work yet") +
            "</span>" +
            '<span class="rp-empty__note">' +
            (months.length
                ? "Try another period."
                : "Each job you deliver is counted here, in the month you delivered it.") +
            "</span>" +
            (state.period.key !== "all"
                ? '<button class="rp-empty__action" type="button" data-clear-filters>' + icon("reset") + "Show all months</button>"
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
            PAGE_SIZES.map(function (size) {
                return '<option value="' + size + '"' + (size === state.perPage ? " selected" : "") + ">" + size + "</option>";
            }).join("") +
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
            detail.firstElementChild.innerHTML = detailMarkup(findRow(id));
        }

        detail.classList.toggle("is-hidden", !open);
        tr.classList.toggle("is-expanded", open);
        tr.querySelector(".rp-expand-btn").setAttribute("aria-expanded", String(open));

        if (open) state.expanded[id] = true;
        else delete state.expanded[id];
    }

    /* A bar, or a link from elsewhere, opens its period in its place in the list */
    function reveal(id, focusRow) {
        var at = listed
            .map(function (row) {
                return row.id;
            })
            .indexOf(id);
        if (at === -1) return;

        state.page = Math.floor(at / state.perPage) + 1;
        state.expanded[id] = true;
        flashId = id;
        render();

        var tr = els.tbody.querySelector('tr.rp-row[data-id="' + id + '"]');
        if (!tr) return;
        if (focusRow) tr.querySelector(".rp-expand-btn").focus({ preventScroll: true });

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

    /* ── Tooltip — the dashboard's, for info buttons, bars and amounts ── */

    function showTip(owner, pinned) {
        if (tipOwner && tipOwner !== owner) hideTip();
        var tip = els.tip;
        tip.textContent = "";

        /* On a bar the value leads and the period follows; text goes in as text, never as markup */
        if (owner.dataset.tipValue) {
            var value = document.createElement("span");
            value.className = "rp-tip__value";
            value.textContent = owner.dataset.tipValue;
            var label = document.createElement("span");
            label.className = "rp-tip__label";
            label.textContent = owner.dataset.tipLabel || "";
            tip.appendChild(value);
            tip.appendChild(label);
        } else {
            tip.textContent = owner.dataset.tip;
        }

        tip.hidden = false;
        var r = owner.getBoundingClientRect();
        /* A bar's tip rides its cap, not the top of its full-height hit area */
        var fill = owner.querySelector(".rp-bar__fill");
        var anchorTop = fill ? fill.getBoundingClientRect().top : r.top;
        var t = tip.getBoundingClientRect();
        var left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), global.innerWidth - t.width - 8);
        var top = anchorTop - t.height - 8;
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
        return node && node.closest ? node.closest("[data-tip], [data-tip-value]") : null;
    }

    /* ── URL ─────────────────────────────────────────────── */

    /* The view lives in the URL, so a reload or a shared link opens the same rows */
    function syncUrl() {
        var params = new URLSearchParams(global.location.search);
        ["view", "period", "metric", "month", "year"].forEach(function (key) {
            params.delete(key);
        });
        if (state.view !== "monthly") params.set("view", state.view);
        if (state.period.key !== "all") params.set("period", periodParam(state.period));
        if (state.metric !== MODEL.defaultMetric) params.set("metric", state.metric);

        var qs = params.toString();
        global.history.replaceState(null, "", qs ? "?" + qs : global.location.pathname);
    }

    /* ── Actions ─────────────────────────────────────────── */

    function setView(view) {
        if (view === state.view) return;
        state.view = view;
        state.page = 1;
        state.expanded = {};
        closePeriod(false);
        render();
        syncUrl();
    }

    function runAction(action, row) {
        if (action === "pdf") RP.toast("Productivity for " + row.label + " would download as a PDF report here.", "info");
        if (action === "jobs") {
            /* My Jobs lists this month's deliveries; older ones only say where they would go */
            if (row.current && row.kind === "month") global.location.href = "jobs.html?tab=completed";
            else RP.toast("The " + number(row.jobs) + " jobs delivered in " + row.label + " would open in My Jobs here.", "info");
        }
    }

    /* Left and right walk the bars, as a radio group does; the table follows on Enter */
    function moveBar(from, by) {
        var bars = Array.prototype.slice.call(els.trend.querySelectorAll(".rp-bar"));
        var at = bars.indexOf(from);
        var next = by === "first" ? bars[0] : by === "last" ? bars[bars.length - 1] : bars[Math.max(0, Math.min(bars.length - 1, at + by))];
        if (!next || next === from) return;
        from.tabIndex = -1;
        next.tabIndex = 0;
        next.focus();
    }

    /* ── Wiring ──────────────────────────────────────────── */

    function wire() {
        els.view.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-view]");
            if (btn) setView(btn.dataset.view);
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

        els.exp.addEventListener("click", function (e) {
            if (e.target.closest("#rpExportBtn")) {
                if (exportOpen) closeExport(false);
                else openExport();
                return;
            }
            var item = e.target.closest("[data-export]");
            if (item) runExport(item.dataset.export);
        });

        els.exp.addEventListener("keydown", function (e) {
            if (!exportOpen) {
                if ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.target.id === "rpExportBtn") {
                    e.preventDefault();
                    openExport();
                }
                return;
            }
            var items = Array.prototype.slice.call(els.exp.querySelectorAll(".rp-export-item"));
            var at = items.indexOf(document.activeElement);
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                var next = items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
                next.focus();
            } else if (e.key === "Tab") {
                closeExport(false);
            }
        });

        /* composedPath, since a click inside a popover may re-render the node it started on */
        document.addEventListener("click", function (e) {
            var path = e.composedPath();
            if (periodOpen && path.indexOf(els.period) === -1) closePeriod(false);
            if (exportOpen && path.indexOf(els.exp) === -1) closeExport(false);
            if (colsOpen && path.indexOf(els.cols) === -1) closeCols(false);
        });

        els.trend.addEventListener("click", function (e) {
            var metric = e.target.closest("[data-metric]");
            if (metric) return setMetric(metric.dataset.metric);
            var bar = e.target.closest(".rp-bar");
            if (bar) reveal(bar.dataset.id, true);
        });

        els.trend.addEventListener("keydown", function (e) {
            var bar = e.target.closest(".rp-bar");
            if (!bar) return;
            var by = { ArrowLeft: -1, ArrowRight: 1, Home: "first", End: "last" }[e.key];
            if (by == null) return;
            e.preventDefault();
            moveBar(bar, by);
        });

        /* The bar and its row light up together */
        els.trend.addEventListener("pointerover", function (e) {
            var bar = e.target.closest(".rp-bar");
            if (bar) hotRow(bar.dataset.id, true);
        });
        els.trend.addEventListener("pointerout", function (e) {
            var bar = e.target.closest(".rp-bar");
            if (bar && !bar.contains(e.relatedTarget)) hotRow(bar.dataset.id, false);
        });
        els.tbody.addEventListener("pointerover", function (e) {
            var tr = e.target.closest("tr.rp-row");
            if (tr) hotBar(tr.dataset.id, true);
        });
        els.tbody.addEventListener("pointerout", function (e) {
            var tr = e.target.closest("tr.rp-row");
            if (tr && !tr.contains(e.relatedTarget)) hotBar(tr.dataset.id, false);
        });

        els.thead.addEventListener("click", function (e) {
            if (e.target.closest(".resizer, .rp-info")) return;
            var th = e.target.closest("th[data-sort]");
            if (!th) return;

            var key = th.dataset.sort;
            if (state.sort.key === key) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
            else state.sort = { key: key, dir: "desc" };
            render();
        });

        els.tbody.addEventListener("click", function (e) {
            if (e.target.closest("[data-clear-filters]")) return setPeriod({ key: "all" });

            var holder = e.target.closest("tr");
            var id = holder && (holder.dataset.id || holder.dataset.detail);

            var actionBtn = e.target.closest("[data-action]");
            if (actionBtn) {
                e.preventDefault();
                return runAction(actionBtn.dataset.action, findRow(id));
            }

            var expandBtn = e.target.closest(".rp-expand-btn");
            if (expandBtn) return toggleRow(id);

            if (e.target.closest("a, button, input, select, label, .rp-detail")) return;

            var tr = e.target.closest("tr.rp-row");
            if (tr) toggleRow(tr.dataset.id);
        });

        els.pagination.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-page]");
            if (!btn || btn.disabled) return;
            state.page = Number(btn.dataset.page);
            render();
            var head = els.scroll.getBoundingClientRect().top;
            if (head < 0) els.scroll.scrollIntoView({ block: "start", behavior: still() ? "auto" : "smooth" });
        });

        els.pagination.addEventListener("change", function (e) {
            if (e.target.id !== "rpPerPage") return;
            state.perPage = Number(e.target.value);
            state.page = 1;
            render();
        });

        els.cols.addEventListener("click", function (e) {
            if (e.target.closest("#rpColumnsBtn")) {
                if (colsOpen) closeCols(false);
                else openCols();
                return;
            }
            if (e.target.closest("[data-cols-all]")) {
                focusFirstCheck();
                return setHidden([]);
            }
            if (e.target.closest("[data-cols-reset]")) {
                focusFirstCheck();
                return resetCols();
            }
        });

        els.cols.addEventListener("change", function (e) {
            var input = e.target.closest("input[data-col]");
            if (input) toggleColumn(input.dataset.col, input.checked);
        });

        els.cols.addEventListener("keydown", function (e) {
            if (!colsOpen && e.key === "ArrowDown" && e.target.id === "rpColumnsBtn") {
                e.preventDefault();
                openCols();
            }
        });

        /* Tabbing out closes it; a null target is focus lost to a button that just disabled itself */
        els.cols.addEventListener("focusout", function (e) {
            if (colsOpen && e.relatedTarget && !els.cols.contains(e.relatedTarget)) closeCols(false);
        });

        /* The shadow says columns have slid under the pinned period */
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
            syncMetricEdge();
            hideTip();
        });

        /* Scroll does not bubble, so the switch, re-rendered with the chart, is heard in the capture phase */
        els.trend.addEventListener(
            "scroll",
            function (e) {
                if (e.target.classList && e.target.classList.contains("rp-metric-switch")) syncMetricEdge();
            },
            true
        );

        /* Catches what resize does not: the sidebar animating, a scrollbar appearing */
        if (global.ResizeObserver) {
            new global.ResizeObserver(function () {
                fitColumns();
                syncDetailWidth();
            }).observe(els.scroll);
        }

        /* Escape closes the innermost thing first: whichever popover is open */
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            hideTip();
            if (colsOpen) return closeCols(true);
            if (exportOpen) return closeExport(true);
            if (periodOpen) return closePeriod(true);
        });

        /* A tap pins the tip, so it works where there is no hover */
        document.addEventListener("click", function (e) {
            var infoBtn = e.target.closest(".rp-info");
            if (infoBtn) {
                e.stopPropagation();
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

    /* ── Boot ────────────────────────────────────────────── */

    function init() {
        if (!document.getElementById("rp-productivity") || !RP.PRODUCTIVITY) return;

        var params = new URLSearchParams(global.location.search);

        /* The preview's resource is a freelancer; ?as=fulltimer shows the page a full-timer gets */
        if (params.get("as") === "fulltimer" && RP.FULLTIMER) {
            FT = RP.FULLTIMER;
            MODEL = {
                columns: FT_COLUMNS, cells: FT_CELL, metrics: FT_METRICS, totals: FT_TOTALS, defaultMetric: "net",
                main: netMarkup, side: payMarkup, storageKey: "rp_productivity_columns_fulltimer"
            };
            months = FT.months.map(monthRow);
            years = [];
        } else {
            MODEL = {
                columns: COLUMNS, cells: CELL, metrics: METRICS, totals: TOTALS, defaultMetric: "earnings",
                main: servicesMarkup, side: summaryMarkup, storageKey: "rp_productivity_columns"
            };
            months = RP.PRODUCTIVITY.map(monthRow);
            years = buildYears();
        }
        state.metric = MODEL.defaultMetric;

        els = {
            base: document.getElementById("rpBase"),
            view: document.getElementById("rpView"),
            period: document.getElementById("rpPeriod"),
            exp: document.getElementById("rpExport"),
            cols: document.getElementById("rpCols"),
            trend: document.getElementById("rpTrend"),
            totals: document.getElementById("rpTotals"),
            table: document.getElementById("new-customized-table"),
            colgroup: document.querySelector("#new-customized-table colgroup"),
            thead: document.querySelector("#new-customized-table thead tr"),
            tbody: document.querySelector("#new-customized-table tbody"),
            scroll: document.getElementById("scrollContainer"),
            pagination: document.getElementById("rpPagination"),
            tip: document.getElementById("rpTip")
        };

        if (params.get("view") === "yearly" && !FT) state.view = "yearly";
        state.period = readPeriodParam(params.get("period")) || state.period;
        if (metricDef(params.get("metric") || "")) state.metric = params.get("metric");

        /* productivity.html?month=2026-09 or ?year=2025 opens that period in its place in the list */
        var linked = null;
        if (/^\d{4}-\d{2}$/.test(params.get("month") || "") && findRow(params.get("month"))) {
            state.view = "monthly";
            linked = params.get("month");
            var range = periodRange(state.period);
            var m = findRow(linked);
            if (range && (m.from < range.start || m.from > range.end)) state.period = { key: "all" };
        } else if (!FT && /^\d{4}$/.test(params.get("year") || "") && findRow(params.get("year"))) {
            state.view = "yearly";
            linked = params.get("year");
        }

        renderExport();

        hiddenCols = loadHidden();
        renderCols();

        wire();
        render();
        if (linked) {
            listed = sortRows(inView());
            reveal(linked);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
