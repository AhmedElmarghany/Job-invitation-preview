/* ============================================================
   PASSWORD POLICY — checklist, eye toggles, submit gate
   ============================================================
   Data-* driven; reuse = this <script> + markup. See change_password.html.
     [data-password-policy]  the form (+ min-length, note-* overrides)
     [data-password-field]   current | new | confirm
     [data-password-rule]    length | upper | lower | number | special
     [data-password-toggle]  id of the input it reveals
     [data-password-submit] [data-password-mismatch] [-gate-note]
     [data-password-scope]   ancestor, if those sit outside the form
   Gate opens when RULES pass, confirm matches, current is filled.
   RULES mirror accounts/views.py password_pattern (min 8 vs its 6).
   API: PasswordPolicy.init(root) / .reset(form) / .RULES
   ============================================================ */
(function (window, document) {
    "use strict";

    var DEFAULT_MIN_LENGTH = 8;

    /* `key` matches data-password-rule; `test` gets the value and the
       form's minimum length. Change this to change the policy. */
    var RULES = [
        { key: "length",  test: function (value, minLength) { return value.length >= minLength; } },
        { key: "upper",   test: function (value) { return /[A-Z]/.test(value); } },
        { key: "lower",   test: function (value) { return /[a-z]/.test(value); } },
        { key: "number",  test: function (value) { return /[0-9]/.test(value); } },
        { key: "special", test: function (value) { return /[_#?!@$%^&*-]/.test(value); } }
    ];

    /* Overridden by data-note-* on the form, for translated copy. */
    var DEFAULT_NOTES = {
        current:  "Enter your current password to continue.",
        rules:    "Your new password does not meet every requirement yet.",
        confirm:  "Re-type your new password to confirm it.",
        mismatch: "The two passwords do not match."
    };

    /* NodeList.forEach is missing in some supported browsers. */
    function each(nodes, callback) {
        Array.prototype.forEach.call(nodes, callback);
    }

    /* Independent of the forms — works on a lone login field too. */
    function setupToggle(button) {
        if (button.dataset.passwordToggleReady === "1") return;
        button.dataset.passwordToggleReady = "1";

        button.addEventListener("click", function () {
            var field = document.getElementById(button.dataset.passwordToggle);
            if (!field) return;

            var revealing = field.type === "password";
            field.type = revealing ? "text" : "password";

            button.classList.toggle("is-revealed", revealing);
            button.setAttribute("aria-pressed", revealing ? "true" : "false");
            button.setAttribute("aria-label", revealing
                ? (button.dataset.labelHide || "Hide password")
                : (button.dataset.labelShow || "Show password"));
        });
    }

    /* ── One policy form ───────────────────────────────────── */
    function setupForm(form) {
        if (form.dataset.passwordPolicyReady === "1") return;
        form.dataset.passwordPolicyReady = "1";

        var newField = form.querySelector('[data-password-field="new"]');
        if (!newField) return;   /* nothing to measure */

        /* A dialog footer is a sibling of the body, so its button and note
           sit outside the form. data-password-scope spans both; without
           one the form is its own scope. */
        var scope = form.closest("[data-password-scope]") || form;

        var currentField = form.querySelector('[data-password-field="current"]');
        var confirmField = form.querySelector('[data-password-field="confirm"]');
        /* Not for .defaultSubmitDisabled forms: function-js/script.js
           force-enables .submitBtn on first change and beats the gate. */
        var submitButton = scope.querySelector("[data-password-submit]");
        var mismatchEl   = scope.querySelector("[data-password-mismatch]");
        var noteEl       = scope.querySelector("[data-password-gate-note]");

        var minLength = Number(form.dataset.passwordMinLength) || DEFAULT_MIN_LENGTH;

        var notes = {
            current:  form.dataset.noteCurrent  || DEFAULT_NOTES.current,
            rules:    form.dataset.noteRules    || DEFAULT_NOTES.rules,
            confirm:  form.dataset.noteConfirm  || DEFAULT_NOTES.confirm,
            mismatch: form.dataset.noteMismatch || DEFAULT_NOTES.mismatch
        };

        /* Indexed once, so a keystroke is one lookup per rule. */
        var rowsByRule = {};
        each(scope.querySelectorAll("[data-password-rule]"), function (row) {
            rowsByRule[row.dataset.passwordRule] = row;
            /* aria-disabled is what makes a non-focusable checkbox valid. */
            row.setAttribute("role", "checkbox");
            row.setAttribute("aria-disabled", "true");
            row.setAttribute("aria-checked", "false");
        });

        /* Every keystroke. No early returns, so the UI can never be
           left describing an older value. */
        function evaluate() {
            var value = newField.value;

            var allRulesMet = true;
            RULES.forEach(function (rule) {
                var met = rule.test(value, minLength);
                if (!met) allRulesMet = false;

                var row = rowsByRule[rule.key];
                if (row) {
                    row.classList.toggle("is-met", met);
                    row.setAttribute("aria-checked", met ? "true" : "false");
                }
            });

            /* Quiet until there is something to compare. */
            var confirmValue   = confirmField ? confirmField.value : "";
            var confirmFilled  = !confirmField || confirmValue.length > 0;
            var confirmMatches = !confirmField || confirmValue === value;
            var showMismatch   = confirmFilled && !confirmMatches;

            if (mismatchEl) {
                mismatchEl.textContent = notes.mismatch;
                mismatchEl.classList.toggle("is-shown", showMismatch);
            }
            if (confirmField) {
                confirmField.setAttribute("aria-invalid", showMismatch ? "true" : "false");
                var confirmWrap = confirmField.closest(".pwd-field");
                if (confirmWrap) confirmWrap.classList.toggle("is-invalid", showMismatch);
            }

            var currentFilled = !currentField || currentField.value.length > 0;
            var ready = allRulesMet && confirmFilled && confirmMatches && currentFilled;

            if (submitButton) submitButton.disabled = !ready;

            /* One reason at a time, in form order, so it does not jump. */
            if (noteEl) {
                var reason = "";
                if (!currentFilled) reason = notes.current;
                else if (!allRulesMet) reason = notes.rules;
                else if (!confirmFilled) reason = notes.confirm;
                else if (!confirmMatches) reason = notes.mismatch;
                noteEl.textContent = reason;
            }
        }

        each(form.querySelectorAll("[data-password-field]"), function (field) {
            field.addEventListener("input", evaluate);
        });

        form.passwordPolicyEvaluate = evaluate;   /* used by reset() */
        evaluate();                               /* paint the empty state */
    }

    /* Called after a successful save, so the next open is clean. */
    function reset(form) {
        if (!form) return;

        each(form.querySelectorAll("[data-password-field]"), function (field) {
            field.value = "";
            field.type = "password";
        });

        var scope = form.closest("[data-password-scope]") || form;
        each(scope.querySelectorAll("[data-password-toggle]"), function (button) {
            button.classList.remove("is-revealed");
            button.setAttribute("aria-pressed", "false");
        });

        if (form.passwordPolicyEvaluate) form.passwordPolicyEvaluate();
    }

    /* Safe to re-run after injecting markup — both setups skip what
       they have already handled. */
    function init(root) {
        var scope = root || document;
        each(scope.querySelectorAll("[data-password-policy]"), setupForm);
        each(scope.querySelectorAll("[data-password-toggle]"), setupToggle);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { init(); });
    } else {
        init();
    }

    window.PasswordPolicy = { init: init, reset: reset, RULES: RULES };
})(window, document);
