/* ============================================================
   MESSENGER — the chat bubble at the bottom-right and its panel.
   Replaces templates/chat/messaging_dock.html. The bubble opens a
   panel above it: the conversation list, then one conversation,
   or both side by side once expanded. Pages keep room under their
   content (messenger.css), so the bubble never covers pagination.
   Conversations come from RP.CONVERSATIONS; what the resource
   sends or changes lasts for the tab (sessionStorage).
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;

    var LOCALE = "en-NZ";
    var MIN = 60000;
    var HOUR = 60 * MIN;
    var DAY = 24 * HOUR;
    var GROUP_GAP = 5 * MIN;
    var STORE_KEY = "rp_messages_v1";
    var PREFS_KEY = "rp_messenger";
    var DEMO_KEY = "rp_messages_demo";
    var REACTIONS = ["👍", "❤️", "😂", "🎉", "🙏", "✅"];
    var EMOJIS = ["😀", "😊", "🙂", "😉", "😂", "🤔", "😅", "🙌", "👍", "👌", "🙏", "👏", "🎉", "✅", "❤️", "🔥", "💯", "👀", "📎", "📄", "📅", "⏰", "✍️", "☕"];

    var convos = [];
    var els = {};
    var ui = {
        open: false,
        view: "list",
        active: null,
        filter: "all",
        query: "",
        expanded: false,
        reply: null,
        editing: null,
        files: [],
        recording: null,
        typing: {},
        playing: null,
        newLine: null,
        peekTimer: null,
        menu: null,
        viewing: null
    };

    /* ── Small helpers ───────────────────────────────────── */

    function esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function still() {
        return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function phone() {
        return global.matchMedia("(max-width: 600px)").matches;
    }

    function finePointer() {
        return global.matchMedia("(hover: hover)").matches;
    }

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

    function uid() {
        return "x" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    }

    /* ── Dates ───────────────────────────────────────────── */

    function dayStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    function daysBetween(date, now) {
        return Math.round((dayStart(now) - dayStart(date)) / DAY);
    }

    function clock(date) {
        return date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
    }

    function shortDate(date, now) {
        var opts = { day: "numeric", month: "short" };
        if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
        return date.toLocaleDateString(LOCALE, opts);
    }

    function fullDate(date) {
        return date.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + ", " + clock(date);
    }

    /* The list's time: the clock today, then the day, then the date */
    function listTime(date, now) {
        var days = daysBetween(date, now);
        if (days <= 0) return clock(date);
        if (days === 1) return "Yesterday";
        if (days < 7) return date.toLocaleDateString(LOCALE, { weekday: "short" });
        return shortDate(date, now);
    }

    function dayLabel(date, now) {
        var days = daysBetween(date, now);
        if (days <= 0) return "Today";
        if (days === 1) return "Yesterday";
        return date.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short" }) +
            (date.getFullYear() !== now.getFullYear() ? " " + date.getFullYear() : "");
    }

    function since(date, now) {
        var mins = Math.max(0, Math.floor((now - date) / MIN));
        if (mins < 1) return "just now";
        if (mins < 60) return mins + " min ago";
        var hours = Math.floor(mins / 60);
        if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");
        var days = daysBetween(date, now);
        return days === 1 ? "yesterday" : days + " days ago";
    }

    /* ── People and conversations ────────────────────────── */

    function person(key) {
        if (key === "me") return { name: RP.USER.fullName, role: "", status: "online" };
        return (RP.PEOPLE || {})[key] || { name: key, role: "", status: "offline" };
    }

    function first(name) {
        return String(name).split(" ")[0];
    }

    function initials(name) {
        return String(name)
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(function (w) {
                return w[0];
            })
            .join("")
            .toUpperCase();
    }

    function jobRow(id) {
        return findBy(RP.JOBS, "id", id);
    }

    function find(id) {
        return findBy(convos, "id", id);
    }

    function counterpart(c) {
        return c.kind === "group" ? null : c.with;
    }

    function titleOf(c) {
        if (c.kind === "job") return c.job;
        if (c.kind === "group") return c.name;
        return person(c.with).name;
    }

    function presence(p, now) {
        if (p.status === "online") return "Online";
        if (p.status === "away") return "Away";
        return p.lastSeen ? "Last seen " + since(p.lastSeen, now) : "Offline";
    }

    function aboutJob(c) {
        var job = jobRow(c.job);
        return job ? job.project : "";
    }

    function members(c) {
        if (c.kind === "group") return c.members.slice();
        return c.with ? [c.with] : [];
    }

    function visibleMessages(c) {
        return c.messages;
    }

    function lastMessage(c) {
        return c.messages[c.messages.length - 1] || null;
    }

    function lastActivity(c) {
        var last = lastMessage(c);
        return last ? last.at : c.createdAt || new Date(0);
    }

    function unreadOf(c) {
        return c.messages.filter(function (m) {
            return m.from !== "me" && !m.system && m.at > c.readAt;
        });
    }

    function isUnread(c) {
        return unreadOf(c).length > 0 || !!c.markedUnread;
    }

    function badgeCount() {
        return convos.reduce(function (sum, c) {
            if (c.muted || c.archived) return sum;
            var n = unreadOf(c).length;
            return sum + (n || (c.markedUnread ? 1 : 0));
        }, 0);
    }

    function mentionsMe(m) {
        return new RegExp("@" + first(RP.USER.fullName) + "\\b", "i").test(m.text || "");
    }

    /* ── Store ───────────────────────────────────────────── */

    function toDates(list) {
        list.forEach(function (c) {
            c.readAt = new Date(c.readAt);
            if (c.createdAt) c.createdAt = new Date(c.createdAt);
            c.messages.forEach(function (m) {
                m.at = new Date(m.at);
                m.files = m.files || [];
                m.reactions = m.reactions || [];
            });
        });
        return list;
    }

    /* A message the other side has answered, reacted to or could see has been read */
    function seedStatus(c) {
        var p = counterpart(c) ? person(counterpart(c)) : null;
        c.messages.forEach(function (m, i) {
            if (m.from !== "me" || m.status) return;
            var answered = c.messages.slice(i + 1).some(function (n) {
                return n.from !== "me" && !n.system;
            });
            var reacted = m.reactions.some(function (r) {
                return r.by.some(function (who) {
                    return who !== "me";
                });
            });
            m.status = answered || reacted || !p || p.status !== "offline" ? "read" : "delivered";
        });
    }

    function load() {
        var saved = readJSON(global.sessionStorage, STORE_KEY);
        convos = toDates(saved || JSON.parse(JSON.stringify(RP.CONVERSATIONS || [])));
        convos.forEach(seedStatus);
    }

    function save() {
        writeJSON(global.sessionStorage, STORE_KEY, convos);
    }

    /* ── Avatars ─────────────────────────────────────────── */

    function personFace(key, size) {
        var p = person(key);
        var online = p.status === "online" ? " rp-face--online" : p.status === "away" ? " rp-face--away" : "";
        return (
            '<span class="rp-face rp-face--' +
            (size || "md") +
            online +
            '" aria-hidden="true">' +
            esc(initials(p.name)) +
            '<span class="rp-face__dot"></span></span>'
        );
    }

    function convoFace(c, size) {
        if (c.kind === "job") {
            return '<span class="rp-face rp-face--' + (size || "md") + ' rp-face--job" aria-hidden="true">' + icon("jobs-bag") + "</span>";
        }
        if (c.kind === "group") {
            return '<span class="rp-face rp-face--' + (size || "md") + ' rp-face--group" aria-hidden="true">' + icon("users") + "</span>";
        }
        return personFace(c.with, size);
    }

    /* ── What a message says, in one line ────────────────── */

    function plain(m) {
        if (m.deleted) return m.from === "me" ? "You deleted a message" : "Message deleted";
        if (m.voice) return "🎤 Voice message · " + m.voice;
        if (m.text) return m.text;
        if (m.files.length) return "📎 " + m.files[0].name + (m.files.length > 1 ? " +" + (m.files.length - 1) : "");
        return "";
    }

    function previewMarkup(c) {
        if (ui.typing[c.id]) {
            return '<span class="rp-convo__typing">' + esc(first(person(ui.typing[c.id]).name)) + " is typing…</span>";
        }
        if (c.draft && c.id !== ui.active) {
            return '<span class="rp-convo__draft">Draft:</span> ' + esc(c.draft);
        }
        var m = lastMessage(c);
        if (!m) return '<span class="rp-convo__empty">No messages yet</span>';
        if (m.system) return esc(m.text);
        var who = m.from === "me" ? "You: " : c.kind === "direct" ? "" : first(person(m.from).name) + ": ";
        return esc(who + plain(m));
    }

    /* ── Text: links and mentions ────────────────────────── */

    function richText(text) {
        var html = esc(text);
        html = html.replace(/(https?:\/\/[^\s<]+)/g, function (url) {
            return '<a href="' + url + '" target="_blank" rel="noopener">' + url + "</a>";
        });
        return html.replace(/@([A-Z][\w'-]+(?: [A-Z][\w'-]+)?)/g, function (match, name) {
            var me = first(name).toLowerCase() === first(RP.USER.fullName).toLowerCase();
            return '<span class="rp-dm__mention' + (me ? " rp-dm__mention--me" : "") + '">@' + name + "</span>";
        });
    }

    /* ── Files ───────────────────────────────────────────── */

    function fileIcon(name) {
        var ext = String(name).split(".").pop().toLowerCase();
        if (ext === "pdf") return "file-pdf";
        if (/^(xlsx?|csv|ods)$/.test(ext)) return "file-spreadsheet";
        if (/^(png|jpe?g|gif|webp|svg)$/.test(ext)) return "image";
        return "file-text";
    }

    function humanSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
        return (bytes / 1024 / 1024).toFixed(1) + " MB";
    }

    function fileMarkup(f) {
        if (f.url && /^image\//.test(f.type || "")) {
            return (
                '<button class="rp-dm__image" type="button" data-act="view-image" data-src="' +
                esc(f.url) +
                '" aria-label="Open ' +
                esc(f.name) +
                '"><img src="' +
                esc(f.url) +
                '" alt=""></button>'
            );
        }
        return (
            '<span class="rp-dm__file">' +
            '<span class="rp-dm__file-icon" aria-hidden="true">' +
            icon(fileIcon(f.name)) +
            "</span>" +
            '<span class="rp-dm__file-text"><span class="rp-dm__file-name">' +
            esc(f.name) +
            '</span><span class="rp-dm__file-size">' +
            esc(f.size) +
            "</span></span>" +
            (f.url
                ? '<a class="rp-dm__file-get" href="' + esc(f.url) + '" download="' + esc(f.name) + '" aria-label="Download ' + esc(f.name) + '">' + icon("download") + "</a>"
                : '<button class="rp-dm__file-get" type="button" data-demo="File download" aria-label="Download ' + esc(f.name) + '">' + icon("download") + "</button>") +
            "</span>"
        );
    }

    /* Bars drawn from the message id, so a voice message keeps its shape */
    function waveMarkup(seed) {
        var bars = "";
        var n = 0;
        for (var i = 0; i < String(seed).length; i++) n = (n * 31 + String(seed).charCodeAt(i)) % 9973;
        for (var b = 0; b < 26; b++) {
            n = (n * 7 + 13) % 97;
            bars += '<i style="height:' + (28 + (n % 72)) + '%"></i>';
        }
        return bars;
    }

    function voiceMarkup(m) {
        var playing = ui.playing === m.id;
        return (
            '<span class="rp-voice-note' +
            (playing ? " is-playing" : "") +
            '" data-voice="' +
            esc(m.id) +
            '">' +
            '<button class="rp-voice-note__play" type="button" data-act="voice" aria-label="' +
            (playing ? "Pause" : "Play") +
            ' voice message">' +
            icon(playing ? "pause" : "play") +
            "</button>" +
            '<span class="rp-voice-note__wave" aria-hidden="true">' +
            '<span class="rp-voice-note__bars">' +
            waveMarkup(m.id) +
            "</span>" +
            '<span class="rp-voice-note__bars rp-voice-note__bars--played">' +
            waveMarkup(m.id) +
            "</span>" +
            "</span>" +
            '<span class="rp-voice-note__time">' +
            esc(m.voice) +
            "</span></span>"
        );
    }

    /* ── One message ─────────────────────────────────────── */

    function statusMarkup(m) {
        var map = {
            sending: ["clock", "Sending"],
            sent: ["check", "Sent"],
            delivered: ["check-check", "Delivered"],
            read: ["check-check", "Seen"]
        };
        var s = map[m.status] || map.sent;
        return '<span class="rp-dm__status rp-dm__status--' + (m.status || "sent") + '" title="' + s[1] + '" aria-label="' + s[1] + '">' + icon(s[0]) + "</span>";
    }

    function quoteMarkup(c, m) {
        var q = findBy(c.messages, "id", m.replyTo);
        if (!q) return "";
        return (
            '<button class="rp-dm__quote" type="button" data-act="jump" data-to="' +
            esc(q.id) +
            '"><strong>' +
            esc(q.from === "me" ? "You" : first(person(q.from).name)) +
            "</strong><span>" +
            esc(plain(q)) +
            "</span></button>"
        );
    }

    function reactionsMarkup(m) {
        if (!m.reactions.length) return "";
        return (
            '<div class="rp-dm__reactions">' +
            m.reactions
                .map(function (r) {
                    var mine = r.by.indexOf("me") > -1;
                    var names = r.by
                        .map(function (k) {
                            return k === "me" ? "You" : first(person(k).name);
                        })
                        .join(", ");
                    return (
                        '<button class="rp-dm__reaction' +
                        (mine ? " is-mine" : "") +
                        '" type="button" data-act="react" data-emoji="' +
                        r.emoji +
                        '" title="' +
                        esc(names) +
                        '" aria-label="' +
                        r.emoji +
                        " " +
                        r.by.length +
                        ", " +
                        esc(names) +
                        '" aria-pressed="' +
                        mine +
                        '">' +
                        r.emoji +
                        "<span>" +
                        r.by.length +
                        "</span></button>"
                    );
                })
                .join("") +
            "</div>"
        );
    }

    function toolsMarkup(m) {
        if (m.deleted) return "";
        return (
            '<div class="rp-dm__tools" role="toolbar" aria-label="Message actions">' +
            '<button class="rp-dm__tool" type="button" data-act="pick-reaction" aria-label="Add a reaction" title="React" aria-haspopup="dialog" aria-expanded="false">' +
            icon("smile-plus") +
            "</button>" +
            '<button class="rp-dm__tool" type="button" data-act="reply" aria-label="Reply" title="Reply">' +
            icon("reply") +
            "</button>" +
            '<button class="rp-dm__tool" type="button" data-act="message-menu" aria-label="More" title="More" aria-haspopup="menu">' +
            icon("ellipsis") +
            "</button>" +
            "</div>"
        );
    }

    function messageMarkup(c, m, prev, next, now) {
        if (m.system) return '<p class="rp-thread__system">' + esc(m.text) + "</p>";

        var mine = m.from === "me";
        var sameDay = function (a, b) {
            return a && b && dayStart(a.at) === dayStart(b.at);
        };
        var starts = !prev || prev.system || prev.from !== m.from || m.at - prev.at > GROUP_GAP || !sameDay(prev, m);
        var ends = !next || next.system || next.from !== m.from || next.at - m.at > GROUP_GAP || !sameDay(next, m);
        var showAuthor = !mine && starts && c.kind === "group";

        var body;
        if (m.deleted) {
            body = '<em class="rp-dm__deleted">' + (mine ? "You deleted this message" : "This message was deleted") + "</em>";
        } else {
            body =
                (m.replyTo ? quoteMarkup(c, m) : "") +
                (m.voice ? voiceMarkup(m) : "") +
                (m.text ? '<span class="rp-dm__text">' + richText(m.text) + "</span>" : "") +
                (m.files.length ? '<span class="rp-dm__files">' + m.files.map(fileMarkup).join("") + "</span>" : "");
        }

        return (
            '<div class="rp-dm' +
            (mine ? " rp-dm--me" : " rp-dm--them") +
            (starts ? " is-first" : "") +
            (ends ? " is-last" : "") +
            (m.deleted ? " is-deleted" : "") +
            (!mine && mentionsMe(m) ? " is-mention" : "") +
            '" data-msg="' +
            esc(m.id) +
            '">' +
            (mine ? "" : ends ? personFace(m.from, "sm") : '<span class="rp-dm__spacer" aria-hidden="true"></span>') +
            '<div class="rp-dm__body">' +
            (showAuthor ? '<span class="rp-dm__author">' + esc(person(m.from).name) + "</span>" : "") +
            '<div class="rp-dm__bubble" title="' +
            fullDate(m.at) +
            '">' +
            body +
            "</div>" +
            reactionsMarkup(m) +
            (ends || m.edited
                ? '<span class="rp-dm__meta">' +
                  (m.edited && !m.deleted ? '<span class="rp-dm__edited">Edited</span> · ' : "") +
                  '<time datetime="' +
                  m.at.toISOString() +
                  '">' +
                  clock(m.at) +
                  "</time>" +
                  (mine && !m.deleted ? statusMarkup(m) : "") +
                  "</span>"
                : "") +
            "</div>" +
            toolsMarkup(m) +
            "</div>"
        );
    }

    function threadMarkup(c) {
        var now = new Date();
        var list = visibleMessages(c);
        var out = "";
        var lastDay = null;

        if (!list.length) {
            return (
                '<div class="rp-thread__hello">' +
                convoFace(c, "lg") +
                '<p class="rp-thread__hello-title">' +
                (c.kind === "direct" ? "Say hello to " + esc(first(person(c.with).name)) : "No messages yet") +
                "</p></div>"
            );
        }

        list.forEach(function (m, i) {
            var day = dayStart(m.at);
            if (day !== lastDay) {
                out += '<p class="rp-thread__day"><span>' + dayLabel(m.at, now) + "</span></p>";
                lastDay = day;
            }
            if (ui.newLine && ui.newLine === m.id) {
                out += '<p class="rp-thread__new" id="rpNewLine"><span>New messages</span></p>';
            }
            out += messageMarkup(c, m, list[i - 1], list[i + 1], now);
        });
        return out;
    }

    /* ── The list ────────────────────────────────────────── */

    function rowMarkup(c, now) {
        var unread = unreadOf(c).length;
        var marked = !unread && c.markedUnread;
        var last = lastMessage(c);
        var name =
            c.kind === "job"
                ? '<span class="rp-convo__name">' + esc(c.job) + '<span class="rp-convo__about">' + esc(aboutJob(c)) + "</span></span>"
                : '<span class="rp-convo__name">' + esc(titleOf(c)) + "</span>";

        return (
            '<li class="rp-convo' +
            (unread || marked ? " is-unread" : "") +
            (c.id === ui.active ? " is-active" : "") +
            (c.muted ? " is-muted" : "") +
            '" data-convo="' +
            esc(c.id) +
            '">' +
            '<button class="rp-convo__open" type="button" data-open-convo="' +
            esc(c.id) +
            '"' +
            (c.id === ui.active ? ' aria-current="true"' : "") +
            ">" +
            convoFace(c) +
            '<span class="rp-convo__main">' +
            '<span class="rp-convo__line">' +
            name +
            '<span class="rp-convo__time">' +
            (last ? listTime(last.at, now) : "") +
            "</span></span>" +
            '<span class="rp-convo__line">' +
            '<span class="rp-convo__preview">' +
            previewMarkup(c) +
            "</span>" +
            '<span class="rp-convo__marks">' +
            (c.muted ? '<span class="rp-convo__mark" title="Muted">' + icon("bell-off") + "</span>" : "") +
            (c.pinned ? '<span class="rp-convo__mark" title="Pinned">' + icon("pin") + "</span>" : "") +
            (unreadOf(c).some(mentionsMe) ? '<span class="rp-convo__at" title="You were mentioned">@</span>' : "") +
            (unread ? '<span class="rp-convo__count">' + unread + "</span>" : marked ? '<span class="rp-convo__dot"></span>' : "") +
            "</span></span></span></button>" +
            '<button class="rp-convo__more" type="button" data-act="convo-menu" aria-label="More for ' +
            esc(titleOf(c)) +
            '" aria-haspopup="menu">' +
            icon("ellipsis") +
            "</button>" +
            "</li>"
        );
    }

    function matches(c, q) {
        if (!q) return true;
        var hay = [titleOf(c), c.kind === "job" ? aboutJob(c) : "", c.kind === "direct" ? person(c.with).role : ""]
            .concat(
                c.messages.map(function (m) {
                    return m.text || "";
                })
            )
            .join(" ")
            .toLowerCase();
        return hay.indexOf(q.toLowerCase()) > -1;
    }

    function listedConvos() {
        return convos
            .filter(function (c) {
                if (c.archived) return false;
                if (!c.messages.length && c.id !== ui.active) return false;
                if (ui.filter === "unread" && !isUnread(c)) return false;
                if (ui.filter === "jobs" && c.kind !== "job") return false;
                return matches(c, ui.query);
            })
            .sort(function (a, b) {
                return lastActivity(b) - lastActivity(a);
            });
    }

    function listMarkup() {
        var now = new Date();
        var list = listedConvos();
        var pinned = list.filter(function (c) {
            return c.pinned;
        });
        var rest = list.filter(function (c) {
            return !c.pinned;
        });
        var html = "";

        if (!list.length) {
            html =
                '<div class="rp-messenger__empty">' +
                '<span class="rp-messenger__empty-icon" aria-hidden="true">' +
                icon(ui.query ? "search" : ui.filter === "unread" ? "check-check" : "messages") +
                "</span>" +
                '<p class="rp-messenger__empty-title">' +
                (ui.query ? "Nothing matches “" + esc(ui.query) + "”" : ui.filter === "unread" ? "You're all caught up" : ui.filter === "jobs" ? "No job chats yet" : "No conversations yet") +
                "</p>" +
                (ui.query || ui.filter !== "all"
                    ? '<button class="rp-messenger__textbtn" type="button" data-act="reset-list">Show all conversations</button>'
                    : '<button class="rp-messenger__textbtn" type="button" data-act="new">' + icon("square-pen") + "Start a conversation</button>") +
                "</div>";
        } else {
            if (pinned.length) {
                html +=
                    '<p class="rp-messenger__label">Pinned</p><ul class="rp-convos" role="list">' +
                    pinned.map(function (c) {
                        return rowMarkup(c, now);
                    }).join("") +
                    "</ul>";
            }
            if (rest.length) {
                html +=
                    (pinned.length ? '<p class="rp-messenger__label">Recent</p>' : "") +
                    '<ul class="rp-convos" role="list">' +
                    rest.map(function (c) {
                        return rowMarkup(c, now);
                    }).join("") +
                    "</ul>";
            }
        }
        return html;
    }

    function archivedMarkup() {
        var now = new Date();
        var list = convos
            .filter(function (c) {
                return c.archived;
            })
            .sort(function (a, b) {
                return lastActivity(b) - lastActivity(a);
            });
        if (!list.length) {
            return '<div class="rp-messenger__empty"><span class="rp-messenger__empty-icon" aria-hidden="true">' + icon("archive") + '</span><p class="rp-messenger__empty-title">No archived conversations</p></div>';
        }
        return '<ul class="rp-convos" role="list">' + list.map(function (c) {
            return rowMarkup(c, now);
        }).join("") + "</ul>";
    }

    /* Who a resource can write to: their project managers, vendor management and their jobs' chats */
    function contacts() {
        var people = Object.keys(RP.PEOPLE || {}).filter(function (k) {
            return /manager/i.test(person(k).role);
        });
        var jobs = (RP.JOBS || []).filter(function (j) {
            return j.tab !== "completed" && /^J-4(79|80)/.test(j.id);
        });
        return { people: people, jobs: jobs };
    }

    function newMarkup() {
        var q = ui.query.toLowerCase();
        var c = contacts();
        var people = c.people.filter(function (k) {
            return !q || (person(k).name + " " + person(k).role).toLowerCase().indexOf(q) > -1;
        });
        var jobs = c.jobs.filter(function (j) {
            return !q || (j.id + " " + j.project + " " + j.pm.name).toLowerCase().indexOf(q) > -1;
        });
        var html = "";

        if (people.length) {
            html +=
                '<p class="rp-messenger__label">People</p><ul class="rp-convos" role="list">' +
                people
                    .map(function (k) {
                        var p = person(k);
                        return (
                            '<li class="rp-convo"><button class="rp-convo__open" type="button" data-start-person="' +
                            k +
                            '">' +
                            personFace(k) +
                            '<span class="rp-convo__main"><span class="rp-convo__line"><span class="rp-convo__name">' +
                            esc(p.name) +
                            '</span></span><span class="rp-convo__line"><span class="rp-convo__preview">' +
                            esc(p.role) +
                            " · " +
                            esc(presence(p, new Date())) +
                            "</span></span></span></button></li>"
                        );
                    })
                    .join("") +
                "</ul>";
        }
        if (jobs.length) {
            html +=
                '<p class="rp-messenger__label">Your jobs</p><ul class="rp-convos" role="list">' +
                jobs
                    .map(function (j) {
                        return (
                            '<li class="rp-convo"><button class="rp-convo__open" type="button" data-start-job="' +
                            j.id +
                            '"><span class="rp-face rp-face--md rp-face--job" aria-hidden="true">' +
                            icon("jobs-bag") +
                            '</span><span class="rp-convo__main"><span class="rp-convo__line"><span class="rp-convo__name">' +
                            esc(j.id) +
                            '<span class="rp-convo__about">' +
                            esc(j.project) +
                            '</span></span></span><span class="rp-convo__line"><span class="rp-convo__preview">With ' +
                            esc(j.pm.name) +
                            "</span></span></span></button></li>"
                        );
                    })
                    .join("") +
                "</ul>";
        }
        if (!html) {
            html = '<div class="rp-messenger__empty"><span class="rp-messenger__empty-icon" aria-hidden="true">' + icon("search") + '</span><p class="rp-messenger__empty-title">No one matches “' + esc(ui.query) + "”</p></div>";
        }
        return html;
    }

    /* ── Thread head and job context ─────────────────────── */

    function deadlineChip(job, now) {
        if (!job || job.tab === "completed") return "";
        var left = job.deadline - now;
        if (job.tab === "waiting") return '<span class="rp-thread__chip">Waiting for files</span>';
        var h = Math.round(Math.abs(left) / HOUR);
        if (left < 0) return '<span class="rp-thread__chip rp-thread__chip--bad">' + h + "h overdue</span>";
        if (left < 24 * HOUR) return '<span class="rp-thread__chip rp-thread__chip--warn">Due in ' + Math.max(1, h) + "h</span>";
        return '<span class="rp-thread__chip">Due in ' + Math.round(left / DAY) + "d</span>";
    }

    function headMarkup(c) {
        var now = new Date();
        var p = c.kind === "group" ? null : person(c.with);
        var line = "";
        if (c.kind === "group") {
            line = members(c).length + 1 + " members · " + members(c).map(function (k) {
                return first(person(k).name);
            }).join(", ") + ", you";
        } else if (c.kind === "job") {
            line = p.name + " · " + presence(p, now);
        } else {
            line = presence(p, now) + " · " + p.role;
        }
        var sub = ui.typing[c.id]
            ? '<span class="rp-thread__typing-label">' + esc(first(person(ui.typing[c.id]).name)) + " is typing…</span>"
            : esc(line);

        return (
            '<button class="rp-messenger__iconbtn rp-thread__back" type="button" data-act="back" aria-label="Back to conversations" title="Back">' +
            icon("chevron-left") +
            "</button>" +
            convoFace(c, "md") +
            '<div class="rp-thread__who">' +
            '<h3 class="rp-thread__name" id="rpThreadName">' +
            (c.kind === "job" ? '<span class="rp-thread__job" tabindex="0" aria-describedby="rpThreadJobTip">' + esc(c.job) + "</span>" : esc(titleOf(c))) +
            "</h3>" +
            (c.kind === "job" ? '<span class="rp-thread__tip" id="rpThreadJobTip" role="tooltip">' + esc(aboutJob(c)) + "</span>" : "") +
            '<p class="rp-thread__status' +
            (p && p.status === "online" && !ui.typing[c.id] ? " is-online" : "") +
            '" title="' +
            esc(line) +
            '">' +
            sub +
            "</p></div>" +
            '<div class="rp-thread__tools">' +
            '<button class="rp-messenger__iconbtn" type="button" data-act="thread-menu" aria-label="Conversation options" title="Options" aria-haspopup="menu">' +
            icon("ellipsis") +
            "</button>" +
            '<button class="rp-messenger__iconbtn rp-thread__close" type="button" data-act="close" aria-label="Close messages" title="Close">' +
            icon("close") +
            "</button>" +
            "</div>"
        );
    }

    function contextMarkup(c) {
        if (c.kind !== "job") return "";
        var job = jobRow(c.job);
        if (!job) return "";
        return (
            '<a class="rp-thread__context" href="job.html?id=' +
            esc(job.id) +
            '">' +
            '<span class="rp-thread__context-text"><strong>' +
            esc(job.service) +
            "</strong> · " +
            esc(job.source) +
            " → " +
            esc(job.target) +
            "</span>" +
            deadlineChip(job, new Date()) +
            '<span class="rp-thread__context-go">Open job' +
            icon("chevron-right") +
            "</span></a>"
        );
    }

    /* ── Shell ───────────────────────────────────────────── */

    function shellMarkup() {
        var emoji = EMOJIS.map(function (e) {
            return '<button type="button" data-act="insert-emoji" data-emoji="' + e + '" aria-label="' + e + '">' + e + "</button>";
        }).join("");

        return (
            '<div class="rp-messenger__peek" data-peek hidden></div>' +
            '<section class="rp-messenger__panel" id="rpMessengerPanel" role="dialog" aria-labelledby="rpMessengerTitle" tabindex="-1" hidden>' +
            /* The list pane: conversations, a new message, or the archive */
            '<div class="rp-messenger__pane rp-messenger__pane--list">' +
            '<header class="rp-messenger__head" data-list-head>' +
            '<h2 class="rp-messenger__title" id="rpMessengerTitle">Messages</h2>' +
            '<div class="rp-messenger__tools">' +
            '<button class="rp-messenger__iconbtn" type="button" data-act="new" aria-label="New message" title="New message">' +
            icon("square-pen") +
            "</button>" +
            '<button class="rp-messenger__iconbtn rp-messenger__archive" type="button" data-act="archived" aria-label="Archived" title="Archived">' +
            icon("archive") +
            '<span class="rp-messenger__archive-count" data-archived-count hidden></span>' +
            "</button>" +
            '<button class="rp-messenger__iconbtn rp-messenger__expand" type="button" data-act="expand" aria-label="Expand" title="Expand">' +
            icon("maximize-2") +
            "</button>" +
            '<button class="rp-messenger__iconbtn" type="button" data-act="close" aria-label="Close messages" title="Close">' +
            icon("close") +
            "</button>" +
            "</div>" +
            "</header>" +
            '<header class="rp-messenger__head rp-messenger__head--sub" data-sub-head hidden>' +
            '<button class="rp-messenger__iconbtn" type="button" data-act="list" aria-label="Back to conversations" title="Back">' +
            icon("chevron-left") +
            "</button>" +
            '<h2 class="rp-messenger__title" data-sub-title></h2>' +
            "</header>" +
            '<div class="rp-messenger__toolbar">' +
            '<label class="rp-messenger__search">' +
            icon("search") +
            '<input type="search" data-search placeholder="Search people, jobs or messages" aria-label="Search conversations" autocomplete="off">' +
            '<button type="button" class="rp-messenger__search-x" data-act="clear-search" aria-label="Clear search" hidden>' +
            icon("close") +
            "</button>" +
            "</label>" +
            '<div class="rp-segmented rp-messenger__filter" role="group" aria-label="Show conversations" data-filters>' +
            '<button class="rp-segment" type="button" data-filter="all">All</button>' +
            '<button class="rp-segment" type="button" data-filter="unread">Unread<span class="rp-segment-count" data-unread-count></span></button>' +
            '<button class="rp-segment" type="button" data-filter="jobs">Jobs</button>' +
            "</div>" +
            "</div>" +
            '<div class="rp-messenger__scroll" data-list></div>' +
            "</div>" +
            /* The conversation pane */
            '<div class="rp-messenger__pane rp-messenger__pane--thread" data-thread-pane>' +
            '<div class="rp-thread__none" data-thread-none>' +
            '<span class="rp-messenger__empty-icon" aria-hidden="true">' +
            icon("messages") +
            "</span>" +
            '<p class="rp-messenger__empty-title">Pick a conversation</p>' +
            "</div>" +
            '<div class="rp-thread" data-thread hidden>' +
            '<header class="rp-thread__head" data-thread-head></header>' +
            '<div class="rp-thread__context-wrap" data-thread-context></div>' +
            '<div class="rp-thread__log" data-log role="log" aria-live="polite" aria-labelledby="rpThreadName" tabindex="0"></div>' +
            '<p class="rp-thread__typing" data-typing hidden></p>' +
            '<button class="rp-thread__jump" type="button" data-act="jump-latest" hidden aria-label="Jump to the latest message">' +
            icon("arrow-down") +
            '<span data-jump-count hidden></span></button>' +
            '<div class="rp-thread__drop" data-drop hidden><span>' +
            icon("paperclip") +
            "Drop files to send</span></div>" +
            /* Composer */
            '<form class="rp-composer" data-composer novalidate>' +
            '<div class="rp-composer__context" data-context hidden>' +
            '<span class="rp-composer__context-icon" data-context-icon aria-hidden="true"></span>' +
            '<span class="rp-composer__context-text"><strong data-context-title></strong><span data-context-text></span></span>' +
            '<button class="rp-composer__x" type="button" data-act="cancel-context" aria-label="Cancel" title="Cancel">' +
            icon("close") +
            "</button>" +
            "</div>" +
            '<ul class="rp-composer__files" data-files hidden></ul>' +
            '<div class="rp-composer__row" data-compose-row>' +
            '<button class="rp-composer__btn" type="button" data-act="attach" aria-label="Attach files" title="Attach files">' +
            icon("paperclip") +
            "</button>" +
            '<input type="file" multiple hidden data-file-input>' +
            '<div class="rp-composer__field">' +
            '<textarea class="rp-composer__input" rows="1" data-input aria-label="Message" placeholder="Write a message…"></textarea>' +
            '<button class="rp-composer__btn rp-composer__btn--inner" type="button" data-act="emoji" aria-label="Emoji" title="Emoji" aria-expanded="false">' +
            icon("smile") +
            "</button>" +
            "</div>" +
            '<button class="rp-composer__btn" type="button" data-act="record" aria-label="Record a voice message" title="Voice message">' +
            icon("mic") +
            "</button>" +
            '<button class="rp-composer__send" type="submit" data-send aria-label="Send" title="Send (Enter)">' +
            icon("send") +
            "</button>" +
            "</div>" +
            '<div class="rp-composer__record" data-recorder hidden>' +
            '<button class="rp-composer__btn rp-composer__btn--danger" type="button" data-act="record-cancel" aria-label="Discard the recording" title="Discard">' +
            icon("trash-2") +
            "</button>" +
            '<span class="rp-composer__rec-dot" aria-hidden="true"></span>' +
            '<span class="rp-composer__rec-time" data-rec-time role="timer">0:00</span>' +
            '<span class="rp-composer__rec-wave" aria-hidden="true">' +
            waveMarkup("recording") +
            "</span>" +
            '<button class="rp-composer__send" type="button" data-act="record-send" aria-label="Send the voice message" title="Send">' +
            icon("send") +
            "</button>" +
            "</div>" +
            '<div class="rp-composer__pop rp-composer__emoji" data-emoji-pop role="dialog" aria-label="Emoji" hidden>' +
            emoji +
            "</div>" +
            '<ul class="rp-composer__pop rp-composer__mentions" data-mentions role="listbox" aria-label="Mention someone" hidden></ul>' +
            "</form>" +
            "</div>" +
            "</div>" +
            /* Shared popovers */
            '<div class="rp-messenger__menu" data-menu role="menu" hidden></div>' +
            '<div class="rp-messenger__picker" data-picker role="dialog" aria-label="Pick a reaction" hidden>' +
            REACTIONS.map(function (e) {
                return '<button type="button" data-act="react-pick" data-emoji="' + e + '" aria-label="' + e + '">' + e + "</button>";
            }).join("") +
            "</div>" +
            "</section>" +
            '<p class="rp-messenger__sr" aria-live="polite" data-live></p>' +
            '<button class="rp-messenger__launcher" type="button" data-launcher aria-controls="rpMessengerPanel" aria-expanded="false" aria-label="Open messages">' +
            '<span class="rp-messenger__launcher-icon rp-messenger__launcher-icon--chat">' +
            icon("messages") +
            "</span>" +
            '<span class="rp-messenger__launcher-icon rp-messenger__launcher-icon--close">' +
            icon("chevron-down") +
            "</span>" +
            '<span class="rp-messenger__badge" data-badge hidden></span>' +
            "</button>" +
            '<div class="rp-messenger__lightbox" data-lightbox role="dialog" aria-modal="true" aria-label="Image" hidden>' +
            '<img alt="" data-lightbox-img>' +
            '<button class="rp-messenger__lightbox-x" type="button" aria-label="Close">' +
            icon("close") +
            "</button></div>"
        );
    }

    /* ── Render ──────────────────────────────────────────── */

    /* Re-rendering replaces buttons: a path finds the same control in the new markup */
    function pathOf(el) {
        var scope = el && el.closest ? el.closest("[data-msg], [data-convo], [data-thread-head], [data-list]") : null;
        if (!scope || !els.panel.contains(scope)) return null;
        var key = ["data-msg", "data-convo", "data-thread-head", "data-list"].filter(function (a) {
            return scope.hasAttribute(a);
        })[0];
        var path = "[" + key + (scope.getAttribute(key) ? '="' + scope.getAttribute(key) + '"' : "") + "] ";
        if (el.hasAttribute("data-open-convo")) return path + "[data-open-convo]";
        if (!el.hasAttribute("data-act")) return null;
        return path + '[data-act="' + el.getAttribute("data-act") + '"]' + (el.hasAttribute("data-emoji") ? '[data-emoji="' + el.getAttribute("data-emoji") + '"]' : "");
    }

    function focusPath(path, fallback) {
        var el = (path && els.panel.querySelector(path)) || fallback;
        if (el) el.focus({ preventScroll: true });
    }

    function renderBadges() {
        var n = badgeCount();
        els.badge.hidden = !n;
        els.badge.textContent = n > 99 ? "99+" : String(n);
        els.launcher.setAttribute("aria-label", ui.open ? "Close messages" : n ? "Open messages, " + n + " unread" : "Open messages");

        var top = document.getElementById("rpMessagesBadge");
        if (top) {
            top.hidden = !n;
            top.textContent = n > 99 ? "99+" : String(n);
        }
        var topBtn = document.getElementById("rpMessagesBtn");
        if (topBtn) topBtn.setAttribute("aria-label", n ? "Messages, " + n + " unread" : "Messages");

        var archived = convos.filter(function (c) {
            return c.archived;
        }).length;
        var shelf = els.panel.querySelector("[data-archived-count]");
        shelf.textContent = archived;
        shelf.hidden = !archived;
        shelf.parentNode.setAttribute("aria-label", archived ? "Archived, " + archived + (archived === 1 ? " conversation" : " conversations") : "Archived");

        var count = els.panel.querySelector("[data-unread-count]");
        var unreadConvos = convos.filter(function (c) {
            return !c.archived && isUnread(c);
        }).length;
        count.textContent = unreadConvos;
        count.hidden = !unreadConvos;
    }

    function renderList() {
        var scroll = els.list;
        var top = scroll.scrollTop;
        var sub = ui.view !== "list";
        var focused = scroll.contains(document.activeElement) ? pathOf(document.activeElement) : null;

        els.panel.querySelector("[data-list-head]").hidden = sub;
        els.panel.querySelector("[data-sub-head]").hidden = !sub;
        els.panel.querySelector("[data-filters]").hidden = ui.view !== "list";
        els.panel.querySelector("[data-sub-title]").textContent = ui.view === "new" ? "New message" : "Archived";
        els.search.placeholder = ui.view === "new" ? "Search by name or job number" : "Search people, jobs or messages";
        els.panel.querySelector(".rp-messenger__toolbar").hidden = ui.view === "archived";

        els.panel.querySelectorAll("[data-filter]").forEach(function (btn) {
            if (!btn.classList.contains("rp-segment")) return;
            var on = btn.getAttribute("data-filter") === ui.filter;
            btn.classList.toggle("is-active", on);
            btn.setAttribute("aria-pressed", String(on));
        });

        scroll.innerHTML = ui.view === "new" ? newMarkup() : ui.view === "archived" ? archivedMarkup() : listMarkup();
        scroll.scrollTop = top;
        if (focused) focusPath(focused);
        reanchor();
        renderBadges();
    }

    function nearBottom() {
        var log = els.log;
        return log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    }

    function scrollToEnd(smooth) {
        els.log.scrollTo({ top: els.log.scrollHeight, behavior: smooth && !still() ? "smooth" : "auto" });
    }

    function renderThread(keepScroll) {
        var c = find(ui.active);
        els.panel.querySelector("[data-thread-none]").hidden = !!c;
        els.thread.hidden = !c;
        if (!c) return;

        var stick = nearBottom();
        var top = els.log.scrollTop;
        var head = els.panel.querySelector("[data-thread-head]");
        var active = document.activeElement;
        var inside = active !== els.log && (els.log.contains(active) || head.contains(active));
        var focused = inside ? pathOf(active) : null;

        head.innerHTML = headMarkup(c);
        els.panel.querySelector("[data-thread-context]").innerHTML = contextMarkup(c);
        els.log.innerHTML = threadMarkup(c);
        renderTyping(c);

        if (keepScroll === "end" || (keepScroll !== "keep" && stick)) scrollToEnd(false);
        else els.log.scrollTop = top;
        if (inside) focusPath(focused, els.log);
        reanchor();
    }

    function renderTyping(c) {
        var who = ui.typing[c.id];
        els.typing.hidden = !who;
        if (who) {
            els.typing.innerHTML =
                personFace(who, "xs") +
                '<span class="rp-thread__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
                '<span class="rp-thread__typing-text">' +
                esc(first(person(who).name)) +
                " is typing…</span>";
        }
    }

    function syncLayout() {
        var wide = ui.expanded && !phone() && global.innerWidth >= 900;
        els.panel.classList.toggle("is-expanded", wide);
        els.panel.classList.toggle("is-thread", !!ui.active && !wide);
        document.body.classList.toggle("rp-messenger-wide", wide);
        var expand = els.panel.querySelector(".rp-messenger__expand");
        expand.innerHTML = icon(wide ? "minimize-2" : "maximize-2");
        expand.setAttribute("aria-label", wide ? "Shrink" : "Expand");
        expand.title = wide ? "Shrink" : "Expand";
        els.panel.setAttribute("aria-modal", phone() ? "true" : "false");
    }

    function announce(text) {
        els.live.textContent = "";
        global.setTimeout(function () {
            els.live.textContent = text;
        }, 40);
    }

    /* ── Open / close ────────────────────────────────────── */

    function open(focusSearch) {
        if (!ui.open) {
            ui.open = true;
            els.root.classList.add("is-open");
            els.panel.hidden = false;
            els.launcher.setAttribute("aria-expanded", "true");
            document.body.classList.add("rp-messenger-open");
            if (phone()) document.body.classList.add("rp-no-scroll");
            hidePeek();
        }
        syncLayout();
        renderList();
        if (ui.active) renderThread("end");
        if (focusSearch) els.search.focus({ preventScroll: true });
        else if (!ui.active || els.panel.classList.contains("is-expanded")) els.panel.focus({ preventScroll: true });
        else focusComposer();
    }

    function close(returnFocus) {
        if (!ui.open) return;
        stashDraft();
        stopRecording(false);
        closePopovers();
        ui.open = false;
        els.root.classList.remove("is-open");
        els.panel.hidden = true;
        els.launcher.setAttribute("aria-expanded", "false");
        document.body.classList.remove("rp-messenger-open");
        if (!document.querySelector(".rp-sidebar--open")) document.body.classList.remove("rp-no-scroll");
        renderBadges();
        if (returnFocus) els.launcher.focus();
    }

    function toggle() {
        if (ui.open) close(true);
        else open(false);
    }

    /* A phone would raise its keyboard over the conversation, so the panel takes focus */
    function focusComposer() {
        (finePointer() ? els.input : els.panel).focus({ preventScroll: true });
    }

    /* ── Conversations ───────────────────────────────────── */

    function markRead(c) {
        var changed = unreadOf(c).length || c.markedUnread;
        c.readAt = new Date();
        c.markedUnread = false;
        if (changed) save();
    }

    function openConvo(id) {
        var c = find(id);
        if (!c) return;
        stashDraft();
        resetComposer();

        if (c.archived && ui.view !== "archived") c.archived = false;
        var unread = unreadOf(c);
        ui.newLine = unread.length ? unread[0].id : null;
        ui.active = id;
        markRead(c);

        if (!ui.open) open(false);
        syncLayout();
        renderList();
        renderThread("end");

        var line = document.getElementById("rpNewLine");
        if (line) line.scrollIntoView({ block: "center" });

        els.input.value = c.draft || "";
        delete c.draft;
        autosize();
        updateComposer();
        focusComposer();
        save();
    }

    function back() {
        var was = ui.active;
        stashDraft();
        stopRecording(false);
        ui.active = null;
        ui.newLine = null;
        resetComposer();
        syncLayout();
        renderList();
        focusPath('[data-convo="' + was + '"] [data-open-convo]', els.panel);
    }

    function stashDraft() {
        var c = find(ui.active);
        if (!c || ui.editing) return;
        var text = els.input.value.trim();
        if (text) c.draft = els.input.value;
        else delete c.draft;
        save();
    }

    function setView(view) {
        var from = ui.view;
        ui.view = view;
        ui.query = "";
        els.search.value = "";
        els.panel.querySelector('[data-act="clear-search"]').hidden = true;
        renderList();
        if (view === "new") els.search.focus({ preventScroll: true });
        else if (view === "archived") els.panel.querySelector('[data-sub-head] [data-act="list"]').focus({ preventScroll: true });
        else focusPath('[data-list-head] [data-act="' + (from === "archived" ? "archived" : "new") + '"]', els.panel);
    }

    function startWith(key) {
        var c = convos.filter(function (x) {
            return x.kind === "direct" && x.with === key;
        })[0];
        if (!c) {
            c = { id: "c-" + key, kind: "direct", with: key, readAt: new Date(), createdAt: new Date(), messages: [] };
            convos.push(c);
            save();
        }
        ui.view = "list";
        els.search.value = "";
        ui.query = "";
        openConvo(c.id);
    }

    function startJob(jobId) {
        var c = findBy(convos, "job", jobId);
        if (!c) {
            var job = jobRow(jobId);
            var key = Object.keys(RP.PEOPLE || {}).filter(function (k) {
                return job && person(k).name === job.pm.name;
            })[0];
            c = { id: "c-" + jobId.toLowerCase(), kind: "job", job: jobId, with: key, readAt: new Date(), createdAt: new Date(), messages: [] };
            convos.push(c);
            save();
        }
        ui.view = "list";
        els.search.value = "";
        ui.query = "";
        openConvo(c.id);
    }

    /* ── Composer ────────────────────────────────────────── */

    /* No border on the textarea, so scrollHeight is its exact height; max-height in the CSS caps it */
    function autosize() {
        var input = els.input;
        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";
    }

    function hasContent() {
        return !!els.input.value.trim() || ui.files.length > 0;
    }

    function updateComposer() {
        els.composer.classList.toggle("has-content", hasContent() || !!ui.editing);
        els.send.disabled = !hasContent();
    }

    function setContext(kind, m) {
        var box = els.composer.querySelector("[data-context]");
        if (!kind) {
            box.hidden = true;
            return;
        }
        box.hidden = false;
        box.setAttribute("data-kind", kind);
        els.composer.querySelector("[data-context-icon]").innerHTML = icon(kind === "edit" ? "pen-line" : "reply");
        els.composer.querySelector("[data-context-title]").textContent =
            kind === "edit" ? "Editing your message" : "Replying to " + (m.from === "me" ? "yourself" : first(person(m.from).name));
        els.composer.querySelector("[data-context-text]").textContent = plain(m);
    }

    function resetComposer() {
        ui.reply = null;
        ui.editing = null;
        ui.files = [];
        setContext(null);
        renderFiles();
        els.input.value = "";
        autosize();
        updateComposer();
        closePopovers();
    }

    function startReply(m) {
        ui.editing = null;
        ui.reply = m.id;
        setContext("reply", m);
        els.input.focus();
    }

    function startEdit(m) {
        ui.reply = null;
        ui.editing = m.id;
        setContext("edit", m);
        els.input.value = m.text;
        autosize();
        updateComposer();
        els.input.focus();
        els.input.setSelectionRange(els.input.value.length, els.input.value.length);
    }

    function cancelContext() {
        if (ui.editing) {
            els.input.value = "";
            autosize();
        }
        ui.reply = null;
        ui.editing = null;
        setContext(null);
        updateComposer();
        els.input.focus();
    }

    function renderFiles() {
        var list = els.composer.querySelector("[data-files]");
        list.hidden = !ui.files.length;
        list.innerHTML = ui.files
            .map(function (f, i) {
                return (
                    '<li class="rp-composer__file">' +
                    (f.url && /^image\//.test(f.type) ? '<img src="' + esc(f.url) + '" alt="">' : '<span class="rp-composer__file-icon">' + icon(fileIcon(f.name)) + "</span>") +
                    '<span class="rp-composer__file-text"><span>' +
                    esc(f.name) +
                    "</span><small>" +
                    esc(f.size) +
                    "</small></span>" +
                    '<button type="button" class="rp-composer__x" data-act="remove-file" data-index="' +
                    i +
                    '" aria-label="Remove ' +
                    esc(f.name) +
                    '">' +
                    icon("close") +
                    "</button></li>"
                );
            })
            .join("");
        updateComposer();
    }

    function addFiles(fileList) {
        [].slice.call(fileList || []).forEach(function (file) {
            ui.files.push({
                name: file.name,
                size: humanSize(file.size),
                type: file.type,
                url: global.URL && global.URL.createObjectURL ? global.URL.createObjectURL(file) : null
            });
        });
        renderFiles();
        els.input.focus();
    }

    function send() {
        var c = find(ui.active);
        if (!c) return;
        var text = els.input.value.trim();

        if (ui.editing) {
            var m = findBy(c.messages, "id", ui.editing);
            if (m && text && text !== m.text) {
                m.text = text;
                m.edited = true;
                save();
                renderThread("keep");
                emit(c, m);
                announce("Message edited");
            }
            cancelContext();
            els.input.value = "";
            autosize();
            updateComposer();
            return;
        }

        if (!text && !ui.files.length) return;
        var msg = {
            id: uid(),
            from: "me",
            at: new Date(),
            text: text,
            files: ui.files.slice(),
            reactions: [],
            replyTo: ui.reply,
            status: "sending"
        };
        deliver(c, msg);

        els.input.value = "";
        ui.files = [];
        ui.reply = null;
        setContext(null);
        renderFiles();
        autosize();
        updateComposer();
        closePopovers();
    }

    /* What the server and the other side do with a message, as the WebSocket would report it */
    function deliver(c, msg) {
        c.messages.push(msg);
        c.readAt = new Date();
        delete c.draft;
        save();
        ui.newLine = null;
        refreshAfterChange(c, true);
        emit(c, msg);

        var p = counterpart(c) ? person(counterpart(c)) : person(c.kind === "group" ? c.members[0] : "");
        var reads = p.status !== "offline";
        step(c, msg, "sent", 350);
        step(c, msg, "delivered", 1000);
        if (reads) step(c, msg, "read", 2200);

        var reply = (c.replies || []).shift();
        if (reply) {
            var from = typeof reply === "string" ? counterpart(c) : reply.from;
            var text = typeof reply === "string" ? reply : reply.text;
            if (!reads) step(c, msg, "read", 2400);
            global.setTimeout(function () {
                setTyping(c, from);
            }, 2600);
            global.setTimeout(function () {
                setTyping(c, null);
                arrive(c, { id: uid(), from: from, at: new Date(), text: text, files: [], reactions: [] });
            }, 2600 + Math.min(3200, 900 + text.length * 30));
        }
    }

    function step(c, msg, status, after) {
        global.setTimeout(function () {
            var order = ["sending", "sent", "delivered", "read"];
            if (order.indexOf(status) <= order.indexOf(msg.status)) return;
            msg.status = status;
            save();
            if (ui.open && ui.active === c.id) {
                var el = els.log.querySelector('[data-msg="' + msg.id + '"] .rp-dm__status');
                if (el) el.outerHTML = statusMarkup(msg);
            }
        }, after);
    }

    function setTyping(c, who) {
        if (who) ui.typing[c.id] = who;
        else delete ui.typing[c.id];
        if (!ui.open) return;
        if (ui.active === c.id) {
            renderTyping(c);
            els.panel.querySelector("[data-thread-head]").innerHTML = headMarkup(c);
            if (who && nearBottom()) scrollToEnd(true);
        }
        renderList();
    }

    function refreshAfterChange(c, toEnd) {
        if (ui.open) {
            renderList();
            if (ui.active === c.id) renderThread(toEnd ? "end" : undefined);
        } else {
            renderBadges();
        }
    }

    function emit(c, msg) {
        try {
            document.dispatchEvent(new global.CustomEvent("rp:message", { detail: { conversation: c.id, job: c.job || null, message: msg } }));
        } catch (err) {
            /* old browsers: the job page just keeps its own copy */
        }
    }

    /* ── Arrivals ────────────────────────────────────────── */

    function arrive(c, msg) {
        if (c.archived) c.archived = false;
        c.messages.push(msg);
        var reading = ui.open && ui.active === c.id && !document.hidden;
        var wasNear = reading && nearBottom();

        if (reading) {
            c.readAt = new Date();
            renderList();
            renderThread(wasNear ? "end" : "keep");
            if (!wasNear) bumpJump();
        } else {
            refreshAfterChange(c);
            if (!c.muted) {
                if (!ui.open) showPeek(c, msg);
                ring();
                chime();
            }
        }
        save();
        emit(c, msg);
        announce("New message from " + person(msg.from).name);
    }

    function bumpJump() {
        var jump = els.panel.querySelector('[data-act="jump-latest"]');
        var count = jump.querySelector("[data-jump-count]");
        var n = Number(count.textContent || 0) + 1;
        count.textContent = n;
        count.hidden = false;
        jump.hidden = false;
    }

    function ring() {
        if (still()) return;
        els.launcher.classList.remove("is-ringing");
        void els.launcher.offsetWidth;
        els.launcher.classList.add("is-ringing");
        global.setTimeout(function () {
            els.launcher.classList.remove("is-ringing");
        }, 900);
    }

    /* One soft note, at the notification settings' volume and only when their sound is on */
    function chime() {
        var prefs = readJSON(global.localStorage, "rp_notification_prefs") || {};
        if (prefs.sound === false) return;
        var volume = typeof prefs.volume === "number" ? prefs.volume : 40;
        var Ctx = global.AudioContext || global.webkitAudioContext;
        if (!Ctx || !volume) return;
        try {
            var audio = (chime.ctx = chime.ctx || new Ctx());
            if (audio.state === "suspended") audio.resume();
            var at = audio.currentTime + 0.01;
            var osc = audio.createOscillator();
            var gain = audio.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(660, at);
            osc.frequency.exponentialRampToValueAtTime(990, at + 0.12);
            gain.gain.setValueAtTime(0.0001, at);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.25 * (volume / 100)), at + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
            osc.connect(gain);
            gain.connect(audio.destination);
            osc.start(at);
            osc.stop(at + 0.32);
        } catch (err) {
            /* no sound, no harm */
        }
    }

    function showPeek(c, msg) {
        var peek = els.root.querySelector("[data-peek]");
        peek.innerHTML =
            '<button class="rp-peek" type="button" data-open-convo="' +
            esc(c.id) +
            '">' +
            personFace(msg.from, "md") +
            '<span class="rp-peek__text"><span class="rp-peek__who"><strong>' +
            esc(person(msg.from).name) +
            "</strong>" +
            (c.kind === "job" ? "<span>" + esc(c.job) + "</span>" : c.kind === "group" ? "<span>" + esc(c.name) + "</span>" : "") +
            '</span><span class="rp-peek__msg">' +
            esc(plain(msg)) +
            "</span></span></button>" +
            '<button class="rp-peek__x" type="button" data-act="peek-close" aria-label="Dismiss">' +
            icon("close") +
            "</button>";
        peek.hidden = false;
        peek.classList.remove("is-in");
        void peek.offsetWidth;
        peek.classList.add("is-in");
        global.clearTimeout(ui.peekTimer);
        ui.peekTimer = global.setTimeout(hidePeek, 7000);
    }

    function hidePeek() {
        var peek = els.root.querySelector("[data-peek]");
        global.clearTimeout(ui.peekTimer);
        peek.hidden = true;
    }

    /* ── Message actions ─────────────────────────────────── */

    /* Tools sit on their bubble's top edge; at the top of the scrolled log that is clipped, so they move to its bottom edge */
    function placeTools(row) {
        var tools = row.querySelector(".rp-dm__tools");
        var bubble = row.querySelector(".rp-dm__bubble");
        if (!tools) return;
        var room = row.getBoundingClientRect().top - els.log.getBoundingClientRect().top;
        var low = room < tools.offsetHeight;
        row.classList.toggle("is-near-top", low);
        if (low) row.style.setProperty("--tools-top", bubble.offsetTop + bubble.offsetHeight - 8 + "px");
    }

    function closeImage() {
        els.lightbox.hidden = true;
        if (ui.viewing && document.body.contains(ui.viewing)) ui.viewing.focus({ preventScroll: true });
        ui.viewing = null;
    }

    function messageOf(el) {
        var c = find(ui.active);
        var row = el.closest("[data-msg]");
        return c && row ? findBy(c.messages, "id", row.getAttribute("data-msg")) : null;
    }

    function toggleReaction(m, emoji) {
        var r = findBy(m.reactions, "emoji", emoji);
        /* One reaction per person, as chat_messagereaction allows */
        m.reactions.forEach(function (x) {
            if (x !== r) {
                var at = x.by.indexOf("me");
                if (at > -1) x.by.splice(at, 1);
            }
        });
        if (r && r.by.indexOf("me") > -1) r.by.splice(r.by.indexOf("me"), 1);
        else if (r) r.by.push("me");
        else m.reactions.push({ emoji: emoji, by: ["me"] });
        m.reactions = m.reactions.filter(function (x) {
            return x.by.length;
        });
        save();
        renderThread("keep");
    }

    function deleteMessage(m) {
        m.deleted = true;
        m.text = "";
        m.files = [];
        m.voice = null;
        m.reactions = [];
        save();
        renderThread("keep");
        renderList();
        emit(find(ui.active), m);
        announce("Message deleted");
    }

    function jumpTo(id) {
        var el = els.log.querySelector('[data-msg="' + id + '"]');
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: still() ? "auto" : "smooth" });
        el.classList.remove("is-flash");
        void el.offsetWidth;
        el.classList.add("is-flash");
    }

    function toggleVoice(m) {
        var playing = ui.playing === m.id;
        ui.playing = playing ? null : m.id;
        global.clearTimeout(toggleVoice.timer);
        renderThread("keep");
        if (!playing) {
            var parts = String(m.voice).split(":");
            var secs = Number(parts[0]) * 60 + Number(parts[1]);
            var el = els.log.querySelector('[data-voice="' + m.id + '"]');
            if (el) el.style.setProperty("--voice-length", secs + "s");
            toggleVoice.timer = global.setTimeout(function () {
                ui.playing = null;
                if (ui.open) renderThread("keep");
            }, secs * 1000);
        }
    }

    /* ── Voice recording (the bar and its timer; the preview records no audio) ── */

    function startRecording() {
        if (ui.recording) return;
        var started = Date.now();
        ui.recording = { started: started };
        els.composer.querySelector("[data-compose-row]").hidden = true;
        els.composer.querySelector("[data-recorder]").hidden = false;
        var time = els.composer.querySelector("[data-rec-time]");
        time.textContent = "0:00";
        ui.recording.timer = global.setInterval(function () {
            var s = Math.floor((Date.now() - started) / 1000);
            time.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
        }, 250);
        els.composer.querySelector('[data-act="record-send"]').focus();
        announce("Recording");
    }

    function stopRecording(sendIt) {
        if (!ui.recording) return;
        global.clearInterval(ui.recording.timer);
        var secs = Math.max(1, Math.round((Date.now() - ui.recording.started) / 1000));
        ui.recording = null;
        els.composer.querySelector("[data-compose-row]").hidden = false;
        els.composer.querySelector("[data-recorder]").hidden = true;
        if (sendIt) {
            var c = find(ui.active);
            if (c) {
                deliver(c, {
                    id: uid(),
                    from: "me",
                    at: new Date(),
                    text: "",
                    files: [],
                    reactions: [],
                    voice: Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0"),
                    status: "sending"
                });
            }
        }
        if (ui.open) els.input.focus({ preventScroll: true });
    }

    /* ── Mentions ────────────────────────────────────────── */

    function mentionQuery() {
        var v = els.input.value.slice(0, els.input.selectionStart);
        var m = /(^|\s)@([\w'-]*)$/.exec(v);
        return m ? m[2] : null;
    }

    function updateMentions() {
        var pop = els.composer.querySelector("[data-mentions]");
        var c = find(ui.active);
        var q = mentionQuery();
        if (!c || q === null || c.kind === "direct") {
            pop.hidden = true;
            return;
        }
        var list = members(c).filter(function (k) {
            return person(k).name.toLowerCase().indexOf(q.toLowerCase()) > -1;
        });
        if (!list.length) {
            pop.hidden = true;
            return;
        }
        pop.innerHTML = list
            .map(function (k, i) {
                return (
                    '<li><button type="button" role="option" data-act="mention" data-name="' +
                    esc(person(k).name) +
                    '"' +
                    (i === 0 ? ' class="is-active" aria-selected="true"' : ' aria-selected="false"') +
                    ">" +
                    personFace(k, "xs") +
                    "<span>" +
                    esc(person(k).name) +
                    "</span><small>" +
                    esc(person(k).role) +
                    "</small></button></li>"
                );
            })
            .join("");
        pop.hidden = false;
    }

    function insertMention(name) {
        var input = els.input;
        var before = input.value.slice(0, input.selectionStart).replace(/@([\w'-]*)$/, "@" + name + " ");
        var after = input.value.slice(input.selectionStart);
        input.value = before + after;
        input.setSelectionRange(before.length, before.length);
        els.composer.querySelector("[data-mentions]").hidden = true;
        autosize();
        updateComposer();
        input.focus();
    }

    function insertText(text) {
        var input = els.input;
        var start = input.selectionStart == null ? input.value.length : input.selectionStart;
        var end = input.selectionEnd == null ? input.value.length : input.selectionEnd;
        input.value = input.value.slice(0, start) + text + input.value.slice(end);
        input.setSelectionRange(start + text.length, start + text.length);
        autosize();
        updateComposer();
        input.focus();
    }

    /* ── Popovers: the menu, the reaction picker, emoji ──── */

    function closePopovers() {
        if (!els.menu) return;
        if (ui.menu && ui.menu.button) ui.menu.button.setAttribute("aria-expanded", "false");
        els.menu.hidden = true;
        els.picker.hidden = true;
        els.composer.querySelector("[data-emoji-pop]").hidden = true;
        els.composer.querySelector('[data-act="emoji"]').setAttribute("aria-expanded", "false");
        els.composer.querySelector("[data-mentions]").hidden = true;
        els.log.querySelectorAll(".rp-dm.is-touched").forEach(function (el) {
            el.classList.remove("is-touched");
        });
        ui.menu = null;
    }

    /* A menu on a row or a message moves with it while its list scrolls, and closes once it scrolls away */
    function followAnchor() {
        var button = ui.menu && ui.menu.button;
        var pop = !els.menu.hidden ? els.menu : !els.picker.hidden ? els.picker : null;
        var scroller = button && button.closest("[data-log], [data-list]");
        if (!pop || !scroller) return;
        var box = button.getBoundingClientRect();
        var view = scroller.getBoundingClientRect();
        if (box.bottom < view.top || box.top > view.bottom) closePopovers();
        else place(pop, button);
    }

    /* A re-render swaps the menu's button for a copy: the menu moves onto the copy, or closes */
    function reanchor() {
        if (!ui.menu || document.body.contains(ui.menu.button)) return;
        var twin = ui.menu.from && els.panel.querySelector(ui.menu.from);
        if (!twin) {
            closePopovers();
            return;
        }
        ui.menu.button = twin;
        twin.setAttribute("aria-expanded", "true");
        followAnchor();
    }

    function place(pop, button) {
        var panel = els.panel.getBoundingClientRect();
        var box = button.getBoundingClientRect();
        pop.hidden = false;
        var top = box.bottom - panel.top + 4;
        if (top + pop.offsetHeight > panel.height - 8) top = box.top - panel.top - pop.offsetHeight - 4;
        var right = panel.right - box.right;
        if (panel.width - right - pop.offsetWidth < 8) right = Math.max(8, panel.width - pop.offsetWidth - 8);
        pop.style.top = Math.max(8, top) + "px";
        pop.style.right = Math.max(8, right) + "px";
    }

    function menuItem(act, iconName, label, danger) {
        return (
            '<button class="rp-messenger__menu-item' +
            (danger ? " rp-messenger__menu-item--danger" : "") +
            '" type="button" role="menuitem" data-act="' +
            act +
            '">' +
            icon(iconName) +
            label +
            "</button>"
        );
    }

    function openMenu(button, items, target) {
        var same = ui.menu && ui.menu.button === button && !els.menu.hidden;
        closePopovers();
        if (same) return;
        els.menu.innerHTML = items.join("");
        ui.menu = { button: button, target: target, from: pathOf(button) };
        button.setAttribute("aria-expanded", "true");
        place(els.menu, button);
        var firstItem = els.menu.querySelector("button");
        if (firstItem) firstItem.focus({ preventScroll: true });
    }

    /* After a menu's choice, focus goes back to the button that opened it */
    function menuBack(menu, fallback) {
        if (!menu) return;
        var el = document.body.contains(menu.button) ? menu.button : menu.from && els.panel.querySelector(menu.from);
        (el || fallback || els.panel).focus({ preventScroll: true });
    }

    function convoMenu(button, c) {
        var unread = isUnread(c);
        var items = [
            menuItem("menu-pin", c.pinned ? "pin-off" : "pin", c.pinned ? "Unpin" : "Pin to the top"),
            menuItem("menu-unread", unread ? "check-check" : "circle-dot", unread ? "Mark as read" : "Mark as unread"),
            menuItem("menu-mute", c.muted ? "notifications" : "bell-off", c.muted ? "Unmute" : "Mute"),
            menuItem("menu-archive", c.archived ? "archive-restore" : "archive", c.archived ? "Move to inbox" : "Archive")
        ];
        if (c.kind === "job") items.splice(0, 0, menuItem("menu-job", "external-link", "Open job " + esc(c.job)));
        if (button.matches('[data-act="thread-menu"]') && !phone() && global.innerWidth >= 900) {
            items.push(menuItem("expand", ui.expanded ? "minimize-2" : "maximize-2", ui.expanded ? "Shrink the panel" : "Expand the panel"));
        }
        openMenu(button, items, { convo: c.id });
    }

    function messageMenu(button, m) {
        var items = [];
        if (m.text) items.push(menuItem("menu-copy", "copy", "Copy text"));
        items.push(menuItem("menu-reply", "reply", "Reply"));
        if (m.from === "me" && m.text && !m.voice) items.push(menuItem("menu-edit", "pen-line", "Edit"));
        if (m.from === "me") items.push(menuItem("menu-delete", "trash-2", "Delete", true));
        openMenu(button, items, { message: m.id });
    }

    function confirmDelete() {
        els.menu.innerHTML =
            '<p class="rp-messenger__confirm">Delete this message for everyone?</p>' +
            '<div class="rp-messenger__confirm-actions">' +
            '<button class="rp-messenger__textbtn" type="button" data-act="menu-close">Cancel</button>' +
            '<button class="rp-messenger__danger" type="button" data-act="menu-delete-yes">Delete</button>' +
            "</div>";
        els.menu.querySelector('[data-act="menu-delete-yes"]').focus();
    }

    function menuTarget() {
        var c = ui.menu && ui.menu.target.convo ? find(ui.menu.target.convo) : null;
        var thread = find(ui.active);
        var m = ui.menu && ui.menu.target.message && thread ? findBy(thread.messages, "id", ui.menu.target.message) : null;
        return { convo: c, message: m };
    }

    /* ── Events ──────────────────────────────────────────── */

    function onClick(e) {
        var t = e.target.closest("[data-act], [data-open-convo], [data-filter], [data-start-person], [data-start-job]");
        if (!t || !els.root.contains(t)) {
            var row = !finePointer() && !e.target.closest("button, a") ? e.target.closest("[data-log] .rp-dm") : null;
            var touched = !!row && row.classList.contains("is-touched");
            if (!e.target.closest("[data-menu], [data-picker], [data-emoji-pop], [data-mentions]")) closePopovers();
            /* Touch: a tap on a bubble shows its actions, as a hover does with a mouse */
            if (row) {
                placeTools(row);
                row.classList.toggle("is-touched", !touched);
            }
            return;
        }

        if (t.hasAttribute("data-open-convo")) {
            e.preventDefault();
            ui.view = ui.view === "new" ? "list" : ui.view;
            openConvo(t.getAttribute("data-open-convo"));
            return;
        }
        if (t.hasAttribute("data-start-person")) {
            startWith(t.getAttribute("data-start-person"));
            return;
        }
        if (t.hasAttribute("data-start-job")) {
            startJob(t.getAttribute("data-start-job"));
            return;
        }
        if (t.hasAttribute("data-filter")) {
            ui.filter = t.getAttribute("data-filter");
            renderList();
            return;
        }

        var act = t.getAttribute("data-act");
        var menu = ui.menu;
        var target;
        var m;

        switch (act) {
            case "close":
                close(true);
                break;
            case "expand":
                ui.expanded = !els.panel.classList.contains("is-expanded");
                writeJSON(global.localStorage, PREFS_KEY, { expanded: ui.expanded });
                closePopovers();
                syncLayout();
                if (ui.active) renderThread("end");
                break;
            case "new":
                setView("new");
                break;
            case "archived":
                setView("archived");
                break;
            case "list":
                setView("list");
                break;
            case "reset-list":
                ui.filter = "all";
                ui.query = "";
                els.search.value = "";
                els.panel.querySelector('[data-act="clear-search"]').hidden = true;
                renderList();
                break;
            case "clear-search":
                ui.query = "";
                els.search.value = "";
                t.hidden = true;
                renderList();
                els.search.focus();
                break;
            case "back":
                back();
                break;
            case "convo-menu":
                convoMenu(t, find(t.closest("[data-convo]").getAttribute("data-convo")));
                break;
            case "thread-menu":
                convoMenu(t, find(ui.active));
                break;
            case "menu-job":
                target = menuTarget().convo;
                closePopovers();
                global.location.href = "job.html?id=" + target.job;
                break;
            case "menu-pin":
                target = menuTarget().convo;
                target.pinned = !target.pinned;
                save();
                closePopovers();
                renderList();
                menuBack(menu);
                announce(target.pinned ? "Pinned" : "Unpinned");
                break;
            case "menu-unread":
                target = menuTarget().convo;
                closePopovers();
                if (isUnread(target)) {
                    markRead(target);
                } else {
                    target.markedUnread = true;
                    save();
                }
                /* Staying in it would read it again at once */
                if (target.markedUnread && ui.active === target.id) {
                    back();
                } else {
                    renderList();
                    menuBack(menu);
                }
                break;
            case "menu-mute":
                target = menuTarget().convo;
                target.muted = !target.muted;
                save();
                closePopovers();
                renderList();
                menuBack(menu);
                announce(target.muted ? "Muted" : "Unmuted");
                break;
            case "menu-archive":
                target = menuTarget().convo;
                target.archived = !target.archived;
                save();
                closePopovers();
                if (target.archived && ui.active === target.id) {
                    back();
                } else {
                    renderList();
                    menuBack(menu);
                }
                announce(target.archived ? "Archived" : "Moved to the inbox");
                break;
            case "menu-close":
                closePopovers();
                menuBack(menu, els.log);
                break;
            case "message-menu":
                messageMenu(t, messageOf(t));
                break;
            case "menu-copy":
                m = menuTarget().message;
                closePopovers();
                if (global.navigator.clipboard && m) global.navigator.clipboard.writeText(m.text).catch(function () {});
                menuBack(menu, els.log);
                RP.toast("Copied to the clipboard.", "success");
                break;
            case "menu-reply":
                m = menuTarget().message;
                closePopovers();
                startReply(m);
                break;
            case "menu-edit":
                m = menuTarget().message;
                closePopovers();
                startEdit(m);
                break;
            case "menu-delete":
                confirmDelete();
                break;
            case "menu-delete-yes":
                m = menuTarget().message;
                closePopovers();
                if (m) deleteMessage(m);
                menuBack(menu, els.log);
                break;
            case "pick-reaction":
                m = messageOf(t);
                var same = ui.menu && ui.menu.button === t && !els.picker.hidden;
                closePopovers();
                if (same) break;
                ui.menu = { button: t, target: { message: m.id }, from: pathOf(t) };
                t.setAttribute("aria-expanded", "true");
                place(els.picker, t);
                els.picker.querySelector("button").focus({ preventScroll: true });
                break;
            case "react-pick":
                m = menuTarget().message;
                closePopovers();
                if (m) toggleReaction(m, t.getAttribute("data-emoji"));
                menuBack(menu, els.log);
                break;
            case "react":
                m = messageOf(t);
                if (m) toggleReaction(m, t.getAttribute("data-emoji"));
                break;
            case "reply":
                startReply(messageOf(t));
                break;
            case "jump":
                jumpTo(t.getAttribute("data-to"));
                break;
            case "jump-latest":
                scrollToEnd(true);
                t.hidden = true;
                t.querySelector("[data-jump-count]").textContent = "";
                break;
            case "voice":
                toggleVoice(messageOf(t));
                break;
            case "view-image":
                ui.viewing = t;
                els.lightbox.querySelector("[data-lightbox-img]").src = t.getAttribute("data-src");
                els.lightbox.hidden = false;
                els.lightbox.querySelector("button").focus();
                break;
            case "cancel-context":
                cancelContext();
                break;
            case "attach":
                els.fileInput.click();
                break;
            case "remove-file":
                ui.files.splice(Number(t.getAttribute("data-index")), 1);
                renderFiles();
                break;
            case "emoji":
                var pop = els.composer.querySelector("[data-emoji-pop]");
                var openNow = pop.hidden;
                closePopovers();
                pop.hidden = !openNow;
                t.setAttribute("aria-expanded", String(openNow));
                if (openNow) pop.querySelector("button").focus({ preventScroll: true });
                break;
            case "insert-emoji":
                insertText(t.getAttribute("data-emoji"));
                break;
            case "mention":
                insertMention(t.getAttribute("data-name"));
                break;
            case "record":
                startRecording();
                break;
            case "record-cancel":
                stopRecording(false);
                break;
            case "record-send":
                stopRecording(true);
                break;
            case "peek-close":
                hidePeek();
                break;
        }
    }

    function onKeydown(e) {
        if (e.key === "Escape") {
            if (!els.lightbox.hidden) {
                closeImage();
                return;
            }
            /* Esc belongs to whatever has focus, so the page's own popovers close alone */
            if (!els.root.contains(e.target)) return;
            var popOpen = !els.menu.hidden || !els.picker.hidden || !els.composer.querySelector("[data-emoji-pop]").hidden || !els.composer.querySelector("[data-mentions]").hidden;
            if (popOpen) {
                var menu = ui.menu;
                closePopovers();
                if (menu) menuBack(menu, els.log);
                else els.input.focus();
                e.preventDefault();
                return;
            }
            if (ui.recording) {
                stopRecording(false);
                return;
            }
            if (ui.reply || ui.editing) {
                cancelContext();
                return;
            }
            if (ui.open) close(true);
            return;
        }

        if (!ui.open) return;

        /* ↑ / ↓ walk the conversation rows */
        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.target.closest("[data-list]")) {
            var rows = [].slice.call(els.list.querySelectorAll(".rp-convo__open"));
            var at = rows.indexOf(e.target.closest(".rp-convo__open"));
            var next = e.key === "ArrowDown" ? Math.min(rows.length - 1, at + 1) : Math.max(0, at - 1);
            if (rows[next]) {
                e.preventDefault();
                rows[next].focus();
            }
        }
        if (e.key === "ArrowDown" && e.target === els.search && els.list.querySelector(".rp-convo__open")) {
            e.preventDefault();
            els.list.querySelector(".rp-convo__open").focus();
        }
    }

    function onInputKeydown(e) {
        var pop = els.composer.querySelector("[data-mentions]");
        if (!pop.hidden && /^(ArrowDown|ArrowUp|Enter|Tab)$/.test(e.key)) {
            var opts = [].slice.call(pop.querySelectorAll("button"));
            var at = opts.indexOf(pop.querySelector(".is-active"));
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(opts[Math.max(0, at)].getAttribute("data-name"));
                return;
            }
            e.preventDefault();
            var next = (at + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
            opts.forEach(function (o, i) {
                o.classList.toggle("is-active", i === next);
                o.setAttribute("aria-selected", String(i === next));
            });
            return;
        }

        if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            send();
            return;
        }

        /* ↑ in an empty field edits the last message you sent, as Slack does */
        if (e.key === "ArrowUp" && !els.input.value && !ui.editing) {
            var c = find(ui.active);
            var mine = c && c.messages.filter(function (m) {
                return m.from === "me" && m.text && !m.deleted && !m.voice;
            }).pop();
            if (mine) {
                e.preventDefault();
                startEdit(mine);
            }
        }
    }

    function wire() {
        els.launcher.addEventListener("click", toggle);
        els.root.addEventListener("click", onClick);
        document.addEventListener("keydown", onKeydown);

        /* Capture: a click anywhere outside the open panel or its bubble closes popovers, not the panel */
        document.addEventListener(
            "click",
            function (e) {
                if (!els.root.contains(e.target)) closePopovers();
            },
            true
        );

        els.search.addEventListener("input", function () {
            ui.query = els.search.value.trim();
            els.panel.querySelector('[data-act="clear-search"]').hidden = !ui.query;
            renderList();
        });

        els.input.addEventListener("input", function () {
            autosize();
            updateComposer();
            updateMentions();
        });
        els.input.addEventListener("keydown", onInputKeydown);
        els.input.addEventListener("click", updateMentions);

        els.composer.addEventListener("submit", function (e) {
            e.preventDefault();
            send();
        });

        els.fileInput.addEventListener("change", function () {
            addFiles(els.fileInput.files);
            els.fileInput.value = "";
        });

        /* Drop files anywhere on the open conversation */
        var drop = els.panel.querySelector("[data-drop]");
        var depth = 0;
        els.thread.addEventListener("dragenter", function (e) {
            if (!e.dataTransfer || [].indexOf.call(e.dataTransfer.types || [], "Files") === -1) return;
            depth += 1;
            drop.hidden = false;
        });
        els.thread.addEventListener("dragleave", function () {
            depth = Math.max(0, depth - 1);
            if (!depth) drop.hidden = true;
        });
        els.thread.addEventListener("dragover", function (e) {
            if (!drop.hidden) e.preventDefault();
        });
        els.thread.addEventListener("drop", function (e) {
            if (drop.hidden) return;
            e.preventDefault();
            depth = 0;
            drop.hidden = true;
            addFiles(e.dataTransfer.files);
        });

        els.log.addEventListener(
            "scroll",
            function () {
                followAnchor();
                var hovered = els.log.querySelector(".rp-dm:hover");
                if (hovered) placeTools(hovered);
                if (!ui.menu) {
                    els.log.querySelectorAll(".rp-dm.is-touched").forEach(function (el) {
                        el.classList.remove("is-touched");
                    });
                }
                if (nearBottom()) {
                    var jump = els.panel.querySelector('[data-act="jump-latest"]');
                    jump.hidden = true;
                    jump.querySelector("[data-jump-count]").textContent = "";
                    jump.querySelector("[data-jump-count]").hidden = true;
                } else if (els.log.scrollHeight - els.log.scrollTop - els.log.clientHeight > 320) {
                    els.panel.querySelector('[data-act="jump-latest"]').hidden = false;
                }
            },
            { passive: true }
        );

        els.list.addEventListener("scroll", followAnchor, { passive: true });

        ["mouseover", "focusin"].forEach(function (type) {
            els.log.addEventListener(type, function (e) {
                var row = e.target.closest(".rp-dm");
                if (row) placeTools(row);
            });
        });

        /* Phones fire resize as their toolbars and keyboard move; only a new width changes the layout */
        var width = global.innerWidth;
        global.addEventListener("resize", function () {
            if (global.innerWidth === width) return;
            width = global.innerWidth;
            closePopovers();
            if (!ui.open) return;
            syncLayout();
            document.body.classList.toggle("rp-no-scroll", phone());
        });

        /* The topbar's Messages button opens the same panel */
        var topBtn = document.getElementById("rpMessagesBtn");
        if (topBtn) {
            topBtn.addEventListener("click", function () {
                if (ui.open && !ui.active) close(true);
                else {
                    if (ui.active && !els.panel.classList.contains("is-expanded")) back();
                    open(false);
                }
            });
        }

        els.lightbox.addEventListener("click", function (e) {
            if (!e.target.closest("img")) closeImage();
        });

        global.addEventListener("pagehide", stashDraft);
    }

    /* ── The demo's one unprompted message ───────────────── */

    function scheduleDemo() {
        var demo = RP.MESSAGE_DEMO;
        if (!demo || readJSON(global.sessionStorage, DEMO_KEY)) return;
        global.setTimeout(function () {
            if (readJSON(global.sessionStorage, DEMO_KEY)) return;
            writeJSON(global.sessionStorage, DEMO_KEY, true);
            var c = find(demo.conversation);
            if (!c) return;
            setTyping(c, demo.from);
            global.setTimeout(function () {
                setTyping(c, null);
                arrive(c, { id: uid(), from: demo.from, at: new Date(), text: demo.text, files: [], reactions: [] });
            }, 2200);
        }, demo.after * 1000);
    }

    /* ── For the job page ────────────────────────────────── */

    function jobThread(jobId) {
        var c = findBy(convos, "job", jobId);
        if (!c) return null;
        return c.messages
            .filter(function (m) {
                return !m.system && !m.deleted;
            })
            .map(function (m) {
                return {
                    from: m.from === "me" ? "me" : "pm",
                    at: m.at.getTime(),
                    text: m.text,
                    file: m.files[0] ? { name: m.files[0].name, size: m.files[0].size } : null,
                    voice: m.voice || null
                };
            });
    }

    function sendToJob(jobId, text) {
        var c = findBy(convos, "job", jobId);
        if (!c) return;
        deliver(c, { id: uid(), from: "me", at: new Date(), text: text, files: [], reactions: [], status: "sending" });
    }

    function openJob(jobId) {
        startJob(jobId);
    }

    /* ── Boot ────────────────────────────────────────────── */

    load();

    function mount() {
        if (!icon || !document.getElementById("rp-layout")) return;

        var root = document.createElement("div");
        root.className = "rp-messenger";
        root.id = "rpMessenger";
        root.innerHTML = shellMarkup();
        document.body.appendChild(root);
        document.body.classList.add("rp-has-messenger");

        els.root = root;
        els.panel = root.querySelector("#rpMessengerPanel");
        els.launcher = root.querySelector("[data-launcher]");
        els.badge = root.querySelector("[data-badge]");
        els.list = root.querySelector("[data-list]");
        els.search = root.querySelector("[data-search]");
        els.thread = root.querySelector("[data-thread]");
        els.log = root.querySelector("[data-log]");
        els.typing = root.querySelector("[data-typing]");
        els.composer = root.querySelector("[data-composer]");
        els.input = root.querySelector("[data-input]");
        els.send = root.querySelector("[data-send]");
        els.fileInput = root.querySelector("[data-file-input]");
        els.menu = root.querySelector("[data-menu]");
        els.picker = root.querySelector("[data-picker]");
        els.live = root.querySelector("[data-live]");
        els.lightbox = root.querySelector("[data-lightbox]");
        /* Out of the bubble's stacking context, so the viewer also covers the topbar */
        document.body.appendChild(els.lightbox);

        ui.expanded = !!(readJSON(global.localStorage, PREFS_KEY) || {}).expanded;
        wire();
        renderBadges();
        updateComposer();
        scheduleDemo();
    }

    RP.messenger = {
        open: open,
        close: close,
        openConversation: openConvo,
        openJob: openJob,
        jobThread: jobThread,
        sendToJob: sendToJob
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mount);
    } else {
        mount();
    }
})(window);
