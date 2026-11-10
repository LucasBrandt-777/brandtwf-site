# BWF Intelligence — P0 conversion funnel

Prepared 2026-11-06 (America/New_York). Development proposal; no production changes.

Follow-up validation on 2026-11-06: see [P0-VALIDATION-2026-11-06.md](P0-VALIDATION-2026-11-06.md)
for independently rerun tests, the cached-page correction, remaining blockers and the
controlled-submission plan. The original 45-test results below are the initial baseline;
the follow-up records the current coverage. Release remains unauthorized.

## Baseline and scope

Continue the November 5 diagnosis; do not repeat the audit. The recovered record reported
92 campaign sessions / 80 users, 3 users with `form_start`, 1 with `bwf_form_start`, and
2 events / 2 users with `generate_lead`. These have different denominators; do not use
3 / 92 as a user conversion rate. The original reporting interval and filters must be
retained before comparing a later period.

The recovered Ads audit reported `generate_lead` imported from GA4 as Primary,
`Contato` as a direct Ads action without data, 8 Primary / 0 Secondary actions,
and Maximize Clicks bidding. No conversion duplication was proven. Those are dated
audit findings, not a new read of live Ads or GA4 configuration.

Code baseline: `a07d072825e790af897019507b0d2b28539ee402`, repository
`LucasBrandt-777/brandtwf-site`. Read-only Netlify inspection confirmed the published
production deploy `6ae601f8804528edd98589bf` points to that same commit on `main`.

The code review confirmed:

- `index.html` and `custom/kitchens.html` each owned a Netlify AJAX handler and copied
  analytics/duplicate protection. The unused `main.js` is not loaded by these pages.
- Both handlers emitted `generate_lead` after `response.ok`, then an additional
  `conversion` directed to `AW-16641705674` without an action label. This is ambiguous
  legacy instrumentation, not proof that Ads recorded a second conversion.
- `bwf_form_start` meant first focus, even without entering a value.
- Quote CTA, actual form exposure, validation and request failures were not measured.
- The shared `bwf_lead_sent` timestamp suppresses both forms for 24 hours.
- FAQ loaded gtag.js but omitted its initialization; reviews had initialized GA4.

## Implementation prepared

1. Add `bwf-funnel-v1.js` as the single owner of submission and funnel measurement.
2. Replace the two inline handler/measurement blocks with one shared script include.
3. Instrument all 13 existing quote CTAs: home 6, kitchens 4, FAQ 1, reviews 2.
   Add only data attributes; preserve labels, links, layout and service presentation.
4. Initialize the already-loaded FAQ GA4 tag, and load CTA tracking on FAQ/reviews.
5. Send funnel events explicitly to GA4 `G-XZQ389ZLRW`. Preserve `generate_lead` as
   the sole confirmed form-lead event and remove the direct, unlabeled Ads emission.
6. Preserve native required/email validation, honeypot, POST format, subject, confirmation,
   the existing 24-hour key and contact click names. Add a synchronous in-flight guard
   and an in-memory confirmed flag. Retry remains available after request failures.

No Netlify configuration, campaigns, budgets, bidding, GA4 admin settings, conversion
actions, service copy, form fields, project options, CSS or server-side logic are changed.
The four service groups remain Custom Millwork; Custom Cabinetry & Built-ins;
Antique Restoration; Fine Upholstery. Kitchens maps to cabinetry for analytics only.

## Event contract

| Event | Trigger / counting rule | Role |
| --- | --- | --- |
| `bwf_quote_click` | Each activation of an annotated quote anchor, including nested elements | Funnel diagnostic |
| `bwf_form_view` | At least half the first input is within the viewport and ancestors are visible; once per page | Funnel diagnostic |
| `bwf_form_start` | First nonempty input/change on an allowed customer field; once per page | Funnel diagnostic |
| `bwf_form_submit` | Valid, non-honeypot attempt about to POST; once per attempt | Funnel diagnostic, not confirmation |
| `bwf_form_error` | Native validation, HTTP failure or network rejection | Funnel diagnostic |
| `form_resubmit_blocked` | Recent submission on load, repeated submission, or request already in flight | Duplicate-protection diagnostic |
| `generate_lead` | First successful HTTP response from the actual form POST | Existing principal lead event |

