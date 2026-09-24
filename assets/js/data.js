/* ============================================================
   DEMO DATA — everything here is invented.
   Times are stored as offsets in hours and resolved against the
   moment the page loads, so deadlines and countdowns stay alive
   however long after this preview was built you open it.
   ============================================================ */
(function (global) {
    "use strict";

    var RP = (global.RP = global.RP || {});

    RP.USER = {
        firstName: "Ahmad",
        fullName: "Ahmad Elmarghany",
        resourceId: "R-10482",
        partnerSince: "March 2021",
        photo: "assets/img/placeholder-headshot.png",
        /* work_status + ResourceDailyWorkSchedule + Profile.timezone.
           No period means "Available from now on"; "" timezone = the device's. */
        availability: {
            status: "AV",
            note: "",
            from: null,
            to: null,
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            start: "09:00",
            end: "17:00",
            timezone: ""
        },
        currency: "NZD",
        balance: "1,284.60",
        balanceUsd: "778.35",
        notifications: 5,
        messages: 2
    };

    var PM = {
        sara: { name: "Sara Whitfield", email: "sara.whitfield@agato.example" },
        daniel: { name: "Daniel Okafor", email: "daniel.okafor@agato.example" },
        mei: { name: "Mei Lin Chen", email: "meilin.chen@agato.example" },
        tane: { name: "Tane Ngata", email: "tane.ngata@agato.example" }
    };

    /* type:    invitation | bid | interpretation
       status:  new_invite | new_bid | bid_sent (see RP.STATUS below) */
    var INVITATIONS = [
        {
            jobId: 48210,
            type: "invitation",
            project: "Cardiac monitor — instructions for use (batch 12)",
            service: "Translation",
            serviceGroup: "Translation",
            source: "English",
            target: "Arabic",
            status: "new_invite",
            amount: 148.5,
            usd: 90.19,
            rate: "0.055 / word",
            count: { value: 2700, unit: "Words" },
            deadlineIn: 68,
            invitedAgo: 3,
            expiresIn: 5.6,
            specialty: "Medical",
            docFormat: "DOCX",
            pm: PM.sara,
            files: [
                { name: "cardiac-monitor-IFU-b12.docx", size: "412 KB", tag: "Source" },
                { name: "AGATO-medical-termbase.xlsx", size: "96 KB", tag: "Reference" }
            ],
            notes:
                "Client supplies an approved glossary — terminology must match it exactly. Keep all measurement units in metric and leave the device model numbers untranslated."
        },
        {
            jobId: 48207,
            type: "bid",
            project: "Employment agreement pack — Ngā Tāngata Trust",
            service: "Certified",
            serviceGroup: "Certified Translation",
            source: "English",
            target: "Te Reo Māori",
            status: "new_bid",
            amount: null,
            usd: null,
            rate: "Your quote",
            count: { value: 4150, unit: "Words" },
            deadlineIn: 120,
            invitedAgo: 6,
            expiresIn: 19.5,
            specialty: "Legal",
            docFormat: "PDF",
            pm: PM.tane,
            bid: { suggestedMin: 280, suggestedMax: 360 },
            files: [{ name: "employment-agreement-pack.pdf", size: "1.8 MB", tag: "Source" }],
            notes:
                "Certified output required with your NZSTI stamp. Quote for the full pack, not per document — there are 4 documents inside the PDF."
        },
        {
            jobId: 48203,
            type: "interpretation",
            project: "ACC assessment appointment — Manukau",
            service: "Interpreting",
            serviceGroup: "Interpreting",
            source: "English",
            target: "Samoan",
            status: "new_invite",
            amount: 210.0,
            usd: 127.55,
            rate: "70.00 / hour",
            count: { value: 3, unit: "Hours" },
            deadlineIn: 52,
            invitedAgo: 9,
            expiresIn: 11.2,
            specialty: "Medical",
            docFormat: null,
            pm: PM.daniel,
            appointment: {
                mode: "On-site",
                location: "ACC Manukau, 31 Amersham Way, Manukau, Auckland 2104",
                durationMin: 180,
                startsIn: 52,
                speakers: [
                    { name: "Dr. H. Patel", lang: "English" },
                    { name: "Client (Mr. F.)", lang: "Samoan" }
                ]
            },
            files: [{ name: "appointment-brief.pdf", size: "88 KB", tag: "Brief" }],
            notes:
                "Arrive 15 minutes early and report to reception. Consecutive interpreting; no simultaneous equipment provided."
        },
        {
            jobId: 48198,
            type: "invitation",
            project: "Consumer app onboarding strings — release 4.2",
            service: "DTP",
            serviceGroup: "Translation",
            source: "English",
            target: "Chinese",
            status: "new_invite",
            amount: 96.0,
            usd: 58.3,
            rate: "0.032 / word",
            count: { value: 3000, unit: "Words" },
            deadlineIn: 31,
            invitedAgo: 1,
            expiresIn: 2.4,
            specialty: "IT / Software",
            docFormat: "XLIFF",
            pm: PM.mei,
            files: [
                { name: "onboarding-strings-4.2.xliff", size: "240 KB", tag: "Source" },
                { name: "ui-style-guide-zh.pdf", size: "310 KB", tag: "Reference" }
            ],
            notes:
                "Character limits are in the XLIFF notes — do not exceed them. Machine output is DeepL; fix meaning and tone, do not re-translate from scratch."
        },
        {
            jobId: 48191,
            type: "invitation",
            project: "Annual financial report 2025 — notes section",
            service: "Translation",
            serviceGroup: "Translation",
            source: "English",
            target: "Japanese",
            status: "new_invite",
            amount: 612.0,
            usd: 371.69,
            rate: "0.085 / word",
            count: { value: 7200, unit: "Words" },
            deadlineIn: 96,
            invitedAgo: 30,
            expiresIn: 21,
            specialty: "Financial",
            docFormat: "DOCX",
            pm: PM.sara,
            files: [
                { name: "annual-report-2025-notes.docx", size: "780 KB", tag: "Source" },
                { name: "FY24-approved-translation.docx", size: "742 KB", tag: "Reference" }
            ],
            notes: "Use last year's approved translation as the reference for all recurring headings."
        },
        {
            jobId: 48188,
            type: "bid",
            project: "Product catalogue 2026 — 48 pages",
            service: "DTP",
            serviceGroup: "DTP",
            source: null,
            target: null,
            status: "bid_sent",
            amount: 480.0,
            usd: 291.52,
            rate: "Your quote",
            count: { value: 48, unit: "Physical Pages" },
            deadlineIn: 150,
            invitedAgo: 26,
            expiresIn: 40,
            specialty: "Marketing",
            docFormat: "INDD",
            pm: PM.daniel,
            bid: { suggestedMin: 420, suggestedMax: 560, submitted: 480 },
            files: [
                { name: "catalogue-2026-src.indd", size: "38 MB", tag: "Source" },
                { name: "brand-fonts.zip", size: "12 MB", tag: "Reference" }
            ],
            notes: "Arabic RTL layout. Fonts are supplied; do not substitute."
        },
        {
            jobId: 48180,
            type: "invitation",
            project: "Immigration statutory declarations — 6 documents",
            service: "Certified",
            serviceGroup: "Certified Translation",
            source: "Farsi",
            target: "English",
            status: "new_invite",
            amount: 270.0,
            usd: 163.98,
            rate: "45.00 / document",
            count: { value: 6, unit: "Documents" },
            deadlineIn: 44,
            invitedAgo: 5,
            expiresIn: 7.8,
            specialty: "Immigration",
            docFormat: "PDF",
            pm: PM.tane,
            paymentMethodMissing: true,
            files: [{ name: "statutory-declarations.zip", size: "6.4 MB", tag: "Source" }],
            notes:
                "INZ submission — certification wording must be the 2024 template. Scans are readable but rotated; straighten before delivery."
        },
        {
            jobId: 48176,
            type: "interpretation",
            project: "Tenancy Tribunal hearing — remote",
            service: "Interpretation",
            serviceGroup: "Interpreting",
            source: "English",
            target: "Hindi",
            status: "new_bid",
            amount: null,
            usd: null,
            rate: "Your quote",
            count: { value: 2, unit: "Hours" },
            deadlineIn: 74,
            invitedAgo: 8,
            expiresIn: 14,
            specialty: "Legal",
            docFormat: null,
            pm: PM.daniel,
            bid: { suggestedMin: 120, suggestedMax: 180 },
            appointment: {
                mode: "Remote (Zoom)",
                location: "Link sent 24 h before the hearing",
                durationMin: 120,
                startsIn: 74,
                speakers: [
                    { name: "Adjudicator", lang: "English" },
                    { name: "Applicant", lang: "Hindi" },
                    { name: "Respondent", lang: "English" }
                ]
            },
            files: [{ name: "hearing-notice.pdf", size: "120 KB", tag: "Brief" }],
            notes: "Quote for a 2-hour block. Overrun is billed in 30-minute increments."
        },
        {
            jobId: 48170,
            type: "invitation",
            project: "School enrolment pack — parent handbook",
            service: "Translation",
            serviceGroup: "Translation",
            source: "English",
            target: "Tongan",
            status: "new_invite",
            amount: 187.2,
            usd: 113.69,
            rate: "0.052 / word",
            count: { value: 3600, unit: "Words" },
            deadlineIn: 90,
            invitedAgo: 11,
            expiresIn: 23.5,
            specialty: "Education",
            docFormat: "DOCX",
            pm: PM.mei,
            files: [{ name: "parent-handbook-2026.docx", size: "520 KB", tag: "Source" }],
            notes: "Plain-language register — the audience is parents, not educators."
        },
        {
            jobId: 48166,
            type: "invitation",
            project: "Pharmacovigilance case narratives — week 38",
            service: "Translation",
            serviceGroup: "Translation",
            source: "Spanish",
            target: "English",
            status: "new_invite",
            amount: 220.5,
            usd: 133.92,
            rate: "0.063 / word",
            count: { value: 3500, unit: "Words" },
            deadlineIn: 22,
            invitedAgo: 40,
            expiresIn: 16.5,
            specialty: "Medical",
            docFormat: "DOCX",
            pm: PM.sara,
            files: [{ name: "pv-narratives-w38.docx", size: "180 KB", tag: "Source" }],
            notes: "Regulatory deadline — no extension is possible on this one."
        },
        {
            jobId: 48159,
            type: "bid",
            project: "Corporate training videos — 5 × 8 min",
            service: "Subtitling",
            serviceGroup: "Subtitling",
            source: "English",
            target: "Korean",
            status: "new_bid",
            amount: null,
            usd: null,
            rate: "Your quote",
            count: { value: 40, unit: "Minutes" },
            deadlineIn: 168,
            invitedAgo: 14,
            expiresIn: 34,
            specialty: "Technical",
            docFormat: "SRT",
            pm: PM.mei,
            bid: { suggestedMin: 320, suggestedMax: 480 },
            files: [
                { name: "training-videos.zip", size: "1.2 GB", tag: "Source", locked: true },
                { name: "english-transcripts.srt", size: "64 KB", tag: "Reference" }
            ],
            notes:
                "Video files unlock once the job is assigned. Quote on the transcripts — 42 characters per line, 2 lines max."
        },
        {
            jobId: 48152,
            type: "invitation",
            project: "Machinery safety manual — hydraulic press HP-400",
            service: "Translation",
            serviceGroup: "Translation",
            source: "German",
            target: "English",
            status: "new_invite",
            amount: 585.0,
            usd: 355.29,
            rate: "0.065 / word",
            count: { value: 9000, unit: "Words" },
            deadlineIn: 200,
            invitedAgo: 62,
            expiresIn: 30,
            specialty: "Technical",
            docFormat: "PDF",
            pm: PM.daniel,
            files: [{ name: "HP-400-safety-manual.pdf", size: "4.1 MB", tag: "Source" }],
            notes: "Heavy figure captions — the DTP is handled separately."
        },
        {
            jobId: 48147,
            type: "invitation",
            project: "Marketing landing page — spring campaign",
            service: "Transcreation",
            serviceGroup: "Translation",
            source: "English",
            target: "French",
            status: "new_invite",
            amount: 132.0,
            usd: 80.16,
            rate: "0.110 / word",
            count: { value: 1200, unit: "Words" },
            deadlineIn: 54,
            invitedAgo: 96,
            expiresIn: 4.8,
            specialty: "Marketing",
            docFormat: "DOCX",
            pm: PM.mei,
            files: [{ name: "spring-campaign-copy.docx", size: "72 KB", tag: "Source" }],
            notes: "Two headline options were wanted per section."
        },
        {
            jobId: 48141,
            type: "invitation",
            project: "Court bundle — witness statements (part 3)",
            service: "Certified",
            serviceGroup: "Certified Translation",
            source: "Russian",
            target: "English",
            status: "new_invite",
            amount: 396.0,
            usd: 240.51,
            rate: "0.072 / word",
            count: { value: 5500, unit: "Words" },
            deadlineIn: 47,
            invitedAgo: 2,
            expiresIn: 4.3,
            specialty: "Legal",
            docFormat: "PDF",
            pm: PM.tane,
            files: [
                { name: "witness-statements-p3.pdf", size: "2.9 MB", tag: "Source" },
                { name: "parts-1-2-delivered.docx", size: "1.1 MB", tag: "Reference" }
            ],
            notes:
                "Parts 1 and 2 were done by you — keep names and transliterations identical to the delivered files."
        },
        {
            jobId: 48136,
            type: "invitation",
            project: "Patient discharge instructions — 12 leaflets",
            service: "Translation",
            serviceGroup: "Translation",
            source: "English",
            target: "Punjabi",
            status: "new_invite",
            amount: 174.0,
            usd: 105.68,
            rate: "0.058 / word",
            count: { value: 3000, unit: "Words" },
            deadlineIn: 14,
            invitedAgo: 50,
            expiresIn: 8.4,
            specialty: "Medical",
            docFormat: "DOCX",
            pm: PM.sara,
            files: [{ name: "discharge-leaflets.docx", size: "340 KB", tag: "Source" }],
            notes: "Reading age 12. Avoid clinical abbreviations entirely."
        },
        {
            jobId: 48130,
            type: "bid",
            project: "Board minutes archive — 2019 to 2024",
            service: "DTP",
            serviceGroup: "Transcription",
            source: "Indonesian",
            target: "English",
            status: "bid_sent",
            amount: 1250.0,
            usd: 759.16,
            rate: "Your quote",
            count: { value: 620, unit: "Minutes" },
            deadlineIn: 400,
            invitedAgo: 70,
            expiresIn: 92,
            specialty: "Financial",
            docFormat: "MP3",
            pm: PM.daniel,
            bid: { suggestedMin: 1100, suggestedMax: 1500, submitted: 1250 },
            files: [{ name: "board-minutes-archive.zip", size: "2.4 GB", tag: "Source", locked: true }],
            notes: "Timestamps every 2 minutes. Speaker labels required."
        },
        {
            jobId: 48124,
            type: "interpretation",
            project: "WINZ benefit review — Wellington office",
            service: "Interpreting",
            serviceGroup: "Interpreting",
            source: "English",
            target: "Somali",
            status: "new_invite",
            amount: 140.0,
            usd: 85.03,
            rate: "70.00 / hour",
            count: { value: 2, unit: "Hours" },
            deadlineIn: 27,
            invitedAgo: 46,
            expiresIn: 12.6,
            specialty: "Government",
            docFormat: null,
            pm: PM.tane,
            appointment: {
                mode: "On-site",
                location: "MSD Wellington, 56 The Terrace, Wellington 6011",
                durationMin: 120,
                startsIn: 27,
                speakers: [
                    { name: "Case manager", lang: "English" },
                    { name: "Client (Ms. A.)", lang: "Somali" }
                ]
            },
            files: [{ name: "review-agenda.pdf", size: "64 KB", tag: "Brief" }],
            notes: "Photo ID required at the door."
        },
        {
            jobId: 48119,
            type: "invitation",
            project: "E-commerce product descriptions — batch 7",
            service: "Translation",
            serviceGroup: "Translation",
            source: "English",
            target: "Vietnamese",
            status: "new_invite",
            amount: 88.0,
            usd: 53.44,
            rate: "0.044 / word",
            count: { value: 2000, unit: "Words" },
            deadlineIn: 63,
            invitedAgo: 4,
            expiresIn: 9.1,
            specialty: "Marketing",
            docFormat: "CSV",
            pm: PM.mei,
            files: [{ name: "products-batch-7.csv", size: "150 KB", tag: "Source" }],
            notes: "Do not translate the SKU column."
        },
        {
            jobId: 48112,
            type: "invitation",
            project: "Insurance policy wording — motor",
            service: "Proofreading",
            serviceGroup: "Translation",
            source: "English",
            target: "Thai",
            status: "new_invite",
            amount: 105.0,
            usd: 63.77,
            rate: "0.021 / word",
            count: { value: 5000, unit: "Words" },
            deadlineIn: 110,
            invitedAgo: 80,
            expiresIn: 26,
            specialty: "Legal",
            docFormat: "DOCX",
            pm: PM.sara,
            files: [{ name: "motor-policy-th.docx", size: "260 KB", tag: "Source" }],
            notes: "Bilingual review against the English source."
        },
        {
            jobId: 48106,
            type: "invitation",
            project: "University transcript and degree certificate",
            service: "Attestation",
            serviceGroup: "Attestation",
            source: "Urdu",
            target: "English",
            status: "new_invite",
            amount: 60.0,
            usd: 36.44,
            rate: "60.00 / document",
            count: { value: 1, unit: "Document" },
            deadlineIn: 40,
            invitedAgo: 72,
            expiresIn: 2.9,
            specialty: "Education",
            docFormat: "PDF",
            pm: PM.tane,
            files: [{ name: "transcript-and-degree.pdf", size: "980 KB", tag: "Source" }],
            notes: "NZQA-ready formatting."
        },
        {
            jobId: 48101,
            type: "bid",
            project: "Clinical trial consent forms — site 4",
            service: "DTP",
            serviceGroup: "Translation",
            source: "English",
            target: "Burmese",
            status: "new_bid",
            amount: null,
            usd: null,
            rate: "Your quote",
            count: { value: 4800, unit: "Words" },
            deadlineIn: 132,
            invitedAgo: 16,
            expiresIn: 27,
            specialty: "Medical",
            docFormat: "DOCX",
            pm: PM.sara,
            bid: { suggestedMin: 380, suggestedMax: 520 },
            files: [{ name: "consent-forms-site4.docx", size: "410 KB", tag: "Source" }],
            notes:
                "Back-translation is quoted separately — this bid is for the forward translation only."
        },
        {
            jobId: 48094,
            type: "invitation",
            project: "Council resource consent — public notice",
            service: "Translation",
            serviceGroup: "Translation",
            source: "English",
            target: "Chinese",
            status: "new_invite",
            amount: 64.4,
            usd: 39.11,
            rate: "0.046 / word",
            count: { value: 1400, unit: "Words" },
            deadlineIn: 8,
            invitedAgo: 34,
            expiresIn: 6.2,
            specialty: "Government",
            docFormat: "DOCX",
            pm: PM.daniel,
            files: [{ name: "resource-consent-notice.docx", size: "88 KB", tag: "Source" }],
            notes: "Goes to print — final proof must be clean."
        },
        {
            jobId: 48088,
            type: "invitation",
            project: "Mobile banking release notes — 4.9",
            service: "DTP",
            serviceGroup: "Translation",
            source: "English",
            target: "Filipino",
            status: "new_invite",
            amount: 42.0,
            usd: 25.51,
            rate: "0.028 / word",
            count: { value: 1500, unit: "Words" },
            deadlineIn: 19,
            invitedAgo: 1,
            expiresIn: 3.2,
            specialty: "IT / Software",
            docFormat: "JSON",
            pm: PM.mei,
            files: [{ name: "release-notes-4.9.json", size: "42 KB", tag: "Source" }],
            notes: "Light pass — fix errors only, leave acceptable wording alone."
        },
        {
            jobId: 48081,
            type: "interpretation",
            project: "Family group conference — Christchurch",
            service: "Interpreting",
            serviceGroup: "Interpreting",
            source: "English",
            target: "Dari",
            status: "new_invite",
            amount: 175.0,
            usd: 106.29,
            rate: "70.00 / hour",
            count: { value: 2.5, unit: "Hours" },
            deadlineIn: 76,
            invitedAgo: 120,
            expiresIn: 9.7,
            specialty: "Government",
            docFormat: null,
            pm: PM.tane,
            appointment: {
                mode: "On-site",
                location: "Oranga Tamariki, 68 Oxford Terrace, Christchurch 8011",
                durationMin: 150,
                startsIn: 76,
                speakers: [
                    { name: "Facilitator", lang: "English" },
                    { name: "Family (3 speakers)", lang: "Dari" }
                ]
            },
            files: [],
            notes: "Sensitive matter — confidentiality agreement required on arrival."
        },
        {
            jobId: 48075,
            type: "invitation",
            project: "Food safety plan — dairy processing site",
            service: "Translation",
            serviceGroup: "Translation",
            source: "English",
            target: "Nepali",
            status: "new_invite",
            amount: 231.0,
            usd: 140.29,
            rate: "0.055 / word",
            count: { value: 4200, unit: "Words" },
            deadlineIn: 140,
            invitedAgo: 88,
            expiresIn: 38,
            specialty: "Technical",
            docFormat: "DOCX",
            pm: PM.daniel,
            files: [{ name: "food-safety-plan.docx", size: "620 KB", tag: "Source" }],
            notes: "MPI-aligned terminology."
        },
        {
            jobId: 48068,
            type: "bid",
            project: "Museum exhibition panels — bilingual",
            service: "DTP",
            serviceGroup: "Translation",
            source: "English",
            target: "Te Reo Māori",
            status: "bid_sent",
            amount: 690.0,
            usd: 419.05,
            rate: "Your quote",
            count: { value: 5200, unit: "Words" },
            deadlineIn: 260,
            invitedAgo: 100,
            expiresIn: 60,
            specialty: "Academic",
            docFormat: "IDML",
            pm: PM.tane,
            bid: { suggestedMin: 600, suggestedMax: 800, submitted: 690 },
            files: [{ name: "exhibition-panels.idml", size: "8.2 MB", tag: "Source" }],
            notes: "Iwi consultation is handled by the client; flag anything you are unsure of."
        },
        {
            jobId: 48060,
            type: "invitation",
            project: "Driver licence theory handbook — update",
            service: "Translation",
            serviceGroup: "Translation",
            source: "English",
            target: "Tamil",
            status: "new_invite",
            amount: 319.0,
            usd: 193.74,
            rate: "0.058 / word",
            count: { value: 5500, unit: "Words" },
            deadlineIn: 210,
            invitedAgo: 20,
            expiresIn: 44,
            specialty: "Government",
            docFormat: "DOCX",
            pm: PM.sara,
            files: [
                { name: "theory-handbook-delta.docx", size: "900 KB", tag: "Source" },
                { name: "previous-edition-ta.docx", size: "1.4 MB", tag: "Reference" }
            ],
            notes: "Only the tracked-change sections are in scope; the rest is reference."
        }
    ];

    /* ── Resolve relative times once, at load ─────────────── */
    var NOW = Date.now();
    var HOUR = 3600 * 1000;

    RP.INVITATIONS = INVITATIONS.map(function (row) {
        var out = Object.assign({}, row);
        out.id = "J-" + row.jobId;
        out.deadline = new Date(NOW + row.deadlineIn * HOUR);
        out.invitedAt = new Date(NOW - row.invitedAgo * HOUR);
        out.expiresAt = row.expiresIn == null ? null : new Date(NOW + row.expiresIn * HOUR);

        if (out.appointment) {
            out.appointment.start = new Date(NOW + out.appointment.startsIn * HOUR);
            out.appointment.end = new Date(
                out.appointment.start.getTime() + out.appointment.durationMin * 60000
            );
        }

        return out;
    });

    /* The only three the real table can show: an FCFS invite, a bid not
       quoted yet, and one already quoted. Anything else means the row has
       left the list. Pills come from status.css — teal, amber and purple
       sit furthest apart on the wheel, so the three read apart at a glance. */
    RP.STATUS = {
        new_invite: { label: "New invite", pill: "status-new" },
        new_bid: { label: "New Bid", pill: "status-processing" },
        bid_sent: { label: "Bid Sent", pill: "status-edited" }
    };

    RP.TYPE = {
        invitation: { label: "Invitation", icon: "invitations" },
        bid: { label: "Bid request", icon: "bid" },
        interpretation: { label: "Interpreting", icon: "interpreting" }
    };

    /* The sidebar badge counts what still needs a decision. */
    RP.USER.invitationCount = RP.INVITATIONS.filter(function (row) {
        return row.status === "new_invite" || row.status === "new_bid";
    }).length;
})(window);
