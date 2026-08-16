# HealthLens — Maestro E2E flows

Maestro test flows for the iOS app. The flows reference `testID` attributes
that are defined on components throughout the app. Run with:

```bash
maestro test .maestro/flows
```

## Flows

### `onboarding-to-main.yaml`
Critical-path smoke test: walks the user through onboarding (health goal →
personal info → personalised plan → paywall → 7-day trial → camera surface).
Asserts the trial CTA navigates back to the main tabs instead of leaving the
user on the paywall screen (regression guard for the navigation reset fix).

### `goal-edit.yaml`
Validates the GoalCard stepper buttons (`profileGoalCalorie-increment`,
`-decrement`) by tapping them twice and confirms the calorie goal input keeps
the expected unit label and the dashboard recalculates after returning to
the Dashboard tab.

## Adding new flows

1. Add `testID` props on every interactive element you need to drive.
2. Prefer `id:` selectors in Maestro (stable across localization changes)
   over `tapOn: "Some Text"`.
3. Commit the new `.yaml` file under `.maestro/flows/`.
