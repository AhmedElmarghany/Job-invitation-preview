/* ============================================================
   NAVIGATION TABS — overflow affordances
   Copied from config/static/js/navigation-tabs.js: edge fades,
   chevron buttons and drag-to-scroll. Two changes — it finds its
   own elements inside every .navigation-tabs on the page instead
   of by id, and it re-runs when the strip's buttons are written
   in, since here they are rendered by the page's own script.
   ============================================================ */
(function () {
    "use strict";

    /* Sub-pixel scroll widths mean scrollLeft never lands exactly on the bounds */
    var EDGE_EPS = 4;

    function wire(nav) {
        var inner = nav.querySelector(".navigation-tabs-inner");
        var fadeL = nav.querySelector(".navigation-tabs-fade-left");
        var fadeR = nav.querySelector(".navigation-tabs-fade-right");
        if (!inner || !fadeL || !fadeR) return;

        function updateFades() {
            var sl = inner.scrollLeft;
            var maxSl = inner.scrollWidth - inner.clientWidth;
            fadeL.classList.toggle("visible", sl > EDGE_EPS);
            fadeR.classList.toggle("visible", maxSl - sl > EDGE_EPS);
        }

        function scrollByPage(direction) {
            var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            inner.scrollBy({
                left: direction * inner.clientWidth,
                behavior: reduceMotion ? "auto" : "smooth"
            });
        }

        fadeL.addEventListener("click", function () {
            scrollByPage(-1);
        });
        fadeR.addEventListener("click", function () {
            scrollByPage(1);
        });

        var isDragging = false;
        var startX = 0;
        var startSL = 0;
        var hasDragged = false;

        inner.addEventListener("pointerdown", function (e) {
            if (e.button !== 0) return;
            isDragging = true;
            hasDragged = false;
            startX = e.clientX;
            startSL = inner.scrollLeft;
        });

        inner.addEventListener("pointermove", function (e) {
            if (!isDragging) return;
            var dx = e.clientX - startX;
            if (!hasDragged && Math.abs(dx) > 5) {
                hasDragged = true;
                inner.classList.add("is-dragging");
                inner.setPointerCapture(e.pointerId);
            }
            if (hasDragged) {
                inner.scrollLeft = startSL - dx;
                updateFades();
            }
        });

        function stopDrag(e) {
            isDragging = false;
            inner.classList.remove("is-dragging");
            if (e && e.pointerId != null && inner.hasPointerCapture(e.pointerId)) {
                inner.releasePointerCapture(e.pointerId);
            }
            /* keep hasDragged — the click handler resets it */
        }

        inner.addEventListener("pointerup", stopDrag);
        inner.addEventListener("pointercancel", stopDrag);

        /* Fires after pointerup — blocks the tab switch if we were dragging */
        inner.addEventListener(
            "click",
            function (e) {
                if (hasDragged) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                hasDragged = false;
            },
            true
        );

        inner.addEventListener("dragstart", function (e) {
            e.preventDefault();
        });

        /* An active tab past the overflow would otherwise load off-screen */
        var lastActive = null;

        function centreActiveTab() {
            var active = inner.querySelector(".navigation-tabs-link.active");
            if (!active) return;
            inner.scrollLeft = Math.max(
                0,
                active.offsetLeft - (inner.clientWidth - active.offsetWidth) / 2
            );
        }

        /* The strip is rewritten on every render, so centring on each one
           would undo a scroll the reader made by hand. Only a genuinely
           new active tab is worth scrolling to. */
        function centreIfTabChanged() {
            var active = inner.querySelector(".navigation-tabs-link.active");
            var key = active ? active.dataset.tab || active.textContent : null;
            if (key === lastActive) return;

            lastActive = key;
            centreActiveTab();
        }

        inner.addEventListener("scroll", updateFades, { passive: true });

        /* The strip is filled by the page's own script, so the first
           measurable width can come after this file has run. */
        var centred = false;
        new ResizeObserver(function () {
            if (!centred && inner.children.length) {
                centred = true;
                centreIfTabChanged();
            }
            updateFades();
        }).observe(inner);

        new MutationObserver(function () {
            centreIfTabChanged();
            updateFades();
        }).observe(inner, { childList: true });
    }

    function init() {
        document.querySelectorAll(".navigation-tabs").forEach(wire);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
