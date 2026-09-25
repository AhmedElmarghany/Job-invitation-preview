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

    /* ============================================================
       MY JOBS — work already accepted, so no offer and no decision.
       tab:    active | waiting | completed  (the three nav tabs)
       Times are offsets in hours, resolved against page load below.
       ============================================================ */
    var JOBS = [
        /* ── Active: job_ready = RE, job status AS / PR ───────── */
        {
            jobId: 47990, tab: "active",
            project: "Cardiac monitor — service manual (vol 2)",
            service: "Translation", source: "English", target: "Arabic",
            specialty: "Medical", count: { value: 5400, unit: "Words" },
            amount: 297.0, progress: 62,
            deadlineIn: 40, acceptedAgo: 30, pm: PM.sara
        },
        {
            jobId: 47982, tab: "active",
            project: "Tender response — rail signalling package",
            service: "Translation", source: "English", target: "Chinese",
            specialty: "Technical", count: { value: 3200, unit: "Words" },
            amount: 176.0, progress: 35,
            deadlineIn: 18, acceptedAgo: 20, pm: PM.mei
        },
        {
            jobId: 47975, tab: "active",
            project: "Patient discharge summaries — batch 7",
            service: "Certified", source: "English", target: "Samoan",
            specialty: "Medical", count: { value: 1850, unit: "Words" },
            amount: 120.25, progress: 88,
            deadlineIn: 6, acceptedAgo: 52, pm: PM.daniel
        },
        {
            jobId: 47968, tab: "active",
            project: "Immigration statements — Hamilton intake",
            service: "Certified", source: "English", target: "Dari",
            specialty: "Legal", count: { value: 2100, unit: "Words" },
            amount: 147.0, progress: 12,
            deadlineIn: 64, acceptedAgo: 9, pm: PM.tane
        },
        {
            jobId: 47960, tab: "active",
            project: "ACC assessment appointment — Manukau",
            service: "Interpreting", source: "English", target: "Samoan",
            specialty: "Medical", count: { value: 3, unit: "Hours" },
            amount: 210.0, progress: 45,
            deadlineIn: 26, acceptedAgo: 14, pm: PM.daniel
        },
        {
            jobId: 47953, tab: "active",
            project: "Product safety labels — release 9",
            service: "DTP", source: "English", target: "Filipino",
            specialty: "Technical", count: { value: 900, unit: "Words" },
            amount: 58.5, progress: 74,
            deadlineIn: 90, acceptedAgo: 36, pm: PM.mei
        },
        /* One overdue row, so the red deadline has something to prove */
        {
            jobId: 47947, tab: "active",
            project: "School enrolment pack — term 4",
            service: "Translation", source: "English", target: "Te Reo Māori",
            specialty: "Government", count: { value: 2600, unit: "Words" },
            amount: 143.0, progress: 20,
            deadlineIn: -4, acceptedAgo: 70, pm: PM.tane
        },
        {
            jobId: 47639, tab: "active",
            project: "Employee handbook — 101 update",
            service: "Attestation", source: "English", target: "Tongan",
            specialty: "Education", count: { value: 3, unit: "Documents" },
            amount: 128.01, progress: 15,
            deadlineIn: 78, acceptedAgo: 109, pm: PM.sara
        },
        {
            jobId: 47607, tab: "active",
            project: "Employment contract — hire 102",
            service: "Translation", source: "English", target: "Vietnamese",
            specialty: "Technical", count: { value: 4500, unit: "Words" },
            amount: 351.0, progress: 30,
            deadlineIn: 52, acceptedAgo: 73, pm: PM.sara
        },
        {
            jobId: 47597, tab: "active",
            project: "Airport signage set — terminal 103",
            service: "Translation", source: "Thai", target: "English",
            specialty: "Government", count: { value: 3200, unit: "Words" },
            amount: 166.4, progress: 15,
            deadlineIn: 36, acceptedAgo: 62, pm: PM.mei
        },
        {
            jobId: 47660, tab: "active",
            project: "Clinical trial summary — site 104",
            service: "Translation", source: "Urdu", target: "English",
            specialty: "Legal", count: { value: 4800, unit: "Words" },
            amount: 192.0, progress: 72,
            deadlineIn: 180, acceptedAgo: 207, pm: PM.daniel
        },
        {
            jobId: 47616, tab: "active",
            project: "Patient consent form — trial 105",
            service: "Translation", source: "English", target: "Chinese",
            specialty: "Technical", count: { value: 2800, unit: "Words" },
            amount: 305.2, progress: 80,
            deadlineIn: 180, acceptedAgo: 207, pm: PM.daniel
        },
        {
            jobId: 47686, tab: "active",
            project: "Training video script — module 106",
            service: "Interpreting", source: "English", target: "Vietnamese",
            specialty: "Government", count: { value: 6, unit: "Hours" },
            amount: 420.0, progress: 30,
            deadlineIn: 16, acceptedAgo: 49, pm: PM.tane
        },
        {
            jobId: 47580, tab: "active",
            project: "Customer support macros — set 107",
            service: "Attestation", source: "Thai", target: "English",
            specialty: "Education", count: { value: 3, unit: "Documents" },
            amount: 233.04, progress: 52,
            deadlineIn: 28, acceptedAgo: 36, pm: PM.daniel
        },
        {
            jobId: 47567, tab: "active",
            project: "Real estate listing — unit 108",
            service: "Proofreading", source: "Thai", target: "English",
            specialty: "Academic", count: { value: 3200, unit: "Words" },
            amount: 262.4, progress: 22,
            deadlineIn: 22, acceptedAgo: 61, pm: PM.mei
        },
        {
            jobId: 47512, tab: "active",
            project: "Birth certificate — file 109",
            service: "Proofreading", source: "English", target: "Dari",
            specialty: "Academic", count: { value: 4500, unit: "Words" },
            amount: 216.0, progress: 15,
            deadlineIn: 16, acceptedAgo: 30, pm: PM.tane
        },
        {
            jobId: 47502, tab: "active",
            project: "Employment contract — hire 110",
            service: "Translation", source: "English", target: "Filipino",
            specialty: "Technical", count: { value: 5300, unit: "Words" },
            amount: 583.0, progress: 80,
            deadlineIn: 120, acceptedAgo: 131, pm: PM.mei
        },
        {
            jobId: 47628, tab: "active",
            project: "Pharmaceutical label — batch 111",
            service: "Attestation", source: "English", target: "Punjabi",
            specialty: "Education", count: { value: 3, unit: "Documents" },
            amount: 179.85, progress: 22,
            deadlineIn: 64, acceptedAgo: 74, pm: PM.mei
        },
        {
            jobId: 47500, tab: "active",
            project: "Court filing — case file 112",
            service: "Attestation", source: "German", target: "English",
            specialty: "Education", count: { value: 2, unit: "Documents" },
            amount: 87.78, progress: 72,
            deadlineIn: 36, acceptedAgo: 71, pm: PM.sara
        },
        {
            jobId: 47517, tab: "active",
            project: "Conference programme — day 113",
            service: "Interpreting", source: "English", target: "Nepali",
            specialty: "Government", count: { value: 1, unit: "Hours" },
            amount: 70.0, progress: 65,
            deadlineIn: 150, acceptedAgo: 162, pm: PM.daniel
        },
        {
            jobId: 47693, tab: "active",
            project: "School newsletter — issue 114",
            service: "Subtitling", source: "Russian", target: "English",
            specialty: "Marketing", count: { value: 31, unit: "Minutes" },
            amount: 365.49, progress: 90,
            deadlineIn: 120, acceptedAgo: 136, pm: PM.mei
        },
        {
            jobId: 47558, tab: "active",
            project: "Clinical trial summary — site 115",
            service: "Attestation", source: "English", target: "Tamil",
            specialty: "Education", count: { value: 4, unit: "Documents" },
            amount: 189.44, progress: 72,
            deadlineIn: 22, acceptedAgo: 26, pm: PM.sara
        },
        {
            jobId: 47671, tab: "active",
            project: "Real estate listing — unit 116",
            service: "Attestation", source: "English", target: "Chinese",
            specialty: "Education", count: { value: 1, unit: "Documents" },
            amount: 82.28, progress: 58,
            deadlineIn: 22, acceptedAgo: 60, pm: PM.daniel
        },
        {
            jobId: 47610, tab: "active",
            project: "University transcript — student 117",
            service: "Proofreading", source: "Farsi", target: "English",
            specialty: "Academic", count: { value: 3500, unit: "Words" },
            amount: 325.5, progress: 45,
            deadlineIn: 44, acceptedAgo: 74, pm: PM.tane
        },
        {
            jobId: 47548, tab: "active",
            project: "Marketing brochure — campaign 118",
            service: "Translation", source: "Burmese", target: "English",
            specialty: "Legal", count: { value: 900, unit: "Words" },
            amount: 55.8, progress: 65,
            deadlineIn: 52, acceptedAgo: 64, pm: PM.tane
        },
        {
            jobId: 47638, tab: "active",
            project: "Council notice — district 119",
            service: "Certified", source: "English", target: "Somali",
            specialty: "Government", count: { value: 1100, unit: "Words" },
            amount: 71.5, progress: 8,
            deadlineIn: 10, acceptedAgo: 29, pm: PM.daniel
        },
        {
            jobId: 47573, tab: "active",
            project: "Medical device manual — revision 120",
            service: "Subtitling", source: "Spanish", target: "English",
            specialty: "Marketing", count: { value: 40, unit: "Minutes" },
            amount: 240.4, progress: 52,
            deadlineIn: 120, acceptedAgo: 159, pm: PM.tane
        },
        {
            jobId: 47649, tab: "active",
            project: "Insurance claim form — batch 121",
            service: "Certified", source: "English", target: "Nepali",
            specialty: "Legal", count: { value: 1000, unit: "Words" },
            amount: 76.0, progress: 58,
            deadlineIn: 64, acceptedAgo: 101, pm: PM.daniel
        },
        {
            jobId: 47645, tab: "active",
            project: "Council notice — district 122",
            service: "Subtitling", source: "English", target: "Samoan",
            specialty: "Technical", count: { value: 19, unit: "Minutes" },
            amount: 140.79, progress: 30,
            deadlineIn: 78, acceptedAgo: 84, pm: PM.sara
        },
        {
            jobId: 47665, tab: "active",
            project: "Employee handbook — 123 update",
            service: "Proofreading", source: "Farsi", target: "English",
            specialty: "Academic", count: { value: 3600, unit: "Words" },
            amount: 165.6, progress: 38,
            deadlineIn: 52, acceptedAgo: 76, pm: PM.sara
        },

        /* ── Waiting: job_ready = NR — assigned, files not released ── */
        {
            jobId: 48002, tab: "waiting",
            project: "Clinical trial protocol — site 4",
            service: "Translation", source: "English", target: "Arabic",
            specialty: "Medical", count: { value: 6800, unit: "Words" },
            amount: 374.0, progress: 0,
            deadlineIn: 140, acceptedAgo: 2, pm: PM.sara
        },
        {
            jobId: 47996, tab: "waiting",
            project: "Annual report 2025 — financial notes",
            service: "Translation", source: "English", target: "Chinese",
            specialty: "Financial", count: { value: 4300, unit: "Words" },
            amount: 236.5, progress: 0,
            deadlineIn: 120, acceptedAgo: 5, pm: PM.mei
        },
        {
            jobId: 47991, tab: "waiting",
            project: "Court bundle — affidavits and exhibits",
            service: "Certified", source: "English", target: "Tamil",
            specialty: "Legal", count: { value: 3900, unit: "Words" },
            amount: 273.0, progress: 0,
            deadlineIn: 96, acceptedAgo: 8, pm: PM.tane
        },
        {
            jobId: 47987, tab: "waiting",
            project: "Employee handbook — health & safety section",
            service: "Translation", source: "English", target: "Nepali",
            specialty: "Technical", count: { value: 2400, unit: "Words" },
            amount: 132.0, progress: 0,
            deadlineIn: 72, acceptedAgo: 12, pm: PM.daniel
        },
        {
            jobId: 47984, tab: "waiting",
            project: "Museum audio guide script",
            service: "Translation", source: "English", target: "Te Reo Māori",
            specialty: "Academic", count: { value: 1700, unit: "Words" },
            amount: 93.5, progress: 0,
            deadlineIn: 168, acceptedAgo: 18, pm: PM.tane
        },
        {
            jobId: 47317, tab: "waiting",
            project: "Marketing brochure — campaign 201",
            service: "DTP", source: "Indonesian", target: "English",
            specialty: "IT / Software", count: { value: 800, unit: "Words" },
            amount: 58.4, progress: 0,
            deadlineIn: 84, acceptedAgo: 12, pm: PM.mei
        },
        {
            jobId: 47441, tab: "waiting",
            project: "Training video script — module 202",
            service: "DTP", source: "Russian", target: "English",
            specialty: "IT / Software", count: { value: 43, unit: "Physical Pages" },
            amount: 631.24, progress: 0,
            deadlineIn: 96, acceptedAgo: 4, pm: PM.daniel
        },
        {
            jobId: 47367, tab: "waiting",
            project: "Tender document — package 203",
            service: "Translation", source: "English", target: "Tongan",
            specialty: "Marketing", count: { value: 2600, unit: "Words" },
            amount: 137.8, progress: 0,
            deadlineIn: 170, acceptedAgo: 16, pm: PM.mei
        },
        {
            jobId: 47341, tab: "waiting",
            project: "Safety data sheet — chemical 204",
            service: "Translation", source: "English", target: "Samoan",
            specialty: "Legal", count: { value: 2700, unit: "Words" },
            amount: 91.8, progress: 0,
            deadlineIn: 260, acceptedAgo: 15, pm: PM.tane
        },
        {
            jobId: 47332, tab: "waiting",
            project: "Tender document — package 205",
            service: "Translation", source: "English", target: "Tongan",
            specialty: "Medical", count: { value: 1600, unit: "Words" },
            amount: 118.4, progress: 0,
            deadlineIn: 48, acceptedAgo: 10, pm: PM.mei
        },
        {
            jobId: 47404, tab: "waiting",
            project: "University transcript — student 206",
            service: "Translation", source: "English", target: "Tamil",
            specialty: "Legal", count: { value: 6000, unit: "Words" },
            amount: 300.0, progress: 0,
            deadlineIn: 190, acceptedAgo: 5, pm: PM.daniel
        },
        {
            jobId: 47471, tab: "waiting",
            project: "Marketing brochure — campaign 207",
            service: "Translation", source: "English", target: "Hindi",
            specialty: "Government", count: { value: 600, unit: "Words" },
            amount: 26.4, progress: 0,
            deadlineIn: 260, acceptedAgo: 8, pm: PM.mei
        },
        {
            jobId: 47358, tab: "waiting",
            project: "School newsletter — issue 208",
            service: "Translation", source: "English", target: "Filipino",
            specialty: "Marketing", count: { value: 4300, unit: "Words" },
            amount: 206.4, progress: 0,
            deadlineIn: 84, acceptedAgo: 1, pm: PM.daniel
        },
        {
            jobId: 47384, tab: "waiting",
            project: "Marketing brochure — campaign 209",
            service: "Interpreting", source: "English", target: "Japanese",
            specialty: "Legal", count: { value: 3, unit: "Hours" },
            amount: 210.0, progress: 0,
            deadlineIn: 48, acceptedAgo: 4, pm: PM.mei
        },
        {
            jobId: 47430, tab: "waiting",
            project: "Training video script — module 210",
            service: "Proofreading", source: "English", target: "Japanese",
            specialty: "Academic", count: { value: 2400, unit: "Words" },
            amount: 187.2, progress: 0,
            deadlineIn: 60, acceptedAgo: 13, pm: PM.daniel
        },
        {
            jobId: 47488, tab: "waiting",
            project: "Council notice — district 211",
            service: "Translation", source: "Thai", target: "English",
            specialty: "Legal", count: { value: 400, unit: "Words" },
            amount: 28.8, progress: 0,
            deadlineIn: 220, acceptedAgo: 7, pm: PM.mei
        },
        {
            jobId: 47379, tab: "waiting",
            project: "School newsletter — issue 212",
            service: "Translation", source: "Burmese", target: "English",
            specialty: "Technical", count: { value: 5500, unit: "Words" },
            amount: 302.5, progress: 0,
            deadlineIn: 220, acceptedAgo: 14, pm: PM.mei
        },
        {
            jobId: 47457, tab: "waiting",
            project: "Safety data sheet — chemical 213",
            service: "Interpreting", source: "Russian", target: "English",
            specialty: "Medical", count: { value: 2, unit: "Hours" },
            amount: 140.0, progress: 0,
            deadlineIn: 190, acceptedAgo: 10, pm: PM.tane
        },
        {
            jobId: 47413, tab: "waiting",
            project: "Airport signage set — terminal 214",
            service: "Translation", source: "English", target: "Nepali",
            specialty: "Medical", count: { value: 2100, unit: "Words" },
            amount: 134.4, progress: 0,
            deadlineIn: 220, acceptedAgo: 7, pm: PM.tane
        },
        {
            jobId: 47492, tab: "waiting",
            project: "Airport signage set — terminal 215",
            service: "Translation", source: "Burmese", target: "English",
            specialty: "Government", count: { value: 2700, unit: "Words" },
            amount: 191.7, progress: 0,
            deadlineIn: 84, acceptedAgo: 10, pm: PM.daniel
        },
        {
            jobId: 47406, tab: "waiting",
            project: "Clinical trial summary — site 216",
            service: "Certified", source: "English", target: "Te Reo Māori",
            specialty: "Legal", count: { value: 1000, unit: "Words" },
            amount: 50.0, progress: 0,
            deadlineIn: 220, acceptedAgo: 19, pm: PM.daniel
        },
        {
            jobId: 47327, tab: "waiting",
            project: "Airport signage set — terminal 217",
            service: "DTP", source: "Spanish", target: "English",
            specialty: "Technical", count: { value: 19, unit: "Physical Pages" },
            amount: 315.4, progress: 0,
            deadlineIn: 130, acceptedAgo: 8, pm: PM.daniel
        },
        {
            jobId: 47470, tab: "waiting",
            project: "Employment contract — hire 218",
            service: "Subtitling", source: "English", target: "Somali",
            specialty: "Technical", count: { value: 50, unit: "Minutes" },
            amount: 437.0, progress: 0,
            deadlineIn: 170, acceptedAgo: 18, pm: PM.mei
        },
        {
            jobId: 47415, tab: "waiting",
            project: "Employment contract — hire 219",
            service: "DTP", source: "Indonesian", target: "English",
            specialty: "IT / Software", count: { value: 57, unit: "Physical Pages" },
            amount: 946.77, progress: 0,
            deadlineIn: 96, acceptedAgo: 8, pm: PM.mei
        },
        {
            jobId: 47438, tab: "waiting",
            project: "Annual report — section 220",
            service: "Subtitling", source: "Spanish", target: "English",
            specialty: "Technical", count: { value: 32, unit: "Minutes" },
            amount: 237.12, progress: 0,
            deadlineIn: 60, acceptedAgo: 5, pm: PM.daniel
        },
        {
            jobId: 47315, tab: "waiting",
            project: "Tender document — package 221",
            service: "DTP", source: "Thai", target: "English",
            specialty: "Technical", count: { value: 3400, unit: "Words" },
            amount: 159.8, progress: 0,
            deadlineIn: 84, acceptedAgo: 14, pm: PM.tane
        },
        {
            jobId: 47407, tab: "waiting",
            project: "Museum exhibit label set — hall 222",
            service: "Proofreading", source: "Thai", target: "English",
            specialty: "Academic", count: { value: 4600, unit: "Words" },
            amount: 312.8, progress: 0,
            deadlineIn: 170, acceptedAgo: 18, pm: PM.daniel
        },
        {
            jobId: 47342, tab: "waiting",
            project: "Customer support macros — set 223",
            service: "Certified", source: "English", target: "Japanese",
            specialty: "Immigration", count: { value: 8, unit: "Documents" },
            amount: 427.92, progress: 0,
            deadlineIn: 150, acceptedAgo: 5, pm: PM.sara
        },
        {
            jobId: 47397, tab: "waiting",
            project: "Rental agreement — property 224",
            service: "DTP", source: "Farsi", target: "English",
            specialty: "Technical", count: { value: 800, unit: "Words" },
            amount: 64.8, progress: 0,
            deadlineIn: 110, acceptedAgo: 7, pm: PM.tane
        },
        {
            jobId: 47389, tab: "waiting",
            project: "Employment contract — hire 225",
            service: "Interpreting", source: "English", target: "Filipino",
            specialty: "Legal", count: { value: 4, unit: "Hours" },
            amount: 280.0, progress: 0,
            deadlineIn: 84, acceptedAgo: 3, pm: PM.sara
        },

        /* ── Completed: delivered, and somewhere along the bill run ── */
        {
            jobId: 47901, tab: "completed", jobStatus: "approved",
            project: "Vaccine information sheet — update 6",
            service: "Translation", source: "English", target: "Samoan",
            specialty: "Medical", count: { value: 1200, unit: "Words" },
            amount: 66.0, progress: 100,
            deadlineIn: -72, acceptedAgo: 140, deliveredAgo: 80,
            billId: "B-2211", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47894, tab: "completed", jobStatus: "billed",
            project: "Insurance policy wording — motor",
            service: "Certified", source: "English", target: "Chinese",
            specialty: "Legal", count: { value: 5100, unit: "Words" },
            amount: 357.0, progress: 100,
            deadlineIn: -120, acceptedAgo: 210, deliveredAgo: 128,
            billId: "B-2208", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47888, tab: "completed", jobStatus: "settled",
            project: "Airport wayfinding signage — stage 2",
            service: "DTP", source: "English", target: "Arabic",
            specialty: "Technical", count: { value: 640, unit: "Words" },
            amount: 44.8, progress: 100,
            deadlineIn: -200, acceptedAgo: 290, deliveredAgo: 206,
            billId: "B-2199", jobSlip: true, pm: PM.sara
        },
        /* Delivered, not billed yet — the Bill ID stays blank, as it does live */
        {
            jobId: 47875, tab: "completed", jobStatus: "delivered",
            project: "Family group conference — Christchurch",
            service: "Interpreting", source: "English", target: "Dari",
            specialty: "Government", count: { value: 2.5, unit: "Hours" },
            amount: 175.0, progress: 100,
            deadlineIn: -34, acceptedAgo: 96, deliveredAgo: 40,
            billId: null, jobSlip: false, pm: PM.tane
        },
        {
            jobId: 47869, tab: "completed", jobStatus: "approved",
            project: "Tenancy agreement pack — 6 properties",
            service: "Certified", source: "English", target: "Tamil",
            specialty: "Legal", count: { value: 3300, unit: "Words" },
            amount: 231.0, progress: 100,
            deadlineIn: -250, acceptedAgo: 340, deliveredAgo: 262,
            billId: "B-2190", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47860, tab: "completed", jobStatus: "settled",
            project: "Food safety plan — dairy processing site",
            service: "Translation", source: "English", target: "Nepali",
            specialty: "Technical", count: { value: 4200, unit: "Words" },
            amount: 231.0, progress: 100,
            deadlineIn: -310, acceptedAgo: 400, deliveredAgo: 318,
            billId: "B-2184", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47852, tab: "completed", jobStatus: "billed",
            project: "Driver licence theory handbook — update",
            service: "Translation", source: "English", target: "Filipino",
            specialty: "Government", count: { value: 5500, unit: "Words" },
            amount: 319.0, progress: 100,
            deadlineIn: -370, acceptedAgo: 470, deliveredAgo: 379,
            billId: "B-2177", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47844, tab: "completed", jobStatus: "settled",
            project: "Consumer app onboarding strings — release 4.2",
            service: "DTP", source: "English", target: "Chinese",
            specialty: "IT / Software", count: { value: 1500, unit: "Words" },
            amount: 96.0, progress: 100,
            deadlineIn: -430, acceptedAgo: 530, deliveredAgo: 441,
            billId: "B-2170", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47111, tab: "completed", jobStatus: "settled",
            project: "Birth certificate — file 301",
            service: "Translation", source: "English", target: "Korean",
            specialty: "Medical", count: { value: 600, unit: "Words" },
            amount: 48.0, progress: 100,
            deadlineIn: -320, acceptedAgo: 448, deliveredAgo: 330,
            billId: "B-2160", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47159, tab: "completed", jobStatus: "settled",
            project: "Court filing — case file 302",
            service: "Transcreation", source: "Urdu", target: "English",
            specialty: "Marketing", count: { value: 2100, unit: "Words" },
            amount: 201.6, progress: 100,
            deadlineIn: -120, acceptedAgo: 189, deliveredAgo: 144,
            billId: "B-2152", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47259, tab: "completed", jobStatus: "billed",
            project: "Council notice — district 303",
            service: "Interpreting", source: "Burmese", target: "English",
            specialty: "Medical", count: { value: 5, unit: "Hours" },
            amount: 350.0, progress: 100,
            deadlineIn: -10, acceptedAgo: 112, deliveredAgo: 39,
            billId: "B-2148", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47275, tab: "completed", jobStatus: "settled",
            project: "University transcript — student 304",
            service: "Interpreting", source: "French", target: "English",
            specialty: "Government", count: { value: 6, unit: "Hours" },
            amount: 420.0, progress: 100,
            deadlineIn: -150, acceptedAgo: 278, deliveredAgo: 165,
            billId: "B-2138", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47014, tab: "completed", jobStatus: "settled",
            project: "Patient consent form — trial 305",
            service: "Certified", source: "English", target: "Samoan",
            specialty: "Immigration", count: { value: 8, unit: "Documents" },
            amount: 484.48, progress: 100,
            deadlineIn: -440, acceptedAgo: 495, deliveredAgo: 452,
            billId: "B-2131", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47208, tab: "completed", jobStatus: "settled",
            project: "Warranty terms — product line 306",
            service: "Certified", source: "English", target: "Punjabi",
            specialty: "Government", count: { value: 5, unit: "Documents" },
            amount: 317.05, progress: 100,
            deadlineIn: -190, acceptedAgo: 266, deliveredAgo: 216,
            billId: "B-2121", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47283, tab: "completed", jobStatus: "billed",
            project: "Clinical trial summary — site 307",
            service: "Translation", source: "English", target: "Samoan",
            specialty: "Medical", count: { value: 2200, unit: "Words" },
            amount: 136.4, progress: 100,
            deadlineIn: -120, acceptedAgo: 235, deliveredAgo: 145,
            billId: "B-2111", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47094, tab: "completed", jobStatus: "approved",
            project: "Court filing — case file 308",
            service: "DTP", source: "English", target: "Japanese",
            specialty: "IT / Software", count: { value: 20, unit: "Physical Pages" },
            amount: 308.6, progress: 100,
            deadlineIn: -50, acceptedAgo: 156, deliveredAgo: 75,
            billId: "B-2103", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47027, tab: "completed", jobStatus: "billed",
            project: "University transcript — student 309",
            service: "Certified", source: "English", target: "Nepali",
            specialty: "Legal", count: { value: 2300, unit: "Words" },
            amount: 101.2, progress: 100,
            deadlineIn: -320, acceptedAgo: 427, deliveredAgo: 326,
            billId: "B-2096", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47244, tab: "completed", jobStatus: "delivered",
            project: "Product spec sheet — release 310",
            service: "Translation", source: "Farsi", target: "English",
            specialty: "Medical", count: { value: 4200, unit: "Words" },
            amount: 285.6, progress: 100,
            deadlineIn: -440, acceptedAgo: 515, deliveredAgo: 444,
            billId: null, jobSlip: false, pm: PM.tane
        },
        {
            jobId: 47060, tab: "completed", jobStatus: "settled",
            project: "Warranty terms — product line 311",
            service: "Proofreading", source: "French", target: "English",
            specialty: "Academic", count: { value: 2700, unit: "Words" },
            amount: 113.4, progress: 100,
            deadlineIn: -230, acceptedAgo: 350, deliveredAgo: 251,
            billId: "B-2086", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47106, tab: "completed", jobStatus: "approved",
            project: "Marketing brochure — campaign 312",
            service: "DTP", source: "English", target: "Nepali",
            specialty: "IT / Software", count: { value: 23, unit: "Physical Pages" },
            amount: 206.77, progress: 100,
            deadlineIn: -70, acceptedAgo: 123, deliveredAgo: 93,
            billId: "B-2080", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47147, tab: "completed", jobStatus: "billed",
            project: "Customer support macros — set 313",
            service: "Proofreading", source: "English", target: "Samoan",
            specialty: "Legal", count: { value: 1500, unit: "Words" },
            amount: 94.5, progress: 100,
            deadlineIn: -320, acceptedAgo: 427, deliveredAgo: 349,
            billId: "B-2075", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47072, tab: "completed", jobStatus: "delivered",
            project: "Warranty terms — product line 314",
            service: "Certified", source: "French", target: "English",
            specialty: "Government", count: { value: 2500, unit: "Words" },
            amount: 97.5, progress: 100,
            deadlineIn: -10, acceptedAgo: 76, deliveredAgo: 17,
            billId: null, jobSlip: false, pm: PM.mei
        },
        {
            jobId: 47020, tab: "completed", jobStatus: "settled",
            project: "Product spec sheet — release 315",
            service: "Translation", source: "English", target: "Somali",
            specialty: "Marketing", count: { value: 3700, unit: "Words" },
            amount: 388.5, progress: 100,
            deadlineIn: -320, acceptedAgo: 429, deliveredAgo: 332,
            billId: "B-2071", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47240, tab: "completed", jobStatus: "settled",
            project: "Product spec sheet — release 316",
            service: "Certified", source: "Burmese", target: "English",
            specialty: "Immigration", count: { value: 3900, unit: "Words" },
            amount: 327.6, progress: 100,
            deadlineIn: -70, acceptedAgo: 171, deliveredAgo: 77,
            billId: "B-2064", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47253, tab: "completed", jobStatus: "billed",
            project: "Warranty terms — product line 317",
            service: "Subtitling", source: "English", target: "Tamil",
            specialty: "Marketing", count: { value: 36, unit: "Minutes" },
            amount: 250.56, progress: 100,
            deadlineIn: -270, acceptedAgo: 401, deliveredAgo: 284,
            billId: "B-2055", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47000, tab: "completed", jobStatus: "settled",
            project: "Birth certificate — file 318",
            service: "Translation", source: "English", target: "Punjabi",
            specialty: "Technical", count: { value: 3000, unit: "Words" },
            amount: 117.0, progress: 100,
            deadlineIn: -120, acceptedAgo: 167, deliveredAgo: 123,
            billId: "B-2044", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47248, tab: "completed", jobStatus: "delivered",
            project: "Clinical trial summary — site 319",
            service: "Subtitling", source: "French", target: "English",
            specialty: "Marketing", count: { value: 18, unit: "Minutes" },
            amount: 208.26, progress: 100,
            deadlineIn: -10, acceptedAgo: 129, deliveredAgo: 32,
            billId: null, jobSlip: false, pm: PM.daniel
        },
        {
            jobId: 47078, tab: "completed", jobStatus: "settled",
            project: "Pharmaceutical label — batch 320",
            service: "Translation", source: "English", target: "Nepali",
            specialty: "Government", count: { value: 4900, unit: "Words" },
            amount: 308.7, progress: 100,
            deadlineIn: -320, acceptedAgo: 416, deliveredAgo: 331,
            billId: "B-2033", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47069, tab: "completed", jobStatus: "delivered",
            project: "Customer support macros — set 321",
            service: "Subtitling", source: "Spanish", target: "English",
            specialty: "Marketing", count: { value: 44, unit: "Minutes" },
            amount: 507.32, progress: 100,
            deadlineIn: -70, acceptedAgo: 169, deliveredAgo: 96,
            billId: null, jobSlip: false, pm: PM.mei
        },
        {
            jobId: 47076, tab: "completed", jobStatus: "settled",
            project: "Warranty terms — product line 322",
            service: "Subtitling", source: "English", target: "Japanese",
            specialty: "Technical", count: { value: 33, unit: "Minutes" },
            amount: 312.84, progress: 100,
            deadlineIn: -190, acceptedAgo: 271, deliveredAgo: 207,
            billId: "B-2026", jobSlip: true, pm: PM.tane
        }
    ];

    RP.JOBS = JOBS.map(function (row) {
        var out = Object.assign({}, row);
        out.id = "J-" + row.jobId;
        out.deadline = new Date(NOW + row.deadlineIn * HOUR);
        out.acceptedAt = new Date(NOW - row.acceptedAgo * HOUR);
        out.deliveredAt = row.deliveredAgo == null ? null : new Date(NOW - row.deliveredAgo * HOUR);
        return out;
    });

    /* Each step of the money run gets its own hue, so the column reads
       at a glance. The classes are status.css's own. */
    RP.JOB_STATUS = {
        delivered: { label: "Delivered", pill: "status-processing" },
        approved: { label: "Approved", pill: "status-accepted" },
        billed: { label: "Billed", pill: "status-accounted" },
        settled: { label: "Settled", pill: "status-settled" }
    };

    RP.JOB_TABS = [
        { key: "active", label: "Active jobs", icon: "circle-play" },
        { key: "waiting", label: "Waiting jobs", icon: "rotate-clock" },
        { key: "completed", label: "Completed jobs", icon: "circle-check" }
    ];

    /* The sidebar badge counts what still needs a decision. */
    RP.USER.invitationCount = RP.INVITATIONS.filter(function (row) {
        return row.status === "new_invite" || row.status === "new_bid";
    }).length;
})(window);