Common parameters: `form_id`, `page_type`, `service_group`, `funnel_version=p0_v1`.
GA routing uses `send_to=G-XZQ389ZLRW` and beacon transport. Additional parameters:
`cta_location`; `field_name`; `attempt_number`; `error_type` / `error_code`; `block_reason`.
Names, email, telephone, city, description, notification subject and raw error messages
are never added to these payloads. `service_group` is mapped from fixed options, never
free text. Contact events keep only their existing public business-contact target.

Validation errors are deduplicated by field and error code until that field changes.
Submission attempts are not leads. Reloads, honeypot pseudo-success and duplicate blocks
never emit `generate_lead`. Existing lead labels, category and legacy `value: 1` are
retained for compatibility; this is not an assessed dollar value and adds no currency.

### Historical comparability

The new `bwf_form_start` definition is stricter than the old focus-based event. Segment
new data by `funnel_version`; annotate the eventual release date. Do not add native
`form_start` and custom `bwf_form_start` together as unique people. GA4 enhanced
measurement may still emit its own `form_start` and `form_submit`; this proposal does
not manually send those names or change that account setting.

## GA4 → Google Ads relationship

| Source / destination | Treatment in this proposal |
| --- | --- |
| GA4 property `445397731`, stream tag `G-XZQ389ZLRW` | Receives the explicitly routed funnel events |
| `generate_lead` GA4 → Ads account `213-582-1992` | Keep the existing import and principal action from the audit |
| New diagnostic events | Do not mark as key events or import as Ads conversions |
| Existing `Contato` direct Ads action | Leave account configuration untouched; dated audit says no data |
| Direct `gtag('event', 'conversion', {send_to:'AW-16641705674'})` | Remove from the two proposed form handlers |
| Existing Google Ads base configuration | Preserve; no campaign/account setting change |

Explicit `send_to` avoids routing a form lead to every configured destination. It does
not prove or enforce deduplication of additional UI-created events, Google Tag Manager
rules, connected destinations or other server emitters. Confirm those against the
existing audit/Tag Assistant before release. A generic `event_id` would not be an
exactly-once guarantee for this GA4 event; no such guarantee is claimed.

Use a closed GA4 funnel for visitors who clicked a CTA, and an open funnel for direct
form arrivals; users may legitimately enter at form view. Compare users with users or
sessions with sessions. Break down by page, form and service. Keep attempts, errors,
blocks and confirmed leads distinct. Event-scoped custom dimensions for the named
parameters and a saved exploration are follow-up admin work only after approval.

## Verification already executed

- 37 offline DOM integration tests pass on the actual HTML documents (Node 24,
  jsdom 26.1.0). No third-party scripts or network resources execute in this harness;
  all POSTs and gtag calls are intercepted.
- Covered all CTA entry points, first-field exposure, fallback observation, focus vs
  input, native validation, service mapping, one success/one lead, HTTP/network retry,
  concurrent submit, 24-hour lock/expiry, honeypot, missing/throwing analytics,
  blocked storage, duplicate script loading, and public contact events.
- All inline JavaScript and the shared module parse. There is one module include per
  public page and one `generate_lead` emitter in the shared implementation.
- 8 additional real Chromium 141 tests pass (Playwright 1.56.1): 1365px desktop and
  390px mobile viewports, original GSAP 3.12.5 animations, visible-field detection,
  CTA and keyboard activation, real native validation, HTTP retry, concurrent submit,
  reload and cross-page duplicate protection. No page JavaScript errors were observed.
  Every URL was intercepted; original local HTML/scripts and pinned animation files
  were served from disk, images were placeholders, Google scripts were empty responses,
  and form POSTs were simulated. No live service received test traffic.
