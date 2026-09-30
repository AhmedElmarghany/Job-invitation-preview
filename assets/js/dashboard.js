/* ============================================================
   DASHBOARD — dashboard.html
   The resource's home. What is open now comes from RP.JOBS, so it
   matches My Jobs; the history behind it (past months, lost bids,
   performance) from RP.DASHBOARD. The period switch, the tips and
   the chart hovers are the page's own; every link opens a real page.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;
    var D = RP.DASHBOARD;
    var LOCALE = "en-NZ";
    var HOUR = 3600 * 1000;
    var NOW = Date.now();
    var STORE = "rp_dashboard_period";
    var PERIODS = ["month", "quarter", "year", "all"];

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

    /* good: which direction of change is the better one, for the delta's colour */
    var STATS = [
        { key: "active", label: "Active jobs", icon: "circle-play", href: "jobs.html?tab=active", tip: "Jobs you are working on now, and the words in them." },
        { key: "completed", label: "Completed jobs", icon: "circle-check", href: "jobs.html?tab=completed", tip: "Jobs you delivered in this period, and the words in them.", good: "up" },
        { key: "lost", label: "Lost bids", icon: "bid", tip: "Bids you sent that went to another resource.", good: "down" },
        { key: "declined", label: "Declined jobs", icon: "circle-x", tip: "Invitations you turned down.", good: "down" }
    ];

    /* In the order money travels, lightest to darkest on the navy ramp */
    var STAGES = [
        { key: "waiting", label: "Waiting for files", note: "assigned, files not released" },
        { key: "progress", label: "In progress", note: "being worked on" },
        { key: "DL", label: "Delivered", note: "waiting for approval" },
        { key: "AP", label: "Approved", note: "not billed yet" },
        { key: "BL", label: "Billed", note: "waiting for payment" }
    ];

    var FEED = {
        invite: { icon: "invitations" },
        delivered: { icon: "send" },
        approved: { icon: "check-check" },
        paid: { icon: "hand-coins", tone: "paid" },
        lost: { icon: "bid", tone: "quiet" },
        declined: { icon: "circle-x", tone: "quiet" }
    };

    var state = { period: "month" };
    var shown = {};
    var els = {};
    var tipOwner = null;
    var tipPinned = false;
    var S = null;

    /* ── Formatting ──────────────────────────────────────── */

    function esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function money(value) {
        return value.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function num(value) {
        return Math.round(value).toLocaleString(LOCALE);
    }

    function compact(value) {
        return value >= 1000 ? (value / 1000).toLocaleString(LOCALE, { maximumFractionDigits: 1 }) + "k" : String(value);
    }

    function plural(n, one, many) {
        return n === 1 ? one : many;
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

    function span(ms) {
        var mins = Math.max(1, Math.round(ms / 60000));
        var days = Math.floor(mins / 1440);
        var hours = Math.floor((mins % 1440) / 60);
        if (days) return days + "d" + (hours ? " " + hours + "h" : "");
        if (hours) return hours + "h";
        return mins + "m";
    }

    function fmtDue(date) {
        return date.toLocaleDateString(LOCALE, { weekday: "short" }) + " " + date.getDate() + " " + date.toLocaleDateString(LOCALE, { month: "short" });
    }

    function ago(date) {
        var hours = Math.round((NOW - date) / HOUR);
        if (hours < 1) return "Just now";
        if (hours < 24) return hours + plural(hours, " hour ago", " hours ago");
        if (hours < 48) return "Yesterday";
        return Math.round(hours / 24) + " days ago";
    }

    function sum(list, pick) {
        return list.reduce(function (total, item) {
            return total + pick(item);
        }, 0);
    }

    /* ── What is open now ────────────────────────────────── */

    function units(rows) {
        var out = { words: 0, hours: 0, documents: 0, pages: 0, minutes: 0 };
        var key = { Words: "words", Hours: "hours", Documents: "documents", "Physical Pages": "pages", Minutes: "minutes" };
        rows.forEach(function (row) {
            out[key[row.count.unit]] += row.count.value;
        });
        return out;
    }

    /* The jobs a word count cannot hold, said once in the tip rather than on the tile */
    function unitsNote(u) {
        var parts = [];
        if (u.hours) parts.push(num(u.hours) + " hours");
        if (u.documents) parts.push(u.documents + " documents");
        if (u.pages) parts.push(u.pages + " pages");
        if (u.minutes) parts.push(u.minutes + " minutes of media");
        if (!parts.length) return "";
        var list = parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0];
        return " Also " + list + ", counted in their own units.";
    }

    function snapshot() {
        var tab = function (name) {
            return RP.JOBS.filter(function (job) {
                return job.tab === name;
            });
        };
        var completed = tab("completed");
        var status = function (code) {
            return completed.filter(function (job) {
                return job.status === code;
            });
        };
        return {
            active: tab("active"),
            waiting: tab("waiting"),
            completed: completed,
            stage: { waiting: tab("waiting"), progress: tab("active"), DL: status("DL"), AP: status("AP"), BL: status("BL") }
        };
    }

    function expected() {
        var stages = STAGES.map(function (s, i) {
            var rows = S.stage[s.key];
            return { label: s.label, note: s.note, count: rows.length, amount: sum(rows, function (r) { return r.amount; }), ramp: i + 1 };
        });
        return {
            stages: stages,
            total: sum(stages, function (s) { return s.amount; }),
            jobs: sum(stages, function (s) { return s.count; })
        };
    }

    /* ── One period's figures ────────────────────────────── */

    function monthsIn(period) {
        var n = D.monthly.length;
        var year = D.monthly[n - 1].month.getFullYear();
        return D.monthly
            .map(function (m, i) {
                return i;
            })
            .filter(function (i) {
                if (period === "month") return i === n - 1;
                if (period === "quarter") return i >= n - 3;
                if (period === "year") return D.monthly[i].month.getFullYear() === year;
                return true;
            });
    }

    function paidIn(indexes) {
        return sum(indexes, function (i) {
            return D.monthly[i].paid;
        });
    }

    function figures(period) {
        var P = D.periods[period];
        var n = D.monthly.length;
        var completed = P.completed || { jobs: S.completed.length, words: units(S.completed).words, note: unitsNote(units(S.completed)) };
        var prevPaid =
            period === "month" ? D.monthly[n - 2].paid
            : period === "quarter" ? paidIn([n - 6, n - 5, n - 4])
            : period === "year" ? D.paidLastYearToDate
            : null;
        return {
            label: P.label,
            vs: P.vs,
            prev: P.prev,
            completed: completed,
            lost: P.lost,
            declined: P.declined,
            paid: period === "all" ? D.paidAllTime : paidIn(monthsIn(period)),
            prevPaid: prevPaid
        };
    }

    /* Signed, against a named period; small counts read better as a difference than a percentage */
    function delta(now, before, good, asPercent) {
        if (before == null) return "";
        var diff = now - before;
        var dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
        var tone = dir === "flat" ? "" : dir === good ? " rp-delta--good" : " rp-delta--bad";
        var sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
        var text = asPercent || before >= 20
            ? sign + Math.abs(Math.round((diff / before) * 100)) + "%"
            : sign + Math.abs(diff);
        return (
            '<span class="rp-delta' + tone + '">' +
            (dir === "up" ? icon("trending-up") : dir === "down" ? icon("trending-down") : "") +
            text + "</span>"
        );
    }

    /* ── Shared pieces ───────────────────────────────────── */

    function info(text, label) {
        return (
            '<button type="button" class="rp-info" data-tip="' + esc(text) + '" aria-label="' + esc(label) + '" aria-expanded="false">' +
            icon("info") + "</button>"
        );
    }

    function cardHead(iconName, title, aside) {
        return '<div class="rp-card__head"><h2 class="rp-card__title">' + icon(iconName) + title + "</h2>" + (aside || "") + "</div>";
    }

    function counter(value, key, decimals) {
        return (
            '<span data-count="' + value + '" data-key="' + key + '"' + (decimals ? ' data-decimals="' + decimals + '"' : "") + ">" +
            (decimals ? money(value) : num(value)) + "</span>"
        );
    }

    /* ── Head ────────────────────────────────────────────── */

    function greeting() {
        var hour = new Date().getHours();
        return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    }

    function today() {
        var d = new Date();
        return d.toLocaleDateString(LOCALE, { weekday: "long" }) + " " + d.getDate() + " " + d.toLocaleDateString(LOCALE, { month: "long" }) + " " + d.getFullYear();
    }

    function headMarkup() {
        return (
            '<div class="rp-dashhead__inner"><div class="rp-dashhead__titles"><p class="rp-dashhead__date">' + today() + "</p>" +
            '<h1 class="rp-dashhead__title">' + greeting() + ", " + esc(RP.USER.firstName) + "</h1></div>" +
            '<div class="rp-segmented rp-period" role="group" aria-label="Period for completed jobs, bids and payments">' +
            PERIODS.map(function (p) {
                var on = p === state.period;
                return (
                    '<button type="button" class="rp-segment' + (on ? " is-active" : "") + '" data-period="' + p + '" aria-pressed="' + on + '">' +
                    D.periods[p].label + "</button>"
                );
            }).join("") +
            "</div></div>"
        );
    }

    /* ── Needs your attention ────────────────────────────── */

    function attentionMarkup() {
        var late = S.active.filter(function (job) {
            return job.deadline < NOW;
        });
        var soon = S.active.filter(function (job) {
            return job.deadline >= NOW && job.deadline - NOW <= 24 * HOUR;
        });
        var invites = RP.USER.invitationCount || 0;
        var terms = RP.PROFILE && RP.PROFILE.terms.state !== "agreed" ? RP.PROFILE.terms.state : null;
        var items = [];

        if (late.length) {
            items.push({
                tone: "danger", icon: "clock-alert",
                href: late.length === 1 ? "job.html?id=" + late[0].id : "jobs.html?tab=active",
                text: "<strong>" + late.length + plural(late.length, " job", " jobs") + "</strong> " + plural(late.length, "is", "are") + " overdue"
            });
        }
        if (soon.length) {
            items.push({
                tone: "warn", icon: "hourglass", href: "jobs.html?tab=active",
                text: "<strong>" + soon.length + plural(soon.length, " job", " jobs") + "</strong> due in the next 24 hours"
            });
        }
        if (invites) {
            items.push({
                icon: "invitations", href: "invitations.html",
                text: "<strong>" + invites + plural(invites, " invitation", " invitations") + "</strong> waiting for your answer"
            });
        }
        if (terms) {
            items.push({
                icon: "shield-check", href: "account.html#terms",
                text: "<strong>" + (terms === "updated" ? "Updated terms" : "Our terms") + "</strong> need your agreement"
            });
        }
        if (!items.length) return "";

        return (
            '<nav class="rp-attn" aria-label="Needs your attention">' +
            items
                .map(function (it) {
                    return (
                        '<a class="rp-attn__item' + (it.tone ? " rp-attn__item--" + it.tone : "") + '" href="' + it.href + '">' +
                        '<span class="rp-attn__icon" aria-hidden="true">' + icon(it.icon) + '</span><span class="rp-attn__text">' + it.text + "</span>" +
                        icon("chevron-right") + "</a>"
                    );
                })
                .join("") +
            "</nav>"
        );
    }

    /* ── Jobs ────────────────────────────────────────────── */

    function statMarkup(def, F) {
        var value, words, foot, tip = def.tip;

        if (def.key === "active") {
            var u = units(S.active);
            value = S.active.length;
            words = u.words;
            tip += unitsNote(u);
            foot = "<span>" + S.waiting.length + " more waiting for files</span>";
        } else {
            var f = F[def.key];
            value = f.jobs;
            words = f.words;
            if (f.note) tip += f.note;
            foot = F.prev ? delta(value, F.prev[def.key], def.good) + "<span>vs " + F.vs + "</span>" : "<span>Since " + esc(D.since) + "</span>";
        }

        var label = def.href ? '<a href="' + def.href + '">' + def.label + icon("arrow-right") + "</a>" : def.label;

        return (
            '<section class="rp-stat" id="stat-' + def.key + '" aria-labelledby="stat-' + def.key + '-label">' +
            '<div class="rp-stat__head"><span class="rp-stat__icon" aria-hidden="true">' + icon(def.icon) + "</span>" +
            '<h2 class="rp-stat__label" id="stat-' + def.key + '-label">' + label + "</h2>" +
            info(tip, "About " + def.label.toLowerCase()) +
            (def.key === "active" ? '<span class="rp-scope">Now</span>' : "") + "</div>" +
            '<p class="rp-stat__value">' + counter(value, def.key) + "</p>" +
            '<p class="rp-stat__words"><strong>' + counter(words, def.key + "-words") + "</strong> words</p>" +
            '<div class="rp-stat__foot">' + foot + "</div></section>"
        );
    }

    /* ── Revenue ─────────────────────────────────────────── */

    function moneyItem(o) {
        return (
            '<div class="rp-money__item"><p class="rp-money__label">' + o.label + info(o.tip, "About " + o.label.toLowerCase()) +
            (o.now ? '<span class="rp-scope">Now</span>' : "") + "</p>" +
            '<p class="rp-money__value">' + counter(o.amount, o.key, 2) + ' <span class="rp-money__unit">' + esc(RP.USER.currency) + "</span></p>" +
            '<p class="rp-money__sub">≈ ' + money(o.amount * RP.USD_RATE) + " USD</p>" +
            '<p class="rp-money__delta">' + o.foot + "</p></div>"
        );
    }

    function pipeline(exp) {
        var cur = esc(RP.USER.currency);
        return (
            '<p class="rp-section-label">Where the expected money is</p>' +
            /* The legend under it carries every value, so the bar itself stays out of the reading order */
            '<div class="rp-pipe__bar" aria-hidden="true">' +
            exp.stages
                .map(function (s) {
                    return (
                        '<span class="rp-pipe__seg" style="--seg: var(--ramp-' + s.ramp + "); flex-grow: " + s.amount.toFixed(2) + '" data-tip-value="' +
                        money(s.amount) + " " + cur + '" data-tip-label="' + esc(s.label + " · " + s.count + plural(s.count, " job", " jobs") + ", " + s.note) + '"></span>'
                    );
                })
                .join("") +
            '</div><ul class="rp-pipe__legend">' +
            exp.stages
                .map(function (s) {
                    return (
                        '<li><span class="rp-swatch" style="--seg: var(--ramp-' + s.ramp + ')" aria-hidden="true"></span><span class="rp-pipe__name">' + s.label +
                        '</span><span class="rp-pipe__amount">' + money(s.amount) + " <span class=\"rp-sr\">" + cur + "</span></span></li>"
                    );
                })
                .join("") +
            "</ul>"
        );
    }

    function niceMax(value) {
        var step = [250, 500, 1000, 2000, 2500, 5000, 10000].filter(function (s) {
            return s * 4 >= value;
        })[0] || Math.ceil(value / 4 / 10000) * 10000;
        return step * 4;
    }

    function chart() {
        var on = monthsIn(state.period);
        var max = niceMax(Math.max.apply(null, D.monthly.map(function (m) { return m.paid; })));
        var last = D.monthly.length - 1;
        var cur = esc(RP.USER.currency);
        var ticks = [0, 1, 2, 3, 4].map(function (i) {
            return (max / 4) * i;
        });
        var month = function (m, opts) {
            return m.month.toLocaleDateString(LOCALE, opts);
        };

        return (
            '<p class="rp-section-label">Paid per month<small>Last 12 months</small></p>' +
            '<div class="rp-chart"><div class="rp-chart__ticks" aria-hidden="true">' +
            ticks
                .map(function (t) {
                    return '<span class="rp-chart__tick" style="bottom:' + (t / max) * 100 + '%">' + (t ? compact(t) : "0") + "</span>";
                })
                .join("") +
            '</div><div class="rp-chart__plot" role="group" aria-label="Paid per month">' +
            ticks
                .slice(1)
                .map(function (t) {
                    return '<span class="rp-chart__grid" style="bottom:' + (t / max) * 100 + '%" aria-hidden="true"></span>';
                })
                .join("") +
            D.monthly
                .map(function (m, i) {
                    var name = month(m, { month: "long", year: "numeric" });
                    return (
                        '<button type="button" class="rp-chart__col' + (on.indexOf(i) !== -1 ? " is-on" : "") + '" tabindex="' + (i === last ? 0 : -1) +
                        '" data-tip-value="' + money(m.paid) + " " + cur + '" data-tip-label="' + esc(name) + ' · paid" aria-label="' + esc(name + ", " + money(m.paid) + " " + RP.USER.currency + " paid") +
                        '"><span class="rp-chart__bar" style="height:' + ((m.paid / max) * 100).toFixed(2) + '%">' +
                        (i === last ? '<span class="rp-chart__cap">' + compact(Math.round(m.paid)) + "</span>" : "") + "</span></button>"
                    );
                })
                .join("") +
            '</div><div class="rp-chart__months" aria-hidden="true">' +
            D.monthly
                .map(function (m) {
                    return "<span>" + month(m, { month: "short" }) + "</span>";
                })
                .join("") +
            "</div></div>" +
            '<table class="rp-sr"><caption>Paid per month, last 12 months</caption><thead><tr><th scope="col">Month</th><th scope="col">Paid (' + cur + ")</th></tr></thead><tbody>" +
            D.monthly
                .map(function (m) {
                    return "<tr><th scope=\"row\">" + month(m, { month: "long", year: "numeric" }) + "</th><td>" + money(m.paid) + "</td></tr>";
                })
                .join("") +
            "</tbody></table>"
        );
    }

    function revenueMarkup(F) {
        var exp = expected();
        return (
            '<section class="rp-card rp-revenue" id="revenue">' +
            cardHead("wallet", "Revenue", '<a class="rp-textbtn" href="earnings.html">Earnings' + icon("arrow-right") + "</a>") +
            '<div class="rp-card__body"><div class="rp-money">' +
            moneyItem({
                label: "Total paid", key: "paid", amount: F.paid,
                tip: "Payments made to you in this period, for bills that are settled.",
                foot: F.prevPaid != null ? delta(F.paid, F.prevPaid, "up", true) + "<span>vs " + F.vs + "</span>" : "<span>Since " + esc(D.since) + "</span>"
            }) +
            moneyItem({
                label: "Total expected", key: "expected", amount: exp.total, now: true,
                tip: "Money for work that is not paid yet — jobs waiting for files, in progress, delivered, approved and billed.",
                foot: "<span>" + exp.jobs + " jobs not paid yet</span>"
            }) +
            "</div>" + pipeline(exp) + chart() + "</div></section>"
        );
    }

    /* ── Performance ─────────────────────────────────────── */

    /* A metric with a target is judged against it; one without, by whether anything went wrong */
    function judge(m) {
        if (m.target != null) return m.value >= m.target ? "ok" : m.value >= m.target - 10 ? "warn" : "bad";
        return m.misses ? "warn" : "ok";
    }

    function perfMarkup() {
        var rows = D.performance.map(function (m) {
            var st = judge(m);
            var chip = st === "ok" ? icon("check") + "On track" : icon("warning") + (m.target != null ? "Below " + m.target + "%" : "Needs attention");
            return (
                '<li class="rp-meter' + (st === "ok" ? "" : " rp-meter--" + st) + '">' +
                '<div class="rp-meter__top"><h3 class="rp-meter__label" id="meter-' + m.key + '">' + m.label + "</h3>" +
                info(m.tip, "What " + m.label.toLowerCase() + " asks of you") +
                '<span class="rp-meter__value">' + m.value + "<small>%</small></span></div>" +
                '<div class="rp-meter__track" role="meter" aria-labelledby="meter-' + m.key + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + m.value + '"' +
                (m.target != null ? ' aria-valuetext="' + m.value + "%, target " + m.target + '%"' : "") + ">" +
                '<span class="rp-meter__fill" style="width:0" data-width="' + m.value + '"></span>' +
                (m.target != null ? '<span class="rp-meter__target" style="left:' + m.target + '%" aria-hidden="true"></span>' : "") + "</div>" +
                '<p class="rp-meter__note"><span>' + esc(m.evidence) + (m.target != null ? " · target " + m.target + "%" : "") + "</span>" +
                '<span class="rp-state rp-state--' + st + '">' + chip + "</span></p></li>"
            );
        });

        return (
            '<section class="rp-card rp-perf" id="performance">' +
            cardHead("gauge", "Performance", '<span class="rp-scope">Last 90 days</span>') +
            '<div class="rp-card__body"><ul class="rp-meters">' + rows.join("") + "</ul></div></section>"
        );
    }

    /* ── Due soon ────────────────────────────────────────── */

    function dueRow(job) {
        var left = job.deadline - NOW;
        var chip =
            left < 0 ? '<span class="rp-time rp-time--late">' + icon("clock-alert") + "Overdue " + span(-left) + "</span>"
            : left <= 24 * HOUR ? '<span class="rp-time rp-time--soon">' + icon("clock") + "Due in " + span(left) + "</span>"
            : '<span class="rp-time">' + icon("calendar") + fmtDue(job.deadline) + "</span>";
        var pair = job.source && job.target
            ? '<span class="rp-pair">' + esc(job.source) + icon("arrow-right") + esc(job.target) + "</span>"
            : "";

        return (
            '<li><a class="rp-duerow" href="job.html?id=' + job.id + '">' +
            '<span class="rp-duerow__icon" aria-hidden="true">' + icon(SERVICE_ICON[job.service] || "jobs") + "</span>" +
            '<span class="rp-duerow__text"><span class="rp-duerow__title">' + esc(job.project) + '</span><span class="rp-duerow__meta"><span class="rp-idchip">' +
            job.id + "</span>" + esc(job.service) + (pair ? dot() + pair : "") + "</span></span>" +
            chip +
            '<span class="rp-progress"><span class="rp-progress__bar" aria-hidden="true"><span style="width:' + job.progress + '%"></span></span><strong>' +
            job.progress + '%</strong><span class="rp-sr">done</span></span></a></li>'
        );
    }

    function dueMarkup() {
        var rows = S.active
            .slice()
            .sort(function (a, b) {
                return a.deadline - b.deadline;
            })
            .slice(0, 5);
        return (
            '<section class="rp-card rp-due" id="due">' +
            cardHead("clock", "Due soon", '<a class="rp-textbtn" href="jobs.html?tab=active">All active jobs' + icon("arrow-right") + "</a>") +
            '<div class="rp-card__body"><ul class="rp-duelist">' + rows.map(dueRow).join("") + "</ul></div></section>"
        );
    }

    /* ── Recent activity ─────────────────────────────────── */

    function feedLine(e) {
        var job = function (id) {
            return '<a href="job.html?id=' + id + '">' + id + "</a>";
        };
        if (e.type === "invite") return 'New invitation <a href="invitations.html">' + e.job + "</a>";
        if (e.type === "delivered") return "You delivered " + job(e.job);
        if (e.type === "approved") return job(e.job) + " was approved";
        if (e.type === "paid") return 'Bill <a href="earnings.html">' + e.bill + "</a> was paid · <strong>" + money(e.amount) + " " + esc(RP.USER.currency) + "</strong>";
        if (e.type === "lost") return "Your bid on " + e.job + " went to another resource";
        if (e.type === "declined") return "You declined " + e.job;
        return "";
    }

    function activityMarkup() {
        return (
            '<section class="rp-card rp-activity" id="activity">' + cardHead("history", "Recent activity") +
            '<div class="rp-card__body"><ol class="rp-feed">' +
            D.activity
                .map(function (e) {
                    var f = FEED[e.type];
                    return (
                        '<li class="rp-feed__item"><span class="rp-feed__icon' + (f.tone ? " rp-feed__icon--" + f.tone : "") + '" aria-hidden="true">' + icon(f.icon) + "</span>" +
                        '<div class="rp-feed__text"><p class="rp-feed__line">' + feedLine(e) + "</p>" +
                        (e.detail ? '<p class="rp-feed__detail">' + esc(e.detail) + "</p>" : "") +
                        '<time class="rp-feed__time" datetime="' + e.at.toISOString() + '">' + ago(e.at) + "</time></div></li>"
                    );
                })
                .join("") +
            "</ol></div></section>"
        );
    }

    /* ── Motion ──────────────────────────────────────────── */

    /* Each number counts from what it last showed, so a period change reads as a change */
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
                var k = Math.min(1, (t - start) / 700);
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
            }, 900);
        });
    }

    function fillMeters() {
        var meters = els.dash.querySelectorAll("[data-width]");
        var fill = function () {
            meters.forEach(function (el) {
                el.style.width = el.dataset.width + "%";
            });
        };
        if (still()) return fill();
        /* A beat at 0 first, so the transition has somewhere to start from */
        global.setTimeout(fill, 60);
    }

    /* ── Tooltip ─────────────────────────────────────────── */

    function showTip(owner, pinned) {
        if (tipOwner && tipOwner !== owner) hideTip();
        var tip = els.tip;
        tip.textContent = "";

        /* Values lead on a mark, the label follows; text goes in as text, never as markup */
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
        return node && node.closest ? node.closest("[data-tip], [data-tip-value]") : null;
    }

    /* ── Period ──────────────────────────────────────────── */

    function readPeriod() {
        var fromUrl = new URLSearchParams(global.location.search).get("period");
        if (PERIODS.indexOf(fromUrl) !== -1) return fromUrl;
        try {
            var stored = global.localStorage.getItem(STORE);
            if (PERIODS.indexOf(stored) !== -1) return stored;
        } catch (err) {
            /* storage is off; the default stands */
        }
        return "month";
    }

    function replace(id, markup) {
        var el = document.getElementById(id);
        if (!el) return null;
        el.outerHTML = markup;
        return document.getElementById(id);
    }

    function setPeriod(period) {
        if (period === state.period) return;
        state.period = period;
        hideTip();

        els.head.querySelectorAll("[data-period]").forEach(function (btn) {
            var on = btn.dataset.period === period;
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-pressed", String(on));
        });

        var F = figures(period);
        STATS.forEach(function (def) {
            if (def.key === "active") return;
            var el = replace("stat-" + def.key, statMarkup(def, F));
            if (el) countUp(el);
        });
        var revenue = replace("revenue", revenueMarkup(F));
        if (revenue) countUp(revenue);

        var url = new URL(global.location.href);
        url.searchParams.set("period", period);
        history.replaceState(null, "", url.toString());
        try {
            global.localStorage.setItem(STORE, period);
        } catch (err) {
            /* the choice just does not persist */
        }
    }

    /* ── Render ──────────────────────────────────────────── */

    function render() {
        var F = figures(state.period);
        els.head.innerHTML = headMarkup();
        els.dash.innerHTML =
            attentionMarkup() +
            STATS.map(function (def) {
                return statMarkup(def, F);
            }).join("") +
            revenueMarkup(F) +
            perfMarkup() +
            dueMarkup() +
            activityMarkup();
        countUp(els.dash);
        fillMeters();
    }

    /* ── Wiring ──────────────────────────────────────────── */

    /* One tab stop for the whole chart; the arrows walk its months */
    function chartKeys(e) {
        var col = e.target.closest(".rp-chart__col");
        if (!col || (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End")) return;
        var cols = Array.prototype.slice.call(col.parentNode.querySelectorAll(".rp-chart__col"));
        var i = cols.indexOf(col);
        var next = e.key === "Home" ? 0 : e.key === "End" ? cols.length - 1 : i + (e.key === "ArrowRight" ? 1 : -1);
        if (next < 0 || next >= cols.length) return;
        e.preventDefault();
        col.tabIndex = -1;
        cols[next].tabIndex = 0;
        cols[next].focus();
    }

    function wire() {
        document.addEventListener("click", function (e) {
            var period = e.target.closest("[data-period]");
            if (period) return setPeriod(period.dataset.period);

            /* A tap pins the tip, so it works where there is no hover */
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

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") return hideTip();
            chartKeys(e);
        });

        global.addEventListener("scroll", hideTip, { passive: true });
        global.addEventListener("resize", hideTip);
    }

    /* ── Boot ────────────────────────────────────────────── */

    function init() {
        els = {
            head: document.getElementById("rpDashHead"),
            dash: document.getElementById("rpDash"),
            tip: document.getElementById("rpTip")
        };
        if (!els.dash || !D) return;

        S = snapshot();
        state.period = readPeriod();
        render();
        wire();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(window);
