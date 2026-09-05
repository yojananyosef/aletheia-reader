## MODIFIED Requirements

### Requirement: Service worker cache migration

`CACHE_NAME` SHALL be `aletheia-v2`. On `activate` the worker SHALL delete caches starting with `alethia-` (legacy brand) or `aletheia-v1`, keeping only `aletheia-v2`. When a new worker installs while an older one controls the page, the app SHALL show an update banner (via `sw-update-available`) instead of silently swapping.

#### Scenario: Update cleans old cache
- **WHEN** SW `aletheia-v2` activates in a client cached by `aletheia-v1` or `alethia-v3`
- **THEN** old caches are gone, bible JSON re-caches on demand under `aletheia-v2`, and the banner offers the update
