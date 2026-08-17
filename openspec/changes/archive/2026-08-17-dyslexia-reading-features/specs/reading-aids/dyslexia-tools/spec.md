## Purpose

Provides text transformation modes — Bionic Reading and Syllable Points — that help users with dyslexia or visual processing differences decode text more efficiently by creating visual fixation anchors and marking syllable boundaries.

## ADDED Requirements

### Requirement: Bionic Reading mode toggle
The system SHALL provide a toggle switch labeled "Lectura Biónica" that enables or disables Bionic Reading mode. When enabled, the first N letters of each word in rendered verse text SHALL be rendered in bold weight while the remaining letters retain normal weight. The value of N SHALL be approximately 40% of the word length (minimum 1 letter for words of 2+ characters, all letters bold for words of 1–2 characters).

#### Scenario: Toggle Bionic Reading on
- **WHEN** the user activates the Bionic Reading toggle
- **THEN** all verse text on the current page re-renders with the first ~40% of each word's characters in bold

#### Scenario: Toggle Bionic Reading off
- **WHEN** the user deactivates the Bionic Reading toggle
- **THEN** all verse text re-renders with uniform font weight (no bold prefix)

#### Scenario: Bionic Reading persists across pages
- **WHEN** the user navigates to a new page or chapter while Bionic Reading is enabled
- **THEN** the new page's verse text is rendered with Bionic Reading applied

### Requirement: Syllable Points mode toggle
The system SHALL provide a toggle switch labeled "Puntos Silábicos" that enables or disables syllable-point display. When enabled, mid-dot characters (·) SHALL be inserted between syllables in Spanish verse text to support phonological decoding.

#### Scenario: Toggle Syllable Points on
- **WHEN** the user activates the Syllable Points toggle
- **THEN** all verse text on the current page re-renders with mid-dot (·) characters inserted at syllable boundaries

#### Scenario: Toggle Syllable Points off
- **WHEN** the user deactivates the Syllable Points toggle
- **THEN** all verse text re-renders without syllable separators

#### Scenario: Syllable segmentation correctness
- **WHEN** Syllable Points mode is active
- **THEN** syllable boundaries in Spanish text SHALL follow standard Spanish phonological syllabification rules (e.g., "gra-cias", "pa-la-bras", "u-ni-ver-so")

### Requirement: Independent mode operation
Bionic Reading and Syllable Points SHALL operate independently. Both can be active simultaneously without conflict.

#### Scenario: Both modes active
- **WHEN** both Bionic Reading and Syllable Points toggles are enabled
- **THEN** verse text displays both bold fixation prefixes and syllable mid-dots

#### Scenario: Only one mode active
- **WHEN** only one mode is enabled
- **THEN** only that mode's transformation is applied to verse text

### Requirement: Settings persistence
The Bionic Reading and Syllable Points toggle states SHALL be persisted in localStorage and restored on app load.

#### Scenario: State persists across sessions
- **WHEN** the user enables Bionic Reading, closes the browser, and reopens the app
- **THEN** Bionic Reading remains enabled

#### Scenario: State persists across tabs
- **WHEN** the user changes toggle state in one tab
- **THEN** other open tabs reflect the updated state
