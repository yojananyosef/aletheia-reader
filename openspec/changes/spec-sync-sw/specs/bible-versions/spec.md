## MODIFIED Requirements

### Requirement: PWA cache version-aware

Service worker cache SHALL be `aletheia-v2` and cache `.json` by full URL including `versionId`, using on-demand `cache.put` (no precache of 60M).

#### Scenario: SW caches per version
- **WHEN** `RV1909/GEN.json` fetched
- **THEN** SW caches it under `.../RV1909/GEN.json` distinct from `ONBV/GEN.json`
