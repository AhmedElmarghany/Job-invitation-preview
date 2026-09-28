/* ============================================================
   SINGLE JOB — job.html?id=J-47990
   One accepted job, rendered from its RP.JOBS row plus
   RP.jobDetail(). Start job and Deliver move the page through the
   real statuses in memory; every other control only says what it
   would have done. Nothing is sent anywhere.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;
    var LOCALE = "en-NZ";
    var HOUR = 3600 * 1000;

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

    /* Before delivery the pills are this page's own; from delivery on they are the table's */
    var OPEN_STATUS = {
        AS: { label: "Assigned", pill: "status-new" },
        WAIT: { label: "Waiting for files", pill: "status-pending" },
        PR: { label: "In progress", pill: "status-inProgress" },
        OV: { label: "Overdue", pill: "status-overdue" }
    };

    var MONEY_STATUS = { DL: "delivered", AP: "approved", BL: "billed", ST: "settled" };
    var STAGE = { AS: 0, PR: 1, OV: 1, DL: 2, AP: 3, BL: 4, ST: 5 };

    var FILE_ICON = {
        source: "file", original: "file", brief: "file", reference: "file",
        template: "layout-template", pretranslated: "bot", ai: "sparkles", delivered: "file-check"
    };

    var COUNT_LABEL = {
        Words: "Word count", Hours: "Duration", Documents: "Documents",
        Minutes: "Media length", "Physical Pages": "Page count"
    };

    var RTL = { Arabic: true, Farsi: true, Urdu: true, Dari: true };

    var job = null;
    var d = null;
    var picked = null;
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

    function money(value) {
        return value.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function number(value) {
        return value.toLocaleString(LOCALE);
    }

    function fmtDate(date) {
        return date.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
    }

    function fmtShort(date) {
        return date.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
    }

    /* Composed by hand: en-NZ puts a comma after the weekday, and a time follows */
    function fmtDay(date) {
        return (
            date.toLocaleDateString(LOCALE, { weekday: "short" }) +
            " " +
            date.getDate() +
            " " +
            date.toLocaleDateString(LOCALE, { month: "short" })
        );
    }

    function fmtTime(date) {
        return date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
    }

    function span(ms) {
        var mins = Math.max(1, Math.round(Math.abs(ms) / 60000));
        var days = Math.floor(mins / 1440);
        var hours = Math.floor((mins % 1440) / 60);
        if (days) return days + "d" + (hours ? " " + hours + "h" : "");
        if (hours) return hours + "h" + (mins % 60 ? " " + (mins % 60) + "m" : "");
        return mins + "m";
    }

    function tzName(date) {
        try {
            var part = new Intl.DateTimeFormat(LOCALE, { timeZoneName: "short" })
                .formatToParts(date)
                .filter(function (p) {
                    return p.type === "timeZoneName";
                })[0];
            return part ? part.value : "";
        } catch (err) {
            return "";
        }
    }

    function bytes(size) {
        return size >= 1e6 ? (size / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1e3)) + " KB";
    }

    function initials(name) {
        return name
            .split(" ")
            .map(function (part) {
                return part.charAt(0);
            })
            .slice(0, 2)
            .join("");
    }

    function first(name) {
        return name.split(" ")[0];
    }

    function dot() {
        return '<span class="rp-dot" aria-hidden="true"></span>';
    }

    function pair() {
        if (!job.source || !job.target) return "Not language based";
        return '<span class="rp-pair">' + esc(job.source) + icon("arrow-right") + esc(job.target) + "</span>";
    }

    function rateText() {
        var decimals = d.unit === "word" ? 3 : 2;
        return (
            RP.USER.currency +
            " " +
            d.rate.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) +
            " / " +
            d.unit
        );
    }

    /* ── State helpers ───────────────────────────────────── */

    function isOpen() {
        return job.status === "AS" || job.status === "PR" || job.status === "OV";
    }

    function isWorking() {
        return job.status === "PR" || job.status === "OV";
    }

    function statusMeta() {
        if (MONEY_STATUS[job.status]) return RP.JOB_STATUS[MONEY_STATUS[job.status]];
        return OPEN_STATUS[job.jobReady ? job.status : "WAIT"];
    }

    function pill(meta, extra) {
        return (
            '<span class="status-pill ' +
            meta.pill +
            (extra ? " " + extra : "") +
            '"><span class="status-dot"></span><span class="status-text">' +
            meta.label +
            "</span></span>"
        );
    }

    function allFiles() {
        return d.files.work.concat(d.files.reference);
    }

    function findFile(ref) {
        var parts = String(ref).split(":");
        if (parts[0] === "delivered") return deliveredAsFile(Number(parts[1]));
        return d.files[parts[0]][Number(parts[1])];
    }

    function deliveredAsFile(index) {
        var file = d.delivered[index];
        return { kind: "delivered", name: file.name, size: file.size, tag: "Delivered" };
    }

    function workFile() {
        return d.files.work.filter(function (f) {
            return f.kind === "source" || f.kind === "brief";
        })[0];
    }

    function templates() {
        return d.files.work.filter(function (f) {
            return f.kind === "template";
        });
    }

    function answeredCount() {
        return d.checklist.filter(function (row) {
            return !!row.answer;
        }).length;
    }

    /* ── Head ────────────────────────────────────────────── */

    function headMarkup() {
        var tab = RP.JOB_TABS.filter(function (t) {
            return t.key === job.tab;
        })[0];

        return (
            '<div class="rp-jobhead__inner">' +
            '<nav class="rp-crumbs" aria-label="Breadcrumb">' +
            '<a href="jobs.html">Jobs</a>' +
            icon("chevron-right") +
            '<a href="jobs.html?tab=' +
            job.tab +
            '">' +
            tab.label +
            "</a>" +
            icon("chevron-right") +
            '<span aria-current="page">' +
            job.id +
            "</span></nav>" +
            '<div class="rp-jobhead__row">' +
            '<span class="rp-jobhead__mark">' +
            icon(SERVICE_ICON[job.service] || "jobs") +
            "</span>" +
            '<div class="rp-jobhead__titles">' +
            '<h1 class="rp-jobhead__title">' +
            esc(job.project) +
            "</h1>" +
            '<p class="rp-jobhead__meta"><span class="rp-idchip">' +
            job.id +
            "</span>" +
            esc(job.service) +
            dot() +
            pair() +
            dot() +
            esc(job.specialty) +
            "</p></div>" +
            pill(statusMeta(), "rp-jobhead__status") +
            "</div></div>"
        );
    }

    /* ── Section tabs ────────────────────────────────────── */

    function sectionList() {
        return [
            { id: "overview", label: "Overview", icon: "info" },
            d.pmNote || d.customerNote ? { id: "instructions", label: "Instructions", icon: "list-todo" } : null,
            { id: "files", label: "Files", icon: "folder", count: allFiles().length },
            d.glossaries.length ? { id: "glossaries", label: "Glossaries", icon: "book-marked", count: d.glossaries.length } : null,
            { id: "delivery", label: "Delivery", icon: "upload" },
            { id: "chat", label: "Chat", icon: "messages", count: d.chat.length }
        ].filter(Boolean);
    }

    function tabsMarkup(activeId) {
        return sectionList()
            .map(function (s) {
                return (
                    '<a class="navigation-tabs-link' +
                    (s.id === activeId ? " active" : "") +
                    '" href="#' +
                    s.id +
                    '" data-section="' +
                    s.id +
                    '"' +
                    (s.id === activeId ? ' aria-current="true"' : "") +
                    '><span class="navigation-tabs-icon">' +
                    icon(s.icon) +
                    "</span>" +
                    s.label +
                    (s.count ? '<span class="navigation-tabs-badge">' + s.count + "</span>" : "") +
                    "</a>"
                );
            })
            .join("");
    }

    /* ── Cards ───────────────────────────────────────────── */

    function cardHead(iconName, title, count, aside) {
        return (
            '<div class="rp-card__head"><h2 class="rp-card__title">' +
            icon(iconName) +
            title +
            // (count ? '<span class="rp-card__count">' + count + "</span>" : "") +
            "</h2>" +
            (aside || "") +
            "</div>"
        );
    }

    function stepsMarkup() {
        var stage = STAGE[job.status];
        var pm = first(job.pm.name);
        var steps = [
            { label: "Assigned", sub: job.jobReady ? "Accepted " + fmtShort(job.acceptedAt) : "Waiting for files" },
            { label: "In progress", sub: d.startedAt ? "Started " + fmtShort(d.startedAt) : "Not started" },
            { label: "Delivered", sub: job.deliveredAt ? fmtShort(job.deliveredAt) : "Due " + fmtShort(job.deadline) },
            { label: "Approved", sub: d.approvedAt ? fmtShort(d.approvedAt) : "By " + pm },
            { label: "Billed", sub: d.billedAt ? fmtShort(d.billedAt) : "On approval" },
            { label: "Settled", sub: d.settledAt ? "Paid " + fmtShort(d.settledAt) : "Next pay run" }
        ];

        if (job.status === "OV") steps[1].sub = "Overdue by " + span(Date.now() - job.deadline);

        return (
            '<ol class="rp-steps" aria-label="Job progress">' +
            steps
                .map(function (step, i) {
                    /* Settled is the end of the run, so it reads as done rather than current */
                    var done = i < stage || job.status === "ST";
                    var current = i === stage && !done;
                    var cls = done ? " is-done" : current ? " is-current" : "";
                    if (current && job.status === "OV") cls += " is-danger";
                    if (current && !job.jobReady) cls += " is-waiting";

                    return (
                        '<li class="rp-step' +
                        cls +
                        '"' +
                        (current ? ' aria-current="step"' : "") +
                        '><span class="rp-step__dot">' +
                        (done ? icon("check") : "") +
                        '</span><span class="rp-step__text"><span class="rp-step__label">' +
                        step.label +
                        '</span><span class="rp-step__sub">' +
                        step.sub +
                        "</span></span></li>"
                    );
                })
                .join("") +
            "</ol>"
        );
    }

    function fact(label, value, hint, wide) {
        if (value == null || value === "") return "";
        return (
            "<div" +
            (wide ? ' class="rp-kv__wide"' : "") +
            "><dt>" +
            label +
            "</dt><dd>" +
            value +
            (hint ? '<span class="rp-kv__hint">' + hint + "</span>" : "") +
            "</dd></div>"
        );
    }

    function factsMarkup() {
        var prev = d.previous;
        var workflow = prev
            ? fact(
                  "Workflow",
                  "After " + esc(prev.service) + " · " + prev.id,
                  prev.delivered ? "Delivered by " + esc(prev.resource) : "Not delivered yet — " + esc(prev.resource)
              )
            : "";

        return (
            '<dl class="rp-kv">' +
            fact("Service", esc(job.service)) +
            fact("Languages", pair()) +
            fact(COUNT_LABEL[job.count.unit] || "Count", number(job.count.value) + " " + job.count.unit) +
            fact("Specialty", esc(job.specialty)) +
            fact("Document format", d.format) +
            (job.service === "Interpreting"
                ? ""
                : fact(
                      "CAT tool",
                      d.cat ? "Matecat" : "Not used",
                      d.cat ? "Work online — it opens in a new tab" : "Download the files and work offline"
                  )) +
            workflow +
            "</dl>"
        );
    }

    function overviewCard() {
        return (
            '<section class="rp-card" id="overview">' +
            cardHead("info", "Overview") +
            '<div class="rp-card__body">' +
            stepsMarkup() +
            '<div class="rp-card__divider"></div>' +
            factsMarkup() +
            "</div></section>"
        );
    }

    function instructionsCard() {
        if (!d.pmNote && !d.customerNote) return "";

        return (
            '<section class="rp-card" id="instructions">' +
            cardHead("list-todo", "Instructions") +
            '<div class="rp-card__body">' +
            (d.pmNote
                ? '<div class="rp-instr"><span class="rp-avatar">' +
                  initials(job.pm.name) +
                  '</span><div><p class="rp-instr__who">From <strong>' +
                  esc(job.pm.name) +
                  '</strong>, your project manager</p><p class="rp-instr__text">' +
                  esc(d.pmNote) +
                  "</p></div></div>"
                : "") +
            (d.customerNote
                ? '<div class="rp-instr"><span class="rp-avatar rp-avatar--muted">' +
                  icon("building") +
                  '</span><div><p class="rp-instr__who">From <strong>the customer</strong></p><p class="rp-instr__text">' +
                  esc(d.customerNote) +
                  "</p></div></div>"
                : "") +
            "</div></section>"
        );
    }

    function fileItem(file, ref, extraHint) {
        var cls =
            "rp-fileitem" +
            (file.kind === "template" ? " rp-fileitem--template" : "") +
            (file.locked ? " rp-fileitem--locked" : "");
        var hint = extraHint || file.hint;
        var actions;

        if (file.locked) {
            actions = '<span class="rp-lockchip">' + icon("lock") + "Locked</span>";
        } else if (file.ai && file.ai.status !== "completed") {
            actions =
                '<span class="rp-genbar" title="The AI translation is still being generated">' +
                '<span class="rp-bar"><span style="width:' +
                file.ai.progress +
                '%"></span></span>' +
                file.ai.progress +
                "%</span>";
        } else {
            actions =
                '<button class="rp-chipbtn" type="button" data-act="view" data-file="' +
                ref +
                '">' +
                icon(file.kind === "ai" ? "columns-2" : "view") +
                (file.kind === "ai" ? "Compare" : "View") +
                '</button><button class="rp-iconbtn" type="button" data-act="download" data-file="' +
                ref +
                '" aria-label="Download ' +
                esc(file.name) +
                '">' +
                icon("download") +
                "</button>";
        }

        return (
            '<li class="' +
            cls +
            '"><span class="rp-fileitem__icon">' +
            icon(file.locked ? "lock" : FILE_ICON[file.kind] || "file") +
            '</span><span class="rp-fileitem__text"><span class="rp-fileitem__name" title="' +
            esc(file.name) +
            '">' +
            esc(file.name) +
            "</span>" +
            (hint ? '<span class="rp-fileitem__hint">' + esc(hint) + "</span>" : "") +
            '</span><span class="rp-fileitem__tag">' +
            esc(file.tag) +
            "</span>" +
            (file.size ? '<span class="rp-fileitem__size">' + file.size + "</span>" : "") +
            '<span class="rp-fileitem__actions">' +
            actions +
            "</span></li>"
        );
    }

    function fileGroup(label, list, key) {
        if (!list.length) return "";
        return (
            '<div class="rp-group"><h3 class="rp-group__label">' +
            label +
            '</h3><ul class="rp-filelist">' +
            list
                .map(function (file, i) {
                    return fileItem(file, key + ":" + i);
                })
                .join("") +
            "</ul></div>"
        );
    }

    function filesCard() {
        var ready = allFiles().filter(function (f) {
            return !f.locked && !(f.ai && f.ai.status !== "completed");
        }).length;

        return (
            '<section class="rp-card" id="files">' +
            cardHead(
                "folder",
                "Files",
                allFiles().length,
                '<button class="rp-textbtn" type="button" data-act="download-all"' +
                    (ready ? "" : " disabled") +
                    ">" +
                    icon("download") +
                    "Download all</button>"
            ) +
            '<div class="rp-card__body">' +
            fileGroup("To work on", d.files.work, "work") +
            fileGroup("For reference", d.files.reference, "reference") +
            "</div></section>"
        );
    }

    function glossariesCard() {
        if (!d.glossaries.length) return "";

        return (
            '<section class="rp-card" id="glossaries">' +
            cardHead("book-marked", "Glossaries", d.glossaries.length) +
            '<div class="rp-card__body"><ul class="rp-glosslist">' +
            d.glossaries
                .map(function (g) {
                    return (
                        '<li class="rp-gloss"><span class="rp-gloss__icon">' +
                        icon("book-marked") +
                        '</span><div class="rp-gloss__text"><p class="rp-gloss__name">' +
                        esc(g.name) +
                        '<span class="rp-idchip" title="Glossary ID">#' +
                        g.id +
                        '</span></p><p class="rp-gloss__meta"><span>' +
                        (g.client ? g.privacy + " · " + esc(g.client) : g.privacy) +
                        "</span>" +
                        dot() +
                        "<span>" +
                        g.terms +
                        " terms</span>" +
                        dot() +
                        '<span class="rp-langchip">' +
                        esc(job.source) +
                        icon("arrow-right") +
                        esc(job.target) +
                        '</span></p><p class="rp-gloss__note">' +
                        esc(g.note) +
                        '</p></div><span class="rp-fileitem__actions">' +
                        '<button class="rp-chipbtn" type="button" data-act="glossary" data-name="' +
                        esc(g.name) +
                        '">' +
                        icon("view") +
                        "View terms</button>" +
                        '<button class="rp-iconbtn" type="button" data-act="glossary-csv" data-name="' +
                        esc(g.name) +
                        '" aria-label="Download ' +
                        esc(g.name) +
                        ' as CSV">' +
                        icon("download") +
                        "</button></span></li>"
                    );
                })
                .join("") +
            "</ul></div></section>"
        );
    }

    /* ── Delivery ────────────────────────────────────────── */

    function lockedDelivery(title, note) {
        return (
            '<div class="rp-locked"><span class="rp-locked__icon">' +
            icon("lock") +
            '</span><div><p class="rp-locked__title">' +
            title +
            '</p><p class="rp-locked__note">' +
            note +
            "</p></div></div>"
        );
    }

    function markFor(row, i) {
        if (row.answer === "C") return icon("check");
        if (row.answer === "I") return icon("minus");
        return String(i + 1);
    }

    function rowState(row) {
        return row.answer === "C" ? " is-done" : row.answer === "I" ? " is-skipped" : "";
    }

    function previousCheck() {
        if (!d.previousChecklist) return "";
        var who = esc(d.previous.resource);

        return (
            '<div class="rp-sub"><div class="rp-sub__head"><h3 class="rp-sub__title">Check the ' +
            esc(d.previous.service) +
            " job</h3></div>" +
            '<p class="rp-sub__note">' +
            who +
            " delivered " +
            d.previous.id +
            " with this checklist. Tick each item once you have seen it holds.</p>" +
            '<ul class="rp-checklist">' +
            d.previousChecklist
                .map(function (row, i) {
                    return (
                        '<li class="rp-checkrow' +
                        rowState(row) +
                        '"><span class="rp-checkrow__mark">' +
                        markFor(row, i) +
                        '</span><span class="rp-checkrow__text">' +
                        esc(row.item) +
                        '<span class="rp-checkrow__by">' +
                        (row.answer === "C" ? "Done by " : "Marked N/A by ") +
                        who +
                        "</span></span>" +
                        '<label class="rp-verify"><input type="checkbox" data-verify="' +
                        i +
                        '" data-focus="verify-' +
                        i +
                        '"' +
                        (row.verified ? " checked" : "") +
                        ">Verified</label></li>"
                    );
                })
                .join("") +
            "</ul></div>"
        );
    }

    function checklistEditor() {
        return (
            '<div class="rp-sub"><div class="rp-sub__head"><h3 class="rp-sub__title">' +
            esc(job.service) +
            ' checklist</h3></div><p class="rp-sub__note">Answer every item before you upload — mark it N/A if it does not apply to this job.</p>' +
            '<ul class="rp-checklist">' +
            d.checklist
                .map(function (row, i) {
                    return (
                        '<li class="rp-checkrow' +
                        rowState(row) +
                        '"><span class="rp-checkrow__mark">' +
                        markFor(row, i) +
                        '</span><span class="rp-checkrow__text">' +
                        esc(row.item) +
                        '</span><span class="rp-segmented" role="group" aria-label="' +
                        esc(row.item) +
                        '">' +
                        segment(i, "C", "Done", row.answer) +
                        segment(i, "I", "N/A", row.answer) +
                        "</span></li>"
                    );
                })
                .join("") +
            "</ul></div>"
        );
    }

    function segment(i, value, label, answer) {
        var on = answer === value;
        return (
            '<button class="rp-segment' +
            (on ? " is-active" : "") +
            '" type="button" data-act="answer" data-item="' +
            i +
            '" data-answer="' +
            value +
            '" data-focus="answer-' +
            i +
            "-" +
            value +
            '" aria-pressed="' +
            on +
            '" title="' +
            (value === "C" ? "Completed" : "Not applicable to this job") +
            '">' +
            (value === "C" ? icon("check") : "") +
            label +
            "</button>"
        );
    }

    /* What the resource hands back is not always "a file of the service" */
    var DELIVERABLE = {
        Interpreting: { noun: "signed attendance sheet", formats: ["PDF", "JPG", "PNG"] },
        Subtitling: { noun: "subtitle file", formats: ["SRT", "VTT", "ZIP"] },
        DTP: { noun: "DTP files", formats: ["INDD", "PDF", "ZIP"] }
    };

    function deliverable() {
        var known = DELIVERABLE[job.service];
        if (known) return known;

        var formats = [d.format || "PDF", "DOCX", "PDF", "ZIP"].filter(function (f, i, list) {
            return list.indexOf(f) === i;
        });
        return { noun: "finished " + job.service.toLowerCase() + " file", formats: formats };
    }

    function formatList(formats) {
        return formats.slice(0, -1).join(", ") + " or " + formats[formats.length - 1];
    }

    function uploadMarkup() {
        var complete = answeredCount() === d.checklist.length;
        var what = deliverable();

        if (picked) {
            return (
                '<div class="rp-deliverbar"><div class="rp-fileitem"><span class="rp-fileitem__icon">' +
                icon("file-check") +
                '</span><span class="rp-fileitem__text"><span class="rp-fileitem__name">' +
                esc(picked.name) +
                '</span><span class="rp-fileitem__hint">Ready to deliver · ' +
                picked.size +
                '</span></span><span class="rp-fileitem__actions"><button class="rp-iconbtn" type="button" data-act="unpick" data-focus="unpick" aria-label="Remove ' +
                esc(picked.name) +
                '">' +
                icon("close") +
                "</button></span></div>" +
                '<button class="rp-button rp-button--primary" type="button" data-act="deliver" data-focus="deliver">' +
                icon("upload") +
                "Deliver job</button></div>"
            );
        }

        return (
            (complete
                ? ""
                : '<p class="rp-callout rp-callout--warn" style="margin-top:14px">' +
                  icon("warning") +
                  "<span>Answer all " +
                  d.checklist.length +
                  " checklist items to unlock the upload.</span></p>") +
            '<label class="rp-drop' +
            (complete ? "" : " is-locked") +
            '" data-drop><input type="file" data-upload data-focus="upload"' +
            (complete ? "" : " disabled") +
            ' aria-label="Upload your ' +
            what.noun +
            '"><span class="rp-drop__icon">' +
            icon(complete ? "upload" : "lock") +
            '</span><span><span class="rp-drop__title">' +
            (complete ? "Drop your " + what.noun + " here, or <u>browse</u>" : "Upload your " + what.noun) +
            '</span><span class="rp-drop__note">' +
            formatList(what.formats) +
            " · up to 200 MB</span></span></label>"
        );
    }

    function deliveredMarkup() {
        return (
            '<div class="rp-sub"><div class="rp-sub__head"><h3 class="rp-sub__title">Delivered files</h3></div>' +
            '<ul class="rp-filelist" style="margin-top:10px">' +
            d.delivered
                .map(function (file, i) {
                    return fileItem(
                        deliveredAsFile(i),
                        "delivered:" + i,
                        "Delivered " + fmtDay(job.deliveredAt) + ", " + fmtTime(job.deliveredAt)
                    );
                })
                .join("") +
            "</ul></div>" +
            '<div class="rp-sub"><div class="rp-sub__head"><h3 class="rp-sub__title">Checklist you submitted</h3></div>' +
            '<ul class="rp-checklist">' +
            d.checklist
                .map(function (row, i) {
                    return (
                        '<li class="rp-checkrow' +
                        rowState(row) +
                        '"><span class="rp-checkrow__mark">' +
                        markFor(row, i) +
                        '</span><span class="rp-checkrow__text">' +
                        esc(row.item) +
                        "</span>" +
                        (row.answer === "C"
                            ? '<span class="rp-result">' + icon("check") + "Done</span>"
                            : '<span class="rp-result rp-result--skip">' + icon("minus") + "N/A</span>") +
                        "</li>"
                    );
                })
                .join("") +
            "</ul></div>"
        );
    }

    function deliveryCard() {
        var aside = "";
        var body;

        if (!job.jobReady) {
            body = lockedDelivery(
                "Delivery opens once the files are released",
                d.previous
                    ? "When the " + esc(d.previous.service) + " job is delivered, start this one and the checklist and upload appear here."
                    : "Your project manager is still preparing the files for this job."
            );
        } else if (job.status === "AS") {
            body = lockedDelivery(
                "Delivery opens when you start the job",
                "Press <strong>Start job</strong> and the " + esc(job.service.toLowerCase()) + " checklist and upload appear here."
            );
        } else if (isWorking()) {
            aside =
                '<span class="rp-card__aside"><strong>' +
                answeredCount() +
                "</strong> of " +
                d.checklist.length +
                " answered</span>";
            body = previousCheck() + checklistEditor() + uploadMarkup();
        } else {
            body = deliveredMarkup();
        }

        return (
            '<section class="rp-card" id="delivery">' +
            cardHead("upload", "Delivery", null, aside) +
            '<div class="rp-card__body">' +
            body +
            "</div></section>"
        );
    }

    /* ── Chat ────────────────────────────────────────────── */

    function dayLabel(date) {
        var today = new Date();
        var start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        var t = date.getTime();
        if (t >= start) return "Today";
        if (t >= start - 24 * HOUR) return "Yesterday";
        return fmtDay(date);
    }

    function messageMarkup(m) {
        var mine = m.from === "me";
        var when = new Date(m.at);
        var content;

        if (m.voice) {
            content =
                '<div class="rp-voice"><button class="rp-voice__play" type="button" data-demo="Voice playback" aria-label="Play voice message">' +
                icon("play") +
                '</button><span class="rp-voice__wave" aria-hidden="true"></span><span class="rp-voice__time">' +
                m.voice +
                "</span></div>";
        } else {
            content =
                esc(m.text) +
                (m.file
                    ? '<div class="rp-msg__file">' +
                      icon("file") +
                      "<span>" +
                      esc(m.file.name) +
                      "</span><small>" +
                      m.file.size +
                      '</small><button class="rp-iconbtn" type="button" data-demo="File download" aria-label="Download ' +
                      esc(m.file.name) +
                      '">' +
                      icon("download") +
                      "</button></div>"
                    : "");
        }

        return (
            '<div class="rp-msg' +
            (mine ? " rp-msg--me" : "") +
            '">' +
            (mine ? "" : '<span class="rp-avatar" aria-hidden="true">' + initials(job.pm.name) + "</span>") +
            '<div class="rp-msg__body"><div class="rp-msg__bubble">' +
            content +
            '</div><span class="rp-msg__meta">' +
            (mine ? "You" : esc(first(job.pm.name))) +
            " · " +
            fmtTime(when) +
            "</span></div></div>"
        );
    }

    function threadMarkup() {
        var lastDay = "";
        return d.chat
            .map(function (m) {
                var day = dayLabel(new Date(m.at));
                var sep = day !== lastDay ? '<span class="rp-chat__day">' + day + "</span>" : "";
                lastDay = day;
                return sep + messageMarkup(m);
            })
            .join("");
    }

    function chatCard() {
        var pm = first(job.pm.name);
        return (
            '<section class="rp-card" id="chat">' +
            cardHead("messages", "Chat with " + esc(pm), d.chat.length) +
            '<div class="rp-chat__thread" id="rpChatThread" aria-live="polite">' +
            threadMarkup() +
            "</div>" +
            '<form class="rp-chat__composer" data-chat>' +
            '<button class="rp-iconbtn rp-iconbtn--square" type="button" data-demo="Attachments" aria-label="Attach a file">' +
            icon("paperclip") +
            "</button>" +
            '<textarea class="rp-chat__input" id="rpChatInput" rows="1" placeholder="Write a message to ' +
            esc(pm) +
            '…" aria-label="Message ' +
            esc(pm) +
            '"></textarea>' +
            '<button class="rp-iconbtn rp-iconbtn--square" type="button" data-demo="Voice messages" aria-label="Record a voice message">' +
            icon("mic") +
            "</button>" +
            '<button class="rp-button rp-button--primary rp-chat__send" type="submit" aria-label="Send message">' +
            icon("send") +
            "</button></form></section>"
        );
    }

    /* ── Aside ───────────────────────────────────────────── */

    function srow(label, value, extraClass) {
        return (
            '<div class="rp-srow' +
            (extraClass ? " " + extraClass : "") +
            '"><dt>' +
            label +
            "</dt><dd>" +
            value +
            "</dd></div>"
        );
    }

    function deadlineChip() {
        var left = job.deadline - Date.now();
        if (left < 0) {
            return '<span class="rp-time rp-time--urgent">' + icon("clock") + "Overdue by <strong>" + span(left) + "</strong></span>";
        }
        return (
            '<span class="rp-time' +
            (left < 24 * HOUR ? " rp-time--urgent" : "") +
            '">' +
            icon("clock") +
            "<strong>" +
            span(left) +
            "</strong> left</span>"
        );
    }

    function summaryRows() {
        var tz = tzName(job.deadline);
        var deadline =
            fmtDay(job.deadline) + ", " + fmtTime(job.deadline) + (tz ? '<span class="rp-srow__hint">Asia/Dubai · ' + "GMT+4" + "</span>" : "");

        if (job.deliveredAt) {
            var early = job.deadline - job.deliveredAt;
            var rows =
                srow(
                    "Delivered",
                    fmtDay(job.deliveredAt) +
                        ", " +
                        fmtTime(job.deliveredAt) +
                        (early >= 0
                            ? '<span class="rp-time rp-time--ok">' + icon("success") + "On time · " + span(early) + " early</span>"
                            : '<span class="rp-time rp-time--urgent">' + icon("clock") + span(early) + " late</span>")
                ) + srow("Deadline", fmtDay(job.deadline) + ", " + fmtTime(job.deadline));

            if (job.billId) {
                rows += srow(
                    "Bill",
                    '<a class="rp-link" href="#" data-act="bill">' + job.billId + "</a>" + pill(statusMeta())
                );
            }
            return rows;
        }

        return (
            srow("Deadline", deadline + deadlineChip()) +
            srow("Accept date", fmtDay(job.acceptedAt) + ", " + fmtTime(job.acceptedAt)) +
            (isWorking()
                ? srow(
                      "Progress",
                      '<span class="rp-bar"><span style="width:' + job.progress + '%"></span></span><strong>' + job.progress + "%</strong>",
                      "rp-srow--bar"
                  )
                : srow("Progress", '<span class="rp-srow__hint">Not started</span>'))
        );
    }

    function summaryActions() {
        var pm = esc(first(job.pm.name));
        var slip = job.jobSlip
            ? '<button class="rp-button rp-button--outline rp-button--block" type="button" data-act="slip">' + icon("file-pdf") + "Job slip (PDF)</button>"
            : "";

        if (!job.jobReady) {
            return (
                '<div class="rp-summary__actions"><button class="rp-button rp-button--primary rp-button--block" type="button" disabled>' +
                icon("play") +
                "Start job</button></div>" +
                '<p class="rp-callout rp-callout--warn">' +
                icon("hourglass") +
                "<span>" +
                (d.previous
                    ? "<strong>Waiting for the " + esc(d.previous.service) + " job</strong> (" + d.previous.id + ") to be delivered. You will be notified when the files are released."
                    : "<strong>Waiting for the files.</strong> " + pm + " is still preparing them.") +
                "</span></p>"
            );
        }

        if (job.status === "AS") {
            return (
                '<div class="rp-summary__actions"><button class="rp-button rp-button--primary rp-button--block" type="button" data-act="start">' +
                icon("play") +
                "Start job</button></div>" +
                '<p class="rp-callout rp-callout--info">' +
                icon("info") +
                "<span>Starting lets " +
                pm +
                " know you are on it and opens the delivery checklist.</span></p>"
            );
        }

        if (isWorking()) {
            return (
                '<div class="rp-summary__actions"><button class="rp-button rp-button--primary rp-button--block" type="button" data-act="goto-delivery">' +
                icon("upload") +
                "Deliver job</button>" +
                (d.cat
                    ? '<button class="rp-button rp-button--outline rp-button--block" type="button" data-act="cat">' + icon("external-link") + "Open in Matecat</button>"
                    : "") +
                "</div>" +
                (job.status === "OV"
                    ? '<p class="rp-callout rp-callout--danger">' +
                      icon("warning") +
                      "<span><strong>The deadline passed " +
                      span(Date.now() - job.deadline) +
                      " ago.</strong> Deliver as soon as you can, or message " +
                      pm +
                      " if you need more time.</span></p>"
                    : "")
            );
        }

        var note = {
            DL: ["info", "info", "<strong>Delivered " + fmtShort(job.deliveredAt) + ".</strong> Waiting for " + pm + " to approve it — you will get an email when that happens."],
            AP: ["ok", "success", "<strong>Approved " + fmtShort(d.approvedAt || job.deliveredAt) + ".</strong> Bill " + esc(job.billId || "") + " was filed for you automatically."],
            BL: ["info", "receipt", "<strong>Billed " + fmtShort(d.billedAt || job.deliveredAt) + ".</strong> The payment follows in the next pay run."],
            ST: ["ok", "success", "<strong>Paid " + fmtShort(d.settledAt || job.deliveredAt) + ".</strong> The amount is in your balance."]
        }[job.status];

        return (
            '<div class="rp-summary__actions">' +
            (job.status === "DL"
                ? '<button class="rp-button rp-button--outline rp-button--block" type="button" data-act="view" data-file="delivered:0">' + icon("view") + "View delivered file</button>"
                : slip) +
            "</div>" +
            '<p class="rp-callout rp-callout--' +
            note[0] +
            '">' +
            icon(note[1]) +
            "<span>" +
            note[2] +
            "</span></p>"
        );
    }

    function summaryCard() {
        return (
            '<section class="rp-card rp-summary" aria-label="Payout and deadline">' +
            '<p class="rp-summary__label">' +
            (job.deliveredAt ? "Your earnings" : "Your payout") +
            "</p>" +
            '<p class="rp-summary__amount"><span class="rp-summary__currency">' +
            RP.USER.currency +
            "</span> " +
            money(job.amount) +
            '<span class="rp-summary__usd">≈ USD ' +
            money(d.usd) +
            "</span></p>" +
            '<p class="rp-summary__meta">' +
            rateText() +
            dot() +
            number(job.count.value) +
            " " +
            job.count.unit +
            "</p>" +
            '<dl class="rp-srows">' +
            summaryRows() +
            "</dl>" +
            summaryActions() +
            "</section>"
        );
    }

    function contactCard() {
        var pm = job.pm;
        var links =
            '<li><a class="rp-contact__link" href="mailto:' +
            pm.email +
            '" data-demo="Email">' +
            icon("mail") +
            "<span>" +
            pm.email +
            "</span></a></li>" +
            (pm.phone
                ? '<li><a class="rp-contact__link" href="tel:' + pm.phone.replace(/\s/g, "") + '" data-demo="Calling">' + icon("phone") + "<span>" + pm.phone + "</span></a></li>"
                : "") +
            (pm.mobile
                ? '<li><a class="rp-contact__link" href="tel:' + pm.mobile.replace(/\s/g, "") + '" data-demo="Calling">' + icon("smartphone") + "<span>" + pm.mobile + "</span><small>Mobile</small></a></li>"
                : "");

        return (
            '<section class="rp-card rp-contact" aria-label="Project manager">' +
            '<p class="rp-summary__label">Project manager</p>' +
            '<div class="rp-contact__who"><span class="rp-avatar">' +
            initials(pm.name) +
            '</span><div><p class="rp-contact__name">' +
            esc(pm.name) +
            '</p><p class="rp-contact__role">Owns this project</p></div></div>' +
            '<ul class="rp-contact__links">' +
            links +
            "</ul>" +
            '<button class="rp-button rp-button--outline rp-button--block" type="button" data-act="message">' +
            icon("messages") +
            "Message " +
            esc(first(pm.name)) +
            "</button></section>"
        );
    }

    /* ── Render ──────────────────────────────────────────── */

    function currentSection() {
        var active = els.tabs.querySelector(".navigation-tabs-link.active");
        return active ? active.dataset.section : "overview";
    }

    function renderAll() {
        document.title = job.id + " · " + job.project + " · Resource Portal";
        els.head.innerHTML = headMarkup();
        els.tabs.innerHTML = tabsMarkup(els.tabs.children.length ? currentSection() : "overview");
        els.job.innerHTML =
            '<div class="rp-job__main">' +
            overviewCard() +
            instructionsCard() +
            filesCard() +
            glossariesCard() +
            deliveryCard() +
            chatCard() +
            '</div><aside class="rp-job__aside">' +
            summaryCard() +
            contactCard() +
            "</aside>";

        collectSections();
        scrollThreadToEnd();
    }

    /* Swaps one card in place, so a checklist click keeps the reader's focus and scroll */
    function refresh(id, markup) {
        var el = document.getElementById(id);
        if (!el) return;

        var focusKey = document.activeElement && document.activeElement.getAttribute("data-focus");
        el.outerHTML = markup;
        collectSections();

        if (focusKey) {
            var next = document.querySelector('[data-focus="' + focusKey + '"]');
            if (next) next.focus({ preventScroll: true });
        }
    }

    function renderNotFound(id) {
        document.title = "Job not found · Resource Portal";
        els.nav.classList.add("is-hidden");
        els.head.innerHTML = "";
        els.job.innerHTML =
            '<div class="rp-notfound"><span class="rp-notfound__icon">' +
            icon("search") +
            '</span><p class="rp-notfound__title">We could not find ' +
            (id ? esc(id) : "that job") +
            '</p><p class="rp-notfound__note">It may have been reassigned, or the link is incomplete. Your jobs are all listed on My Jobs.</p>' +
            '<a class="rp-button rp-button--primary" href="jobs.html">' +
            icon("jobs") +
            "Go to My Jobs</a></div>";
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

    function goTo(id, then) {
        var el = document.getElementById(id);
        if (!el) return;

        var reduce = global.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", "#" + id);
        setActive(id);
        if (then) setTimeout(then, reduce ? 0 : 420);
    }

    /* ── Modal ───────────────────────────────────────────── */

    function openModal(markup, viewer) {
        lastFocus = document.activeElement;
        els.panel.innerHTML = markup;
        els.modal.className = "rp-modal is-open" + (viewer ? " rp-modal--viewer" : "");
        els.modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("rp-no-scroll");

        var target = els.panel.querySelector("[data-autofocus]") || els.panel.querySelector("[data-close]");
        if (target) target.focus({ preventScroll: true });
    }

    function closeModal() {
        if (!els.modal.classList.contains("is-open")) return;
        els.modal.classList.remove("is-open");
        els.modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("rp-no-scroll");
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }

    function skeleton(seed) {
        var widths = [100, 97, 99, 94, 58, 0, 100, 96, 98, 72, 0, 99, 95, 100, 91, 64];
        return widths
            .map(function (w, i) {
                if (!w) return '<div class="rp-skel rp-skel--head" style="width:' + (30 + ((seed + i) % 4) * 8) + '%"></div>';
                return '<div class="rp-skel" style="width:' + Math.max(40, w - ((seed * (i + 3)) % 9)) + '%"></div>';
            })
            .join("");
    }

    function docMock(file, lang, showTitle) {
        var ext = file.name.split(".").pop().toLowerCase();
        var rtl = RTL[lang];

        if (ext === "mp4") {
            return (
                '<div class="rp-video"><span class="rp-video__play">' +
                icon("play") +
                '</span><span class="rp-video__caption">— We start every shift with a safety check.</span></div>'
            );
        }

        if (ext === "xlsx" || ext === "csv") {
            var cells = "";
            for (var i = 0; i < 70; i++) cells += "<span></span>";
            return '<div class="rp-doc" style="padding:24px"><div class="rp-sheet">' + cells + "</div></div>";
        }

        return (
            '<article class="rp-doc"' +
            (rtl ? ' dir="rtl"' : "") +
            ">" +
            (showTitle
                ? '<h3 class="rp-doc__title">' + esc(job.project) + '</h3><p class="rp-doc__kicker">' + esc(file.name) + "</p>"
                : '<div class="rp-skel rp-skel--head" style="width:62%;height:16px;margin-top:0"></div><div class="rp-skel" style="width:28%;margin-bottom:26px"></div>') +
            skeleton(job.jobId) +
            "</article>"
        );
    }

    function openViewer(file) {
        var compare = file.kind === "ai";
        var source = workFile() || file;
        var inTarget = file.kind === "ai" || file.kind === "pretranslated" || file.kind === "delivered";
        var body;

        if (compare) {
            body =
                '<div class="rp-viewer rp-viewer--compare" id="rpViewer">' +
                '<div class="rp-viewer__pane"><span class="rp-viewer__label">' +
                icon("file") +
                "Source · " +
                esc(job.source) +
                "</span>" +
                docMock(source, job.source, true) +
                '</div><div class="rp-viewer__pane"><span class="rp-viewer__label">' +
                icon("bot") +
                "AI translation · " +
                esc(job.target) +
                "</span>" +
                docMock(file, job.target, false) +
                "</div></div>";
        } else {
            body = '<div class="rp-viewer">' + docMock(file, inTarget ? job.target : job.source, !inTarget) + "</div>";
        }

        openModal(
            '<header class="rp-modal__head"><span class="rp-fileitem__icon">' +
                icon(FILE_ICON[file.kind] || "file") +
                '</span><div class="rp-modal__titles"><h2 class="rp-modal__title" id="rpModalTitle">' +
                esc(file.name) +
                '</h2><p class="rp-modal__sub">' +
                esc(file.tag) +
                (file.size ? dot() + file.size : "") +
                "</p></div>" +
                '<div class="rp-modal__tools">' +
                (compare
                    ? '<button class="rp-button rp-button--outline rp-button--sm" type="button" data-act="toggle-source" aria-pressed="false">' +
                      icon("columns-2") +
                      "Hide source</button>"
                    : "") +
                '<button class="rp-iconbtn rp-iconbtn--square" type="button" data-demo="File download" aria-label="Download">' +
                icon("download") +
                "</button>" +
                '<button class="rp-iconbtn rp-iconbtn--square" type="button" data-demo="Opening in a new tab" aria-label="Open in a new tab">' +
                icon("external-link") +
                "</button>" +
                '<button class="rp-iconbtn rp-iconbtn--square" type="button" data-close aria-label="Close preview">' +
                icon("close") +
                "</button></div></header>" +
                '<div class="rp-modal__body">' +
                body +
                "</div>",
            true
        );
    }

    function openStartNotice() {
        openModal(
            '<div class="rp-notice"><span class="rp-notice__icon">' +
                icon("layout-template") +
                '</span><h2 class="rp-notice__title" id="rpModalTitle">This job comes with a template</h2>' +
                '<p class="rp-notice__text">' +
                esc(first(job.pm.name)) +
                " attached a template for your delivery. Use it, so the layout matches what the client expects.</p>" +
                '<ul class="rp-filelist">' +
                templates()
                    .map(function (file) {
                        return fileItem(file, "work:" + d.files.work.indexOf(file));
                    })
                    .join("") +
                "</ul></div>" +
                '<footer class="rp-modal__foot"><button class="rp-button rp-button--outline" type="button" data-close>Cancel</button>' +
                '<button class="rp-button rp-button--primary" type="button" data-act="confirm-start" data-autofocus>' +
                icon("play") +
                "Start job</button></footer>"
        );
    }

    /* ── Transitions ─────────────────────────────────────── */

    function start() {
        job.status = job.deadline < Date.now() ? "OV" : "PR";
        d.startedAt = new Date();
        renderAll();
        RP.toast("Job started — the delivery checklist is open.", "success");

        /* The real page opens the work file (or the CAT tool) straight after starting */
        if (d.cat) RP.toast("Matecat would open this job in a new tab.", "info");
        else if (workFile()) setTimeout(function () {
            openViewer(workFile());
        }, 450);
    }

    function deliver() {
        job.status = "DL";
        job.jobStatus = "delivered";
        job.tab = "completed";
        job.progress = 100;
        job.deliveredAt = new Date();
        d.delivered = [{ name: picked.name, size: picked.size }];
        picked = null;

        renderAll();
        global.scrollTo({ top: 0, behavior: "smooth" });
        RP.toast("Delivered — " + first(job.pm.name) + " has been notified.", "success");
    }

    function sendMessage(input) {
        var text = input.value.trim();
        if (!text) return;

        d.chat.push({ from: "me", at: Date.now(), text: text });
        input.value = "";
        autosize(input);

        document.getElementById("rpChatThread").innerHTML = threadMarkup();
        [document.querySelector("#chat .rp-card__count"), els.tabs.querySelector('[data-section="chat"] .navigation-tabs-badge')]
            .filter(Boolean)
            .forEach(function (el) {
                el.textContent = d.chat.length;
            });
        scrollThreadToEnd();
    }

    function scrollThreadToEnd() {
        var thread = document.getElementById("rpChatThread");
        if (thread) thread.scrollTop = thread.scrollHeight;
    }

    function autosize(input) {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight + 2, 140) + "px";
    }

    /* ── Wiring ──────────────────────────────────────────── */

    function onAction(btn, e) {
        var act = btn.dataset.act;

        if (act === "start") return templates().length ? openStartNotice() : start();
        if (act === "confirm-start") {
            closeModal();
            return start();
        }
        if (act === "goto-delivery") {
            return goTo("delivery", function () {
                var target = document.querySelector('#delivery [data-act="answer"]:not(.is-active)') || document.querySelector("#delivery [data-upload]");
                if (target) target.focus({ preventScroll: true });
            });
        }
        if (act === "message") {
            return goTo("chat", function () {
                document.getElementById("rpChatInput").focus({ preventScroll: true });
            });
        }
        if (act === "view") return openViewer(findFile(btn.dataset.file));
        if (act === "download") return RP.toast(findFile(btn.dataset.file).name + " would download here.", "info");
        if (act === "download-all") return RP.toast("Every file would download as one ZIP.", "info");
        if (act === "cat") return RP.toast("Matecat would open this job in a new tab.", "info");
        if (act === "bill") {
            e.preventDefault();
            return RP.toast("Bill " + job.billId + " would open here.", "info");
        }
        if (act === "slip") return RP.toast("The job slip for " + job.id + " would download as a PDF.", "info");
        if (act === "glossary") return RP.toast("The terms in " + btn.dataset.name + " would open here.", "info");
        if (act === "glossary-csv") return RP.toast(btn.dataset.name + " would download as a CSV.", "info");

        if (act === "answer") {
            d.checklist[Number(btn.dataset.item)].answer = btn.dataset.answer;
            return refresh("delivery", deliveryCard());
        }
        if (act === "unpick") {
            picked = null;
            return refresh("delivery", deliveryCard());
        }
        if (act === "deliver") return deliver();

        if (act === "toggle-source") {
            var viewer = document.getElementById("rpViewer");
            var solo = viewer.classList.toggle("is-solo");
            btn.setAttribute("aria-pressed", String(solo));
            btn.lastChild.textContent = solo ? "Show source" : "Hide source";
        }
    }

    function wire() {
        document.addEventListener("click", function (e) {
            if (e.target.closest("[data-close]")) return closeModal();
            if (e.target === els.modal) return closeModal();

            var btn = e.target.closest("[data-act]");
            if (btn && !btn.disabled) onAction(btn, e);
        });

        els.tabs.addEventListener("click", function (e) {
            var link = e.target.closest("[data-section]");
            if (!link) return;
            e.preventDefault();
            goTo(link.dataset.section);
        });

        document.addEventListener("change", function (e) {
            if (e.target.matches("[data-verify]")) {
                d.previousChecklist[Number(e.target.dataset.verify)].verified = e.target.checked;
            }

            if (e.target.matches("[data-upload]") && e.target.files.length) {
                var file = e.target.files[0];
                picked = { name: file.name, size: bytes(file.size) };
                refresh("delivery", deliveryCard());
                var deliverBtn = document.querySelector('[data-act="deliver"]');
                if (deliverBtn) deliverBtn.focus({ preventScroll: true });
            }
        });

        ["dragenter", "dragover"].forEach(function (type) {
            document.addEventListener(type, function (e) {
                var drop = e.target.closest && e.target.closest("[data-drop]");
                if (drop && !drop.classList.contains("is-locked")) drop.classList.add("is-dragover");
            });
        });

        ["dragleave", "drop"].forEach(function (type) {
            document.addEventListener(type, function (e) {
                var drop = e.target.closest && e.target.closest("[data-drop]");
                if (drop) drop.classList.remove("is-dragover");
            });
        });

        document.addEventListener("submit", function (e) {
            if (!e.target.matches("[data-chat]")) return;
            e.preventDefault();
            sendMessage(document.getElementById("rpChatInput"));
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeModal();

            if (e.key === "Enter" && !e.shiftKey && e.target.id === "rpChatInput") {
                e.preventDefault();
                sendMessage(e.target);
            }
        });

        document.addEventListener("input", function (e) {
            if (e.target.id === "rpChatInput") autosize(e.target);
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
    }

    /* ── Boot ────────────────────────────────────────────── */

    function init() {
        els = {
            head: document.getElementById("rpJobHead"),
            nav: document.getElementById("rpJobNav"),
            tabs: document.getElementById("rpJobTabs"),
            job: document.getElementById("rpJob"),
            modal: document.getElementById("rpModal"),
            panel: document.getElementById("rpModalPanel")
        };
        if (!els.job) return;

        var id = new URLSearchParams(global.location.search).get("id");

        /* Opened without an id, the page shows the first job in progress instead of nothing */
        job = id
            ? RP.JOBS.filter(function (row) {
                  return row.id === id;
              })[0]
            : RP.JOBS.filter(function (row) {
                  return row.status === "PR";
              })[0];

        wire();

        if (!job) {
            renderNotFound(id);
            return;
        }

        d = RP.jobDetail(job);
        renderAll();

        var hash = global.location.hash.slice(1);
        if (hash && document.getElementById(hash)) {
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
