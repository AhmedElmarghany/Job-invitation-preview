/* ============================================================
   ICONS  —  the only place icons live.

   ── HOW TO REPLACE AN ICON ──────────────────────────────────
   Find its name below and paste your whole <svg>…</svg> between
   the backticks, exactly as you copied it. Nothing to strip:

     • any viewBox  (24, 32, 256 … it is kept as-is)
     • any width / height  (dropped — CSS sizes every icon)
     • any colour  (fill="#000000", stroke="#514231" … all become
       currentColor, so the icon follows the design system)
     • outline or solid is detected automatically
     • a Lucide or Phosphor class (lucide lucide-search, ph ph-…)
       is kept, so the icon can still be found by name

   Example — pasted straight from Phosphor, untouched:

     jobs: `<svg xmlns="http://www.w3.org/2000/svg" width="24"
       height="24" fill="#000000" viewBox="0 0 256 256"><path
       d="M216,64H176…"></path></svg>`,

   ── WHERE THEY ARE USED ─────────────────────────────────────
   In JS:    RP.icon("jobs")
   In HTML:  <span data-rp-icon="jobs"></span>

   ICONS        = the normal weight, used everywhere.
   ICONS_ACTIVE = the solid weight the sidebar's current tab wears.
                  Only the nav names need an entry there.
   ============================================================ */
