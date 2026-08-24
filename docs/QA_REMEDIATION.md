# Bagriya FitFam QA remediation

Implemented after three independent 30-day QA journeys on 24 August 2026.

## Fixed

- Blocked authenticated navigation while server state hydrates.
- Forced a fresh account pull after password login, preventing stale local state from
  overwriting a newly signed-in family member's plan.
- Added regression coverage for forced hydration and dirty local-state preservation.
- Added Saving, Saved, and retry feedback for account synchronization.
- Removed the repeated weight-confirmation sheet after every weighted exercise. Completed
  set weights remain the source of truth and the heaviest completed set is saved at workout end.
- Stopped describing a zero-kilogram barbell session as bodyweight progression.
- Added accessible names to routine names, exercise search, workout numeric fields,
  increment/decrement controls, sliders, and set-completion checkboxes.
- Added live-region semantics to toast and synchronization feedback.
- Added an obvious Done action to the exercise picker and close it after an exercise is chosen.
- Renamed the unclear Chosen filter to Previously used and explained its marker.
- Marked custom-exercise name and body part as required and disabled creation until valid.
- Added a visible routine-title editing affordance.
- Added password visibility and administrator-reset guidance.
- Repositioned short-screen login feedback so it does not overlap the primary action.
- Added finite-number guards so malformed imported values render as an em dash instead of NaN.
- Added a global reduced-motion mode while retaining existing lightweight view, sheet, and
  progress transitions.

## Validation

- Frontend: 348 tests passed across 23 files.
- API: 5 tests passed.
- Production Vite build completed successfully.
- Exercise media remains served locally from 1,324 JPG and 1,324 GIF files.

## Optional later enhancements

- Self-host a small licensed Lottie asset for workout-complete and 7/30-day milestones.
- Prototype a lazy-loaded, static-fallback 3D FitFam emblem only for major celebrations.
- Code-split large translated exercise-instruction bundles before the Oracle deployment.
