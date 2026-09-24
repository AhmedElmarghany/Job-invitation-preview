/* ============================================================
   AVAILABILITY — the topbar pill and its dropdown: status, the
   period it applies to, working days, working hours and a note.
   UI preview only: the logic is dummy and nothing is stored.
   Field names match the Django models (see README) so the form
   ports back with its names intact.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;

    /* Translator.WORK_STATUS_OPTIONS, with the descriptions from
       partials/_work_status_modal.html word for word. */
    var STATUS = {
        AV: { label: "Available", note: "You will be considered for new job invitations." },
        BS: { label: "Busy", note: "Working at capacity — fewer invitations will come your way." },
        NA: { label: "Not Available", note: "You will not be sent new job invitations at all." }
    };

    /* ResourceDailyWorkSchedule.DAYS, Monday first */
    var DAYS = [
        ["monday", "Mon", "Monday"],
        ["tuesday", "Tue", "Tuesday"],
        ["wednesday", "Wed", "Wednesday"],
        ["thursday", "Thu", "Thursday"],
        ["friday", "Fri", "Friday"],
        ["saturday", "Sat", "Saturday"],
        ["sunday", "Sun", "Sunday"]
    ];

    var DAY_SETS = {
        weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        weekends: ["saturday", "sunday"],
        everyday: DAYS.map(function (d) {
            return d[0];
        })
    };

    var PRESETS = [
        ["today", "Today"],
        ["tomorrow", "Tomorrow"],
        ["this-week", "This week"],
        ["next-week", "Next week"]
    ];

    /* A short fixed list is enough for the preview; the real one is Profile.TIMEZONES */
    var ZONES = [
        ["Pacific/Auckland", "Auckland (GMT+12)"],
        ["Australia/Sydney", "Sydney (GMT+10)"],
        ["Asia/Tokyo", "Tokyo (GMT+9)"],
        ["Asia/Shanghai", "Shanghai (GMT+8)"],
        ["Asia/Kolkata", "Kolkata (GMT+5:30)"],
        ["Asia/Dubai", "Dubai (GMT+4)"],
        ["Africa/Cairo", "Cairo (GMT+3)"],
        ["Europe/Paris", "Paris (GMT+2)"],
        ["Europe/London", "London (GMT+1)"],
        ["UTC", "UTC (GMT)"],
        ["America/New_York", "New York (GMT−4)"],
        ["America/Los_Angeles", "Los Angeles (GMT−7)"]
    ];

    var LOCALE = "en-NZ";

    /* ── Dates (local midnights) ─────────────────────────── */

    function today() {
        var n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), n.getDate());
    }

    function addDays(d, n) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    }

    function toISO(d) {
        return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    }

    function fromISO(v) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
        return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
    }

    /* getDay() counts from Sunday; the week here starts on Monday */
    function dayIndex(d) {
        return (d.getDay() + 6) % 7;
    }

    function isWorking(d, days) {
        return days.indexOf(DAYS[dayIndex(d)][0]) > -1;
    }

    function same(a, b) {
        return a.getTime() === b.getTime();
    }

    function presetRange(key) {
        var t = today();
        if (key === "tomorrow") return [addDays(t, 1), addDays(t, 1)];
        if (key === "this-week") return [t, addDays(t, 6 - dayIndex(t))];
        if (key === "next-week") {
            var mon = addDays(t, 7 - dayIndex(t));
            return [mon, addDays(mon, 6)];
        }
        return [t, t];
    }

    /* Same en-NZ wording as the invitations table ("25 Sept") */
    function fmtDay(d) {
        return (
            d.toLocaleDateString(LOCALE, { weekday: "short" }) +
            " " +
            d.getDate() +
            " " +
            d.toLocaleDateString(LOCALE, { month: "short" })
        );
    }

    function fmtTime(v) {
        var p = (v || "0:0").split(":");
        return new Date(2000, 0, 1, +p[0], +p[1]).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
    }

    function hoursBetween(start, end) {
        var s = start.split(":"), e = end.split(":");
        var mins = (+e[0] * 60 + +e[1] - (+s[0] * 60 + +s[1]) + 1440) % 1440;
        return Math.floor(mins / 60) + " h" + (mins % 60 ? " " + (mins % 60) + " min" : "");
    }

    /* ── Pill ────────────────────────────────────────────── */

    function pillInner(state) {
        var to = fromISO(state.to);
        var until = state.status !== "AV" && to && to > today() ? "until " + to.getDate() + " " + to.toLocaleDateString(LOCALE, { month: "short" }) : "";

        return (
            '<span class="rp-availability__dot"></span>' +
            '<span class="rp-availability__label">' +
            STATUS[state.status].label +
            (until ? ' <span class="rp-availability__until">' + until + "</span>" : "") +
            "</span>" +
            icon("chevron-down", "rp-availability__caret")
        );
    }

    /* ── Markup ──────────────────────────────────────────── */

    function head(id, title, aside) {
        return (
            '<div class="ws-section-head"><span class="ws-section-title" id="' +
            id +
            '">' +
            title +
            "</span>" +
            (aside || "") +
            "</div>"
        );
    }

    function dropdownMarkup() {
        var statuses = Object.keys(STATUS)
            .map(function (key) {
                return (
                    '<label class="ws-option ws-option--' +
                    key +
                    '"><input type="radio" name="work_status" value="' +
                    key +
                    '"><span class="ws-option-dot" aria-hidden="true"></span><span class="ws-option-name">' +
                    STATUS[key].label +
                    "</span></label>"
                );
            })
            .join("");

        var presets = PRESETS.map(function (p) {
            return '<button type="button" class="ws-preset" data-ws-period="' + p[0] + '" aria-pressed="false">' + p[1] + "</button>";
        }).join("");

        var quick =
            '<div class="ws-quick" role="group" aria-label="Quick picks">' +
            [["weekdays", "Weekdays"], ["weekends", "Weekends"], ["everyday", "Every day"]]
                .map(function (q) {
                    return '<button type="button" class="ws-quick-btn" data-ws-days="' + q[0] + '" aria-pressed="false">' + q[1] + "</button>";
                })
                .join("") +
            "</div>";

        var days = DAYS.map(function (d) {
            return (
                '<label class="ws-day" title="' +
                d[2] +
                '"><input type="checkbox" name="working_days" value="' +
                d[0] +
                '"><span class="ws-day-name">' +
                d[1] +
                "</span></label>"
            );
        }).join("");

        var zones = ZONES.map(function (z) {
            return '<option value="' + z[0] + '">' + z[1] + "</option>";
        }).join("");

        return (
            '<div class="ws-dropdown" id="WorkStatusDropdown" role="dialog" aria-labelledby="wsDropdownTitle" hidden>' +
            '<form class="ws-form" id="ChangeWorkStatusPost" method="post" novalidate>' +
            '<div class="ws-scroll">' +
            '<div class="ws-dropdown-head">' +
            '<h2 class="ws-dropdown-title" id="wsDropdownTitle">Update availability</h2>' +
            '<p class="ws-dropdown-hint">This is what project managers see when they are looking for a resource.</p>' +
            "</div>" +
            '<div class="ws-dropdown-body">' +
            /* Status */
            '<div class="ws-section">' +
            head("wsStatusTitle", "Status") +
            '<div class="ws-options" role="radiogroup" aria-labelledby="wsStatusTitle" aria-describedby="wsStatusDesc">' +
            statuses +
            "</div>" +
            '<p class="ws-status-desc" id="wsStatusDesc"></p>' +
            "</div>" +
            /* Period */
            '<div class="ws-section" role="group" aria-labelledby="wsPeriodTitle">' +
            head("wsPeriodTitle", "Period", '<span class="ws-section-aside" id="wsPeriodLength"></span>') +
            '<div class="ws-presets" role="group" aria-label="Quick periods">' +
            presets +
            "</div>" +
            '<div class="ws-range">' +
            '<label class="ws-date"><span class="ws-date-label">From</span><input type="date" name="work_status_from"></label>' +
            '<span class="ws-range-arrow" aria-hidden="true">' +
            icon("arrow-right") +
            "</span>" +
            '<label class="ws-date"><span class="ws-date-label">To</span><input type="date" name="work_status_to"></label>' +
            "</div>" +
            "</div>" +
            /* Working days + the period drawn under them */
            '<div class="ws-section" role="group" aria-labelledby="wsDaysTitle">' +
            head("wsDaysTitle", "Working days", quick) +
            '<div class="ws-week">' +
            '<div class="ws-days">' +
            days +
            "</div>" +
            '<div class="ws-cal" id="wsCal" aria-hidden="true"></div>' +
            "</div>" +
            "</div>" +
            /* Working hours */
            '<div class="ws-section" role="group" aria-labelledby="wsHoursTitle">' +
            head(
                "wsHoursTitle",
                "Working hours",
                '<label class="ws-tz"><span class="rp-sr-only">Time zone</span>' +
                    icon("globe", "ws-tz-globe") +
                    '<select class="ws-tz-select" name="timezone">' +
                    zones +
                    "</select>" +
                    icon("chevron-down", "ws-tz-caret") +
                    "</label>"
            ) +
            '<div class="ws-hours">' +
            '<input class="ws-input ws-time" type="time" name="start_time" step="900" aria-label="Start time">' +
            '<span class="ws-hours-dash" aria-hidden="true">–</span>' +
            '<input class="ws-input ws-time" type="time" name="end_time" step="900" aria-label="End time">' +
            '<span class="ws-hours-total" id="wsHoursTotal"></span>' +
            "</div>" +
            '<p class="ws-help">In your own time zone — project managers see these hours in theirs.</p>' +
            "</div>" +
            /* Note */
            '<label class="ws-field">' +
            '<span class="ws-field-label">Note <span class="ws-optional">(optional)</span></span>' +
            '<input class="ws-input" type="text" name="work_status_description" maxlength="255" placeholder="e.g. Only short jobs this week" autocomplete="off">' +
            "</label>" +
            "</div>" +
            "</div>" +
            '<div class="ws-summary" id="wsSummary" aria-live="polite"></div>' +
            '<div class="ws-dropdown-foot">' +
            '<button type="button" class="ws-btn ws-btn--ghost" data-ws-cancel>Cancel</button>' +
            '<button type="submit" class="ws-btn ws-btn--primary" id="submit_change_status">Save</button>' +
            "</div>" +
            "</form>" +
            "</div>"
        );
    }

    function markup(user) {
        var state = user.availability;
        return (
            '<div class="rp-av" id="rpAv">' +
            '<button class="rp-availability rp-availability--' +
            state.status +
            '" id="rpAvailabilityBtn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="WorkStatusDropdown" title="Change your availability">' +
            pillInner(state) +
            "</button>" +
            dropdownMarkup() +
            "</div>"
        );
    }

    /* ── Preview + summary (dummy logic) ─────────────────── */

    function calendar(d, from, to) {
        var t = today();
        var cursor = addDays(from, -dayIndex(from));
        var end = addDays(to, 6 - dayIndex(to));
        var html = "";
        var weeks = 0;

        while (cursor <= end && weeks < 5) {
            html += '<div class="ws-cal-week">';
            for (var i = 0; i < 7; i++) {
                var inside = cursor >= from && cursor <= to;
                var cls = inside ? (isWorking(cursor, d.days) ? " is-applied" : " is-off") : "";
                html +=
                    '<span class="ws-cal-day' +
                    cls +
                    (same(cursor, t) ? " is-today" : "") +
                    '">' +
                    cursor.getDate() +
                    (cursor.getDate() === 1 ? "<small>" + cursor.toLocaleDateString(LOCALE, { month: "short" }) + "</small>" : "") +
                    "</span>";
                cursor = addDays(cursor, 1);
            }
            html += "</div>";
            weeks++;
        }

        var off = html.indexOf("is-off") > -1;
        var more = cursor <= end;
        if (off || more) {
            html +=
                '<div class="ws-cal-foot"><span>' +
                (more ? "…continues until " + fmtDay(to) : "") +
                "</span>" +
                (off ? '<span class="ws-cal-key">Day off</span>' : "") +
                "</div>";
        }
        return html;
    }

    function summary(d, from, to) {
        var applied = [];
        for (var x = from; x <= to; x = addDays(x, 1)) {
            if (isWorking(x, d.days)) applied.push(x);
        }

        if (!applied.length) {
            return {
                ok: false,
                html:
                    '<span class="ws-summary-icon" aria-hidden="true">' +
                    icon("warning") +
                    '</span><div class="ws-summary-text"><p class="ws-summary-main">' +
                    (d.days.length ? "None of these days is a working day" : "Pick at least one working day") +
                    '</p><p class="ws-summary-sub">Add a working day above to apply your status.</p></div>'
            };
        }

        var label = STATUS[d.status].label;
        var first = applied[0];
        var last = applied[applied.length - 1];
        var when =
            applied.length === 1
                ? same(first, today())
                    ? "today"
                    : "on " + fmtDay(first)
                : "on " + applied.length + " working days";

        var lines = [];
        var sameMonth = first.getMonth() === last.getMonth();
        var range =
            applied.length > 1
                ? (sameMonth ? fmtDay(first).replace(/ \S+$/, "") : fmtDay(first)) + " – " + fmtDay(last)
                : "";
        var hours = d.status === "NA" ? "" : fmtTime(d.start) + " – " + fmtTime(d.end);
        if (range || hours) lines.push([range, hours].filter(Boolean).join(" · "));
        if (d.status !== "AV") {
            var back = addDays(to, 1);
            while (!isWorking(back, d.days)) back = addDays(back, 1);
            lines.push("Back to Available on " + fmtDay(back));
        }

        return {
            ok: true,
            text: label + " " + when,
            html:
                '<span class="ws-summary-dot" aria-hidden="true"></span><div class="ws-summary-text">' +
                '<p class="ws-summary-main"><strong>' +
                label +
                "</strong> " +
                when +
                "</p>" +
                lines
                    .map(function (l) {
                        return '<p class="ws-summary-sub">' + l + "</p>";
                    })
                    .join("") +
                "</div>"
        };
    }

    /* ── Behaviour ───────────────────────────────────────── */

    function wire() {
        var saved = RP.USER.availability;
        var wrap = document.getElementById("rpAv");
        var btn = document.getElementById("rpAvailabilityBtn");
        var dropdown = document.getElementById("WorkStatusDropdown");
        var form = document.getElementById("ChangeWorkStatusPost");
        var f = form.elements;
        var dayInputs = form.querySelectorAll('input[name="working_days"]');

        function read() {
            var checked = form.querySelector('input[name="work_status"]:checked');
            return {
                status: checked ? checked.value : "AV",
                from: f.work_status_from.value,
                to: f.work_status_to.value,
                days: Array.prototype.filter
                    .call(dayInputs, function (i) {
                        return i.checked;
                    })
                    .map(function (i) {
                        return i.value;
                    }),
                start: f.start_time.value || "09:00",
                end: f.end_time.value || "17:00",
                timezone: f.timezone.value,
                note: f.work_status_description.value
            };
        }

        function setRange(r) {
            f.work_status_from.value = toISO(r[0]);
            f.work_status_to.value = toISO(r[1]);
        }

        function setDays(keys) {
            dayInputs.forEach(function (i) {
                i.checked = keys.indexOf(i.value) > -1;
            });
        }

        function render() {
            var d = read();
            var from = fromISO(d.from) || today();
            var to = fromISO(d.to) || from;
            if (to < from) {
                to = from;
                f.work_status_to.value = toISO(to);
            }

            dropdown.className = "ws-dropdown ws-tone--" + d.status;
            document.getElementById("wsStatusDesc").textContent = STATUS[d.status].note;

            form.querySelectorAll("[data-ws-period]").forEach(function (b) {
                var r = presetRange(b.dataset.wsPeriod);
                b.setAttribute("aria-pressed", String(same(r[0], from) && same(r[1], to)));
            });
            var length = Math.round((to - from) / 864e5) + 1;
            document.getElementById("wsPeriodLength").textContent = length + (length === 1 ? " day" : " days");
            f.work_status_from.min = toISO(today());
            f.work_status_to.min = toISO(from);

            form.querySelectorAll("[data-ws-days]").forEach(function (b) {
                b.setAttribute("aria-pressed", String(DAY_SETS[b.dataset.wsDays].join() === d.days.join()));
            });

            document.getElementById("wsCal").innerHTML = calendar(d, from, to);
            document.getElementById("wsHoursTotal").textContent = hoursBetween(d.start, d.end) + " a day";

            var s = summary(d, from, to);
            var box = document.getElementById("wsSummary");
            box.classList.toggle("is-warning", !s.ok);
            box.innerHTML = s.html;
            document.getElementById("submit_change_status").disabled = !s.ok;
            return s;
        }

        /* Every open starts from the last saved state, so Cancel never leaves a stale pick */
        function open() {
            form.querySelector('input[value="' + saved.status + '"]').checked = true;
            var from = fromISO(saved.from);
            setRange(from && from >= today() ? [from, fromISO(saved.to)] : presetRange("today"));
            setDays(saved.days);
            f.start_time.value = saved.start;
            f.end_time.value = saved.end;
            f.timezone.value = saved.timezone || "Pacific/Auckland";
            f.work_status_description.value = saved.note;
            render();

            dropdown.hidden = false;
            wrap.classList.add("is-open");
            btn.setAttribute("aria-expanded", "true");
            form.querySelector(".ws-scroll").scrollTop = 0;
            /* Scroll inside the panel rather than past the bottom of a short screen */
            dropdown.style.setProperty(
                "--ws-max-h",
                Math.max(320, global.innerHeight - dropdown.getBoundingClientRect().top - 12) + "px"
            );
            form.querySelector('input[name="work_status"]:checked').focus({ preventScroll: true });
        }

        function close(returnFocus) {
            if (dropdown.hidden) return;
            dropdown.hidden = true;
            wrap.classList.remove("is-open");
            btn.setAttribute("aria-expanded", "false");
            if (returnFocus) btn.focus();
        }

        btn.addEventListener("click", function () {
            if (dropdown.hidden) open();
            else close(false);
        });

        form.addEventListener("click", function (e) {
            var preset = e.target.closest("[data-ws-period]");
            var quick = e.target.closest("[data-ws-days]");
            if (preset) setRange(presetRange(preset.dataset.wsPeriod));
            else if (quick) setDays(DAY_SETS[quick.dataset.wsDays]);
            else if (e.target.closest("[data-ws-cancel]")) return close(true);
            else return;
            render();
        });

        form.addEventListener("change", render);

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var s = render();
            if (!s.ok) return;
            saved = RP.USER.availability = read();
            btn.className = "rp-availability rp-availability--" + saved.status;
            btn.innerHTML = pillInner(saved);
            close(true);
            RP.toast("Availability saved — " + s.text + ".", "success");
        });

        /* Capture phase: the profile trigger stops propagation, and opening
           that menu must still close this one. */
        document.addEventListener(
            "click",
            function (e) {
                if (!wrap.contains(e.target)) close(false);
            },
            true
        );

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !dropdown.hidden) close(true);
        });
    }

    RP.AVAILABILITY = STATUS;
    RP.availability = { markup: markup, wire: wire };
})(window);
