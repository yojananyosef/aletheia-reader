## Purpose

Provides adjustable letter-spacing and line-height settings with a restore-defaults mechanism, allowing users to fine-tune typography for their visual comfort and return to recommended defaults in one action.

## ADDED Requirements

### Requirement: Adjustable letter-spacing setting
The system SHALL expose a `letterSpacing` setting (in `em` units) with a range of 0.0em to 0.1em, defaulting to 0.02em. The setting SHALL be controllable via a slider in the reader settings panel.

#### Scenario: Adjust letter-spacing via slider
- **WHEN** the user moves the letter-spacing slider
- **THEN** the displayed letter-spacing value updates in real-time and the reading canvas applies the new `letter-spacing` CSS property immediately

#### Scenario: Letter-spacing persists
- **WHEN** the user sets letter-spacing to 0.06em and navigates to a new chapter
- **THEN** the letter-spacing of 0.06em is applied to the new chapter's text

### Requirement: Extended line-height range
The system SHALL support a line-height range of 1.2 to 2.5 (previously 1.4 to 2.0), defaulting to 1.6. The slider SHALL continue to use 0.1 step increments.

#### Scenario: Adjust line-height outside previous range
- **WHEN** the user moves the line-height slider to 1.3 or 2.2
- **THEN** the reading canvas applies the new `line-height` value and the setting persists

### Requirement: Restore defaults button
The system SHALL provide a "Restaurar valores" button that resets all typography-related settings to their recommended defaults in one action.

#### Scenario: Restore defaults resets typography
- **WHEN** the user clicks the restore defaults button
- **THEN** fontSize resets to 18px, lineHeight resets to 1.6, letterSpacing resets to 0.02em, fontWeight resets to 400, and both Bionic Reading and Syllable Points toggles turn off

#### Scenario: Restore defaults persists
- **WHEN** the user clicks restore defaults and refreshes the page
- **THEN** the settings remain at the restored defaults

### Requirement: Backward-compatible settings migration
The system SHALL handle existing users who have no `letterSpacing`, `bionicReading`, or `phoneticDots` keys in localStorage. Missing keys SHALL default to the recommended values (0.02em, false, false respectively).

#### Scenario: Existing user loads app after update
- **WHEN** a user with existing localStorage settings (no `letterSpacing` key) opens the app
- **THEN** `letterSpacing` defaults to 0.02em without overwriting their existing fontSize/lineHeight settings

### Requirement: Settings UI layout
The settings panel SHALL display typography controls in the following order: Font Size, Line Height, Letter Spacing, followed by a visual separator, then Bionic Reading toggle, Syllable Points toggle, and finally the Restore Defaults button.

#### Scenario: Settings panel renders all controls
- **WHEN** the user opens the reader settings panel
- **THEN** all typography sliders, dyslexia toggles, and the restore button are visible and functional