- Compared all four HTML files against baseline after removing scripts, comments and
  the added tracking attributes: markup, copy, fields and CSS are unchanged.
- `git diff --check` passes. `netlify.toml` and the unreferenced legacy `main.js` are unchanged.

Total: 45 tests pass. DOM tests explicitly simulate geometry; Chromium tests exercise
real layout. Neither establishes Google delivery, Netlify persistence, Safari behavior
or Ads attribution. Mobile viewport emulation is not an iPhone Safari test.

To reproduce without adding package/build configuration to this static Netlify site:

```sh
npm install --prefix /tmp/bwf-p0-qa --no-audit --no-fund jsdom@26.1.0 playwright@1.56.1 gsap@3.12.5
node /tmp/bwf-p0-qa/node_modules/playwright/cli.js install chromium --only-shell
NODE_PATH=/tmp/bwf-p0-qa/node_modules node --test tests/funnel.test.cjs
NODE_PATH=/tmp/bwf-p0-qa/node_modules node --test tests/browser.test.cjs
node --check bwf-funnel-v1.js
git diff --check
```

## Gates before release approval

1. **Remaining browser QA in an isolated environment:** iPhone Safari and browser-back
   behavior; desktop/mobile Chromium checks above are already completed. Check
   each CTA, keyboard activation, reveal animations, direct `#contact`/`#quote`,
   scrolling away/back, browser back, normal/restricted storage and network failures.
   Require one POST for a double click and one lead per successful POST.
2. **Google delivery QA:** Tag Assistant and a separate test GA4 property / DebugView;
   validate event names, parameters, order and one collection request per intended event.
   Production GA IDs in copied HTML must be replaced or intercepted for testing;
   DebugView alone does not exclude test events from production reports.
3. **Netlify receipt QA:** only on an authorized test site, submit one identifiable
   controlled request per form; reconcile the stored submission and confirmation.
   Check spam classification. HTTP OK alone does not prove a verified lead record
   or notification delivery. No real submissions have been created by this work.
4. **Ads release check:** verify the existing GA4 import remains the intended Primary
   form conversion, diagnostic events are not imported, and no additional rule creates
   a parallel lead. Account settings and actual post-release attribution require an
   explicitly authorized check; no campaign or budget change is part of this PR.
5. **Approve release separately:** review the diff and QA evidence; then explicitly
   authorize merge/deployment. Do not merge or enable auto-merge on this draft.

## Known limits and trade-offs

- The preserved 24-hour lock can block a legitimate second project/correction. P0 now
  measures this; changing that business rule belongs to a separately approved change.
- Client-side guards cover one page plus the existing stored timestamp. They are not
  server idempotency: simultaneous requests in separate tabs/devices and a lost response
  after server acceptance can still create duplicates. Storage denial limits protection
  across reloads. A later server-side design is needed for stronger guarantees.
- Analytics blockers can prevent delivery although the request succeeds. The request
  and confirmation must still work. Client observations cannot guarantee Ads attribution.
- View means first-field exposure, not attention or complete visibility of the whole form.
- The external asset is named `bwf-funnel-v1.js` because existing Netlify JS caching is
  immutable for a year. Future published revisions must change that filename and all
  references; this PR deliberately leaves cache configuration untouched.

## Branch / deployment controls

Branch: `dev/p0-ga4-conversion-funnel`. Target: `main`. Create the PR as draft.
Use `[skip netlify]` in both the commit message and PR title: commit marker skips a
branch deploy; PR-title marker skips Deploy Preview. Draft status alone is insufficient.
No branch ref is pointed at an unmarked intermediate commit. Do not alter Netlify
dashboard settings, production branch, budgets or conversion configuration.

## Primary references

- [Google: route events with send_to](https://developers.google.com/tag-platform/gtagjs/routing)
- [Google: enhanced form measurement](https://support.google.com/analytics/answer/9216061)
- [Google: primary/secondary conversion actions](https://support.google.com/google-ads/answer/11461796)
- [Google: recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Netlify: skip deploys and Deploy Previews](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/#skip-a-deploy)
