/* ============================================================
   COLUMNS MODAL
   Same markup and class names as
   accounting/customer/modals/orders_customize_columns_modal.html,
   so what is styled here is what ships there. Generic on purpose:
   every table in the portal can reuse it.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});
    var icon = RP.icon;

    function ColumnsModal(options) {
        this.table = document.querySelector(options.table);
        this.columns = options.columns;
        this.storageKey = options.storageKey;
        this.onChange = options.onChange || function () {};
        this.hidden = this.load();
        this.build();
    }

    ColumnsModal.prototype.load = function () {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (err) {
            return [];
        }
    };

    ColumnsModal.prototype.save = function () {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.hidden));
        } catch (err) {
            /* private mode — the choice just does not persist */
        }
    };

    ColumnsModal.prototype.build = function () {
        var self = this;
        var host = document.createElement("div");
        host.innerHTML = this.markup();
        document.body.appendChild(host.firstChild);

        this.overlay = document.getElementById("columnsCustomizeModal");

        this.overlay.addEventListener("click", function (e) {
            if (e.target === self.overlay || e.target.closest("[data-col-close]")) self.close();
            if (e.target.closest("[data-col-reset]")) self.reset();
            if (e.target.closest("[data-col-all]")) self.selectAll();
        });

        this.overlay.addEventListener("change", function (e) {
            var input = e.target.closest(".column-toggle");
            if (!input) return;

            var key = input.dataset.column;
            var at = self.hidden.indexOf(key);

            if (input.checked && at > -1) self.hidden.splice(at, 1);
            if (!input.checked && at === -1) self.hidden.push(key);

            self.save();
            self.apply();
            self.refreshSummary();
        });

        this.onKeydown = function (e) {
            if (e.key === "Escape") self.close();
        };
        document.addEventListener("keydown", this.onKeydown);

        this.apply();
        this.refreshSummary();
    };

    /* A table whose column set changes — jobs.html, where each tab
       carries different columns — throws the modal away and builds a
       new one, so the overlay and its Escape handler have to go too. */
    ColumnsModal.prototype.destroy = function () {
        document.removeEventListener("keydown", this.onKeydown);
        if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
        document.body.classList.remove("rp-no-scroll");
    };

    ColumnsModal.prototype.markup = function () {
        var self = this;

        var items = this.columns
            .map(function (col) {
                if (col.fixed) {
                    return (
                        '<div class="col-item-fixed checked" tabindex="0">' +
                        '<div class="col-checkbox-fixed">' +
                        icon("lock") +
                        "</div>" +
                        '<span class="col-label">' +
                        col.label +
                        "</span>" +
                        "</div>"
                    );
                }

                var checked = self.hidden.indexOf(col.key) === -1 ? " checked" : "";
                var id = "colToggle-" + col.key;

                return (
                    '<div class="form-check col-box">' +
                    '<input class="form-check-input theme-checkbox column-toggle" type="checkbox" data-column="' +
                    col.key +
                    '" id="' +
                    id +
                    '"' +
                    checked +
                    ">" +
                    '<label class="form-check-label" for="' +
                    id +
                    '">' +
                    col.label +
                    "</label>" +
                    "</div>"
                );
            })
            .join("");

        return (
            '<div class="columns-customize-modal__overlay" id="columnsCustomizeModal" role="dialog" aria-modal="true" aria-labelledby="colModalTitle">' +
            '<div class="columns-customize-modal">' +
            '<div class="columns-customize-modal__header">' +
            '<div class="columns-customize-modal__header-left">' +
            '<div class="columns-customize-modal__title-wrap">' +
            '<div class="columns-customize-modal__title" id="colModalTitle">Customize Columns</div>' +
            '<div class="columns-customize-modal__subtitle">Choose which columns to display in the table</div>' +
            "</div></div>" +
            '<button class="columns-customize-modal__close" type="button" data-col-close aria-label="Close modal">' +
            icon("close") +
            "</button>" +
            "</div>" +
            '<div class="fixed-column-note">' +
            icon("lock") +
            "<span>Fixed columns are always visible and cannot be hidden.</span>" +
            "</div>" +
            '<div class="selection-bar">' +
            '<span class="selection-count"><strong id="selectedCount">0</strong> of <strong id="totalCount">0</strong> columns selected</span>' +
            '<button class="select-all-btn" type="button" data-col-all>Select all</button>' +
            "</div>" +
            '<div class="columns-customize-modal__body">' +
            '<div class="columns-grid" id="columnsGrid">' +
            items +
            "</div></div>" +
            '<div class="columns-customize-modal__footer">' +
            '<button class="btn-reset" type="button" data-col-reset>' +
            icon("reset") +
            "Reset to default</button>" +
            '<div class="footer-right">' +
            '<button class="btn-done" type="button" data-col-close>Done</button>' +
            "</div></div>" +
            "</div></div>"
        );
    };

    ColumnsModal.prototype.apply = function () {
        var self = this;

        this.columns.forEach(function (col) {
            var off = !col.fixed && self.hidden.indexOf(col.key) > -1;
            self.table.querySelectorAll("." + col.key).forEach(function (cell) {
                cell.style.display = off ? "none" : "";
            });
        });

        this.onChange();
    };

    ColumnsModal.prototype.refreshSummary = function () {
        var total = this.columns.length;
        var shown = total - this.hidden.length;

        this.overlay.querySelector("#selectedCount").textContent = shown;
        this.overlay.querySelector("#totalCount").textContent = total;
        this.overlay.querySelector("[data-col-all]").textContent =
            shown === total ? "Clear optional" : "Select all";
    };

    ColumnsModal.prototype.selectAll = function () {
        var self = this;
        var allOn = this.hidden.length === 0;

        this.hidden = allOn
            ? this.columns
                  .filter(function (col) {
                      return !col.fixed;
                  })
                  .map(function (col) {
                      return col.key;
                  })
            : [];

        this.overlay.querySelectorAll(".column-toggle").forEach(function (input) {
            input.checked = self.hidden.indexOf(input.dataset.column) === -1;
        });

        this.save();
        this.apply();
        this.refreshSummary();
    };

    ColumnsModal.prototype.reset = function () {
        this.hidden = [];

        this.overlay.querySelectorAll(".column-toggle").forEach(function (input) {
            input.checked = true;
        });

        this.save();
        this.apply();
        this.refreshSummary();
        RP.toast("Columns reset to default.", "info");
    };

    ColumnsModal.prototype.open = function () {
        this.overlay.classList.add("open");
        document.body.classList.add("rp-no-scroll");
    };

    ColumnsModal.prototype.close = function () {
        this.overlay.classList.remove("open");
        document.body.classList.remove("rp-no-scroll");
    };

    RP.ColumnsModal = ColumnsModal;
})(window);
