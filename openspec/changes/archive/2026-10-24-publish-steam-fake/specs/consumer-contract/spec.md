# Spec Delta

## Purpose

Guarantees a stable neutral contract for integration-test consumers such as steam-cards-bot, stating exactly what the library promises and what it leaves to consumer-side adapters.

## ADDED Requirements

### Requirement: Barrel-only public surface

The system SHALL expose every public symbol from the `steam-fake` barrel and support no deep imports, so consumers cannot couple to internal paths.

#### Scenario: Deep import is unsupported

- **WHEN** a consumer imports `steam-fake/dist/core/fakeSteamCore.js`
- **THEN** documentation states it is unsupported and may break without a version signal

### Requirement: Neutral synchronous deterministic behaviour

The system SHALL stay dependency-free, synchronous, and deterministic (identical seeds yield identical asset ids), with no network, clock, or consumer-specific types.

#### Scenario: Parallel tests stay isolated

- **WHEN** two tests build separate instances with the same seed
- **THEN** both observe identical inventories and neither observes the other's mutations

### Requirement: Non-goals are explicit

The system SHALL document as non-goals login and cookies, badges and levels service, market pricing, gems, polling and recovery, and async Steam-shaped types, directing consumers to implement those in their own adapter.

#### Scenario: Bot adapter boundary is clear

- **WHEN** a `steam-cards-bot` test needs `ISteamSessionService` or `ITradeOfferManagerService`
- **THEN** the docs point to a consumer-side async adapter that wraps the sync fake instead of expecting it from the library

### Requirement: README examples cannot drift

The system SHALL keep every README TypeScript snippet executed verbatim by tests so documentation and behaviour stay in sync.

#### Scenario: Drifted snippet fails CI

- **WHEN** a README snippet diverges from the library API
- **THEN** the readme test suite fails before release