(function (global) {
    "use strict";

    var ICONS = {

        /* ── Sidebar ─────────────────────────────────────── */

        dashboard: `<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10.3125V8.8125C6 8.66332 6.05926 8.52024 6.16475 8.41475C6.27024 8.30926 6.41332 8.25 6.5625 8.25C6.71168 8.25 6.85476 8.30926 6.96025 8.41475C7.06574 8.52024 7.125 8.66332 7.125 8.8125V10.3125C7.125 10.4617 7.06574 10.6048 6.96025 10.7102C6.85476 10.8157 6.71168 10.875 6.5625 10.875C6.41332 10.875 6.27024 10.8157 6.16475 10.7102C6.05926 10.6048 6 10.4617 6 10.3125ZM9.5625 10.875C9.71168 10.875 9.85476 10.8157 9.96025 10.7102C10.0657 10.6048 10.125 10.4617 10.125 10.3125V8.0625C10.125 7.91332 10.0657 7.77024 9.96025 7.66475C9.85476 7.55926 9.71168 7.5 9.5625 7.5C9.41332 7.5 9.27024 7.55926 9.16475 7.66475C9.05926 7.77024 9 7.91332 9 8.0625V10.3125C9 10.4617 9.05926 10.6048 9.16475 10.7102C9.27024 10.8157 9.41332 10.875 9.5625 10.875ZM12.5625 10.875C12.7117 10.875 12.8548 10.8157 12.9602 10.7102C13.0657 10.6048 13.125 10.4617 13.125 10.3125V7.3125C13.125 7.16332 13.0657 7.02024 12.9602 6.91475C12.8548 6.80926 12.7117 6.75 12.5625 6.75C12.4133 6.75 12.2702 6.80926 12.1648 6.91475C12.0593 7.02024 12 7.16332 12 7.3125V10.3125C12 10.4617 12.0593 10.6048 12.1648 10.7102C12.2702 10.8157 12.4133 10.875 12.5625 10.875ZM17.625 4.125V13.5H18.5625C18.7117 13.5 18.8548 13.5593 18.9602 13.6648C19.0657 13.7702 19.125 13.9133 19.125 14.0625C19.125 14.2117 19.0657 14.3548 18.9602 14.4602C18.8548 14.5657 18.7117 14.625 18.5625 14.625H10.125V16.5788C10.6039 16.7145 11.0176 17.0189 11.2897 17.4358C11.5618 17.8527 11.6739 18.3539 11.6054 18.847C11.5368 19.3401 11.2923 19.7917 10.9168 20.1186C10.5413 20.4455 10.0603 20.6256 9.5625 20.6256C9.06468 20.6256 8.58366 20.4455 8.2082 20.1186C7.83274 19.7917 7.58818 19.3401 7.51964 18.847C7.4511 18.3539 7.56322 17.8527 7.8353 17.4358C8.10737 17.0189 8.52105 16.7145 9 16.5788V14.625H0.5625C0.413316 14.625 0.270242 14.5657 0.164752 14.4602C0.0592632 14.3548 0 14.2117 0 14.0625C0 13.9133 0.0592632 13.7702 0.164752 13.6648C0.270242 13.5593 0.413316 13.5 0.5625 13.5H1.5V4.125H1.3125C0.964403 4.125 0.630564 3.98672 0.384422 3.74058C0.138281 3.49444 0 3.1606 0 2.8125V1.3125C0 0.964403 0.138281 0.630564 0.384422 0.384422C0.630564 0.138281 0.964403 0 1.3125 0H17.8125C18.1606 0 18.4944 0.138281 18.7406 0.384422C18.9867 0.630564 19.125 0.964403 19.125 1.3125V2.8125C19.125 3.1606 18.9867 3.49444 18.7406 3.74058C18.4944 3.98672 18.1606 4.125 17.8125 4.125H17.625ZM9.5625 17.625C9.37708 17.625 9.19582 17.68 9.04165 17.783C8.88748 17.886 8.76732 18.0324 8.69636 18.2037C8.62541 18.375 8.60684 18.5635 8.64301 18.7454C8.67919 18.9273 8.76848 19.0943 8.89959 19.2254C9.0307 19.3565 9.19775 19.4458 9.3796 19.482C9.56146 19.5182 9.74996 19.4996 9.92127 19.4286C10.0926 19.3577 10.239 19.2375 10.342 19.0833C10.445 18.9292 10.5 18.7479 10.5 18.5625C10.5 18.3139 10.4012 18.0754 10.2254 17.8996C10.0496 17.7238 9.81114 17.625 9.5625 17.625ZM1.3125 3H17.8125C17.8622 3 17.9099 2.98025 17.9451 2.94508C17.9802 2.90992 18 2.86223 18 2.8125V1.3125C18 1.26277 17.9802 1.21508 17.9451 1.17992C17.9099 1.14475 17.8622 1.125 17.8125 1.125H1.3125C1.26277 1.125 1.21508 1.14475 1.17992 1.17992C1.14475 1.21508 1.125 1.26277 1.125 1.3125V2.8125C1.125 2.86223 1.14475 2.90992 1.17992 2.94508C1.21508 2.98025 1.26277 3 1.3125 3ZM16.5 4.125H2.625V13.5H16.5V4.125Z" fill="currentColor"/></svg>`,

        invitations: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.625 0C11.193 0 11.7458 0.184608 12.2002 0.525391L20.2002 6.52539L20.2031 6.52734C20.8549 7.0227 21.25 7.79504 21.25 8.625V18.625C21.25 19.3212 20.9737 19.9892 20.4814 20.4814C19.9892 20.9737 19.3212 21.25 18.625 21.25H2.625C1.92881 21.25 1.26084 20.9737 0.768555 20.4814C0.276272 19.9892 0 19.3212 0 18.625V8.625C0 8.21748 0.0950961 7.81567 0.277344 7.45117C0.459533 7.08679 0.723933 6.76987 1.0498 6.52539L9.0498 0.525391C9.50418 0.184608 10.057 0 10.625 0ZM11.9902 14.8525L11.9873 14.8545C11.5791 15.1102 11.1067 15.2461 10.625 15.2461C10.1433 15.2461 9.67089 15.1102 9.2627 14.8545L9.25977 14.8525L1.25 9.76172V18.625C1.25 18.9897 1.39448 19.3398 1.65234 19.5977C1.91021 19.8555 2.26033 20 2.625 20H18.625C18.9897 20 19.3398 19.8555 19.5977 19.5977C19.8555 19.3398 20 18.9897 20 18.625V9.76172L11.9902 14.8525ZM10.625 1.25C10.3275 1.25 10.0378 1.34689 9.7998 1.52539L1.7998 7.52539C1.6293 7.65335 1.49091 7.81912 1.39551 8.00977C1.34832 8.10414 1.31243 8.20373 1.28809 8.30566L9.92578 13.7949C10.135 13.926 10.3781 13.9961 10.625 13.9961C10.8101 13.9961 10.9923 13.9566 11.1602 13.8818L11.3232 13.7949L19.9619 8.30566C19.8879 7.99967 19.7087 7.72309 19.4502 7.52539L11.4502 1.52539C11.2122 1.34689 10.9225 1.25 10.625 1.25Z" fill="currentColor"/></svg>`,

        jobs: `<svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 8.0625C7.5 7.91332 7.55926 7.77024 7.66475 7.66475C7.77024 7.55926 7.91332 7.5 8.0625 7.5H11.0625C11.2117 7.5 11.3548 7.55926 11.4602 7.66475C11.5657 7.77024 11.625 7.91332 11.625 8.0625C11.625 8.21168 11.5657 8.35476 11.4602 8.46025C11.3548 8.56574 11.2117 8.625 11.0625 8.625H8.0625C7.91332 8.625 7.77024 8.56574 7.66475 8.46025C7.55926 8.35476 7.5 8.21168 7.5 8.0625ZM19.125 4.3125V16.3125C19.125 16.6606 18.9867 16.9944 18.7406 17.2406C18.4944 17.4867 18.1606 17.625 17.8125 17.625H1.3125C0.964403 17.625 0.630564 17.4867 0.384422 17.2406C0.138281 16.9944 0 16.6606 0 16.3125V4.3125C0 3.9644 0.138281 3.63056 0.384422 3.38442C0.630564 3.13828 0.964403 3 1.3125 3H5.25V2.0625C5.25 1.51549 5.4673 0.990886 5.85409 0.604092C6.24089 0.217298 6.76549 0 7.3125 0H11.8125C12.3595 0 12.8841 0.217298 13.2709 0.604092C13.6577 0.990886 13.875 1.51549 13.875 2.0625V3H17.8125C18.1606 3 18.4944 3.13828 18.7406 3.38442C18.9867 3.63056 19.125 3.9644 19.125 4.3125ZM6.375 3H12.75V2.0625C12.75 1.81386 12.6512 1.5754 12.4754 1.39959C12.2996 1.22377 12.0611 1.125 11.8125 1.125H7.3125C7.06386 1.125 6.8254 1.22377 6.64959 1.39959C6.47377 1.5754 6.375 1.81386 6.375 2.0625V3ZM1.125 4.3125V8.32406C3.70804 9.75172 6.61118 10.5004 9.5625 10.5C12.514 10.5005 15.4172 9.75145 18 8.32312V4.3125C18 4.26277 17.9802 4.21508 17.9451 4.17992C17.9099 4.14475 17.8622 4.125 17.8125 4.125H1.3125C1.26277 4.125 1.21508 4.14475 1.17992 4.17992C1.14475 4.21508 1.125 4.26277 1.125 4.3125ZM18 16.3125V9.59719C15.3871 10.9299 12.4957 11.6248 9.5625 11.625C6.62938 11.6253 3.73792 10.9307 1.125 9.59813V16.3125C1.125 16.3622 1.14475 16.4099 1.17992 16.4451C1.21508 16.4802 1.26277 16.5 1.3125 16.5H17.8125C17.8622 16.5 17.9099 16.4802 17.9451 16.4451C17.9802 16.4099 18 16.3622 18 16.3125Z" fill="currentColor"/></svg>`,

        earnings: `<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.625 0C16.056 0 16.4697 0.170839 16.7744 0.475586C17.0792 0.780333 17.25 1.19402 17.25 1.625V4H17.625C18.056 4 18.4697 4.17084 18.7744 4.47559C19.0792 4.78033 19.25 5.19402 19.25 5.625V9.125C19.4441 9.20587 19.6229 9.32403 19.7744 9.47559C20.0792 9.78033 20.25 10.194 20.25 10.625V12.625C20.25 13.056 20.0792 13.4697 19.7744 13.7744C19.6229 13.9259 19.4439 14.0432 19.25 14.124V17.625C19.25 18.056 19.0792 18.4697 18.7744 18.7744C18.4697 19.0792 18.056 19.25 17.625 19.25H2.625C1.92881 19.25 1.26084 18.9737 0.768555 18.4814C0.276271 17.9892 0 17.3212 0 16.625V2.625C0 1.92881 0.276272 1.26084 0.768555 0.768555C1.26084 0.276272 1.92881 0 2.625 0H15.625ZM1.25 16.625C1.25 16.9897 1.39448 17.3398 1.65234 17.5977C1.91021 17.8555 2.26033 18 2.625 18H17.625C17.7245 18 17.8203 17.961 17.8906 17.8906C17.961 17.8203 18 17.7245 18 17.625V14.25H15.625C14.9288 14.25 14.2608 13.9737 13.7686 13.4814C13.2763 12.9892 13 12.3212 13 11.625C13 10.9288 13.2763 10.2608 13.7686 9.76855C14.2608 9.27627 14.9288 9 15.625 9H18V5.625C18 5.52554 17.961 5.4297 17.8906 5.35938C17.8203 5.28905 17.7245 5.25 17.625 5.25H2.625C2.13474 5.25 1.66069 5.10949 1.25 4.85645V16.625ZM15.625 10.25C15.2603 10.25 14.9102 10.3945 14.6523 10.6523C14.3945 10.9102 14.25 11.2603 14.25 11.625C14.25 11.9897 14.3945 12.3398 14.6523 12.5977C14.9102 12.8555 15.2603 13 15.625 13H18.625C18.7245 13 18.8203 12.961 18.8906 12.8906C18.961 12.8203 19 12.7245 19 12.625V10.625C19 10.5255 18.961 10.4297 18.8906 10.3594C18.8203 10.289 18.7245 10.25 18.625 10.25H15.625ZM2.625 1.25C2.26033 1.25 1.91021 1.39448 1.65234 1.65234C1.39448 1.91021 1.25 2.26033 1.25 2.625C1.25 2.98967 1.39448 3.33979 1.65234 3.59766C1.91021 3.85552 2.26033 4 2.625 4H16V1.625C16 1.52554 15.961 1.4297 15.8906 1.35938C15.8203 1.28905 15.7245 1.25 15.625 1.25H2.625Z" fill="currentColor"/></svg>`,

        "professional-profile": `<svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.125 6.5625C16.125 6.71168 16.0657 6.85476 15.9602 6.96025C15.8548 7.06574 15.7117 7.125 15.5625 7.125H11.8125C11.6633 7.125 11.5202 7.06574 11.4148 6.96025C11.3093 6.85476 11.25 6.71168 11.25 6.5625C11.25 6.41332 11.3093 6.27024 11.4148 6.16475C11.5202 6.05926 11.6633 6 11.8125 6H15.5625C15.7117 6 15.8548 6.05926 15.9602 6.16475C16.0657 6.27024 16.125 6.41332 16.125 6.5625ZM15.5625 9H11.8125C11.6633 9 11.5202 9.05926 11.4148 9.16475C11.3093 9.27024 11.25 9.41332 11.25 9.5625C11.25 9.71168 11.3093 9.85476 11.4148 9.96025C11.5202 10.0657 11.6633 10.125 11.8125 10.125H15.5625C15.7117 10.125 15.8548 10.0657 15.9602 9.96025C16.0657 9.85476 16.125 9.71168 16.125 9.5625C16.125 9.41332 16.0657 9.27024 15.9602 9.16475C15.8548 9.05926 15.7117 9 15.5625 9ZM19.125 1.3125V14.8125C19.125 15.1606 18.9867 15.4944 18.7406 15.7406C18.4944 15.9867 18.1606 16.125 17.8125 16.125H1.3125C0.964403 16.125 0.630564 15.9867 0.384422 15.7406C0.138281 15.4944 0 15.1606 0 14.8125V1.3125C0 0.964403 0.138281 0.630564 0.384422 0.384422C0.630564 0.138281 0.964403 0 1.3125 0H17.8125C18.1606 0 18.4944 0.138281 18.7406 0.384422C18.9867 0.630564 19.125 0.964403 19.125 1.3125ZM18 1.3125C18 1.26277 17.9802 1.21508 17.9451 1.17992C17.9099 1.14475 17.8622 1.125 17.8125 1.125H1.3125C1.26277 1.125 1.21508 1.14475 1.17992 1.17992C1.14475 1.21508 1.125 1.26277 1.125 1.3125V14.8125C1.125 14.8622 1.14475 14.9099 1.17992 14.9451C1.21508 14.9802 1.26277 15 1.3125 15H17.8125C17.8622 15 17.9099 14.9802 17.9451 14.9451C17.9802 14.9099 18 14.8622 18 14.8125V1.3125ZM10.1072 11.6728C10.1445 11.8173 10.1229 11.9706 10.0471 12.0992C9.97131 12.2277 9.84759 12.3208 9.70312 12.3581C9.55866 12.3954 9.40531 12.3738 9.27678 12.298C9.14826 12.2223 9.05511 12.0985 9.01781 11.9541C8.75063 10.9106 7.695 10.125 6.5625 10.125C5.43 10.125 4.37531 10.9106 4.10719 11.9531C4.06989 12.0976 3.97674 12.2213 3.84822 12.2971C3.71969 12.3729 3.56634 12.3945 3.42188 12.3572C3.27741 12.3199 3.15369 12.2267 3.07791 12.0982C3.00213 11.9697 2.98052 11.8163 3.01781 11.6719C3.14383 11.2057 3.3633 10.77 3.6629 10.3913C3.9625 10.0125 4.33597 9.69868 4.76062 9.46875C4.31707 9.09848 3.99831 8.60059 3.8477 8.04277C3.69709 7.48495 3.72194 6.89428 3.91886 6.35109C4.11578 5.80789 4.47523 5.33852 4.94832 5.00681C5.42141 4.6751 5.98518 4.49715 6.56297 4.49715C7.14076 4.49715 7.70453 4.6751 8.17762 5.00681C8.65071 5.33852 9.01015 5.80789 9.20708 6.35109C9.404 6.89428 9.42885 7.48495 9.27824 8.04277C9.12763 8.60059 8.80887 9.09848 8.36531 9.46875C8.78989 9.69888 9.16324 10.0129 9.46268 10.3918C9.76212 10.7707 9.9814 11.2065 10.1072 11.6728ZM6.5625 9C6.89626 9 7.22252 8.90103 7.50003 8.7156C7.77753 8.53018 7.99382 8.26663 8.12155 7.95828C8.24927 7.64993 8.28269 7.31063 8.21758 6.98328C8.15246 6.65594 7.99174 6.35526 7.75574 6.11926C7.51974 5.88326 7.21906 5.72254 6.89172 5.65742C6.56437 5.59231 6.22507 5.62573 5.91672 5.75345C5.60837 5.88118 5.34482 6.09747 5.15939 6.37497C4.97397 6.65248 4.875 6.97874 4.875 7.3125C4.875 7.76005 5.05279 8.18927 5.36926 8.50574C5.68573 8.82221 6.11495 9 6.5625 9Z" fill="currentColor"/></svg>`,

        account: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`,

        /* ── Topbar ──────────────────────────────────────── */

        notifications: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path></svg>`,

        messages: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256"><path d="M116,120a12,12,0,1,1,12,12A12,12,0,0,1,116,120ZM84,132a12,12,0,1,0-12-12A12,12,0,0,0,84,132Zm88,0a12,12,0,1,0-12-12A12,12,0,0,0,172,132Zm60-76V184a16,16,0,0,1-16,16H155.57l-13.68,23.94a16,16,0,0,1-27.78,0L100.43,200H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V184h65.07a8,8,0,0,1,7,4l16,28,16-28a8,8,0,0,1,7-4H216Z"/></svg>`,

        menu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,

        availability: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>`,

        logout: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,

        help: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-help"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,

        manual: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>`,

        balance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dollar-sign"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>`,

        /* ── Chevrons ────────────────────────────────────── */

        "chevron-left": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>`,

        "chevron-right": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>`,

        "chevron-down": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`,

        "chevron-up": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>`,

        /* ── Toolbar ─────────────────────────────────────── */

        search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,

        close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,

        columns: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-columns-3"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`,

        reset: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,

        lock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,

        /* ── Row and panel ───────────────────────────────── */

        check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`,

        view: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,

        file: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text preview-icon"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
        
        folder: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-open preview-icon"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>`,

        download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,

        "arrow-right": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,

        clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,

        hourglass: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hourglass"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`,
        
        "list-todo": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-todo preview-icon"><path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><rect x="3" y="4" width="6" height="6" rx="1"/></svg>`,

        /* ── Jobs tabs ───────────────────────────────────── */

        "circle-play": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity preview-icon"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>`,

        "circle-check": `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check preview-icon"><circle cx="12" cy="12" r="10"></circle><path d="m16 9-5.5 5.5L8 12"></path></svg>`,
        
        "rotate-clock": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw-fading-clock preview-icon"><path d="M12 3a9.75 9.75 0 0 1 6.74 2.74"/><path d="M18.74 5.74 21 8"/><path d="M21 8V3"/><path d="M7.5 19.794c-6-3.464-6-12.124 0-15.588"/><path d="M7.5 4.206A9 9 0 0 1 12 3"/><path d="M12 7v5l4 2"/><path d="M14 20.775A9 9 0 0 1 12 21"/><path d="M19 17.656a9 9 0 0 1-1.5 1.456"/><path d="M21 12a9 9 0 0 1-.228 2"/><path d="M21 8h-5"/></svg>`,

        "file-pdf": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M224,152a8,8,0,0,1-8,8H192v16h16a8,8,0,0,1,0,16H192v16a8,8,0,0,1-16,0V152a8,8,0,0,1,8-8h32A8,8,0,0,1,224,152ZM92,172a28,28,0,0,1-28,28H56v8a8,8,0,0,1-16,0V152a8,8,0,0,1,8-8H64A28,28,0,0,1,92,172Zm-16,0a12,12,0,0,0-12-12H56v24h8A12,12,0,0,0,76,172Zm88,16a36,36,0,0,1-36,36H112a8,8,0,0,1-8-8V160a8,8,0,0,1,8-8h16A36,36,0,0,1,164,188Zm-16,0a20,20,0,0,0-20-20h-8v40h8A20,20,0,0,0,148,188ZM40,112V40A16,16,0,0,1,56,24h96a8,8,0,0,1,5.66,2.34l56,56A8,8,0,0,1,216,88v24a8,8,0,0,1-16,0V96H152a8,8,0,0,1-8-8V40H56v72a8,8,0,0,1-16,0ZM160,80h28.69L160,51.31Z"></path></svg>`,

        /* ── Job page: services ──────────────────────────── */

        languages: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-languages"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`,

        "badge-check": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-badge-check"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>`,

        "spell-check": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-spell-check"><path d="m6 16 6-12 6 12"/><path d="M8 12h8"/><path d="m16 20 2 2 4-4"/></svg>`,

        "pen-tool": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-tool"><path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/></svg>`,

        captions: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-captions"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg>`,

        stamp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13"/></svg>`,

        "pen-line": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-line"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>`,

        /* ── Job page: files and delivery ────────────────── */

        "layout-template": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-template"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/></svg>`,

        "file-check": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-check"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>`,

        sparkles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,

        bot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,

        "columns-2": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-columns-2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/></svg>`,

        "external-link": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,

        upload: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/></svg>`,

        play: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,

        "list-checks": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-checks"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>`,

        minus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus"><path d="M5 12h14"/></svg>`,

        "book-marked": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-marked"><path d="M10 2v8l3-3 3 3V2"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>`,

        receipt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-receipt"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>`,

        calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`,

        /* ── Job page: people and chat ───────────────────── */

        mail: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,

        phone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,

        smartphone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,

        building: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,

        paperclip: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`,

        send: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>`,

        mic: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,

        /* ── Offer types ─────────────────────────────────── */

        bid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gavel"><path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>`,

        interpreting: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg>`,

        /* ── States ──────────────────────────────────────── */

        success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>`,

        error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,

        alert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,

        warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,

        info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,

        "empty-inbox": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-inbox"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,

        /* ── Account page: sections ────────────────────── */

        "user-round": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`,

        "graduation-cap": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,

        "briefcase-business": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase-business"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`,

        award: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>`,

        "app-window": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-app-window"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/></svg>`,

        files: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-files"><path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/><path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z"/><path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1"/></svg>`,

        "shield-check": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,

        /* ── Account page: details ─────────────────────── */

        "map-pin": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,

        globe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,

        "building-2": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>`,

        school: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-school"><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M18 4.933V21"/><path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6"/><path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11"/><path d="M6 4.933V21"/><circle cx="12" cy="9" r="2"/></svg>`,

        "calendar-clock": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-clock"><path d="M16 14v2.2l1.6 1"/><path d="M16 2v3"/><path d="M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338"/><path d="M3 9h5.859"/><path d="M8 2v3"/><circle cx="16" cy="16" r="6"/></svg>`,

        "scroll-text": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>`,

        "lock-keyhole": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock-keyhole"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>`,

        "circle-alert": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,

        gauge: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gauge"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,

        /* ── Account page: actions ─────────────────────── */

        camera: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg>`,

        "id-card": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-id-card"><path d="M13 19a4 4 0 00-8 0"/><path d="M16 10h2"/><path d="M16 14h2"/><circle cx="9" cy="12" r="3"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg>`,

        plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,

        "trash-2": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,

        eye: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,

        "eye-off": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`,

        "key-round": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,

        copy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,

        "cloud-upload": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-upload"><path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/></svg>`,

        image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,

        "user-round-pen": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-pen"><path d="M2 21a8 8 0 0 1 10.821-7.487"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="8" r="5"/></svg>`,

        circle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle"><circle cx="12" cy="12" r="10"/></svg>`,

        /* ── Account page: technology groups ───────────── */

        video: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-video"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`,

        shapes: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shapes"><path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/></svg>`,

        /* ── Dashboard ─────────────────────────────────── */

        wallet: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`,

        "clock-alert": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-alert"><path d="M12 6v6l4 2"/><path d="M20 12v5"/><path d="M20 21h.01"/><path d="M21.25 8.2A10 10 0 1 0 16 21.16"/></svg>`,

        history: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,

        "circle-x": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,

        "trending-up": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>`,

        "trending-down": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-down"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>`,

        "credit-card-check": `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-credit-card-check preview-icon"><path d="M12.5 19H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v4"/><path d="M2 10h20"/><path d="M6 14h2"/><path d="m16 17 2 2 4-4"/></svg>`,

        "check-check": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-check"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>`,

        /* ── Phosphor, where Lucide has no brand icons ───── */

        whatsapp: `<svg viewBox="0 0 50 50" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#67C15E" class="ph ph-whatsapp-logo"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> </defs> <g id="Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g transform="translate(-700.000000, -360.000000)" fill="#67C15E"> <path d="M723.993033,360 C710.762252,360 700,370.765287 700,383.999801 C700,389.248451 701.692661,394.116025 704.570026,398.066947 L701.579605,406.983798 L710.804449,404.035539 C714.598605,406.546975 719.126434,408 724.006967,408 C737.237748,408 748,397.234315 748,384.000199 C748,370.765685 737.237748,360.000398 724.006967,360.000398 L723.993033,360.000398 L723.993033,360 Z M717.29285,372.190836 C716.827488,371.07628 716.474784,371.034071 715.769774,371.005401 C715.529728,370.991464 715.262214,370.977527 714.96564,370.977527 C714.04845,370.977527 713.089462,371.245514 712.511043,371.838033 C711.806033,372.557577 710.056843,374.23638 710.056843,377.679202 C710.056843,381.122023 712.567571,384.451756 712.905944,384.917648 C713.258648,385.382743 717.800808,392.55031 724.853297,395.471492 C730.368379,397.757149 732.00491,397.545307 733.260074,397.27732 C735.093658,396.882308 737.393002,395.527239 737.971421,393.891043 C738.54984,392.25405 738.54984,390.857171 738.380255,390.560912 C738.211068,390.264652 737.745308,390.095816 737.040298,389.742615 C736.335288,389.389811 732.90737,387.696673 732.25849,387.470894 C731.623543,387.231179 731.017259,387.315995 730.537963,387.99333 C729.860819,388.938653 729.198006,389.89831 728.661785,390.476494 C728.238619,390.928051 727.547144,390.984595 726.969123,390.744481 C726.193254,390.420348 724.021298,389.657798 721.340985,387.273388 C719.267356,385.42535 717.856938,383.125756 717.448104,382.434484 C717.038871,381.729275 717.405907,381.319529 717.729948,380.938852 C718.082653,380.501232 718.421026,380.191036 718.77373,379.781688 C719.126434,379.372738 719.323884,379.160897 719.549599,378.681068 C719.789645,378.215575 719.62006,377.735746 719.450874,377.382942 C719.281687,377.030139 717.871269,373.587317 717.29285,372.190836 Z" id="Whatsapp"> </path> </g> </g> </g></svg>`

    };

    /* ============================================================
       ACTIVE (solid) weight — the sidebar's current tab.
       Same names as the nav. A name missing here simply falls back
       to the normal weight above.
       ============================================================ */
    var ICONS_ACTIVE = {

        dashboard: `<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.8125 0C18.1606 0 18.4941 0.138624 18.7402 0.384766C18.9864 0.630907 19.125 0.964403 19.125 1.3125V2.8125C19.125 3.1606 18.9864 3.49409 18.7402 3.74023C18.4941 3.98638 18.1606 4.125 17.8125 4.125H17.625V13.5H18.5625C18.7117 13.5 18.8545 13.5595 18.96 13.665C19.0654 13.7705 19.125 13.9133 19.125 14.0625C19.125 14.2117 19.0654 14.3545 18.96 14.46C18.8545 14.5655 18.7117 14.625 18.5625 14.625H10.125V16.5791C10.6039 16.7149 11.018 17.0187 11.29 17.4355C11.5621 17.8523 11.6739 18.3537 11.6055 18.8467C11.537 19.3396 11.2923 19.7913 10.917 20.1182C10.5415 20.445 10.0603 20.626 9.5625 20.626C9.06468 20.626 8.58347 20.445 8.20801 20.1182C7.83274 19.7913 7.58805 19.3396 7.51953 18.8467C7.4511 18.3537 7.56295 17.8523 7.83496 17.4355C8.10702 17.0187 8.52111 16.7149 9 16.5791V14.625H0.5625C0.413316 14.625 0.270528 14.5655 0.165039 14.46C0.0595503 14.3545 0 14.2117 0 14.0625C2.52563e-07 13.9133 0.0595501 13.7705 0.165039 13.665C0.270528 13.5596 0.413316 13.5 0.5625 13.5H1.5V4.125H1.3125C0.964403 4.125 0.630907 3.98638 0.384766 3.74023C0.138624 3.49409 0 3.1606 0 2.8125V1.3125C3.15705e-08 0.964403 0.138624 0.630907 0.384766 0.384766C0.630907 0.138624 0.964403 0 1.3125 0H17.8125ZM9.5625 17.625C9.37714 17.625 9.19613 17.6802 9.04199 17.7832C8.88782 17.8862 8.76725 18.0328 8.69629 18.2041C8.62549 18.3752 8.60652 18.5635 8.64258 18.7451C8.67875 18.927 8.7683 19.0945 8.89941 19.2256C9.03053 19.3567 9.19803 19.4462 9.37988 19.4824C9.56151 19.5185 9.74979 19.4995 9.9209 19.4287C10.0922 19.3578 10.2388 19.2372 10.3418 19.083C10.4448 18.9289 10.5 18.7479 10.5 18.5625C10.5 18.3139 10.4014 18.0752 10.2256 17.8994C10.0498 17.7236 9.81114 17.625 9.5625 17.625ZM6.5625 8.25C6.41332 8.25 6.27053 8.30955 6.16504 8.41504C6.05955 8.52053 6 8.66332 6 8.8125V10.3125C6 10.4617 6.05955 10.6045 6.16504 10.71C6.27053 10.8155 6.41332 10.875 6.5625 10.875C6.71168 10.875 6.85447 10.8155 6.95996 10.71C7.06545 10.6045 7.125 10.4617 7.125 10.3125V8.8125C7.125 8.66332 7.06545 8.52053 6.95996 8.41504C6.85447 8.30955 6.71168 8.25 6.5625 8.25ZM9.5625 7.5C9.41332 7.5 9.27053 7.55955 9.16504 7.66504C9.05955 7.77053 9 7.91332 9 8.0625V10.3125C9 10.4617 9.05955 10.6045 9.16504 10.71C9.27053 10.8155 9.41332 10.875 9.5625 10.875C9.71168 10.875 9.85447 10.8155 9.95996 10.71C10.0654 10.6045 10.125 10.4617 10.125 10.3125V8.0625C10.125 7.91332 10.0655 7.77053 9.95996 7.66504C9.85447 7.55955 9.71168 7.5 9.5625 7.5ZM12.5625 6.75C12.4133 6.75 12.2705 6.80955 12.165 6.91504C12.0595 7.02053 12 7.16332 12 7.3125V10.3125C12 10.4617 12.0596 10.6045 12.165 10.71C12.2705 10.8155 12.4133 10.875 12.5625 10.875C12.7117 10.875 12.8545 10.8155 12.96 10.71C13.0654 10.6045 13.125 10.4617 13.125 10.3125V7.3125C13.125 7.16332 13.0655 7.02053 12.96 6.91504C12.8545 6.80955 12.7117 6.75 12.5625 6.75ZM1.3125 1.125C1.26277 1.125 1.21485 1.14452 1.17969 1.17969C1.14452 1.21485 1.125 1.26277 1.125 1.3125V2.8125C1.125 2.86223 1.14452 2.91015 1.17969 2.94531C1.21485 2.98048 1.26277 3 1.3125 3H17.8125C17.8622 3 17.9101 2.98048 17.9453 2.94531C17.9805 2.91015 18 2.86223 18 2.8125V1.3125C18 1.26277 17.9805 1.21485 17.9453 1.17969C17.9101 1.14452 17.8622 1.125 17.8125 1.125H1.3125Z" fill="currentColor"/></svg>`,

        invitations: `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.625 0C11.193 0 11.7458 0.184608 12.2002 0.525391L20.2002 6.52539L20.2031 6.52734C20.8549 7.0227 21.25 7.79504 21.25 8.625V19C21.25 20.3577 19.9472 21.25 18.625 21.25H2.625C1.30278 21.25 0 20.3577 0 19V8.625C0 8.21748 0.0950961 7.81567 0.277344 7.45117C0.459533 7.08679 0.723933 6.76987 1.0498 6.52539L9.0498 0.525391C9.50418 0.184608 10.057 0 10.625 0ZM2.625 8.25C1.87324 8.25 1.40851 8.65444 1.28418 9.04395L9.625 14.3516C9.93011 14.5288 10.277 14.6221 10.6299 14.6221C10.9826 14.622 11.3288 14.5287 11.6338 14.3516L19.9648 9.04492C19.8408 8.65524 19.3771 8.25 18.625 8.25H2.625Z" fill="currentColor"/></svg>`,

        jobs: `<svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 8.0625C7.5 7.91332 7.55926 7.77024 7.66475 7.66475C7.77024 7.55926 7.91332 7.5 8.0625 7.5H11.0625C11.2117 7.5 11.3548 7.55926 11.4602 7.66475C11.5657 7.77024 11.625 7.91332 11.625 8.0625C11.625 8.21168 11.5657 8.35476 11.4602 8.46025C11.3548 8.56574 11.2117 8.625 11.0625 8.625H8.0625C7.91332 8.625 7.77024 8.56574 7.66475 8.46025C7.55926 8.35476 7.5 8.21168 7.5 8.0625ZM19.125 4.3125V16.3125C19.125 16.6606 18.9867 16.9944 18.7406 17.2406C18.4944 17.4867 18.1606 17.625 17.8125 17.625H1.3125C0.964403 17.625 0.630564 17.4867 0.384422 17.2406C0.138281 16.9944 0 16.6606 0 16.3125V4.3125C0 3.9644 0.138281 3.63056 0.384422 3.38442C0.630564 3.13828 0.964403 3 1.3125 3H5.25V2.0625C5.25 1.51549 5.4673 0.990886 5.85409 0.604092C6.24089 0.217298 6.76549 0 7.3125 0H11.8125C12.3595 0 12.8841 0.217298 13.2709 0.604092C13.6577 0.990886 13.875 1.51549 13.875 2.0625V3H17.8125C18.1606 3 18.4944 3.13828 18.7406 3.38442C18.9867 3.63056 19.125 3.9644 19.125 4.3125ZM6.375 3H12.75V2.0625C12.75 1.81386 12.6512 1.5754 12.4754 1.39959C12.2996 1.22377 12.0611 1.125 11.8125 1.125H7.3125C7.06386 1.125 6.8254 1.22377 6.64959 1.39959C6.47377 1.5754 6.375 1.81386 6.375 2.0625V3ZM1.125 4.3125V8.32406C3.70804 9.75172 6.61118 10.5004 9.5625 10.5C12.514 10.5005 15.4172 9.75145 18 8.32312V4.3125C18 4.26277 17.9802 4.21508 17.9451 4.17992C17.9099 4.14475 17.8622 4.125 17.8125 4.125H1.3125C1.26277 4.125 1.21508 4.14475 1.17992 4.17992C1.14475 4.21508 1.125 4.26277 1.125 4.3125Z" fill="currentColor"/></svg>`,

        earnings: `<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.625 0C16.056 0 16.4697 0.170839 16.7744 0.475586C17.0792 0.780333 17.25 1.19402 17.25 1.625V4H17.625C18.056 4 18.4697 4.17084 18.7744 4.47559C19.0792 4.78033 19.25 5.19402 19.25 5.625V9.12402C19.298 9.14397 19.3447 9.16693 19.3906 9.19141C19.4057 9.19944 19.4197 9.20927 19.4346 9.21777C19.4661 9.23587 19.498 9.25322 19.5283 9.27344C19.6162 9.33204 19.6986 9.39979 19.7744 9.47559C20.0792 9.78033 20.25 10.194 20.25 10.625V12.625C20.25 13.056 20.0792 13.4697 19.7744 13.7744C19.6228 13.926 19.4442 14.0442 19.25 14.125V17.625C19.25 18.056 19.0792 18.4697 18.7744 18.7744C18.4697 19.0792 18.056 19.25 17.625 19.25H2.625C1.92881 19.25 1.26084 18.9737 0.768555 18.4814C0.276272 17.9892 0 17.3212 0 16.625V2.625C0 1.92881 0.276272 1.26084 0.768555 0.768555C1.26084 0.276272 1.92881 0 2.625 0H15.625ZM15.625 10.25C15.2603 10.25 14.9102 10.3945 14.6523 10.6523C14.3945 10.9102 14.25 11.2603 14.25 11.625C14.25 11.9897 14.3945 12.3398 14.6523 12.5977C14.9102 12.8555 15.2603 13 15.625 13H18.625C18.7245 13 18.8203 12.961 18.8906 12.8906C18.961 12.8203 19 12.7245 19 12.625V10.625C19 10.5255 18.961 10.4297 18.8906 10.3594C18.8203 10.289 18.7245 10.25 18.625 10.25H15.625ZM2.625 1.25C2.26033 1.25 1.91021 1.39448 1.65234 1.65234C1.39448 1.91021 1.25 2.26033 1.25 2.625C1.25 2.98967 1.39448 3.33979 1.65234 3.59766C1.91021 3.85552 2.26033 4 2.625 4H16V1.625C16 1.52554 15.961 1.4297 15.8906 1.35938C15.8203 1.28905 15.7245 1.25 15.625 1.25H2.625Z" fill="currentColor"/></svg>`,

        "professional-profile": `<svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.8125 0C18.1606 0 18.4941 0.138624 18.7402 0.384766C18.9864 0.630907 19.125 0.964403 19.125 1.3125V14.8125C19.125 15.1606 18.9864 15.4941 18.7402 15.7402C18.4941 15.9864 18.1606 16.125 17.8125 16.125H1.3125C0.964403 16.125 0.630907 15.9864 0.384766 15.7402C0.138624 15.4941 0 15.1606 0 14.8125V1.3125C0 0.964403 0.138624 0.630907 0.384766 0.384766C0.630907 0.138624 0.964403 0 1.3125 0H17.8125ZM6.5625 4.49707C5.98488 4.49717 5.4212 4.67522 4.94824 5.00684C4.47519 5.33854 4.11586 5.80839 3.91895 6.35156C3.72215 6.89465 3.69708 7.48529 3.84766 8.04297C3.99829 8.60071 4.31723 9.09852 4.76074 9.46875C4.33609 9.69868 3.96269 10.0129 3.66309 10.3916C3.36353 10.7703 3.14358 11.2057 3.01758 11.6719C2.9803 11.8163 3.00236 11.9701 3.07812 12.0986C3.15392 12.2269 3.27757 12.3202 3.42188 12.3574C3.56631 12.3947 3.72013 12.3726 3.84863 12.2969C3.97694 12.2211 4.07017 12.0974 4.10742 11.9531C4.37557 10.9107 5.43002 10.125 6.5625 10.125C7.69499 10.125 8.75038 10.9107 9.01758 11.9541C9.05484 12.0984 9.14805 12.2221 9.27637 12.2979C9.40487 12.3736 9.55869 12.3957 9.70312 12.3584C9.84742 12.3211 9.97108 12.2279 10.0469 12.0996C10.1226 11.9711 10.1447 11.8173 10.1074 11.6729C9.98163 11.2066 9.76233 10.7705 9.46289 10.3916C9.16346 10.0127 8.78979 9.69888 8.36523 9.46875C8.80874 9.09852 9.12769 8.60071 9.27832 8.04297C9.42889 7.48529 9.40382 6.89465 9.20703 6.35156C9.01012 5.8084 8.65077 5.33854 8.17773 5.00684C7.70465 4.67513 7.14029 4.49707 6.5625 4.49707ZM11.8125 9C11.6633 9 11.5205 9.05956 11.415 9.16504C11.3095 9.27053 11.25 9.41332 11.25 9.5625C11.25 9.71168 11.3095 9.85447 11.415 9.95996C11.5205 10.0654 11.6633 10.125 11.8125 10.125H15.5625C15.7117 10.125 15.8545 10.0654 15.96 9.95996C16.0654 9.85447 16.125 9.71168 16.125 9.5625C16.125 9.41332 16.0654 9.27053 15.96 9.16504C15.8545 9.05955 15.7117 9.00001 15.5625 9H11.8125ZM5.91699 5.75391C6.22527 5.62623 6.56433 5.59216 6.8916 5.65723C7.21894 5.72234 7.51986 5.88314 7.75586 6.11914C7.99186 6.35514 8.15266 6.65606 8.21777 6.9834C8.28284 7.31067 8.24877 7.64973 8.12109 7.95801C7.99337 8.26635 7.7775 8.5304 7.5 8.71582C7.22252 8.90119 6.8962 9 6.5625 9C6.11495 9 5.68561 8.82232 5.36914 8.50586C5.05267 8.18939 4.875 7.76005 4.875 7.3125C4.875 6.97879 4.97381 6.65248 5.15918 6.375C5.3446 6.0975 5.60865 5.88163 5.91699 5.75391ZM11.8125 6C11.6633 6 11.5205 6.05956 11.415 6.16504C11.3095 6.27053 11.25 6.41332 11.25 6.5625C11.25 6.71168 11.3095 6.85447 11.415 6.95996C11.5205 7.06544 11.6633 7.125 11.8125 7.125H15.5625C15.7117 7.12499 15.8545 7.06545 15.96 6.95996C16.0654 6.85447 16.125 6.71168 16.125 6.5625C16.125 6.41332 16.0654 6.27053 15.96 6.16504C15.8545 6.05955 15.7117 6.00001 15.5625 6H11.8125Z" fill="currentColor"/></svg>`,

        account: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.5A4.5 4.5 0 1 0 12 11.5 4.5 4.5 0 0 0 12 2.5ZM4.1 20.4a8 8 0 0 1 15.8 0 1.2 1.2 0 0 1-1.2 1.4H5.3a1.2 1.2 0 0 1-1.2-1.4Z"/></svg>`
    };

    /* ============================================================
       Nothing below needs editing.
       ============================================================
       adopt() is what lets a pasted icon work untouched: it drops
       the size attributes so CSS can size it, rewrites every
       hard-coded colour to currentColor, and tags the icon outline
       or solid by looking at whether it strokes. */

    var COLOUR = /\s(fill|stroke)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
    var DROP = /\s(?:width|height|class|version|xmlns:xlink|xml:space)\s*=\s*(?:"[^"]*"|'[^']*')/gi;
    var STROKED = /\sstroke\s*=\s*(?:"|')\s*(?!none\s*(?:"|'))[^"']+(?:"|')/i;
    var CLASS = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
    var LIBRARY_CLASS = /^(?:lucide|ph)(?:-|$)/;

    /* Only the library's own names survive; any other pasted class is styling we do not want */
    function libraryClasses(attrs) {
        var m = attrs.match(CLASS);
        if (!m) return "";
        return (m[1] !== undefined ? m[1] : m[2])
            .split(/\s+/)
            .filter(function (c) {
                return LIBRARY_CLASS.test(c);
            })
            .join(" ");
    }

    function recolour(chunk) {
        return chunk.replace(COLOUR, function (match, prop, dq, sq) {
            var value = (dq !== undefined ? dq : sq).trim();
            /* "none" is structure, not colour, and a gradient or
               pattern reference is not ours to repaint. */
            if (!value || value === "none" || value === "currentColor" || value.indexOf("url(") === 0) {
                return match;
            }
            return " " + prop + '="currentColor"';
        });
    }

    function adopt(raw, extraClass) {
        var svg = String(raw).trim();

        /* editors often leave a prologue or a comment on top */
        svg = svg.replace(/<\?xml[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>|<!--[\s\S]*?-->/gi, "").trim();

        var open = svg.match(/^<svg\b([^>]*)>/i);
        if (!open) return svg;

        var named = libraryClasses(open[1]);
        var cls =
            (named ? named + " " : "") +
            "preview-icon " +
            (STROKED.test(svg) ? "preview-icon--outline" : "preview-icon--filled") +
            (extraClass ? " " + extraClass : "");

        return (
            "<svg" +
            recolour(open[1].replace(DROP, "")) +
            ' class="' +
            cls +
            '" aria-hidden="true" focusable="false">' +
            recolour(svg.slice(open[0].length))
        );
    }

    function icon(name, extraClass, opts) {
        opts = opts || {};

        var raw =
            (opts.variant === "active" || opts.variant === "filled" ? ICONS_ACTIVE[name] : null) ||
            ICONS[name];

        if (!raw) {
            if (global.console) global.console.warn('RP.icon: no icon named "' + name + '"');
            return "";
        }

        return adopt(raw, extraClass);
    }

    /* <span data-rp-icon="search"></span> anywhere in the HTML */
    function paint(root) {
        (root || document).querySelectorAll("[data-rp-icon]").forEach(function (el) {
            el.innerHTML = icon(el.getAttribute("data-rp-icon"), el.getAttribute("data-rp-icon-class"));
        });
    }

    global.RP = global.RP || {};
    global.RP.icon = icon;
    global.RP.paintIcons = paint;
    global.RP.ICONS = ICONS;
    global.RP.ICONS_ACTIVE = ICONS_ACTIVE;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            paint();
        });
    } else {
        paint();
    }
})(window);
