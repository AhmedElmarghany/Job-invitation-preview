/* ============================================================
   USER ACCOUNT — account.html
   The resource's own profile, rendered from RP.PROFILE: personal
   details, education, work, technology, certifications, documents
   and the terms. Saving, uploading and agreeing change the page in
   memory only; nothing is sent anywhere and a reload starts over.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;
    var P = RP.PROFILE;
    var LOCALE = "en-NZ";
    var YEAR = new Date().getFullYear();
    var PLACEHOLDER_PHOTO = RP.USER.photo;
    var MAX_UPLOAD = 10 * 1024 * 1024;

    var CERT_STATUS = {
        verified: { label: "Verified", pill: "status-verified" },
        pending: { label: "Pending verification", pill: "status-pending" },
        rejected: { label: "Rejected", pill: "status-rejected" }
    };

    var editing = { personal: false, technology: false };
    var dirty = { personal: false, technology: false };
    var techDraft = null;
    var picked = { photo: null, file: null };
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

    function bytes(size) {
        return size >= 1e6 ? (size / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1e3)) + " KB";
    }

    function dot() {
        return '<span class="rp-dot" aria-hidden="true"></span>';
    }

    function country(code) {
        return RP.COUNTRIES.filter(function (c) {
            return c.code === code;
        })[0];
    }

    function countryName(code) {
        var c = country(code);
        return c ? c.name : "";
    }

    function phoneText(phone) {
        if (!phone || !phone.number) return "";
        var c = country(phone.country);
        return (c ? c.dial + " " : "") + phone.number;
    }

    function tzOffset(id) {
        var zone = RP.TIMEZONES.filter(function (z) {
            return z.id === id;
        })[0];
        return zone ? "GMT" + zone.offset : "";
    }

    function localTime(tz) {
        try {
            return new Date().toLocaleTimeString(LOCALE, { timeZone: tz, hour: "numeric", minute: "2-digit" });
        } catch (err) {
            return "";
        }
    }

    function yearsLabel(years) {
        if (years < 1) return "Under a year";
        return years + (years === 1 ? " year" : " years");
    }

    function daysUntil(date) {
        return Math.ceil((date - Date.now()) / 86400000);
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

    function techCount() {
        return P.technology.length + P.customTools.length;
    }

    /* ── Form controls ───────────────────────────────────── */

    function attrs(o) {
        var out = "";
        if (o.required) out += " required";
        if (o.maxlength) out += ' maxlength="' + o.maxlength + '"';
        if (o.placeholder) out += ' placeholder="' + esc(o.placeholder) + '"';
        if (o.dir) out += ' dir="' + o.dir + '"';
        if (o.autofocus) out += " data-autofocus";
        if (o.autocomplete) out += ' autocomplete="' + o.autocomplete + '"';
        return out;
    }

    function input(id, value, o) {
        o = o || {};
        return (
            '<input type="' + (o.type || "text") + '" class="form-control" id="' + id + '" name="' + id + '" value="' +
            esc(value || "") + '"' + attrs(o) + ">"
        );
    }

    function textarea(id, value, o) {
        o = o || {};
        return (
            '<textarea class="form-control" id="' + id + '" name="' + id + '" rows="3"' + attrs(o) + ">" + esc(value || "") +
            "</textarea>" +
            (o.maxlength
                ? '<span class="pd-counter" data-counter-for="' + id + '">' + (value || "").length + " / " + o.maxlength + "</span>"
                : "")
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

    function countryOptions() {
        return RP.COUNTRIES.map(function (c) {
            return [c.code, c.name];
        });
    }

    function timezoneOptions() {
        return RP.TIMEZONES.map(function (z) {
            return [z.id, "(GMT" + z.offset + ") " + z.id];
        });
    }

    function yearOptions(from, to) {
        var out = [];
        for (var y = to; y >= from; y--) out.push([y, y]);
        return out;
    }

    /* Stands in for intl-tel-input: the dial code and the national number, one pill */
    function phoneControl(id, phone, required) {
        return (
            '<div class="pd-phone"><select class="form-control" id="' + id + '_country" name="' + id + '_country" aria-label="Country code">' +
            RP.COUNTRIES.map(function (c) {
                return '<option value="' + c.code + '"' + (c.code === phone.country ? " selected" : "") + ">" + c.code + " " + c.dial + "</option>";
            }).join("") +
            '</select><input type="tel" class="form-control" id="' + id + '" name="' + id + '" value="' + esc(phone.number) +
            '" inputmode="tel" autocomplete="tel-national"' + (required ? " required" : "") + "></div>"
        );
    }

    function field(id, label, control, o) {
        o = o || {};
        return (
            '<div class="pd-field' + (o.cls ? " " + o.cls : "") + '"><label for="' + id + '">' + label +
            (o.required ? ' <span class="asterisk" aria-hidden="true">*</span>' : "") + "</label>" + control +
            (o.hint ? '<p class="pd-field-hint">' + o.hint + "</p>" : "") + "</div>"
        );
    }

    /* ── Shared pieces ───────────────────────────────────── */

    function cardHead(iconName, title, aside) {
        return '<div class="rp-card__head"><h2 class="rp-card__title">' + icon(iconName) + title + "</h2>" + (aside || "") + "</div>";
    }

    function addButton(act, label, iconName) {
        return '<button type="button" class="rp-textbtn" data-act="' + act + '">' + icon(iconName || "plus") + label + "</button>";
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

    function group(iconName, title, note, inner) {
        return (
            '<div class="pd-group"><div class="pd-group-head"><span class="pd-group-icon" aria-hidden="true">' + icon(iconName) +
            '</span><div class="pd-group-titles"><h3 class="pd-group-title">' + title + '</h3><p class="pd-group-note">' + note +
            '</p></div></div><div class="pd-grid">' + inner + "</div></div>"
        );
    }

    /* A value, or the dashed "+ Add …" that opens the editor on that field */
    function item(label, value, focus, addLabel, cls, prose) {
        var body =
            value
                ? '<div class="pd-value' + (prose ? " is-prose" : "") + '">' + value + "</div>"
                : focus
                ? '<button type="button" class="pd-add" data-act="edit" data-edit="personal" data-focus-field="' + focus + '">' + addLabel + "</button>"
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

    function rowActions(kind, id, name) {
        return (
            '<div class="rp-entry__actions">' +
            '<button type="button" class="rp-iconbtn" data-act="edit-' + kind + '" data-id="' + id + '" aria-label="Edit ' + esc(name) + '" title="Edit">' +
            icon("pen-line") + "</button>" +
            '<div class="rp-confirm-wrap"><button type="button" class="rp-iconbtn is-danger" data-act="ask-delete" data-kind="' + kind +
            '" data-id="' + id + '" aria-label="Delete ' + esc(name) + '" title="Delete">' + icon("trash-2") + "</button></div></div>"
        );
    }

    /* ── Head ────────────────────────────────────────────── */

    function headMarkup() {
        return (
            '<div class="rp-accthead__inner">' +
            '<nav class="rp-crumbs" aria-label="Breadcrumb"><a href="dashboard.html">Dashboard</a>' + icon("chevron-right") +
            '<span aria-current="page">User Account</span></nav>' +
            '<div class="rp-accthead__row">' +
            '<div class="rp-accthead__avatar"><img src="' + esc(RP.USER.photo) + '" alt="' + esc(RP.USER.fullName) + '" data-avatar>' +
            '<button type="button" class="rp-accthead__camera" data-act="photo" aria-label="Change profile photo" title="Change photo">' +
            icon("camera") + "</button></div>" +
            '<div class="rp-accthead__titles"><h1 class="rp-accthead__title">' + esc(RP.USER.fullName) + "</h1>" +
            '<p class="rp-accthead__meta"><span class="rp-tag">User Profile</span><span class="rp-idchip">' + esc(RP.USER.resourceId) +
            '</span><span class="rp-accthead__mail">' + icon("mail") + esc(P.email) + "</span></p></div>" +
            '<div class="rp-accthead__actions"><a class="rp-button rp-button--outline" href="professional-profile.html">' + icon("id-card") +
            "Professional Profile</a></div>" +
            "</div></div>"
        );
    }

    /* ── Section tabs ────────────────────────────────────── */

    function sectionList() {
        return [
            { id: "personal", label: "Personal details", icon: "user-round" },
            { id: "education", label: "Education", icon: "graduation-cap", count: P.educations.length },
            { id: "work", label: "Work experience", icon: "briefcase-business", count: P.works.length },
            { id: "technology", label: "Technology", icon: "app-window", count: techCount() },
            { id: "certificates", label: "Certifications", icon: "award", count: P.certificates.length },
            { id: "documents", label: "Documents", icon: "files", count: P.documents.length },
            { id: "terms", label: "Terms", icon: "shield-check", flag: P.terms.state !== "agreed" }
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

    /* ── Personal details ────────────────────────────────── */

    function phoneValue(phone) {
        var text = phoneText(phone);
        return text ? '<span dir="ltr">' + esc(text) + "</span>" : null;
    }

    function personalView() {
        var tz = P.timezone
            ? esc(P.timezone)
            : null;

        return (
            group(
                "user-round",
                "Basics",
                "How project managers and our emails address you.",
                item("Name", esc(RP.USER.fullName)) +
                    item("Name in Native Language", P.nativeName ? '<span dir="auto">' + esc(P.nativeName) + "</span>" : null, "native_name", "Add native name") +
                    item("Email Greeting", P.greeting ? esc(P.greeting) : null, "greeting", "Add greeting") +
                    item(
                        "Website / LinkedIn",
                        P.website
                            ? '<a href="https://' + esc(P.website) + '" data-act="external" data-say="' + esc(P.website) + ' would open in a new tab.">' +
                                  esc(P.website) + "</a>" + icon("external-link", "pd-value-icon")
                            : null,
                        "website",
                        "Add website or LinkedIn",
                        "pd-col-wide"
                    ) +
                    item("About me", P.about ? esc(P.about) : null, "aboutMe", "Add a short description", "pd-col-full", true)
            ) +
            group(
                "phone",
                "Contact and availability",
                "Where we reach you, and the clock your deadlines are set in.",
                item("Phone number", phoneValue(P.phone), "phoneNumber", "Add phone number") +
                    item("Mobile phone number", phoneValue(P.mobile), "mobilePhoneNumber", "Add mobile phone") +
                    item(icon("whatsapp") + "WhatsApp", phoneValue(P.whatsapp), "whatsapp", "Add WhatsApp number") +
                    item("Email address", esc(P.email), null, null, "pd-col-wide") +
                    item("Time zone", tz, "timezone", "Add time zone")
            ) +
            group(
                "map-pin",
                "Address",
                "Where you are based. It appears on your bills.",
                item("Country", country(P.country) ? esc(countryName(P.country)) : null, "country", "Add country") +
                    item("City", P.city ? esc(P.city) : null, "city", "Add city") +
                    item("State or Province", P.state ? esc(P.state) : null, "state", "Add state or province") +
                    item("Street address", P.address ? esc(P.address) : null, "address", "Add street address", "pd-col-wide") +
                    item("Zip Code", P.zip ? esc(P.zip) : null, "zipCode", "Add ZIP code")
            )
        );
    }

    function lockedEmail() {
        var why = "Email cannot be changed directly. Please contact support to update your registered email.";
        return (
            '<div class="pd-field pd-col-wide"><label for="email_locked">Email address <span class="pd-lock-badge" tabindex="0" data-tip="' + why +
            '" aria-label="' + why + '">' + icon("lock") + "Not editable</span></label>" +
            '<div class="pd-locked-shell"><input type="email" class="form-control" id="email_locked" readonly aria-readonly="true" value="' +
            esc(P.email) + '">' + icon("lock", "pd-locked-icon") + "</div></div>"
        );
    }

    function personalForm() {
        return (
            '<form class="pd-form" id="rpPersonalForm" novalidate>' +
            group(
                "user-round",
                "Basics",
                "How project managers and our emails address you.",
                field("first_name", "Name", input("first_name", RP.USER.fullName, { required: true, maxlength: 80, autocomplete: "name" }), { required: true }) +
                    field("native_name", "Name in Native Language", input("native_name", P.nativeName, { dir: "auto", maxlength: 80 }), {
                        hint: "As it is written in your own script."
                    }) +
                    field("greeting", "Email Greeting", input("greeting", P.greeting, { maxlength: 32, placeholder: "Mr, Mrs, Ms, Dr ..." })) +
                    field("website", "Website / LinkedIn", input("website", P.website, { maxlength: 100, placeholder: "Your website or LinkedIn" }), {
                        cls: "pd-col-wide"
                    }) +
                    field("aboutMe", "About me", textarea("aboutMe", P.about, { maxlength: 600, placeholder: "Describe your experience and skills" }), {
                        cls: "pd-col-full"
                    })
            ) +
            group(
                "phone",
                "Contact and availability",
                "Where we reach you, and the clock your deadlines are set in.",
                field("phoneNumber", "Phone number", phoneControl("phoneNumber", P.phone, true), { required: true }) +
                    field("mobilePhoneNumber", "Mobile phone number", phoneControl("mobilePhoneNumber", P.mobile)) +
                    field("whatsapp", icon("whatsapp") + "WhatsApp", phoneControl("whatsapp", P.whatsapp)) +
                    lockedEmail() +
                    field("timezone", "Time zone", select("timezone", timezoneOptions(), P.timezone, { required: true, empty: "Select your time zone" }), {
                        required: true
                    })
            ) +
            group(
                "map-pin",
                "Address",
                "Where you are based. It appears on your bills.",
                field("country", "Country", select("country", countryOptions(), P.country, { required: true, empty: "Select your country" }), { required: true }) +
                    field("city", "City", input("city", P.city, { placeholder: "Select or type your city", maxlength: 60 })) +
                    field("state", "State or Province", input("state", P.state, { placeholder: "State, province, or region", maxlength: 30 })) +
                    field("address", "Street address", input("address", P.address, { placeholder: "Start typing your address...", maxlength: 160 }), {
                        cls: "pd-col-wide"
                    }) +
                    field("zipCode", "Zip Code", input("zipCode", P.zip, { maxlength: 10 }))
            ) +
            "</form>"
        );
    }

    /* customer/profile/personal_details.html's bar: Reset password while reading, Cancel and Save while editing */
    function personalActions() {
        if (editing.personal) return saveBar("personal", "rpPersonalForm");
        return (
            '<div class="pd-actions"><p class="pd-actions-note"></p>' +
            '<button type="button" class="pd-edit-btn is-danger" data-act="password" aria-haspopup="dialog">Reset password</button>' +
            '<button type="button" class="pd-edit-btn pd-foot-edit" data-act="edit" data-edit="personal">' + icon("pen-line") + "Edit</button></div>"
        );
    }

    function personalCard() {
        var on = editing.personal;
        return (
            '<section class="rp-card' + (on ? " is-editing" : "") + '" id="personal">' +
            cardHead("user-round", "Personal details", '<div class="pd-head-actions">' + (on ? cancelChip("personal") : editChip("personal")) + "</div>") +
            '<div class="rp-card__body">' + (on ? personalForm() : personalView()) + personalActions() + "</div></section>"
        );
    }

    /* ── Education ───────────────────────────────────────── */

    function educationItem(e) {
        var title = esc(e.degree) + (e.major ? " · " + esc(e.major) : "");
        return (
            '<li class="rp-entry" id="edu-' + e.id + '"><span class="rp-entry__icon" aria-hidden="true">' + icon("school") + "</span>" +
            '<div class="rp-entry__body"><p class="rp-entry__title">' + title + '</p><p class="rp-entry__sub">' + esc(e.university) +
            '</p><p class="rp-entry__meta">' + esc(countryName(e.country)) + "</p></div>" +
            '<div class="rp-entry__side"><span class="rp-period" title="Graduation year">' + e.year + "</span></div>" +
            rowActions("education", e.id, e.degree + " " + (e.major || "")) + "</li>"
        );
    }

    function educationCard() {
        var list = P.educations.slice().sort(function (a, b) {
            return b.year - a.year;
        });
        var body = list.length
            ? '<ul class="rp-entries">' + list.map(educationItem).join("") + "</ul>"
            : empty("graduation-cap", "No education added yet", "Add the degrees and diplomas you hold. They show on the profile project managers see.", "add-education", "Add education");
        return (
            '<section class="rp-card" id="education">' +
            cardHead("graduation-cap", "Education", list.length ? addButton("add-education", "Add education") : "") +
            '<div class="rp-card__body">' + body + "</div></section>"
        );
    }

    /* ── Work experience ─────────────────────────────────── */

    function workItem(w) {
        var years = (w.end || YEAR) - w.start;
        var long = w.duties && w.duties.length > 150;
        return (
            '<li class="rp-entry" id="work-' + w.id + '"><span class="rp-entry__icon" aria-hidden="true">' + icon("building-2") + "</span>" +
            '<div class="rp-entry__body"><p class="rp-entry__title">' + esc(w.position) + "</p>" +
            '<p class="rp-entry__sub">' + esc(w.company) + (w.country ? dot() + esc(countryName(w.country)) : "") + "</p>" +
            (w.duties ? '<p class="rp-entry__text" id="duties-' + w.id + '">' + esc(w.duties) + "</p>" : "") +
            (long ? '<button type="button" class="rp-linkbtn rp-entry__more" data-act="more" data-target="duties-' + w.id + '" aria-expanded="false" aria-controls="duties-' + w.id + '">Show more</button>' : "") +
            "</div>" +
            '<div class="rp-entry__side"><span class="rp-period' + (w.end ? "" : " is-current") + '">' + w.start + " – " + (w.end || "Present") +
            '</span><span class="rp-entry__meta">' + yearsLabel(years) + "</span></div>" +
            rowActions("work", w.id, w.position) + "</li>"
        );
    }

    function workCard() {
        var list = P.works.slice().sort(function (a, b) {
            return (b.end || 9999) - (a.end || 9999) || b.start - a.start;
        });
        var body;
        if (list.length) {
            body = '<ul class="rp-entries">' + list.map(workItem).join("") + "</ul>";
        } else if (P.noExperience) {
            body =
                empty("briefcase-business", "No work experience yet", "You told us you are just starting out. Add a role as soon as you have one.", "add-work", "Add work experience") +
                optOut();
        } else {
            body =
                empty("briefcase-business", "No work experience added yet", "Add the companies you have worked for, or tick the box below if you are just starting out.", "add-work", "Add work experience") +
                optOut();
        }
        return (
            '<section class="rp-card" id="work">' +
            cardHead("briefcase-business", "Work experience", list.length ? addButton("add-work", "Add experience") : "") +
            '<div class="rp-card__body">' + body + "</div></section>"
        );
    }

    function optOut() {
        return (
            '<label class="rp-optout"><input type="checkbox" data-no-experience' + (P.noExperience ? " checked" : "") +
            "><span>I have no work experience</span></label>"
        );
    }

    /* ── Technology ──────────────────────────────────────── */

    function techView() {
        var groups = RP.TECH_GROUPS.map(function (g) {
            return {
                label: g.label,
                icon: g.icon,
                tools: g.tools.filter(function (t) {
                    return P.technology.indexOf(t) !== -1;
                })
            };
        }).filter(function (g) {
            return g.tools.length;
        });
        if (P.customTools.length) groups.push({ label: "Other tools", icon: "shapes", tools: P.customTools });

        return (
            '<div class="rp-tech">' +
            groups
                .map(function (g) {
                    return (
                        '<div class="rp-tech__group"><p class="rp-tech__label">' + icon(g.icon) + esc(g.label) + '</p><ul class="rp-chips">' +
                        g.tools
                            .map(function (t) {
                                return '<li class="rp-chip">' + esc(t) + "</li>";
                            })
                            .join("") +
                        "</ul></div>"
                    );
                })
                .join("") +
            "</div>"
        );
    }

    function toolToggle(name, on) {
        return (
            '<button type="button" class="rp-toggle" aria-pressed="' + on + '" data-act="toggle-tool" data-tool="' + esc(name) + '">' +
            icon("check") + esc(name) + "</button>"
        );
    }

    function customChip(name) {
        return (
            '<span class="rp-toggle is-custom" data-tool="' + esc(name) + '">' + icon("check") + esc(name) +
            '<button type="button" class="rp-iconbtn rp-iconbtn--bare" data-act="remove-tool" data-tool="' + esc(name) + '" aria-label="Remove ' +
            esc(name) + '">' + icon("close") + "</button></span>"
        );
    }

    function techCountText() {
        return "<strong>" + (techDraft.tools.length + techDraft.custom.length) + "</strong> selected";
    }

    function techEditor() {
        return (
            '<form class="pd-form rp-techedit" id="rpTechForm" novalidate>' +
            '<p class="rp-card__intro">Pick every tool you are comfortable delivering in. Anything missing goes under Other tools.</p>' +
            '<div class="rp-techedit__bar"><label class="rp-search">' + icon("search") +
            '<input type="search" placeholder="Search tools" aria-label="Search tools" data-tech-search autocomplete="off"></label>' +
            '<span class="rp-techedit__count" data-tech-count aria-live="polite">' + techCountText() + "</span></div>" +
            '<div class="rp-tech">' +
            RP.TECH_GROUPS.map(function (g) {
                return (
                    '<div class="rp-tech__group" data-group="' + g.key + '"><p class="rp-tech__label">' + icon(g.icon) + esc(g.label) +
                    '</p><div class="rp-chips">' +
                    g.tools
                        .map(function (t) {
                            return toolToggle(t, techDraft.tools.indexOf(t) !== -1);
                        })
                        .join("") +
                    "</div></div>"
                );
            }).join("") +
            '<div class="rp-tech__group" data-group="other"><p class="rp-tech__label">' + icon("shapes") + 'Other tools</p><div class="rp-chips" data-custom>' +
            techDraft.custom.map(customChip).join("") + "</div>" +
            '<div class="rp-addtool"><input class="form-control" type="text" maxlength="40" placeholder="Add a tool that is not listed" aria-label="Tool name" data-tech-new>' +
            '<button type="button" class="pd-edit-btn" data-act="add-tool">' + icon("plus") + "Add</button></div></div>" +
            '<p class="rp-tech__nomatch" data-tech-nomatch hidden></p>' +
            "</div></form>"
        );
    }

    function technologyCard() {
        var on = editing.technology;
        var has = techCount() > 0;
        var body;

        if (on) {
            body = techEditor() + saveBar("technology", "rpTechForm");
        } else if (!has) {
            body = empty(
                "app-window",
                "Which software do you work in?",
                "Pick the tools you are confident with. Project managers look here when a job needs one — an InDesign file, a Trados package, a Zoom booking.",
                "edit",
                "Add your software",
                ' data-edit="technology"'
            );
        } else {
            body = techView() + '<div class="pd-actions is-twin">' + editChip("technology").replace("pd-edit-btn", "pd-edit-btn pd-foot-edit") + "</div>";
        }

        return (
            '<section class="rp-card' + (on ? " is-editing" : "") + '" id="technology">' +
            cardHead("app-window", "Technology", '<div class="pd-head-actions">' + (on ? cancelChip("technology") : has ? editChip("technology") : "") + "</div>") +
            '<div class="rp-card__body">' + body + "</div></section>"
        );
    }

    /* ── Certifications ──────────────────────────────────── */

    function certItem(c) {
        var status = CERT_STATUS[c.status];
        var left = c.expires ? daysUntil(c.expires) : null;
        var soon = left !== null && left <= 60 && c.status !== "rejected"
            ? '<span class="rp-soon">' + icon("calendar-clock") + (left <= 0 ? "Expired" : "Expires in " + left + (left === 1 ? " day" : " days")) + "</span>"
            : "";

        return (
            '<li class="rp-entry" id="cert-' + c.id + '"><span class="rp-entry__icon" aria-hidden="true">' + icon("award") + "</span>" +
            '<div class="rp-entry__body"><p class="rp-entry__title">' + esc(c.name) + "</p>" +
            '<p class="rp-entry__sub">' + esc(c.service) + dot() + '<span class="rp-pair">' + esc(c.source) + icon("arrow-right") + esc(c.target) +
            "</span>" + dot() + esc(c.country) + "</p>" +
            '<p class="rp-entry__meta"><span>ID ' + esc(c.certId) + "</span>" + dot() + "<span>" +
            (c.expires ? "Expires " + fmtDate(c.expires) : "Lifetime") + "</span>" + soon + dot() +
            '<button type="button" class="rp-linkbtn" data-act="view-file" data-name="' + esc(c.file) + '">View certificate</button></p>' +
            (c.status === "rejected" && c.reason
                ? '<div class="rp-callout rp-callout--danger">' + icon("circle-alert") + "<span><strong>Rejection reason:</strong> " + esc(c.reason) +
                  ' <a href="professional-profile.html#translator_prices">Replace the file</a></span></div>'
                : "") +
            "</div>" +
            '<div class="rp-entry__side"><span class="status-pill ' + status.pill + '"><span class="status-dot"></span><span class="status-text">' +
            status.label + "</span></span></div></li>"
        );
    }

    function certificatesCard() {
        var link = "professional-profile.html#translator_prices";
        var body = P.certificates.length
            ? '<ul class="rp-entries">' + P.certificates.map(certItem).join("") + "</ul>"
            : empty("award", "No certifications yet", "Add them from Services &amp; Prices on your Professional Profile. They show here once added.");

        return (
            '<section class="rp-card" id="certificates">' +
            cardHead("award", "Certifications", '<a class="rp-textbtn" href="' + link + '">Manage' + icon("arrow-right") + "</a>") +
            '<div class="rp-card__body"><div class="rp-callout rp-callout--info rp-callout--lead">' + icon("info") +
            '<span>Certificates are added and updated from <a href="' + link + '">Services &amp; Prices</a> on your Professional Profile, where each one is tied to a service.</span></div>' +
            body + "</div></section>"
        );
    }

    /* ── Documents ───────────────────────────────────────── */

    function docItem(d) {
        var type = RP.DOC_TYPES[d.type] || "Document";
        var isImage = /\.(jpe?g|png)$/i.test(d.name);
        return (
            '<li class="rp-fileitem" id="doc-' + d.id + '"><span class="rp-fileitem__icon" aria-hidden="true">' + icon(isImage ? "image" : "file") + "</span>" +
            '<div class="rp-fileitem__text"><span class="rp-fileitem__name">' + esc(d.name) + '</span><span class="rp-fileitem__hint">' +
            esc(d.description || type) + " · " + fmtDate(d.uploaded) + "</span></div>" +
            '<span class="rp-fileitem__tag">' + esc(type) + '</span><span class="rp-fileitem__size">' + esc(d.size) + "</span>" +
            '<div class="rp-fileitem__actions">' +
            '<button type="button" class="rp-iconbtn" data-act="view-file" data-name="' + esc(d.name) + '" aria-label="View ' + esc(d.name) + '" title="View">' + icon("view") + "</button>" +
            '<button type="button" class="rp-iconbtn" data-act="edit-document" data-id="' + d.id + '" aria-label="Edit ' + esc(d.name) + '" title="Edit">' + icon("pen-line") + "</button>" +
            '<div class="rp-confirm-wrap"><button type="button" class="rp-iconbtn is-danger" data-act="ask-delete" data-kind="document" data-id="' + d.id +
            '" aria-label="Delete ' + esc(d.name) + '" title="Delete">' + icon("trash-2") + "</button></div></div></li>"
        );
    }

    function documentsCard() {
        var list = P.documents.slice().sort(function (a, b) {
            return b.uploaded - a.uploaded;
        });
        var body = list.length
            ? '<ul class="rp-filelist">' + list.map(docItem).join("") + "</ul>"
            : empty("files", "No documents yet", "Upload your CV, resume or education certificates. Project managers can open them from your profile.", "add-document", "Upload a document");

        return (
            '<section class="rp-card" id="documents">' +
            cardHead("files", "Documents", list.length ? addButton("add-document", "Upload document", "upload") : "") +
            '<div class="rp-card__body">' + body + "</div></section>"
        );
    }

    /* ── Terms and conditions ────────────────────────────── */

    function termsDoc(iconName, name) {
        return (
            '<li class="rp-fileitem"><span class="rp-fileitem__icon" aria-hidden="true">' + icon(iconName) + '</span><div class="rp-fileitem__text">' +
            '<span class="rp-fileitem__name">' + name + '</span><span class="rp-fileitem__hint">Version ' + esc(P.terms.version) + " · updated " +
            fmtDate(P.terms.updatedOn) + "</span></div>" +
            '<button type="button" class="rp-chipbtn" data-act="external" data-say="' + name + ' would open in a new tab.">Read' + icon("external-link") + "</button></li>"
        );
    }

    function termsCard() {
        var t = P.terms;
        var agreed = t.state === "agreed";
        var docs = '<ul class="rp-filelist">' + termsDoc("scroll-text", "Terms &amp; Conditions") + termsDoc("lock-keyhole", "Privacy Policy") + "</ul>";
        var chip = agreed
            ? '<span class="rp-state rp-state--ok">' + icon("check") + "Agreed</span>"
            : '<span class="rp-state rp-state--warn">Action needed</span>';
        var body;

        if (agreed) {
            body =
                '<div class="rp-terms__done"><span class="rp-terms__doneicon" aria-hidden="true">' + icon("circle-check") +
                '</span><div><p class="rp-terms__donetitle">You agreed to our Terms &amp; Conditions and Privacy Policy</p><p class="rp-terms__donenote">On ' +
                fmtDate(t.agreedOn) + " at " + fmtTime(t.agreedOn) + ", version " + esc(t.version) + ". We will ask again whenever they change.</p></div></div>" +
                docs;
        } else {
            body =
                '<p class="rp-terms__hello">Dear ' + esc(RP.USER.firstName) + ",</p>" +
                '<p class="rp-terms__text">' +
                (t.state === "updated"
                    ? "We've updated our <strong>Terms &amp; Conditions</strong> and <strong>Privacy Policy</strong>. Please read them and confirm your agreement by ticking the checkbox below."
                    : "Please read our <strong>Terms &amp; Conditions</strong> and <strong>Privacy Policy</strong> and confirm your agreement by ticking the checkbox below.") +
                "</p>" +
                docs +
                '<label class="rp-agree"><input type="checkbox" data-agree><span class="rp-agree__box" aria-hidden="true">' + icon("check") +
                '</span><span class="rp-agree__text">I acknowledge that I have read and agree to the above terms and conditions.</span></label>' +
                '<div class="rp-terms__foot"><p class="rp-terms__fine">' +
                (t.state === "updated" ? "Last agreed on " + fmtDate(t.agreedOn) + ", to an earlier version." : "You have not agreed to them yet.") +
                '</p><button type="button" class="rp-button rp-button--primary" data-act="agree" disabled><span class="pd-spinner" aria-hidden="true"></span>' +
                '<span class="pd-btn-label">Confirm agreement</span></button></div>';
        }

        return (
            '<section class="rp-card" id="terms">' + cardHead("shield-check", "Terms and conditions", chip) +
            '<div class="rp-card__body">' + body + "</div></section>"
        );
    }

    function termsBanner() {
        if (P.terms.state === "agreed") return "";
        var updated = P.terms.state === "updated";
        return (
            '<div class="rp-banner" id="termsBanner" role="status"><span class="rp-banner__icon" aria-hidden="true">' + icon("shield-check") +
            '</span><div class="rp-banner__text"><p class="rp-banner__title">' +
            (updated ? "We've updated our Terms &amp; Conditions and Privacy Policy" : "Please agree to our Terms &amp; Conditions") +
            '</p><p class="rp-banner__note">' +
            (updated ? "Updated on " + fmtDate(P.terms.updatedOn) + ". Please read them and confirm your agreement." : "Read them and confirm your agreement at the bottom of this page.") +
            '</p></div><button type="button" class="rp-button rp-button--outline rp-button--sm" data-act="goto" data-target="terms">Review terms' +
            icon("arrow-right") + "</button></div>"
        );
    }

    /* ── Aside ───────────────────────────────────────────── */

    function todos() {
        var t = P.terms.state;
        return [
            { key: "terms", done: t === "agreed", text: t === "updated" ? "Agree to the updated terms" : "Agree to our terms", icon: "shield-check", urgent: true },
            { key: "photo", done: !P.photoIsPlaceholder, text: "Add a profile photo", icon: "camera" },
            { key: "native", done: !!P.nativeName, text: "Add your name in your native language", icon: "user-round-pen" },
            { key: "about", done: !!P.about, text: "Write a short About me", icon: "pen-line" },
            { key: "contact", done: !!(P.phone.number && P.whatsapp.number), text: "Add your phone and WhatsApp", icon: "phone" },
            { key: "education", done: P.educations.length > 0, text: "Add your education", icon: "graduation-cap" },
            { key: "work", done: P.works.length > 0 || P.noExperience, text: "Add your work experience", icon: "briefcase-business" },
            { key: "technology", done: techCount() > 0, text: "Pick the software you use", icon: "app-window" },
            {
                key: "cv",
                done: P.documents.some(function (d) {
                    return d.type === "cv" || d.type === "resume";
                }),
                text: "Upload your CV",
                icon: "upload"
            }
        ];
    }

    function strengthCard() {
        var list = todos();
        var open = list.filter(function (x) {
            return !x.done;
        });
        var done = list.length - open.length;
        var pct = Math.round((done / list.length) * 100);
        var label = pct === 100 ? "Complete" : pct >= 75 ? "Almost there" : pct >= 50 ? "Good start" : "Getting started";

        return (
            '<section class="rp-card rp-strength" id="strength">' +
            cardHead("gauge", "Profile strength", '<span class="rp-card__aside"><strong>' + done + "</strong> of " + list.length + " done</span>") +
            '<div class="rp-card__body"><div class="rp-strength__top"><p class="rp-strength__pct">' + pct + '<small>%</small></p><p class="rp-strength__label">' +
            label + "</p></div>" +
            '<div class="rp-bar" role="progressbar" aria-label="Profile strength" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct +
            '"><span style="width:' + pct + '%"></span></div>' +
            (open.length
                ? '<p class="rp-strength__note">Project managers see this profile when they choose who to invite.</p><ul class="rp-todo">' +
                  open
                      .map(function (x) {
                          return (
                              '<li><button type="button" class="rp-todo__item' + (x.urgent ? " is-urgent" : "") + '" data-act="todo" data-todo="' + x.key +
                              '"><span class="rp-todo__icon" aria-hidden="true">' + icon(x.icon) + '</span><span class="rp-todo__text">' + x.text +
                              "</span>" + icon("chevron-right") + "</button></li>"
                          );
                      })
                      .join("") +
                  "</ul>"
                : '<p class="rp-strength__done">' + icon("circle-check") + "Everything project managers look for is here.</p>") +
            "</div></section>"
        );
    }

    function srow(label, value) {
        return '<div class="rp-srow"><dt>' + label + "</dt><dd>" + value + "</dd></div>";
    }

    function accountCard() {
        var av = (RP.AVAILABILITY || {})[RP.USER.availability] || { label: RP.USER.availability };
        var t = P.terms;
        return (
            '<section class="rp-card rp-accountcard">' + cardHead("id-card", "Account") +
            '<div class="rp-card__body"><dl class="rp-srows">' +
            srow(
                "Resource ID",
                esc(RP.USER.resourceId) + '<button type="button" class="rp-iconbtn" data-act="copy-id" aria-label="Copy resource ID" title="Copy">' + icon("copy") + "</button>"
            ) +
            srow("Partner since", esc(RP.USER.partnerSince)) +
            srow(
                "Availability",
                '<span class="rp-avstate rp-avstate--' + RP.USER.availability + '">' + esc(av.label) +
                    '</span><button type="button" class="rp-linkbtn" data-act="availability">Change</button>'
            ) +
            srow(
                "Terms",
                t.state === "agreed"
                    ? "Agreed " + fmtDate(t.agreedOn)
                    : '<button type="button" class="rp-linkbtn" data-act="goto" data-target="terms">' + (t.state === "updated" ? "Review the update" : "Review and agree") + "</button>"
            ) +
            "</dl></div></section>"
        );
    }

    /* ── Render ──────────────────────────────────────────── */

    var CARDS = {
        personal: personalCard,
        education: educationCard,
        work: workCard,
        technology: technologyCard,
        certificates: certificatesCard,
        documents: documentsCard,
        terms: termsCard,
        strength: strengthCard
    };

    function currentSection() {
        var active = els.tabs.querySelector(".navigation-tabs-link.active");
        return active ? active.dataset.section : "personal";
    }

    function renderAll() {
        els.head.innerHTML = headMarkup();
        els.tabs.innerHTML = tabsMarkup("personal");
        els.acct.classList.toggle("has-banner", P.terms.state !== "agreed");
        els.acct.innerHTML =
            termsBanner() +
            '<div class="rp-acct__main">' +
            personalCard() +
            educationCard() +
            workCard() +
            technologyCard() +
            certificatesCard() +
            documentsCard() +
            termsCard() +
            '</div><aside class="rp-acct__aside" aria-label="Profile summary">' +
            strengthCard() +
            accountCard() +
            "</aside>";
        collectSections();
    }

    /* Swaps one card in place, so the reader keeps their scroll */
    function refresh(id) {
        var el = document.getElementById(id);
        if (el) el.outerHTML = CARDS[id]();
        collectSections();
    }

    /* Counts, the aside and the banner all read the same record */
    function refreshSummary() {
        els.tabs.innerHTML = tabsMarkup(currentSection());
        refresh("strength");
        var account = document.querySelector(".rp-accountcard");
        if (account) account.outerHTML = accountCard();
        var banner = document.getElementById("termsBanner");
        if (banner && P.terms.state === "agreed") {
            banner.remove();
            els.acct.classList.remove("has-banner");
        }
    }

    function paintAvatars() {
        document.querySelectorAll("[data-avatar], .rp-sidebar__account-avatar, .rp-profile__avatar, .rp-profile__identity-avatar").forEach(function (img) {
            img.src = RP.USER.photo;
        });
    }

    function paintNames() {
        els.head.innerHTML = headMarkup();
        document.querySelectorAll(".rp-sidebar__account-name, .rp-profile__identity-name").forEach(function (el) {
            el.textContent = RP.USER.fullName;
        });
        var hello = document.querySelector(".rp-profile__greeting strong");
        if (hello) hello.textContent = RP.USER.firstName;
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

    /* ── Inline editors ──────────────────────────────────── */

    function focusField(section, fieldId) {
        var form = document.querySelector("#" + section + " form");
        var target = (fieldId && document.getElementById(fieldId)) || (form && form.querySelector("input:not([readonly]), select, textarea"));
        if (!target) return;
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
    }

    function startEdit(section, fieldId) {
        if (!editing[section]) {
            editing[section] = true;
            dirty[section] = false;
            if (section === "technology") techDraft = { tools: P.technology.slice(), custom: P.customTools.slice() };
            refresh(section);
        }
        focusField(section, fieldId);
    }

    function stopEdit(section) {
        editing[section] = false;
        dirty[section] = false;
        if (section === "technology") techDraft = null;
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

    function invalidate(form, el, message, noteEl) {
        var target = el.closest(".pd-phone") || el;
        target.classList.add("is-invalid");
        noteEl.textContent = message;
        noteEl.classList.add("is-error");
        el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
        el.focus({ preventScroll: true });
    }

    function clearInvalid(form) {
        form.querySelectorAll(".is-invalid").forEach(function (el) {
            el.classList.remove("is-invalid");
        });
    }

    function val(form, id) {
        var el = form.querySelector("#" + id);
        return el ? el.value.trim() : "";
    }

    function savePersonal(form) {
        var note = document.querySelector('[data-note="personal"]');
        var btn = document.querySelector('[data-save="personal"]');
        clearInvalid(form);

        var missing = ["first_name", "phoneNumber", "timezone", "country"]
            .map(function (id) {
                return form.querySelector("#" + id);
            })
            .filter(function (el) {
                return !el.value.trim();
            })[0];
        if (missing) return invalidate(form, missing, "Please fill in the highlighted field.", note);

        var about = form.querySelector("#aboutMe");
        if (about.value.length > 600) return invalidate(form, about, "About me must be 600 characters or fewer.", note);

        busy(btn, true);
        setTimeout(function () {
            RP.USER.fullName = val(form, "first_name");
            RP.USER.firstName = RP.USER.fullName.split(" ")[0];
            P.nativeName = val(form, "native_name");
            P.greeting = val(form, "greeting");
            P.website = val(form, "website").replace(/^https?:\/\//, "");
            P.about = val(form, "aboutMe");
            P.phone = { country: val(form, "phoneNumber_country"), number: val(form, "phoneNumber") };
            P.mobile = { country: val(form, "mobilePhoneNumber_country"), number: val(form, "mobilePhoneNumber") };
            P.whatsapp = { country: val(form, "whatsapp_country"), number: val(form, "whatsapp") };
            P.timezone = val(form, "timezone");
            P.country = val(form, "country");
            P.city = val(form, "city");
            P.state = val(form, "state");
            P.address = val(form, "address");
            P.zip = val(form, "zipCode");

            stopEdit("personal");
            paintNames();
            refreshSummary();
            RP.toast("Your personal details are saved.", "success");
        }, 650);
    }

    function saveTechnology() {
        var btn = document.querySelector('[data-save="technology"]');
        busy(btn, true);
        setTimeout(function () {
            P.technology = techDraft.tools.slice();
            P.customTools = techDraft.custom.slice();
            stopEdit("technology");
            refreshSummary();
            RP.toast("Your software list is saved.", "success");
        }, 500);
    }

    /* ── Technology editor ───────────────────────────────── */

    function paintTechCount() {
        var count = document.querySelector("[data-tech-count]");
        if (count) count.innerHTML = techCountText();
    }

    function toggleTool(btn) {
        var name = btn.dataset.tool;
        var on = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(on));
        if (on) techDraft.tools.push(name);
        else techDraft.tools.splice(techDraft.tools.indexOf(name), 1);
        paintTechCount();
        markDirty("technology");
    }

    function addTool(name) {
        name = (name || "").trim().replace(/\s+/g, " ");
        var input = document.querySelector("[data-tech-new]");
        if (!name) {
            if (input) input.focus();
            return;
        }

        /* A listed tool typed by hand is picked in its group instead of doubled */
        var listed = document.querySelector('.rp-toggle[data-act="toggle-tool"][data-tool="' + name.replace(/"/g, '\\"') + '"]');
        var known = listed || techDraft.custom.some(function (t) {
            return t.toLowerCase() === name.toLowerCase();
        });
        if (listed && listed.getAttribute("aria-pressed") !== "true") toggleTool(listed);

        if (!known) {
            techDraft.custom.push(name);
            document.querySelector("[data-custom]").insertAdjacentHTML("beforeend", customChip(name));
            paintTechCount();
            markDirty("technology");
        }

        if (input) {
            input.value = "";
            input.focus();
        }
        var search = document.querySelector("[data-tech-search]");
        if (search && search.value) {
            search.value = "";
            filterTools("");
        }
    }

    function removeTool(name) {
        techDraft.custom.splice(techDraft.custom.indexOf(name), 1);
        var chip = document.querySelector('.rp-toggle.is-custom[data-tool="' + name.replace(/"/g, '\\"') + '"]');
        if (chip) chip.remove();
        paintTechCount();
        markDirty("technology");
        var input = document.querySelector("[data-tech-new]");
        if (input) input.focus();
    }

    function filterTools(query) {
        var q = query.trim().toLowerCase();
        var matches = 0;

        document.querySelectorAll("#rpTechForm .rp-tech__group").forEach(function (group) {
            var shown = 0;
            group.querySelectorAll(".rp-toggle").forEach(function (chip) {
                var hit = !q || chip.dataset.tool.toLowerCase().indexOf(q) !== -1;
                chip.hidden = !hit;
                if (hit) shown++;
            });
            matches += shown;
            /* Other tools keeps its add field on screen, so a miss can be added right there */
            group.hidden = !!q && !shown && group.dataset.group !== "other";
        });

        var none = document.querySelector("[data-tech-nomatch]");
        none.hidden = !q || matches > 0;
        if (!none.hidden) {
            none.innerHTML =
                "No tool matches “" + esc(query.trim()) + "”. " +
                '<button type="button" class="rp-linkbtn" data-act="add-query">Add “' + esc(query.trim()) + "” to Other tools</button>";
        }
    }

    /* ── Delete, with a confirm popover instead of the old code-typing modal ── */

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
        var what = btn.dataset.kind === "document" ? "Delete this document?" : "Delete this entry?";
        btn.parentNode.insertAdjacentHTML(
            "beforeend",
            '<div class="rp-confirm" role="alertdialog" aria-label="' + what + '"><span class="rp-confirm__text">' + what + "</span>" +
                '<button type="button" class="rp-mini is-yes" data-act="delete" data-kind="' + btn.dataset.kind + '" data-id="' + btn.dataset.id + '">Delete</button>' +
                '<button type="button" class="rp-mini is-no" data-act="keep">Keep</button></div>'
        );
        btn.parentNode.querySelector(".rp-mini.is-no").focus({ preventScroll: true });
    }

    var KINDS = {
        education: { list: "educations", row: "edu-", card: "education", done: "Education removed." },
        work: { list: "works", row: "work-", card: "work", done: "Work experience removed." },
        document: { list: "documents", row: "doc-", card: "documents", done: "Document deleted." }
    };

    function doDelete(kind, id) {
        var k = KINDS[kind];
        var row = document.getElementById(k.row + id);
        closeConfirm();
        if (row) row.classList.add("is-leaving");

        setTimeout(function () {
            P[k.list] = P[k.list].filter(function (x) {
                return x.id !== id;
            });
            refresh(k.card);
            refreshSummary();
            RP.toast(k.done, "success");
        }, reduced() ? 0 : 260);
    }

    /* ── Modal ───────────────────────────────────────────── */

    function openModal(markup, variant) {
        lastFocus = document.activeElement;
        els.panel.innerHTML = markup;
        els.modal.className = "rp-modal is-open" + (variant ? " " + variant : "");
        els.modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("rp-no-scroll");

        var target = els.panel.querySelector("[data-autofocus]") || els.panel.querySelector("input:not([type=hidden]), select, textarea") || els.panel.querySelector("[data-close]");
        if (target) target.focus({ preventScroll: true });
    }

    function closeModal() {
        if (!els.modal.classList.contains("is-open")) return;
        els.modal.classList.remove("is-open");
        els.modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("rp-no-scroll");
        picked.photo = null;
        picked.file = null;
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }

    function dialog(o) {
        return (
            '<form class="pd-form" id="rpDialogForm" data-dialog="' + o.form + '"' + (o.id ? ' data-id="' + o.id + '"' : "") + " novalidate>" +
            '<div class="pd-modal-head"><div class="pd-modal-titles"><h2 class="pd-modal-title" id="rpModalTitle">' + o.title + "</h2>" +
            (o.note ? '<p class="pd-modal-note">' + o.note + "</p>" : "") + "</div>" +
            '<button type="button" class="pd-modal-close" data-close aria-label="Close">' + icon("close") + "</button></div>" +
            '<div class="pd-modal-body">' + o.body + "</div>" +
            '<div class="pd-modal-foot"><p class="pd-actions-note" data-dialog-note></p>' +
            '<button type="button" class="pd-btn pd-btn-secondary" data-close>Cancel</button>' +
            '<button type="submit" class="pd-btn pd-btn-primary"' + (o.locked ? " disabled" : "") + ' data-dialog-save><span class="pd-spinner" aria-hidden="true"></span>' +
            '<span class="pd-btn-label">' + o.submit + "</span></button></div></form>"
        );
    }

    function dialogFail(form, el, message) {
        var note = form.querySelector("[data-dialog-note]");
        (el.closest(".rp-drop") || el).classList.add("is-invalid");
        note.textContent = message;
        note.classList.add("is-error");
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

    /* ── Education dialog (add_user_education.html) ──────── */

    function openEducation(id) {
        var e = id ? find(P.educations, id) : { degree: "Master", major: "", university: "", country: P.country, year: YEAR };
        var body =
            '<div class="pd-grid">' +
            field("edu_degree", "Degree", select("edu_degree", RP.DEGREES.map(function (d) { return [d, d]; }), e.degree, { required: true }), { required: true }) +
            field("edu_major", "Major", input("edu_major", e.major, { placeholder: "Enter your major", maxlength: 80 })) +
            field("edu_university", "University", input("edu_university", e.university, {
                placeholder: "Enter the name of the University you attended",
                maxlength: 120,
                required: true,
                autofocus: !id
            }), { required: true, cls: "pd-col-wide" }) +
            field("edu_country", "Country", select("edu_country", countryOptions(), e.country, { empty: "Select country" })) +
            field("edu_year", "Graduation year", select("edu_year", yearOptions(1960, YEAR + 5), e.year)) +
            "</div>";

        openModal(
            dialog({
                title: id ? "Edit education" : "Add education",
                note: "Add information about your education.",
                form: "education",
                id: id,
                body: body,
                submit: id ? "Save changes" : "Add education"
            })
        );
    }

    function saveEducation(form) {
        clearInvalid(form);
        var uni = form.querySelector("#edu_university");
        if (!uni.value.trim()) return dialogFail(form, uni, "Enter the university you attended.");

        var id = Number(form.dataset.id) || null;
        dialogDone(form, function () {
            var row = {
                id: id || nextId(P.educations),
                degree: val(form, "edu_degree"),
                major: val(form, "edu_major"),
                university: val(form, "edu_university"),
                country: val(form, "edu_country"),
                year: Number(val(form, "edu_year"))
            };
            if (id) P.educations[P.educations.indexOf(find(P.educations, id))] = row;
            else P.educations.push(row);
            refresh("education");
            refreshSummary();
            flash("edu-" + row.id);
            RP.toast(id ? "Education updated." : "Education added.", "success");
        });
    }

    /* ── Work dialog (add_work_experience.html) ──────────── */

    function openWork(id) {
        var w = id ? find(P.works, id) : { position: "", company: "", country: P.country, start: YEAR, end: null, duties: "" };
        var ends = [["", "Still working"]].concat(yearOptions(1960, YEAR));
        var body =
            '<div class="pd-grid">' +
            field("work_position", "Position", input("work_position", w.position, { placeholder: "Enter the title of your position", maxlength: 80, required: true, autofocus: !id }), { required: true }) +
            field("work_company", "Company name", input("work_company", w.company, { placeholder: "Name of the company you worked for", maxlength: 120, required: true }), { required: true }) +
            field("work_country", "Country", select("work_country", countryOptions(), w.country, { empty: "Select country" })) +
            '<div class="pd-field"><span class="pd-field-label">Years</span><div class="rp-yearpair">' +
            select("work_start", yearOptions(1960, YEAR), w.start) + '<span aria-hidden="true">–</span>' + select("work_end", ends, w.end || "") +
            "</div></div>" +
            field("work_duties", "Duties and achievements", textarea("work_duties", w.duties, {
                maxlength: 600,
                placeholder: "Describe the tasks you performed and what you have achieved in this role"
            }), { cls: "pd-col-wide" }) +
            "</div>";

        openModal(
            dialog({
                title: id ? "Edit work experience" : "Add work experience",
                note: "Add the company you worked for.",
                form: "work",
                id: id,
                body: body,
                submit: id ? "Save changes" : "Add experience"
            })
        );
        els.panel.querySelector("#work_start").setAttribute("aria-label", "Start year");
        els.panel.querySelector("#work_end").setAttribute("aria-label", "End year");
    }

    function saveWork(form) {
        clearInvalid(form);
        var pos = form.querySelector("#work_position");
        var company = form.querySelector("#work_company");
        if (!pos.value.trim()) return dialogFail(form, pos, "Enter the title of your position.");
        if (!company.value.trim()) return dialogFail(form, company, "Enter the company you worked for.");

        var start = Number(val(form, "work_start"));
        var end = val(form, "work_end") ? Number(val(form, "work_end")) : null;
        if (end && end < start) return dialogFail(form, form.querySelector("#work_end"), "The end year cannot be before the start year.");

        var id = Number(form.dataset.id) || null;
        dialogDone(form, function () {
            var row = {
                id: id || nextId(P.works),
                position: pos.value.trim(),
                company: company.value.trim(),
                country: val(form, "work_country"),
                start: start,
                end: end,
                duties: val(form, "work_duties")
            };
            if (id) P.works[P.works.indexOf(find(P.works, id))] = row;
            else P.works.push(row);
            P.noExperience = false;
            refresh("work");
            refreshSummary();
            flash("work-" + row.id);
            RP.toast(id ? "Work experience updated." : "Work experience added.", "success");
        });
    }

    /* ── Document dialog (tr_documents.html) ─────────────── */

    function dropzone(replacing) {
        if (picked.file) {
            return (
                '<div class="rp-fileitem"><span class="rp-fileitem__icon" aria-hidden="true">' + icon("file") + '</span><div class="rp-fileitem__text">' +
                '<span class="rp-fileitem__name">' + esc(picked.file.name) + '</span><span class="rp-fileitem__hint">' + esc(picked.file.size) +
                " · ready to upload</span></div>" +
                '<div class="rp-fileitem__actions"><button type="button" class="rp-iconbtn" data-act="unpick-file" aria-label="Remove this file" title="Remove">' +
                icon("close") + "</button></div></div>"
            );
        }
        return (
            '<label class="rp-drop" data-drop><input type="file" data-doc-file accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" aria-label="Choose a file">' +
            '<span class="rp-drop__icon" aria-hidden="true">' + icon("cloud-upload") + '</span><span><span class="rp-drop__title">' +
            (replacing ? "Drop a new file to replace it, or <u>browse</u>" : "Drop a file here or <u>browse</u>") +
            '</span><span class="rp-drop__note">PDF, DOCX, JPG or PNG, up to 10 MB</span></span></label>'
        );
    }

    function openDocument(id, presetType) {
        picked.file = null;
        var d = id ? find(P.documents, id) : { type: presetType || "", description: "" };
        var types = Object.keys(RP.DOC_TYPES).map(function (k) {
            return [k, RP.DOC_TYPES[k]];
        });
        var current = id
            ? '<p class="pd-field-hint">Current file: <strong>' + esc(d.name) + "</strong> · " + esc(d.size) + "</p>"
            : "";
        var body =
            '<div class="pd-grid">' +
            field("doc_type", "Type of document", select("doc_type", types, d.type, { required: true, empty: "Select document type", autofocus: !presetType }), {
                required: true
            }) +
            field("doc_description", "Description", textarea("doc_description", d.description, { maxlength: 200, placeholder: "What is in this file?" }), {
                cls: "pd-col-wide"
            }) +
            '<div class="pd-field pd-col-wide"><span class="pd-field-label">' + (id ? "Replace file" : 'File upload <span class="asterisk" aria-hidden="true">*</span>') +
            '</span><div data-dropslot data-replacing="' + (id ? "1" : "") + '">' + dropzone(!!id) + "</div>" + current + "</div>" +
            "</div>";

        openModal(
            dialog({
                title: id ? "Edit document" : "Upload a document",
                note: "Your CV, resume and education documents. Project managers can open them from your profile.",
                form: "document",
                id: id,
                body: body,
                submit: id ? "Save changes" : "Upload document"
            })
        );
        if (presetType) {
            var desc = els.panel.querySelector("#doc_description");
            if (desc) desc.focus({ preventScroll: true });
        }
    }

    function paintDropslot() {
        var slot = els.panel.querySelector("[data-dropslot]");
        if (slot) slot.innerHTML = dropzone(!!slot.dataset.replacing);
    }

    function saveDocument(form) {
        clearInvalid(form);
        var type = form.querySelector("#doc_type");
        var id = Number(form.dataset.id) || null;
        if (!type.value) return dialogFail(form, type, "Choose what kind of document this is.");
        if (!id && !picked.file) {
            var drop = form.querySelector("[data-doc-file]");
            return dialogFail(form, drop, "Choose the file to upload.");
        }

        var file = picked.file;
        dialogDone(form, function () {
            var old = id ? find(P.documents, id) : null;
            var row = {
                id: id || nextId(P.documents),
                type: type.value,
                description: val(form, "doc_description"),
                name: file ? file.name : old.name,
                size: file ? file.size : old.size,
                uploaded: file ? new Date() : old.uploaded
            };
            if (id) P.documents[P.documents.indexOf(old)] = row;
            else P.documents.push(row);
            refresh("documents");
            refreshSummary();
            flash("doc-" + row.id);
            RP.toast(id ? "Document updated." : row.name + " uploaded.", "success");
        });
    }

    /* ── Photo dialog (_profile_upload.html's crop, simplified) ── */

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
            dialog({
                title: "Profile photo",
                note: "Zoom in to crop it. The circle is what everyone sees.",
                form: "photo",
                body: body,
                submit: "Save photo",
                locked: true
            }),
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

    function savePhoto(form) {
        var img = form.querySelector("[data-photo-img]");
        var zoom = Number(form.querySelector("[data-photo-zoom]").value);
        dialogDone(form, function () {
            RP.USER.photo = cropPhoto(img, zoom);
            P.photoIsPlaceholder = false;
            paintAvatars();
            refreshSummary();
            RP.toast("Your photo is updated.", "success");
        });
    }

    function removePhoto() {
        RP.USER.photo = PLACEHOLDER_PHOTO;
        P.photoIsPlaceholder = true;
        closeModal();
        paintAvatars();
        refreshSummary();
        RP.toast("Your photo is removed.", "success");
    }

    /* ── Password dialog: customer/profile/change_password.html, same copy and data-password-* ── */

    function eye(id) {
        return (
            '<button type="button" class="pwd-eye" data-password-toggle="' + id + '" data-label-show="Show password" data-label-hide="Hide password" aria-label="Show password" aria-pressed="false">' +
            icon("eye", "pwd-eye-show") + icon("eye-off", "pwd-eye-hide") + "</button>"
        );
    }

    function pwdField(id, field, label, placeholder, autocomplete, extra) {
        return (
            '<div class="pwd-field"><label class="pwd-field-label" for="' + id + '">' + label + '</label><div class="pwd-input-shell">' +
            '<input class="pwd-input form-control" type="password" id="' + id + '" name="' + id + '" data-password-field="' + field + '" autocomplete="' +
            autocomplete + '" placeholder="' + placeholder + '"' + (extra || "") + " required>" + eye(id) + "</div>" +
            (field === "confirm" ? '<p class="pwd-error" data-password-mismatch role="alert"></p>' : "") + "</div>"
        );
    }

    function rule(key, text) {
        return (
            '<div class="pwd-rule" data-password-rule="' + key + '"><span class="pwd-rule-icon">' + icon("circle", "pwd-rule-todo") +
            icon("circle-check", "pwd-rule-done") + "</span>" + text + "</div>"
        );
    }

    function openPassword() {
        var markup =
            '<div data-password-scope class="rp-pwdscope">' +
            '<div class="pwd-header"><div class="pwd-titlebox"><h3 class="pwd-title" id="rpModalTitle">Reset password</h3>' +
            '<p class="pwd-subtitle">Confirm your current password, then choose a new one.</p></div>' +
            '<button type="button" class="pwd-close" data-close aria-label="Close">' + icon("close") + "</button></div>" +
            '<div class="pwd-body"><form id="reset-password-form" data-password-policy data-password-min-length="8"' +
            ' data-note-current="Enter your current password to continue."' +
            ' data-note-rules="Your new password does not meet every requirement yet."' +
            ' data-note-confirm="Re-type your new password to confirm it."' +
            ' data-note-mismatch="The two passwords do not match.">' +
            '<input type="hidden" name="form_name" value="password-update">' +
            pwdField("current_password", "current", "Current password", "Your current password", "current-password", " data-autofocus") +
            pwdField("new_password", "new", "New password", "Choose a new password", "new-password", ' aria-describedby="pwd-requirements"') +
            '<div class="pwd-checklist" id="pwd-requirements" role="group" aria-label="Password requirements"><p class="pwd-checklist-label">Your new password must have:</p>' +
            rule("length", "At least 8 characters") +
            rule("upper", "A capital letter") +
            rule("lower", "A small letter") +
            rule("number", "A number") +
            rule("special", "<span>A special character <code>#?!@$%^&amp;*-_</code></span>") +
            "</div>" +
            pwdField("confirm_password", "confirm", "Confirm new password", "Re-type the new password", "new-password") +
            "</form>" +
            '<div class="pwd-footer"><p class="pwd-note" data-password-gate-note aria-live="polite"></p>' +
            '<button type="submit" form="reset-password-form" class="pwd-btn pwd-btn-primary" id="resetPasswordSubmit" data-password-submit disabled>' +
            '<span class="pwd-btn-spinner" aria-hidden="true"></span><span class="pwd-btn-label">Update password</span></button></div>' +
            "</div></div>";

        openModal(markup, "pwd-modal");
        if (global.PasswordPolicy) global.PasswordPolicy.init(els.panel);
    }

    function savePassword(form) {
        var btn = document.getElementById("resetPasswordSubmit");
        btn.classList.add("is-busy");
        btn.disabled = true;
        setTimeout(function () {
            closeModal();
            RP.toast("Your password is updated.", "success");
        }, 800);
    }

    /* ── Terms ───────────────────────────────────────────── */

    function agree(btn) {
        busy(btn, true);
        setTimeout(function () {
            P.terms.state = "agreed";
            P.terms.agreedOn = new Date();
            refresh("terms");
            refreshSummary();
            RP.toast("Thank you. Your agreement is recorded.", "success");
        }, 600);
    }

    /* ── Small actions ───────────────────────────────────── */

    /* After a save focus follows the row; from a link on load it stays put */
    function flash(id, keepFocus) {
        var el = document.getElementById(id);
        if (!el) return;
        el.classList.add("is-flagged");
        el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
        var first = !keepFocus && el.querySelector("button");
        if (first) first.focus({ preventScroll: true });
    }

    function copyId() {
        var id = RP.USER.resourceId;
        var done = function () {
            RP.toast("Resource ID " + id + " copied.", "success");
        };
        if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
            global.navigator.clipboard.writeText(id).then(done, done);
        } else {
            done();
        }
    }

    /* The topbar scrolls away with the page, so it is brought back before its dropdown opens */
    function openAvailability() {
        global.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
        setTimeout(function () {
            var pill = document.getElementById("rpAvailabilityBtn");
            if (pill) pill.click();
        }, reduced() ? 0 : 380);
    }

    function runTodo(key) {
        if (key === "terms") {
            return goTo("terms", function () {
                var box = document.querySelector("[data-agree]");
                if (box) box.focus({ preventScroll: true });
            });
        }
        if (key === "photo") return openPhoto();
        if (key === "native") return startEdit("personal", "native_name");
        if (key === "about") return startEdit("personal", "aboutMe");
        if (key === "contact") return startEdit("personal", P.phone.number ? "whatsapp" : "phoneNumber");
        if (key === "education") return openEducation();
        if (key === "work") return openWork();
        if (key === "technology") return startEdit("technology");
        if (key === "cv") return openDocument(null, "cv");
    }

    /* ── Wiring ──────────────────────────────────────────── */

    function onAction(btn, e) {
        var act = btn.dataset.act;
        var id = Number(btn.dataset.id) || null;

        if (act === "edit") return startEdit(btn.dataset.edit, btn.dataset.focusField);
        if (act === "cancel") return cancelEdit(btn.dataset.edit);
        if (act === "password") return openPassword();
        if (act === "photo") return openPhoto();
        if (act === "photo-remove") return removePhoto();
        if (act === "add-education" || act === "edit-education") return openEducation(id);
        if (act === "add-work" || act === "edit-work") return openWork(id);
        if (act === "add-document" || act === "edit-document") return openDocument(id);
        if (act === "ask-delete") return askDelete(btn);
        if (act === "delete") return doDelete(btn.dataset.kind, id);
        if (act === "keep") {
            var ask = btn.closest(".rp-confirm-wrap").querySelector('[data-act="ask-delete"]');
            closeConfirm();
            return ask && ask.focus({ preventScroll: true });
        }
        if (act === "more") {
            var text = document.getElementById(btn.dataset.target);
            var open = text.classList.toggle("is-open");
            btn.setAttribute("aria-expanded", String(open));
            btn.textContent = open ? "Show less" : "Show more";
            return;
        }
        if (act === "toggle-tool") return toggleTool(btn);
        if (act === "add-tool") return addTool(document.querySelector("[data-tech-new]").value);
        if (act === "add-query") return addTool(document.querySelector("[data-tech-search]").value);
        if (act === "remove-tool") return removeTool(btn.dataset.tool);
        if (act === "unpick-file") {
            picked.file = null;
            paintDropslot();
            return;
        }
        if (act === "agree") return agree(btn);
        if (act === "goto") return goTo(btn.dataset.target);
        if (act === "todo") return runTodo(btn.dataset.todo);
        if (act === "copy-id") return copyId();
        if (act === "availability") return openAvailability();
        if (act === "view-file") return RP.toast(btn.dataset.name + " would open in the file viewer.", "info");
        if (act === "external") {
            e.preventDefault();
            return RP.toast(btn.dataset.say, "info");
        }
    }

    function onSubmit(e) {
        var form = e.target;
        if (form.id === "rpPersonalForm") {
            e.preventDefault();
            return savePersonal(form);
        }
        if (form.id === "rpTechForm") {
            e.preventDefault();
            return saveTechnology();
        }
        if (form.id === "reset-password-form") {
            e.preventDefault();
            return savePassword(form);
        }
        if (form.id === "rpDialogForm") {
            e.preventDefault();
            var kind = form.dataset.dialog;
            if (kind === "education") return saveEducation(form);
            if (kind === "work") return saveWork(form);
            if (kind === "document") return saveDocument(form);
            if (kind === "photo") return savePhoto(form);
        }
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
            var note = form.querySelector("[data-dialog-note]");
            note.textContent = "";
            note.classList.remove("is-error");
        };
        reader.readAsDataURL(file);
    }

    function onChange(e) {
        var t = e.target;

        if (t.matches("[data-agree]")) {
            var agreeBtn = document.querySelector('[data-act="agree"]');
            if (agreeBtn) agreeBtn.disabled = !t.checked;
            return;
        }
        if (t.matches("[data-no-experience]")) {
            P.noExperience = t.checked;
            refresh("work");
            refreshSummary();
            RP.toast(t.checked ? "Noted — no work experience yet." : "Thanks. Add your experience whenever you are ready.", "info");
            var box = document.querySelector("[data-no-experience]");
            if (box) box.focus({ preventScroll: true });
            return;
        }
        if (t.matches("[data-photo-file]")) return readPhoto(t.files[0]);
        if (t.matches("[data-doc-file]") && t.files.length) {
            var file = t.files[0];
            var form = t.closest("form");
            if (file.size > MAX_UPLOAD) return dialogFail(form, t, file.name + " is over 10 MB. Choose a smaller file.");
            picked.file = { name: file.name, size: bytes(file.size) };
            paintDropslot();
            var note = form.querySelector("[data-dialog-note]");
            note.textContent = "";
            note.classList.remove("is-error");
            return;
        }
        if (t.closest("#rpPersonalForm")) markDirty("personal");
    }

    function onInput(e) {
        var t = e.target;
        var counter = t.id && document.querySelector('[data-counter-for="' + t.id + '"]');
        if (counter) {
            counter.textContent = t.value.length + " / " + t.maxLength;
            counter.classList.toggle("is-over", t.value.length > t.maxLength);
        }
        if (t.closest(".is-invalid") || t.classList.contains("is-invalid")) (t.closest(".pd-phone") || t).classList.remove("is-invalid");

        if (t.matches("[data-tech-search]")) return filterTools(t.value);
        if (t.matches("[data-photo-zoom]")) {
            els.panel.querySelector("[data-photo-img]").style.transform = "scale(" + t.value + ")";
            return;
        }
        if (t.closest("#rpPersonalForm")) markDirty("personal");
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
        if (e.key === "Enter" && e.target.matches("[data-tech-new]")) {
            e.preventDefault();
            return addTool(e.target.value);
        }
        if (e.key === "Enter" && e.target.matches("[data-tech-search]")) {
            e.preventDefault();
            var first = document.querySelector('#rpTechForm .rp-toggle[data-act="toggle-tool"]:not([hidden])');
            if (first) return toggleTool(first);
            return addTool(e.target.value);
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

        global.addEventListener("beforeunload", function (e) {
            if (!dirty.personal && !dirty.technology) return;
            e.preventDefault();
            e.returnValue = "";
        });
    }

    /* ── Boot ────────────────────────────────────────────── */

    function init() {
        els = {
            head: document.getElementById("rpAcctHead"),
            nav: document.getElementById("rpAcctNav"),
            tabs: document.getElementById("rpAcctTabs"),
            acct: document.getElementById("rpAcct"),
            modal: document.getElementById("rpModal"),
            panel: document.getElementById("rpModalPanel")
        };
        if (!els.acct) return;

        var params = new URLSearchParams(global.location.search);

        /* ?terms=agreed|none shows the other two states of the Terms card */
        var terms = params.get("terms");
        if (terms === "agreed" || terms === "none") P.terms.state = terms;
        if (terms === "agreed") P.terms.agreedOn = new Date(P.terms.updatedOn.getTime() + 2 * 86400000);

        renderAll();
        wire();

        var cert = params.get("highlight_cert");
        var hash = global.location.hash.slice(1);
        if (cert && document.getElementById("cert-" + cert)) {
            setTimeout(function () {
                flash("cert-" + cert, true);
                setActive("certificates");
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
