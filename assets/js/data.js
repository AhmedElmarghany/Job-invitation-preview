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
        firstName: "Ahmed",
        fullName: "Ahmed Elmarghany",
        resourceId: "T-202",
        partnerSince: "March 2021",
        photo: "assets/img/placeholder-headshot.png",
        availability: "AV",
        currency: "NZD",
        balance: "1,284.60",
        balanceUsd: "778.35",
        notifications: 5,
        messages: 2
    };

    var PM = {
        sara: { name: "Sara Whitfield", email: "sara.whitfield@agato.example", phone: "+64 9 555 0142", mobile: "+64 21 555 0178" },
        daniel: { name: "Daniel Okafor", email: "daniel.okafor@agato.example", phone: "+64 9 555 0167", mobile: "+64 22 555 0134" },
        mei: { name: "Mei Lin Chen", email: "meilin.chen@agato.example", phone: "+64 9 555 0181", mobile: null },
        tane: { name: "Tane Ngata", email: "tane.ngata@agato.example", phone: "+64 4 555 0123", mobile: "+64 27 555 0191" }
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
            billId: "B-2216", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47894, tab: "completed", jobStatus: "billed",
            project: "Insurance policy wording — motor",
            service: "Certified", source: "English", target: "Chinese",
            specialty: "Legal", count: { value: 5100, unit: "Words" },
            amount: 357.0, progress: 100,
            deadlineIn: -120, acceptedAgo: 210, deliveredAgo: 128,
            billId: "B-2209", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47888, tab: "completed", jobStatus: "settled",
            project: "Airport wayfinding signage — stage 2",
            service: "DTP", source: "English", target: "Arabic",
            specialty: "Technical", count: { value: 640, unit: "Words" },
            amount: 44.8, progress: 100,
            deadlineIn: -200, acceptedAgo: 290, deliveredAgo: 206,
            billId: "B-2201", jobSlip: true, pm: PM.sara
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
            billId: "B-2216", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47860, tab: "completed", jobStatus: "settled",
            project: "Food safety plan — dairy processing site",
            service: "Translation", source: "English", target: "Nepali",
            specialty: "Technical", count: { value: 4200, unit: "Words" },
            amount: 231.0, progress: 100,
            deadlineIn: -310, acceptedAgo: 400, deliveredAgo: 318,
            billId: "B-2201", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47852, tab: "completed", jobStatus: "billed",
            project: "Driver licence theory handbook — update",
            service: "Translation", source: "English", target: "Filipino",
            specialty: "Government", count: { value: 5500, unit: "Words" },
            amount: 319.0, progress: 100,
            deadlineIn: -370, acceptedAgo: 470, deliveredAgo: 379,
            billId: "B-2209", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47844, tab: "completed", jobStatus: "settled",
            project: "Consumer app onboarding strings — release 4.2",
            service: "DTP", source: "English", target: "Chinese",
            specialty: "IT / Software", count: { value: 1500, unit: "Words" },
            amount: 96.0, progress: 100,
            deadlineIn: -430, acceptedAgo: 530, deliveredAgo: 441,
            billId: "B-2201", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47111, tab: "completed", jobStatus: "settled",
            project: "Birth certificate — file 301",
            service: "Translation", source: "English", target: "Korean",
            specialty: "Medical", count: { value: 600, unit: "Words" },
            amount: 48.0, progress: 100,
            deadlineIn: -320, acceptedAgo: 448, deliveredAgo: 330,
            billId: "B-2201", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47159, tab: "completed", jobStatus: "settled",
            project: "Court filing — case file 302",
            service: "Transcreation", source: "Urdu", target: "English",
            specialty: "Marketing", count: { value: 2100, unit: "Words" },
            amount: 201.6, progress: 100,
            deadlineIn: -120, acceptedAgo: 189, deliveredAgo: 144,
            billId: "B-2201", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47259, tab: "completed", jobStatus: "billed",
            project: "Council notice — district 303",
            service: "Interpreting", source: "Burmese", target: "English",
            specialty: "Medical", count: { value: 5, unit: "Hours" },
            amount: 350.0, progress: 100,
            deadlineIn: -10, acceptedAgo: 112, deliveredAgo: 39,
            billId: "B-2209", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47275, tab: "completed", jobStatus: "settled",
            project: "University transcript — student 304",
            service: "Interpreting", source: "French", target: "English",
            specialty: "Government", count: { value: 6, unit: "Hours" },
            amount: 420.0, progress: 100,
            deadlineIn: -150, acceptedAgo: 278, deliveredAgo: 165,
            billId: "B-2201", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47014, tab: "completed", jobStatus: "settled",
            project: "Patient consent form — trial 305",
            service: "Certified", source: "English", target: "Samoan",
            specialty: "Immigration", count: { value: 8, unit: "Documents" },
            amount: 484.48, progress: 100,
            deadlineIn: -440, acceptedAgo: 495, deliveredAgo: 452,
            billId: "B-2201", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47208, tab: "completed", jobStatus: "settled",
            project: "Warranty terms — product line 306",
            service: "Certified", source: "English", target: "Punjabi",
            specialty: "Government", count: { value: 5, unit: "Documents" },
            amount: 317.05, progress: 100,
            deadlineIn: -190, acceptedAgo: 266, deliveredAgo: 216,
            billId: "B-2201", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47283, tab: "completed", jobStatus: "billed",
            project: "Clinical trial summary — site 307",
            service: "Translation", source: "English", target: "Samoan",
            specialty: "Medical", count: { value: 2200, unit: "Words" },
            amount: 136.4, progress: 100,
            deadlineIn: -120, acceptedAgo: 235, deliveredAgo: 145,
            billId: "B-2209", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47094, tab: "completed", jobStatus: "approved",
            project: "Court filing — case file 308",
            service: "DTP", source: "English", target: "Japanese",
            specialty: "IT / Software", count: { value: 20, unit: "Physical Pages" },
            amount: 308.6, progress: 100,
            deadlineIn: -50, acceptedAgo: 156, deliveredAgo: 75,
            billId: "B-2216", jobSlip: true, pm: PM.mei
        },
        {
            jobId: 47027, tab: "completed", jobStatus: "billed",
            project: "University transcript — student 309",
            service: "Certified", source: "English", target: "Nepali",
            specialty: "Legal", count: { value: 2300, unit: "Words" },
            amount: 101.2, progress: 100,
            deadlineIn: -320, acceptedAgo: 427, deliveredAgo: 326,
            billId: "B-2209", jobSlip: true, pm: PM.sara
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
            billId: "B-2201", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47106, tab: "completed", jobStatus: "approved",
            project: "Marketing brochure — campaign 312",
            service: "DTP", source: "English", target: "Nepali",
            specialty: "IT / Software", count: { value: 23, unit: "Physical Pages" },
            amount: 206.77, progress: 100,
            deadlineIn: -70, acceptedAgo: 123, deliveredAgo: 93,
            billId: "B-2216", jobSlip: true, pm: PM.daniel
        },
        {
            jobId: 47147, tab: "completed", jobStatus: "billed",
            project: "Customer support macros — set 313",
            service: "Proofreading", source: "English", target: "Samoan",
            specialty: "Legal", count: { value: 1500, unit: "Words" },
            amount: 94.5, progress: 100,
            deadlineIn: -320, acceptedAgo: 427, deliveredAgo: 349,
            billId: "B-2209", jobSlip: true, pm: PM.daniel
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
            billId: "B-2201", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47240, tab: "completed", jobStatus: "settled",
            project: "Product spec sheet — release 316",
            service: "Certified", source: "Burmese", target: "English",
            specialty: "Immigration", count: { value: 3900, unit: "Words" },
            amount: 327.6, progress: 100,
            deadlineIn: -70, acceptedAgo: 171, deliveredAgo: 77,
            billId: "B-2201", jobSlip: true, pm: PM.tane
        },
        {
            jobId: 47253, tab: "completed", jobStatus: "billed",
            project: "Warranty terms — product line 317",
            service: "Subtitling", source: "English", target: "Tamil",
            specialty: "Marketing", count: { value: 36, unit: "Minutes" },
            amount: 250.56, progress: 100,
            deadlineIn: -270, acceptedAgo: 401, deliveredAgo: 284,
            billId: "B-2209", jobSlip: true, pm: PM.sara
        },
        {
            jobId: 47000, tab: "completed", jobStatus: "settled",
            project: "Birth certificate — file 318",
            service: "Translation", source: "English", target: "Punjabi",
            specialty: "Technical", count: { value: 3000, unit: "Words" },
            amount: 117.0, progress: 100,
            deadlineIn: -120, acceptedAgo: 167, deliveredAgo: 123,
            billId: "B-2201", jobSlip: true, pm: PM.mei
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
            billId: "B-2201", jobSlip: true, pm: PM.tane
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
            billId: "B-2201", jobSlip: true, pm: PM.tane
        }
    ];

    var COMPLETED_STATUS = { delivered: "DL", approved: "AP", billed: "BL", settled: "ST" };

    RP.JOBS = JOBS.map(function (row) {
        var out = Object.assign({}, row);
        out.id = "J-" + row.jobId;
        out.deadline = new Date(NOW + row.deadlineIn * HOUR);
        out.acceptedAt = new Date(NOW - row.acceptedAgo * HOUR);
        out.deliveredAt = row.deliveredAgo == null ? null : new Date(NOW - row.deliveredAgo * HOUR);

        /* The rows carry no Job.status; a barely-moved active job stands in for "not started yet". */
        out.status =
            row.tab === "completed" ? COMPLETED_STATUS[row.jobStatus]
            : row.tab === "waiting" ? "AS"
            : row.deadlineIn < 0 ? "OV"
            : row.progress <= 15 ? "AS"
            : "PR";
        out.jobReady = row.tab !== "waiting";
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

    /* ── Job page: built from each row, so every job in RP.JOBS opens on a full page ── */
    var CHECKLISTS = {
        Translation: [
            "Spell-check run in the target language",
            "Numbers, dates and units match the source",
            "Glossary terms applied throughout",
            "Formatting mirrors the source layout",
            "No untranslated or skipped segments"
        ],
        Certified: [
            "Certification statement added on the last page",
            "Names spelled exactly as in the passport",
            "Stamps, seals and signatures described in brackets",
            "Page count matches the source document"
        ],
        Proofreading: [
            "Read against the source, segment by segment",
            "Terminology consistent with the glossary",
            "Every change left as a tracked change",
            "Queries for the translator added as comments"
        ],
        Transcreation: [
            "Two headline options for every section",
            "Tone checked against the brand guide",
            "Back-translation of each headline included"
        ],
        DTP: [
            "Supplied fonts used, none substituted",
            "Text reflow checked on every page",
            "Images and captions in the right place",
            "Print-ready PDF exported with the source file"
        ],
        Subtitling: [
            "No more than 42 characters per line",
            "Reading speed under 17 characters per second",
            "Timecodes synced to the audio",
            "Speaker changes marked"
        ],
        Interpreting: [
            "Session attended from start to finish",
            "Attendance sheet signed by the client",
            "Anything unusual noted for the project manager"
        ],
        Attestation: [
            "Original document seen and checked",
            "Attestation stamp on every page",
            "Scanned copy is clear and complete"
        ]
    };

    /* The job each service waits on in its workflow; Interpreting stands alone. */
    var PREVIOUS = {
        Proofreading: "Translation",
        DTP: "Translation",
        Attestation: "Certified translation",
        Subtitling: "Transcription",
        Translation: "Typing",
        Certified: "Typing",
        Transcreation: "Typing"
    };

    var CHAINED = { Proofreading: true, DTP: true, Attestation: true };
    var PRICED_PER_LANGUAGE = { Translation: true, Certified: true, Proofreading: true, Transcreation: true };

    var FORMAT = {
        Translation: "DOCX", Certified: "PDF", Proofreading: "DOCX", Transcreation: "DOCX",
        DTP: "INDD", Subtitling: "MP4", Interpreting: null, Attestation: "PDF"
    };

    var UNIT = { Words: "word", Hours: "hour", Documents: "document", Minutes: "minute", "Physical Pages": "page" };

    var LANG_CODE = {
        Arabic: "ar", Chinese: "zh", Samoan: "sm", Tongan: "to", "Te Reo Māori": "mi", Hindi: "hi",
        Vietnamese: "vi", Korean: "ko", Japanese: "ja", Nepali: "ne", Punjabi: "pa", Tamil: "ta",
        Filipino: "fil", Dari: "prs", Somali: "so", English: "en", Spanish: "es", German: "de",
        Russian: "ru", Farsi: "fa", Indonesian: "id", French: "fr", Burmese: "my", Thai: "th", Urdu: "ur"
    };

    var PEERS = ["Leila Haddad", "Tomasi Fifita", "Priya Raman", "Jonas Weber", "Hana Sato"];

    var CLIENTS = {
        Medical: "Cardiac Devices NZ", Legal: "Harbour Lane Legal", Technical: "Tasman Rail Systems",
        Government: "Te Kāwanatanga Services", Financial: "Kauri Capital", Marketing: "Southern Light Retail",
        Education: "Waitematā Schools Trust", Immigration: "Pathways Migration", Academic: "Aotearoa Museum",
        "IT / Software": "Fern Mobile"
    };

    var PM_NOTES = {
        Medical: "Keep drug names, dosages and device model numbers exactly as in the source. The client's regulatory team checks every term against the attached termbase.",
        Legal: "Mirror the source numbering and clause structure. Party names stay in English, with the translation in brackets on first use only.",
        Technical: "Warnings and cautions follow the ISO 3864 wording in the reference file. Leave part numbers and on-screen labels untranslated.",
        Government: "Plain-language register, reading age 12. Use the official names for agencies wherever one exists.",
        Financial: "Figures stay in the source currency and format. Reuse last year's approved translation for every recurring heading.",
        Marketing: "Adapt rather than translate word for word, so it reads as if it was written locally. Keep headlines under 60 characters.",
        Education: "The audience is parents, not teachers. Short sentences, and no jargon without a plain explanation next to it.",
        Immigration: "INZ expects the 2024 certification wording. Spell names exactly as in the passport, even where the usual transliteration differs.",
        Academic: "Keep citations and reference lists in their original language. Flag any term you are unsure of rather than guessing.",
        "IT / Software": "Respect the character limits in the file notes. Placeholders such as {name} and %s must stay exactly as they are."
    };

    var CUSTOMER_NOTES = [
        "Please keep the terminology from last year's version — our staff are used to it.",
        "This goes to print on Friday, so the final proof needs to be clean.",
        null,
        "Our in-country reviewers may send small preference changes after delivery.",
        "Numbers in the tables must line up with the original; an auditor checks them.",
        null
    ];

    var REFERENCE = {
        Medical: ["medical-termbase.xlsx", "Termbase"], Technical: ["technical-termbase.xlsx", "Termbase"],
        Legal: ["legal-termbase.xlsx", "Termbase"], Marketing: ["brand-style-guide.pdf", "Style guide"],
        "IT / Software": ["ui-style-guide.pdf", "Style guide"], Immigration: ["inz-certification-wording-2024.pdf", "Wording"],
        Academic: ["reference-list.pdf", "Reference"]
    };

    function pick(list, seed) {
        return list[seed % list.length];
    }

    function slug(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    function size(seed, minKb, maxKb) {
        var kb = minKb + (seed * 37) % (maxKb - minKb);
        return kb >= 1000 ? (kb / 1000).toFixed(1) + " MB" : kb + " KB";
    }

    /* A completed job's milestones sit between delivery and now, so none lands in the future. */
    function between(from, to, share) {
        return new Date(from.getTime() + (to.getTime() - from.getTime()) * share);
    }

    function filesFor(job, d) {
        var id = job.jobId;
        var base = slug(job.project);
        var ext = (d.format || "PDF").toLowerCase();
        var code = LANG_CODE[job.target] || "xx";
        var work = [];
        var reference = [];
        var ai = [];

        if (job.service === "Interpreting") {
            work.push({ kind: "brief", name: "appointment-brief.pdf", size: size(id, 60, 180), tag: "Brief", hint: "Venue, timing and who you will interpret for" });
        } else if (d.previous && d.previous.delivered) {
            work.push({ kind: "original", name: base + "." + ext, size: size(id, 180, 900), tag: "Original", hint: "The file the client shared" });
            work.push({ kind: "source", name: base + "-" + code + "-" + slug(d.previous.service) + ".docx", size: size(id + 3, 160, 820), tag: "Source", hint: "Delivered by " + d.previous.resource + " — the file you work on" });
        } else if (d.previous) {
            if (CHAINED[job.service]) {
                work.push({ kind: "original", name: base + "." + ext, size: size(id, 180, 900), tag: "Original", hint: "Read it now and prepare while you wait" });
            }
            work.push({ kind: "source", name: base + (CHAINED[job.service] ? "-" + code + ".docx" : "." + ext), locked: true, tag: "Source", hint: "Released when the " + d.previous.service + " job is delivered" });
        } else {
            work.push({ kind: "source", name: base + "." + ext, size: size(id, 180, 900), tag: "Source", hint: "Shared by the client — the file you work on" });
        }

        if (job.service === "Certified") {
            work.push({ kind: "template", name: "certification-statement-template.docx", size: "38 KB", tag: "Template", hint: "Use this template for your delivery" });
        } else if (job.service === "Attestation") {
            work.push({ kind: "template", name: "attestation-cover-sheet.docx", size: "42 KB", tag: "Template", hint: "Use this template for your delivery" });
        } else if (job.service === "Translation" && id % 4 === 0) {
            work.push({ kind: "template", name: "client-report-template.dotx", size: "64 KB", tag: "Template", hint: "Use this template for your delivery" });
        }

        var ref = REFERENCE[job.specialty];
        if (ref) reference.push({ kind: "reference", name: ref[0], size: size(id + 7, 70, 420), tag: ref[1] });
        if (job.service === "Subtitling") reference.push({ kind: "reference", name: "english-transcript.srt", size: size(id, 20, 90), tag: "Transcript" });
        if (job.specialty === "Financial" || job.specialty === "Government") {
            reference.push({ kind: "reference", name: "previous-edition-" + code + ".docx", size: size(id + 5, 300, 1400), tag: "Past translation" });
        }

        if (job.jobReady && job.service === "Translation") {
            if (id % 5 === 1) {
                reference.push({ kind: "pretranslated", name: base + "-pretranslated.docx", size: size(id + 2, 150, 700), tag: "Pre-translated", hint: "Machine pre-translation — review it before you rely on it" });
            }
            /* Its own list, as section_2.html keeps ai_file apart from ref_files; only open work can still be generating */
            if (id % 3 === 0 || id % 5 === 2) {
                ai.push({
                    kind: "ai", name: base + "-ai-" + code + ".docx", size: size(id + 4, 150, 700), tag: "AI translation",
                    ai: id % 7 === 0 && job.tab !== "completed" ? { status: "processing", progress: 64 } : { status: "completed" }
                });
            }
        }

        return { work: work, reference: reference, ai: ai };
    }

    function checklistFor(service, answered, seed) {
        return (CHECKLISTS[service] || CHECKLISTS.Translation).map(function (item, i) {
            return { item: item, answer: answered ? (i === 2 && seed % 2 ? "I" : "C") : null };
        });
    }

    function glossariesFor(job) {
        if (!PRICED_PER_LANGUAGE[job.service] || !job.source || !job.target) return [];

        var list = [{
            id: 100 + (job.jobId % 60), name: job.specialty + " terminology", client: CLIENTS[job.specialty] || "Client",
            privacy: "Client", terms: 60 + (job.jobId % 140), note: "Approved by the client's reviewers — use these terms exactly."
        }];

        if (job.jobId % 2 === 0) {
            list.push({ id: 7, name: "AGATO house style", client: null, privacy: "Public", terms: 48, note: "Dates, numbers and punctuation rules for every language we work in." });
        }
        return list;
    }

    function chatFor(job, d) {
        var me = RP.USER.firstName;
        var pmFirst = job.pm.name.split(" ")[0];
        var t0 = job.acceptedAt.getTime();
        var msgs = [
            { from: "pm", at: t0 + 0.4 * HOUR, text: "Hi " + me + ", thanks for picking this one up. " + (PM_NOTES[job.specialty] || "").split(". ")[0] + "." },
            { from: "me", at: t0 + 1.1 * HOUR, text: "Thanks " + pmFirst + " — all clear. I will message you here if anything in the source is unclear." }
        ];

        if (!job.jobReady && d.previous) {
            msgs.push({ from: "pm", at: t0 + 2.5 * HOUR, text: "The files are released as soon as the " + d.previous.service + " job is delivered. I expect that tomorrow morning." });
        } else if (job.status !== "AS") {
            msgs.push({ from: "pm", at: t0 + 4 * HOUR, text: "The client added a few terms this morning — updated list attached.", file: { name: slug(job.specialty) + "-terms-v2.xlsx", size: "88 KB" } });
            if (job.jobId % 4 === 1) msgs.push({ from: "pm", at: t0 + 6 * HOUR, voice: "0:42" });
        }

        if (job.status === "OV") {
            msgs.push({ from: "pm", at: NOW - 1.5 * HOUR, text: "Hi " + me + ", the deadline has passed — how far along are you? Tell me if you need a few more hours." });
        }
        if (job.deliveredAt) {
            msgs.push({ from: "me", at: job.deliveredAt.getTime(), text: "Delivered — the checklist is filled in on the job page." });
        }
        if (d.approvedAt) {
            msgs.push({ from: "pm", at: d.approvedAt.getTime(), text: "Checked and approved. Thanks for the careful work, " + me + "!" });
        }

        return msgs
            .filter(function (m) {
                return m.at < NOW;
            })
            .sort(function (a, b) {
                return a.at - b.at;
            });
    }

    RP.jobDetail = function (job) {
        var id = job.jobId;
        var d = {
            format: FORMAT[job.service] === undefined ? "DOCX" : FORMAT[job.service],
            cat: job.service === "Translation" && id % 3 === 0,
            usd: Math.round(job.amount * 0.6059 * 100) / 100,
            rate: job.amount / job.count.value,
            unit: UNIT[job.count.unit] || "unit",
            previous: null
        };

        var prevService = PREVIOUS[job.service];
        if (!job.jobReady && prevService) {
            d.previous = { id: "J-" + (id - 1), service: prevService, resource: pick(PEERS, id), delivered: false };
        } else if (CHAINED[job.service] && prevService) {
            d.previous = { id: "J-" + (id - 1), service: prevService, resource: pick(PEERS, id), delivered: true };
            d.previousChecklist = checklistFor(prevService === "Certified translation" ? "Certified" : prevService, true, id + 1)
                .map(function (row) {
                    row.verified = false;
                    return row;
                });
        }

        var now = new Date(NOW);
        d.startedAt = job.status !== "AS" ? between(job.acceptedAt, job.deliveredAt || now, 0.12) : null;

        if (job.deliveredAt) {
            d.approvedAt = /^(AP|BL|ST)$/.test(job.status) ? between(job.deliveredAt, now, 0.25) : null;
            d.billedAt = /^(BL|ST)$/.test(job.status) ? between(job.deliveredAt, now, 0.55) : null;
            d.settledAt = job.status === "ST" ? between(job.deliveredAt, now, 0.85) : null;

            var base = slug(job.project);
            var ext = job.service === "Subtitling" ? "srt" : (d.format || "pdf").toLowerCase();
            var name = job.service === "Interpreting"
                ? "signed-attendance-sheet.pdf"
                : base + "-" + (LANG_CODE[job.target] || "final") + "-final." + ext;
            d.delivered = [{ name: name, size: size(id + 9, 200, 950) }];
            if (job.service === "DTP") d.delivered.push({ name: base + "-print.pdf", size: size(id + 11, 900, 4800) });
        }

        d.files = filesFor(job, d);
        d.checklist = checklistFor(job.service, !!job.deliveredAt, id);
        d.pmNote = PM_NOTES[job.specialty] || null;
        d.customerNote = pick(CUSTOMER_NOTES, id);
        d.glossaries = glossariesFor(job);
        d.chat = chatFor(job, d);
        return d;
    };

    /* ── User account: what templates/accounts/profile/main.html shows a resource about themselves ── */
    var DAY = 24 * 3600 * 1000;

    RP.COUNTRIES = [
        { code: "AE", name: "United Arab Emirates", dial: "+971" },
        { code: "AU", name: "Australia", dial: "+61" },
        { code: "BH", name: "Bahrain", dial: "+973" },
        { code: "CA", name: "Canada", dial: "+1" },
        { code: "EG", name: "Egypt", dial: "+20" },
        { code: "FJ", name: "Fiji", dial: "+679" },
        { code: "FR", name: "France", dial: "+33" },
        { code: "DE", name: "Germany", dial: "+49" },
        { code: "IN", name: "India", dial: "+91" },
        { code: "JO", name: "Jordan", dial: "+962" },
        { code: "KW", name: "Kuwait", dial: "+965" },
        { code: "LB", name: "Lebanon", dial: "+961" },
        { code: "MA", name: "Morocco", dial: "+212" },
        { code: "NZ", name: "New Zealand", dial: "+64" },
        { code: "OM", name: "Oman", dial: "+968" },
        { code: "PK", name: "Pakistan", dial: "+92" },
        { code: "PH", name: "Philippines", dial: "+63" },
        { code: "QA", name: "Qatar", dial: "+974" },
        { code: "WS", name: "Samoa", dial: "+685" },
        { code: "SA", name: "Saudi Arabia", dial: "+966" },
        { code: "ES", name: "Spain", dial: "+34" },
        { code: "TO", name: "Tonga", dial: "+676" },
        { code: "TN", name: "Tunisia", dial: "+216" },
        { code: "GB", name: "United Kingdom", dial: "+44" },
        { code: "US", name: "United States", dial: "+1" }
    ];

    RP.TIMEZONES = [
        { id: "Pacific/Auckland", offset: "+12" },
        { id: "Pacific/Tongatapu", offset: "+13" },
        { id: "Pacific/Apia", offset: "+13" },
        { id: "Pacific/Fiji", offset: "+12" },
        { id: "Australia/Sydney", offset: "+10" },
        { id: "Asia/Manila", offset: "+8" },
        { id: "Asia/Kolkata", offset: "+5:30" },
        { id: "Asia/Karachi", offset: "+5" },
        { id: "Asia/Dubai", offset: "+4" },
        { id: "Asia/Qatar", offset: "+3" },
        { id: "Asia/Riyadh", offset: "+3" },
        { id: "Asia/Amman", offset: "+3" },
        { id: "Africa/Cairo", offset: "+3" },
        { id: "Europe/Berlin", offset: "+2" },
        { id: "Europe/London", offset: "+1" },
        { id: "Africa/Casablanca", offset: "+1" },
        { id: "America/New_York", offset: "-4" },
        { id: "America/Los_Angeles", offset: "-7" }
    ];

    /* The choices add_user_education.html offers, in its order */
    RP.DEGREES = ["Bachelor", "Specialist", "Master", "Master of Business Administration (MBA)", "Ph.D", "Doctor of Science", "Diploma", "Other"];

    /* crt_document_type in tr_documents.html: value → label */
    RP.DOC_TYPES = {
        cv: "CV",
        resume: "Resume",
        "educational-document": "Educational document",
        "other document": "Other document"
    };

    RP.TECH_GROUPS = [
        { key: "office", label: "Office and documents", icon: "file", tools: ["Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint", "Microsoft Visio", "Google Docs", "Google Sheets", "Adobe Acrobat Pro"] },
        { key: "design", label: "Design and DTP", icon: "pen-tool", tools: ["Adobe InDesign", "Adobe Illustrator", "Adobe Photoshop", "Adobe FrameMaker", "QuarkXPress", "Affinity Publisher", "Canva"] },
        { key: "cat", label: "CAT tools", icon: "languages", tools: ["Matecat", "Trados Studio", "memoQ", "Phrase (Memsource)", "Wordfast", "Smartcat", "OmegaT", "XTM Cloud", "Crowdin"] },
        { key: "media", label: "Subtitling and media", icon: "captions", tools: ["Subtitle Edit", "Aegisub", "EZTitles", "OOONA", "Adobe Premiere Pro", "Audacity"] },
        { key: "remote", label: "Remote interpreting", icon: "video", tools: ["Zoom", "Microsoft Teams", "Google Meet", "Webex", "Interprefy", "KUDO"] }
    ];

    RP.PROFILE = {
        greeting: "Mr",
        nativeName: "",
        email: "ahmedelmarghany01@gmail.com",
        website: "linkedin.com/in/ahmed-elmarghany",
        about: "Arabic and English translator with eleven years in legal, medical and marketing content for clients across the Gulf and North Africa. I also subtitle e-learning courses and lay out Arabic documents in InDesign.",
        phone: { country: "AE", number: "4 555 0147" },
        mobile: { country: "AE", number: "50 555 0182" },
        whatsapp: { country: "AE", number: "50 555 0182" },
        timezone: "Asia/Dubai",
        country: "AE",
        city: "Dubai",
        state: "Dubai",
        address: "Apartment 1204, Building 7, Al Marsa Street, Dubai Marina",
        zip: "",
        photoIsPlaceholder: true,

        educations: [
            { id: 41, degree: "Master", major: "Translation and Interpreting", university: "Hamad Bin Khalifa University", country: "QA", year: 2016 },
            { id: 37, degree: "Bachelor", major: "English Language and Literature", university: "Cairo University", country: "EG", year: 2012 }
        ],

        works: [
            { id: 58, position: "Senior Arabic Translator", company: "Lingua Bridge Ltd", country: "AE", start: 2019, end: null, duties: "Translate and review legal, medical and marketing content for Gulf clients. I lead a team of four linguists and wrote the Arabic style guide and termbase the team still works from." },
            { id: 52, position: "Translator and DTP specialist", company: "Nile Language Services", country: "EG", start: 2014, end: 2019, duties: "Translated technical manuals and certified documents, and laid out more than 40 Arabic brochures and catalogues in InDesign." },
            { id: 47, position: "Freelance subtitler", company: "Self-employed", country: "EG", start: 2012, end: 2014, duties: "Subtitled documentaries and e-learning courses from English into Arabic." }
        ],
        noExperience: false,

        /* tr_certificate.html: read-only here, added under Services & Prices */
        certificates: [
            { id: 311, name: "ATA Certified Translator", service: "Translation", country: "United States", source: "English", target: "Arabic", certId: "ATA-512384", file: "ata-certificate.pdf", expires: null, status: "verified" },
            { id: 318, name: "NAATI Certified Translator", service: "Translation", country: "Australia", source: "English", target: "Arabic", certId: "CPN8XQ2A", file: "naati-certification.pdf", expires: new Date(NOW + 47 * DAY), status: "verified" },
            { id: 326, name: "Diploma in Translation (CIOL)", service: "Translation", country: "United Kingdom", source: "Arabic", target: "English", certId: "CIOL-78214", file: "ciol-diptrans.pdf", expires: null, status: "pending" },
            { id: 334, name: "Court Interpreter Licence", service: "Interpreting", country: "United Arab Emirates", source: "Arabic", target: "English", certId: "MOJ-2291-4", file: "court-interpreter-licence.jpg", expires: new Date(NOW + 520 * DAY), status: "rejected", reason: "The scan is cut off at the bottom, so the expiry date cannot be read. Upload the whole page." }
        ],

        documents: [
            { id: 91, type: "cv", name: "Ahmed-Elmarghany-CV-2026.pdf", size: "412 KB", description: "CV updated with the 2025–2026 projects", uploaded: new Date(2026, 1, 3) },
            { id: 88, type: "educational-document", name: "MA-Translation-degree.pdf", size: "1.8 MB", description: "Master's degree certificate and transcript", uploaded: new Date(2023, 2, 14) },
            { id: 84, type: "other document", name: "Reference-letter-Lingua-Bridge.pdf", size: "236 KB", description: "Reference letter from Lingua Bridge", uploaded: new Date(2025, 0, 20) }
        ],

        /* New: nothing picked yet, the way every resource meets it */
        technology: [],
        customTools: [],

        /* updated = agreed to an older version, as usertermsandconditionacceptance's is_expired */
        terms: { state: "updated", version: "September 2026", updatedOn: new Date(NOW - 27 * DAY), agreedOn: new Date(2025, 2, 12, 10, 24) }
    };

    /* ── Dashboard: the history the job rows cannot carry — past months, bids, performance ── */
    RP.USD_RATE = 0.6059;

    /* The balance is billed work not yet paid, so the profile menu and the dashboard agree */
    var BILLED = RP.JOBS.filter(function (job) {
        return job.status === "BL";
    }).reduce(function (sum, job) {
        return sum + job.amount;
    }, 0);
    var MONEY_FMT = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    RP.USER.balance = BILLED.toLocaleString("en-NZ", MONEY_FMT);
    RP.USER.balanceUsd = (BILLED * RP.USD_RATE).toLocaleString("en-NZ", MONEY_FMT);

    /* Paid per calendar month, oldest first; the current month is whatever the settled rows add up to */
    var PAID_BY_MONTH = [2840.5, 3120.75, 2610.2, 2215.4, 2980.6, 3405.1, 3050.3, 2870.9, 3290.45, 3610.8, 3155.1];
    var SETTLED = RP.JOBS.filter(function (job) {
        return job.status === "ST";
    }).reduce(function (sum, job) {
        return sum + job.amount;
    }, 0);
    var THIS_MONTH = new Date(NOW);
    var PAID_ALL_TIME = 104812.45;

    /* ── Earnings: one bill a month, filed on the 1st as celery_tasks/bills.py's monthly run does ── */
    /* The newest bill carries the Billed jobs and the one before it the Settled ones, so pending = balance */
    var PENDING_BILL = "B-2209";
    var LAST_PAID_BILL = "B-2201";
    var BILLS_SINCE = new Date(2021, 2, 1);
    var BILLED_JOBS_ALL_TIME = 1155;
    var PAID_AT = new Date(NOW - 30 * HOUR);

    var BILL_WORK = [
        ["Product safety sheet — batch", "Translation"], ["Employment contract — hire", "Translation"],
        ["Court filing — case file", "Certified"], ["Warranty terms — product line", "Translation"],
        ["Patient leaflet — update", "Proofreading"], ["Website copy — page set", "Transcreation"],
        ["Annual report — section", "Translation"], ["Tender documents — lot", "Translation"],
        ["Training manual — module", "DTP"], ["Marketing brochure — edition", "Transcreation"],
        ["Birth certificate — applicant", "Certified"], ["Insurance claim — file", "Proofreading"],
        ["App strings — release", "Translation"], ["Hotel guest guide — edition", "DTP"],
        ["Clinical trial consent — site", "Translation"], ["Training video — episode", "Subtitling"],
        ["Family court hearing — session", "Interpreting"], ["Hospital appointment — clinic", "Interpreting"]
    ];

    /* Bonuses and deductions sit on a few bills, as formatVatAndBonusIncludedAMount adds them in */
    var BILL_ADJUST = {
        5: { bonus: 60, bonusNote: "Rush delivery" },
        16: { bonus: 45, bonusNote: "Quality bonus" },
        23: { deduction: 25, deductionNote: "Late delivery" }
    };

    /* Seeded, so every reload and every viewer gets the same bills */
    function seeded(seed) {
        return function () {
            seed = (seed + 0x6d2b79f5) | 0;
            var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function cents(value) {
        return Math.round(value * 100) / 100;
    }

    function total(list) {
        return list.reduce(function (sum, value) {
            return sum + value;
        }, 0);
    }

    /* The last part takes the rounding, so a bill's jobs add up to its amount to the cent */
    function split(amount, n, rand) {
        var weights = [];
        for (var i = 0; i < n; i++) weights.push(0.35 + rand() * rand() * 2.4);
        var all = total(weights);
        var parts = weights.slice(0, n - 1).map(function (w) {
            return cents((amount * w) / all);
        });
        parts.push(cents(amount - total(parts)));
        return parts;
    }

    function billedJobs(status) {
        return RP.JOBS.filter(function (job) {
            return job.status === status;
        }).map(function (job) {
            return { id: job.id, project: job.project, service: job.service, amount: job.amount, real: true };
        }).sort(function (a, b) {
            return a.id.localeCompare(b.id);
        });
    }

    RP.BILLS = (function () {
        var rand = seeded(2209);
        var month = new Date(new Date(NOW).getFullYear(), new Date(NOW).getMonth(), 1);
        var count = (month.getFullYear() - BILLS_SINCE.getFullYear()) * 12 + month.getMonth() - BILLS_SINCE.getMonth();
        var pendingJobs = billedJobs("BL");
        var paidJobs = billedJobs("ST");
        var amount = {};
        var jobs = {};
        var num = {};
        var k;

        /* Paid two months on: bill k lands in the month PAID_BY_MONTH lists k - 2 months back */
        amount[1] = cents(BILLED);
        amount[2] = cents(SETTLED);
        for (k = 3; k <= Math.min(13, count); k++) amount[k] = PAID_BY_MONTH[13 - k];

        /* Older bills ramp up from the first month and add up to the all-time Total paid */
        var older = cents(PAID_ALL_TIME - total(PAID_BY_MONTH) - SETTLED);
        var ramp = {};
        for (k = 14; k <= count; k++) {
            var t = count === 14 ? 1 : (count - k) / (count - 14);
            ramp[k] = (0.2 + 1.4 * Math.pow(t, 1.6)) * (0.88 + rand() * 0.24);
        }
        var rampSum = total(Object.keys(ramp).map(function (key) {
            return ramp[key];
        }));
        var placed = 0;
        for (k = count; k > 14; k--) {
            amount[k] = cents((older * ramp[k]) / rampSum);
            placed += amount[k];
        }
        if (count >= 14) amount[14] = cents(older - placed);

        /* Jobs grew from ~60 to ~110 NZD each, so recent bills carry fewer jobs for their money */
        var restJobs = BILLED_JOBS_ALL_TIME - pendingJobs.length - paidJobs.length;
        var weight = {};
        for (k = 3; k <= count; k++) weight[k] = amount[k] / (60 + (50 * (count - k)) / Math.max(1, count - 3));
        var restWeight = total(Object.keys(weight).map(function (key) {
            return weight[key];
        }));
        var counts = {};
        var remainders = [];
        for (k = 3; k <= count; k++) {
            var exact = (weight[k] / restWeight) * restJobs;
            counts[k] = Math.max(1, Math.floor(exact));
            remainders.push({ k: k, rem: exact - Math.floor(exact) });
        }
        var missing = restJobs - total(Object.keys(counts).map(function (key) {
            return counts[key];
        }));
        remainders.sort(function (a, b) {
            return b.rem - a.rem;
        }).slice(0, Math.max(0, missing)).forEach(function (r) {
            counts[r.k] += 1;
        });

        num[1] = 2209;
        num[2] = 2201;
        for (k = 3; k <= count; k++) num[k] = num[k - 1] - (7 + Math.floor(rand() * 8));

        jobs[1] = pendingJobs;
        jobs[2] = paidJobs;
        for (k = 3; k <= count; k++) {
            /* Job numbers drift down ~238 a month, clear of the 47000s the job rows use */
            var top = 46990 - (k - 3) * 238;
            var taken = {};
            var ids = [];
            while (ids.length < counts[k]) {
                var id = top - Math.floor(rand() * 230);
                if (taken[id]) continue;
                taken[id] = true;
                ids.push(id);
            }
            ids.sort(function (a, b) {
                return a - b;
            });
            var adjust = BILL_ADJUST[k] || {};
            var parts = split(amount[k] - (adjust.bonus || 0) + (adjust.deduction || 0), ids.length, rand);
            jobs[k] = ids.map(function (jobId, i) {
                var work = BILL_WORK[Math.floor(rand() * BILL_WORK.length)];
                return {
                    id: "J-" + jobId,
                    project: work[0] + " " + (10 + Math.floor(rand() * 290)),
                    service: work[1],
                    amount: parts[i],
                    real: false
                };
            });
        }

        var bills = [];
        for (k = 1; k <= count; k++) {
            var y = month.getFullYear();
            var m = month.getMonth() - k;
            var adj = BILL_ADJUST[k] || {};
            bills.push({
                id: "B-" + num[k],
                num: num[k],
                from: new Date(y, m, 1),
                to: new Date(y, m + 1, 0),
                issued: new Date(y, m + 1, 1),
                due: new Date(y, m + 2, 20),
                paidOn: k === 1 ? null : k === 2 ? PAID_AT : new Date(y, m + 2, 6 + Math.floor(rand() * 12), 10 + Math.floor(rand() * 6), Math.floor(rand() * 60)),
                status: k === 1 ? "pending" : "paid",
                amount: amount[k],
                bonus: adj.bonus || 0,
                bonusNote: adj.bonusNote || "",
                deduction: adj.deduction || 0,
                deductionNote: adj.deductionNote || "",
                method: k === 1 ? null : k <= 30 ? "Wise" : "PayPal",
                jobs: jobs[k]
            });
        }
        return bills;
    })();

    /* A pending bill wears the orange of status.css, not .status-pending's brown, which jobs and certificates keep */
    RP.BILL_STATUS = {
        pending: { label: "Pending", pill: "status-processing" },
        paid: { label: "Paid", pill: "status-paid" }
    };

    RP.DASHBOARD = {
        since: RP.USER.partnerSince,
        monthly: PAID_BY_MONTH.concat([Math.round(SETTLED * 100) / 100]).map(function (paid, i) {
            return { month: new Date(THIS_MONTH.getFullYear(), THIS_MONTH.getMonth() - 11 + i, 1), paid: paid };
        }),
        paidLastYearToDate: 25240.3,
        paidAllTime: PAID_ALL_TIME,

        /* The month's completed jobs come from the rows; the longer periods add the history behind them */
        periods: {
            month: {
                label: "This month", vs: "last month",
                lost: { jobs: 4, words: 9800 }, declined: { jobs: 6, words: 12400 },
                prev: { completed: 27, lost: 6, declined: 4 }
            },
            quarter: {
                label: "Last 3 months", vs: "the 3 months before",
                completed: { jobs: 84, words: 158420 }, lost: { jobs: 13, words: 31400 }, declined: { jobs: 17, words: 36100 },
                prev: { completed: 77, lost: 12, declined: 19 }
            },
            year: {
                label: "This year", vs: "this time last year",
                completed: { jobs: 241, words: 452880 }, lost: { jobs: 38, words: 94200 }, declined: { jobs: 49, words: 108300 },
                prev: { completed: 218, lost: 41, declined: 57 }
            },
            all: {
                label: "All time", vs: null,
                completed: { jobs: 1164, words: 2184300 }, lost: { jobs: 142, words: 368900 }, declined: { jobs: 186, words: 421000 },
                prev: null
            }
        },

        /* Rolling 90 days; the tips are the expectations word for word */
        performance: [
            {
                key: "quality", label: "Quality", value: 96, target: null,
                evidence: "No gross mistakes in 24 reviewed jobs",
                tip: "Avoid any gross mistake in translation and stick to the required format to maintain a high quality level."
            },
            {
                key: "ontime", label: "On-time delivery", value: 93, target: 90,
                evidence: "41 of 44 jobs delivered on time",
                tip: "Deliver at least 90% of all your projects on time to not lose a level."
            },
            {
                key: "response", label: "Response rate", value: 76, target: 80,
                evidence: "38 of 50 replies within 1 working hour",
                tip: "Respond to messages within 1 working hour to not lose a level. At least 80% of all your replies should be within this time frame."
            },
            {
                key: "conduct", label: "Professional conduct", value: 100, target: null,
                evidence: "No warnings",
                tip: "Avoid receiving warnings for breaching our terms of service and stay professional with our clients and staff."
            }
        ],

        activity: [
            { type: "invite", job: "J-48210", detail: "Cardiac monitor — instructions for use (batch 12)", at: new Date(NOW - 3 * HOUR) },
            { type: "delivered", job: "J-47072", detail: "Warranty terms — product line 314", at: new Date(NOW - 17 * HOUR) },
            { type: "lost", job: "J-48163", detail: "Mining safety manual — English → Arabic", at: new Date(NOW - 26 * HOUR) },
            { type: "paid", bill: LAST_PAID_BILL, amount: cents(SETTLED), at: PAID_AT },
            { type: "approved", job: "J-47094", detail: "Court filing — case file 308", at: new Date(NOW - 52 * HOUR) },
            { type: "declined", job: "J-48141", detail: "Pharmacy leaflet — English → Tongan", at: new Date(NOW - 60 * HOUR) }
        ]
    };

    /* The sidebar badge counts what still needs a decision. */
    RP.USER.invitationCount = RP.INVITATIONS.filter(function (row) {
        return row.status === "new_invite" || row.status === "new_bid";
    }).length;
})(window);
