# Typewright website audit JSON

Contract for the report this plugin reads from `POST /api/audit`. The plugin does not score a site. It copies `score`, `passed`, `total`, `couldnt`, and `couldnt_check` exactly as returned, and it copies each check's verdict, finding, and sources. It does not invent a check.

The public form at https://typewrightstudio.com/audit/ is a separate page. This plugin does not call it.

## Request

`POST https://typewrightstudio.com/api/audit?source=plugin`

`Content-Type: application/json`

```json
{
  "url": "example.com",
  "source": "plugin",
  "include_cta": true
}
```

| Field | Rule |
| --- | --- |
| `url` | Required string. The address as submitted, with or without `https://`. |
| `source` | The query parameter and the JSON field are both the exact string `plugin`. The plugin sends both on every request. |
| `include_cta` | Boolean from `TYPEWRIGHT_AUDIT_INCLUDE_CTA`. Default `true`. `false`, `0`, or `no` sends `false`. |

`TYPEWRIGHT_AUDIT_ENDPOINT` overrides the full audit URL. The plugin still adds `source=plugin`.

## Success, HTTP 200

```json
{
  "url": "https://example.com/",
  "final_url": "https://www.example.com/",
  "score": 14,
  "passed": 14,
  "total": 20,
  "couldnt": 1,
  "couldnt_check": 1,
  "js_heavy": false,
  "speed_source": "pagespeed",
  "groups": [
    { "name": "Speed", "soft": false, "ids": ["speed_score"] }
  ],
  "checks": [
    {
      "id": "speed_score",
      "label": "Mobile speed score",
      "verdict": "pass",
      "finding": "Google's mobile performance score is 90/100.",
      "source": "S2",
      "citations": [
        {
          "name": "Chrome for Developers: Lighthouse performance scoring",
          "url": "https://developer.chrome.com/docs/lighthouse/performance/performance-scoring"
        }
      ]
    }
  ],
  "citations": {
    "S2": {
      "name": "Chrome for Developers: Lighthouse performance scoring",
      "url": "https://developer.chrome.com/docs/lighthouse/performance/performance-scoring"
    }
  },
  "disclaimer": "Automated check of one page and a few linked pages; not a full review.",
  "scoring": "Score is out of 20. A check we couldn't run counts as not passed.",
  "cta": {
    "text": "Want help fixing these? Start a project",
    "url": "https://typewrightstudio.com/#contact"
  }
}
```

| Field | Meaning |
| --- | --- |
| `url` | Address the service normalized. |
| `final_url` | Address after redirects. |
| `score` | Integer score, returned as-is. The service currently scores out of 20. |
| `passed` | Integer count of scored checks that passed, returned as-is. |
| `total` | Integer denominator, returned as-is. Currently 20. |
| `couldnt` | Integer count of scored checks that could not be run, returned as-is. |
| `couldnt_check` | Same count under the service's second field name, returned as-is. |
| `js_heavy` | Boolean. |
| `speed_source` | Non-empty string. `pagespeed` when the speed numbers came from Google PageSpeed. |
| `groups` | `{ "name", "soft", "ids" }` in service order. `ids` lists check ids. `soft` is true only for notes that are not scored. Every check id appears in exactly one group. |
| `checks` | One object per check. |
| `citations` | Shared source catalog. Keys are source ids such as `S2`. Each value is `{ "name", "url" }`. |
| `disclaimer` | Service wording. Show it unchanged. |
| `scoring` | Service wording for how the score works. Show it unchanged. |
| `cta` | Optional `{ "text", "url" }`. Absent when `include_cta` is false. The plugin does not add one. |

### Each check

| Field | Meaning |
| --- | --- |
| `id` | Stable check id. |
| `label` | Short name. |
| `verdict` | `pass`, `needs_work`, `couldnt_check`, or `info`. |
| `finding` | Plain-English result. |
| `source` | Source id, or several ids separated by commas (for example `S4,S9`). |
| `citations` | The cited sources for this check. Each item is `{ "name", "url" }`. |

`info` checks are notes and are not part of the score. A `couldnt_check` verdict counts as not passed. Say so with the returned finding. Do not recompute `score`, `passed`, or `total` from the checks.

## Errors

Any status other than 200 is an error. The body is JSON `{ "error", "message" }` when the service can say why. The plugin shows that code and message and does not show checks.

```json
{ "error": "bad_url", "message": "Please enter a website address, like example.com." }
```

```json
{ "error": "blocked", "message": "That address points to a private or local network, so it can't be checked." }
```

A network failure, a non-JSON body, or a 200 body that is not the report above is also an error. No check results are shown.

## Privacy

The submitted URL is sent to typewrightstudio.com, which fetches that page. The speed check sends the address to Google PageSpeed. Neither the URL nor the results are stored.

- Privacy policy: https://typewrightstudio.com/privacy/
- Terms: https://typewrightstudio.com/terms/
