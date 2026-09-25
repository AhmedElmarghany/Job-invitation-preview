/* ============================================================
   LAYOUT — sidebar, topbar, profile menu, availability dropdown
   and logout modal. Rendered once here and mounted into #rp-layout
   so the six portal pages never drift apart.

   A page opts in with:
   <div id="rp-layout" data-page="invitations" data-title="Job Invitations"></div>
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;

    var STORAGE_KEY = "rp_sidebar_collapsed";
    var BP_MOBILE = 766;
    var BP_TABLET = 1023;

    var NAV = [
        { key: "dashboard", label: "Dashboard", icon: "dashboard", href: "dashboard.html" },
        { key: "invitations", label: "Invitations", icon: "invitations", href: "invitations.html", badge: true },
        { key: "jobs", label: "Jobs", icon: "jobs", href: "jobs.html" },
        { key: "earnings", label: "Earnings", icon: "earnings", href: "earnings.html" }
    ];

    var FOOTER_NAV = [
        { key: "professional", label: "Professional Profile", icon: "professional-profile", href: "professional-profile.html" }
    ];

    /* Translator.WORK_STATUS_OPTIONS, with the descriptions from
       partials/_work_status_modal.html word for word. */
    var AVAILABILITY = {
        AV: { label: "Available", note: "You will be considered for new job invitations." },
        BS: { label: "Busy", note: "Working at capacity — fewer invitations will come your way." },
        NA: { label: "Not Available", note: "You will not be sent new job invitations at all." }
    };

    function isMobile() {
        return global.innerWidth <= BP_MOBILE;
    }

    function isTablet() {
        return global.innerWidth > BP_MOBILE && global.innerWidth <= BP_TABLET;
    }

    /* Storage throws when the page is opened straight off disk in some
       browsers, and the preview has to survive that. */
    function readStore() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (err) {
            return null;
        }
    }

    function writeStore(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (err) {
            /* the choice just does not persist */
        }
    }

    /* ── Markup ──────────────────────────────────────────── */

    function navItem(item, active, badgeCount) {
        var isActive = item.key === active;
        var badge =
            item.badge && badgeCount
                ? '<span class="rp-sidebar__nav-item-badge">' + badgeCount + "</span>"
                : "";

        return (
            '<a class="rp-sidebar__nav-item' +
            (isActive ? " rp-sidebar__nav-item--active" : "") +
            '" href="' +
            item.href +
            '"' +
            (isActive ? ' aria-current="page"' : "") +
            ">" +
            /* Both weights ship with every item and the active state
               swaps them, the way the customer sidebar does. */
            '<span class="rp-sidebar__nav-item-icon">' +
            icon(item.icon, "rp-sidebar__nav-item-icon--outline") +
            icon(item.icon, "rp-sidebar__nav-item-icon--filled", { variant: "active" }) +
            "</span>" +
            '<span class="rp-sidebar__nav-item-label">' +
            item.label +
            "</span>" +
            badge +
            '<span class="rp-sidebar__nav-item-tooltip">' +
            item.label +
            (item.badge && badgeCount ? " (" + badgeCount + ")" : "") +
            "</span>" +
            "</a>"
        );
    }

    function sidebarMarkup(page, user) {
        var main = NAV.map(function (item) {
            return navItem(item, page, user.invitationCount);
        }).join("");

        var footer = FOOTER_NAV.map(function (item) {
            return navItem(item, page);
        }).join("");

        return (
            '<aside class="rp-sidebar" id="rpSidebar">' +
            '<div class="rp-sidebar__header">' +
            '<a class="rp-sidebar__logo" href="dashboard.html" aria-label="AGATO Translation — dashboard">' +
            '<img class="rp-sidebar__logo-image" src="assets/img/logo.png" alt="AGATO Translation">' +
            "</a>" +
            '<button class="rp-sidebar__collapse-btn" id="rpCollapseBtn" type="button" title="Collapse sidebar" aria-label="Collapse sidebar">' +
            icon("chevron-left") +
            "</button>" +
            "</div>" +
            '<nav class="rp-sidebar__nav" aria-label="Main">' +
            '<div class="rp-sidebar__nav-section-label">Main Menu</div>' +
            main +
            "</nav>" +
            '<div class="rp-sidebar__footer">' +
            footer +
            '<a class="rp-sidebar__account' +
            (page === "account" ? " rp-sidebar__account--active" : "") +
            '" href="account.html">' +
            '<img class="rp-sidebar__account-avatar" src="' +
            user.photo +
            '" alt="">' +
            '<span class="rp-sidebar__account-text">' +
            '<span class="rp-sidebar__account-name">' +
            user.fullName +
            "</span>" +
            '<span class="rp-sidebar__account-role">User Account</span>' +
            "</span>" +
            '<span class="rp-sidebar__nav-item-tooltip">User Account</span>' +
            "</a>" +
            "</div>" +
            "</aside>" +
            '<div class="rp-sidebar-overlay" id="rpSidebarOverlay"></div>'
        );
    }

    function topbarMarkup(title, user) {
        return (
            '<header class="rp-topbar" id="rpTopbar">' +
            '<div class="rp-topbar__left">' +
            '<button class="rp-topbar__burger-btn" id="rpBurgerBtn" type="button" title="Open menu" aria-label="Open menu">' +
            icon("menu") +
            "</button>" +
            '<button class="rp-topbar__expand-btn" id="rpExpandBtn" type="button" title="Expand sidebar" aria-label="Expand sidebar">' +
            icon("chevron-right") +
            "</button>" +
            '<span class="rp-topbar__page-title" id="rpPageTitle">' +
            title +
            "</span>" +
            "</div>" +
            '<div class="rp-topbar__right">' +
            '<button class="rp-topbar__icon-btn" type="button" title="Notifications" aria-label="Notifications" data-demo="Notifications">' +
            icon("notifications") +
            '<span class="rp-topbar__icon-badge">' +
            user.notifications +
            "</span>" +
            "</button>" +
            '<button class="rp-topbar__icon-btn" type="button" title="Messages" aria-label="Messages" data-demo="Messaging">' +
            icon("messages") +
            '<span class="rp-topbar__icon-badge">' +
            user.messages +
            "</span>" +
            "</button>" +
            '<span class="rp-topbar__divider"></span>' +
            availabilityMarkup(user) +
            profileMarkup(user) +
            "</div>" +
            "</header>"
        );
    }

    /* partials/_work_status_modal.html as a dropdown. Form id, field names
       and ws-* classes are kept so the markup ports back as a copy. */
    function availabilityMarkup(user) {
        var current = AVAILABILITY[user.availability];

        var options = Object.keys(AVAILABILITY)
            .map(function (key) {
                return (
                    '<label class="ws-option ws-option--' +
                    key +
                    '">' +
                    '<input type="radio" name="work_status" value="' +
                    key +
                    '"' +
                    (key === user.availability ? " checked" : "") +
                    ">" +
                    '<span class="ws-option-dot" aria-hidden="true"></span>' +
                    '<span class="ws-option-text">' +
                    '<span class="ws-option-name">' +
                    AVAILABILITY[key].label +
                    "</span>" +
                    '<span class="ws-option-desc">' +
                    AVAILABILITY[key].note +
                    "</span>" +
                    "</span>" +
                    '<span class="ws-option-tick" aria-hidden="true">' +
                    icon("check") +
                    "</span>" +
                    "</label>"
                );
            })
            .join("");

        return (
            '<div class="rp-av" id="rpAv">' +
            '<button class="rp-availability rp-availability--' +
            user.availability +
            '" id="rpAvailabilityBtn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="WorkStatusDropdown" title="Change your availability — currently ' +
            current.label +
            '">' +
            '<span class="rp-availability__dot"></span>' +
            '<span class="rp-availability__label">' +
            current.label +
            "</span>" +
            icon("chevron-down", "rp-availability__caret") +
            "</button>" +
            '<div class="ws-dropdown" id="WorkStatusDropdown" role="dialog" aria-labelledby="wsDropdownTitle" hidden>' +
            '<form id="ChangeWorkStatusPost" method="post">' +
            '<div class="ws-dropdown-head">' +
            '<h2 class="ws-dropdown-title" id="wsDropdownTitle">Update availability</h2>' +
            '<p class="ws-dropdown-hint">This is what project managers see when they are looking for a resource.</p>' +
            "</div>" +
            '<div class="ws-dropdown-body">' +
            '<div class="ws-options" role="radiogroup" aria-labelledby="wsDropdownTitle">' +
            options +
            "</div>" +
            '<label class="ws-field">' +
            '<span class="ws-field-label">Note <span class="ws-optional">(optional)</span></span>' +
            '<input type="text" name="work_status_description" maxlength="255" placeholder="e.g. Back on Monday" autocomplete="off">' +
            "</label>" +
            "</div>" +
            '<div class="ws-dropdown-foot">' +
            '<button type="button" class="ws-btn ws-btn--ghost" data-ws-cancel>Cancel</button>' +
            '<button type="submit" class="ws-btn ws-btn--primary" id="submit_change_status">Save</button>' +
            "</div>" +
            "</form>" +
            "</div>" +
            "</div>"
        );
    }

    function profileMarkup(user) {
        return (
            '<div class="rp-profile" id="rpProfile">' +
            '<button class="rp-profile__trigger" id="rpProfileTrigger" type="button" aria-haspopup="menu" aria-expanded="false">' +
            '<span class="rp-profile__greeting">Hello, <strong>' +
            user.firstName +
            "</strong></span>" +
            '<img class="rp-profile__avatar" src="' +
            user.photo +
            '" alt="' +
            user.fullName +
            '">' +
            icon("chevron-down", "rp-profile__chevron") +
            "</button>" +
            '<div class="rp-profile__menu" role="menu">' +
            '<div class="rp-profile__identity">' +
            '<img class="rp-profile__identity-avatar" src="' +
            user.photo +
            '" alt="">' +
            '<div class="rp-profile__identity-text">' +
            '<div class="rp-profile__identity-name">' +
            user.fullName +
            "</div>" +
            '<div class="rp-profile__identity-meta">' +
            '<span class="rp-profile__id-chip">' +
            user.resourceId +
            "</span>" +
            '<span class="rp-profile__since">Partner since ' +
            user.partnerSince +
            "</span>" +
            "</div>" +
            "</div>" +
            "</div>" +
            '<div class="rp-profile__balance">' +
            '<span class="rp-profile__balance-label">' +
            icon("balance") +
            "Balance</span>" +
            '<span class="rp-profile__balance-value">' +
            user.currency +
            " " +
            user.balance +
            '<small class="rp-profile__balance-sub">≈ USD ' +
            user.balanceUsd +
            "</small></span>" +
            "</div>" +
            '<div class="rp-profile__help" id="rpHelpGroup">' +
            '<button class="rp-profile__item" type="button" id="rpHelpToggle" aria-expanded="false">' +
            icon("help") +
            "Help" +
            icon("chevron-down", "rp-profile__item-caret") +
            "</button>" +
            '<div class="rp-profile__submenu">' +
            '<a class="rp-profile__subitem" href="#" data-demo="User Manual">' +
            icon("manual") +
            "User Manual</a>" +
            "</div>" +
            "</div>" +
            '<div class="rp-profile__divider"></div>' +
            '<button class="rp-profile__item rp-profile__item--danger" type="button" data-logout-trigger aria-haspopup="dialog">' +
            icon("logout") +
            "Sign out</button>" +
            "</div>" +
            "</div>"
        );
    }

    /* Same structure and class names as partials/logout_modal.html so
       the real modal drops straight in. */
    function logoutModalMarkup() {
        return (
            '<div class="logout-backdrop" id="logoutBackdrop" role="dialog" aria-modal="true" aria-labelledby="logoutTitle" aria-describedby="logoutDesc">' +
            '<div class="logout-modal" id="logoutModal">' +
            '<button class="logout-modal__close" id="closeLogoutModal" type="button" aria-label="Close">' +
            icon("close") +
            "</button>" +
            '<div class="logout-modal__icon" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="icon-outline">' +
            '<path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>' +
            "</svg>" +
            "</div>" +
            '<h2 class="logout-modal__title" id="logoutTitle">Sign out</h2>' +
            '<p class="logout-modal__body" id="logoutDesc">You\'ll need to sign in again to access your dashboard and settings.</p>' +
            '<div class="logout-modal__divider" aria-hidden="true"></div>' +
            '<div class="logout-modal__actions">' +
            '<button class="logout-btn logout-btn--cancel" id="cancelLogout" type="button">Stay signed in</button>' +
            '<a class="logout-btn logout-btn--confirm" id="confirmLogout" href="#">Sign out</a>' +
            "</div>" +
            "</div>" +
            "</div>"
        );
    }

    /* ── Behaviour ───────────────────────────────────────── */

    function mount() {
        var host = document.getElementById("rp-layout");
        if (!host) return;

        var user = RP.USER;
        var page = host.dataset.page || "";
        var title = host.dataset.title || "Dashboard";

        host.innerHTML = sidebarMarkup(page, user) + topbarMarkup(title, user) + logoutModalMarkup();

        if (!document.querySelector(".rp-toast-stack")) {
            var stack = document.createElement("div");
            stack.className = "rp-toast-stack";
            stack.setAttribute("aria-live", "polite");
            document.body.appendChild(stack);
        }

        wireSidebar();
        wireProfile();
        wireLogoutModal();
        wireAvailabilityDropdown();
        wireDemoStubs();
    }

    function wireSidebar() {
        var sidebar = document.getElementById("rpSidebar");
        var overlay = document.getElementById("rpSidebarOverlay");
        var collapseBtn = document.getElementById("rpCollapseBtn");
        var expandBtn = document.getElementById("rpExpandBtn");
        var burgerBtn = document.getElementById("rpBurgerBtn");

        function sync() {
            document.body.classList.toggle(
                "rp-sidebar-collapsed",
                sidebar.classList.contains("rp-sidebar--collapsed")
            );
        }

        function init() {
            sidebar.classList.remove("rp-sidebar--collapsed", "rp-sidebar--open");
            overlay.classList.remove("rp-sidebar-overlay--visible");

            /* Tablets start collapsed whatever the saved preference —
               there is not enough room for the rail and a wide table. */
            if (isTablet()) {
                sidebar.classList.add("rp-sidebar--collapsed");
            } else if (!isMobile() && readStore() === "1") {
                sidebar.classList.add("rp-sidebar--collapsed");
            }

            sync();
        }

        function toggle() {
            if (isMobile()) {
                closeDrawer();
                return;
            }

            var collapsed = sidebar.classList.toggle("rp-sidebar--collapsed");
            if (!isTablet()) writeStore(collapsed ? "1" : "0");
            sync();
            document.dispatchEvent(new CustomEvent("rp:layout-change"));
        }

        function openDrawer() {
            sidebar.classList.add("rp-sidebar--open");
            overlay.classList.add("rp-sidebar-overlay--visible");
            document.body.classList.add("rp-no-scroll");
        }

        function closeDrawer() {
            sidebar.classList.remove("rp-sidebar--open");
            overlay.classList.remove("rp-sidebar-overlay--visible");
            document.body.classList.remove("rp-no-scroll");
        }

        collapseBtn.addEventListener("click", toggle);
        expandBtn.addEventListener("click", toggle);
        burgerBtn.addEventListener("click", openDrawer);
        overlay.addEventListener("click", closeDrawer);

        var resizeTimer;
        global.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (!isMobile()) closeDrawer();
                init();
                document.dispatchEvent(new CustomEvent("rp:layout-change"));
            }, 120);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeDrawer();
        });

        init();
    }

    function wireProfile() {
        var profile = document.getElementById("rpProfile");
        var trigger = document.getElementById("rpProfileTrigger");
        var helpGroup = document.getElementById("rpHelpGroup");
        var helpToggle = document.getElementById("rpHelpToggle");

        function close() {
            profile.classList.remove("rp-profile--open");
            trigger.setAttribute("aria-expanded", "false");
            helpGroup.classList.remove("is-open");
            helpToggle.setAttribute("aria-expanded", "false");
        }

        trigger.addEventListener("click", function (e) {
            e.stopPropagation();
            var open = profile.classList.toggle("rp-profile--open");
            trigger.setAttribute("aria-expanded", open ? "true" : "false");
            if (!open) close();
        });

        helpToggle.addEventListener("click", function (e) {
            e.stopPropagation();
            var open = helpGroup.classList.toggle("is-open");
            helpToggle.setAttribute("aria-expanded", open ? "true" : "false");
        });

        document.addEventListener("click", function (e) {
            if (!profile.contains(e.target)) close();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") close();
        });
    }

    /* Mirrors static/js/logout_modal.js so behaviour matches the real one. */
    function wireLogoutModal() {
        var backdrop = document.getElementById("logoutBackdrop");

        function open() {
            backdrop.classList.add("is-open");
            backdrop.removeAttribute("aria-hidden");
            document.body.classList.add("rp-no-scroll");
        }

        function close() {
            backdrop.classList.remove("is-open");
            backdrop.setAttribute("aria-hidden", "true");
            document.body.classList.remove("rp-no-scroll");
        }

        document.addEventListener("click", function (e) {
            if (e.target.closest("[data-logout-trigger]")) {
                e.preventDefault();
                open();
            }
        });

        document.getElementById("closeLogoutModal").addEventListener("click", close);
        document.getElementById("cancelLogout").addEventListener("click", close);

        document.getElementById("confirmLogout").addEventListener("click", function (e) {
            e.preventDefault();
            close();
            RP.toast("Signed out — this is a preview, so you stay where you are.", "info");
        });

        backdrop.addEventListener("click", function (e) {
            if (e.target === backdrop) close();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && backdrop.classList.contains("is-open")) close();
        });

        backdrop.setAttribute("aria-hidden", "true");
    }

    /* UI only, nothing is saved: every close resets the form, so reopening never shows a stale pick. */
    function wireAvailabilityDropdown() {
        var wrap = document.getElementById("rpAv");
        var btn = document.getElementById("rpAvailabilityBtn");
        var dropdown = document.getElementById("WorkStatusDropdown");
        var form = document.getElementById("ChangeWorkStatusPost");

        function open() {
            dropdown.hidden = false;
            wrap.classList.add("is-open");
            btn.setAttribute("aria-expanded", "true");
            var checked = form.querySelector('input[name="work_status"]:checked');
            if (checked) checked.focus({ preventScroll: true });
        }

        function close(returnFocus) {
            if (dropdown.hidden) return;
            dropdown.hidden = true;
            wrap.classList.remove("is-open");
            btn.setAttribute("aria-expanded", "false");
            form.reset();
            if (returnFocus) btn.focus();
        }

        btn.addEventListener("click", function () {
            if (dropdown.hidden) open();
            else close(false);
        });

        form.querySelector("[data-ws-cancel]").addEventListener("click", function () {
            close(true);
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            close(true);
            RP.toast("Saving availability is not part of this preview yet.", "info");
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

    /* Controls that have no page behind them yet still say so. */
    function wireDemoStubs() {
        document.addEventListener("click", function (e) {
            var el = e.target.closest("[data-demo]");
            if (!el) return;
            e.preventDefault();
            RP.toast(el.dataset.demo + " is not part of this preview yet.", "info");
        });
    }

    /* ── Toast ───────────────────────────────────────────── */
    RP.toast = function (message, type) {
        var stack = document.querySelector(".rp-toast-stack");
        if (!stack) return;

        var iconName =
            type === "success" ? "success" : type === "danger" ? "error" : "info";

        var el = document.createElement("div");
        el.className = "rp-toast rp-toast--" + (type || "info");
        el.innerHTML = icon(iconName) + "<span>" + message + "</span>";
        stack.appendChild(el);

        setTimeout(function () {
            el.classList.add("is-leaving");
            setTimeout(function () {
                el.remove();
            }, 220);
        }, 3200);
    };

    RP.AVAILABILITY = AVAILABILITY;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mount);
    } else {
        mount();
    }
})(window);
