# steam-builder Specification

## Purpose

Exposes the single public imperative API of the library so tests can seed scenarios fluently, script failure sequences, mutate the fake mid-test, and read back what happened for assertions.

## Requirements

### Requirement: Fluent seeding verbs build a scenario

The system SHALL provide chainable seeding verbs to declare the bot identity, user identities, per-app set counts, individual cards, levels, and pre-existing pending offers, returning a ready instance at the end.

#### Scenario: Chain seeds into a ready instance

- **WHEN** a test chains bot identity, 2 sets of app `730` for the bot, a friend user, and a level for that user
- **THEN** the built instance exposes exactly that seeded state and is ready to use

#### Scenario: Shorthand sets expand to complete sets

- **WHEN** a test seeds 2 sets of app `730` through the shorthand verb
- **THEN** the instance holds 2 complete 5-card sets of `730`

### Requirement: Failure verbs queue scripted errors

The system SHALL provide verbs to queue one-shot send, fetch, and confirm failures with a machine-readable code, consumed in the order they were queued.

#### Scenario: Queue two send failures

- **WHEN** a test queues two send failures and sends three offers
- **THEN** the first two sends report the queued codes in order and the third succeeds

#### Scenario: Confirm failure is scriptable

- **WHEN** a test queues a stale-confirmation failure for the next confirm
- **THEN** the next confirm reports stale and the following confirm resolves

### Requirement: Runtime verbs mutate the fake mid-test

The system SHALL provide verbs to replace a user inventory, force-confirm an offer, and expire a pending offer after the instance is built, without rebuilding the scenario.

#### Scenario: Replace inventory mid-test

- **WHEN** a test replaces the partner inventory after an offer was sent
- **THEN** accepting that offer yields the missing-items outcome instead of moving items

#### Scenario: Expire mid-test

- **WHEN** a test expires a pending offer mid-test
- **THEN** that offer becomes terminally expired with inventories unchanged

### Requirement: Read-back verbs expose outcomes for assertions

The system SHALL expose read-back verbs reporting send attempts in order, current offers with their states, inventories per user, and recorded events.

#### Scenario: Assert send attempts

- **WHEN** a test sends two offers after queueing one failure
- **THEN** the read-back reports three attempts with the failure code first and two successes after

#### Scenario: Assert final offer states

- **WHEN** a test accepts one offer and expires another
- **THEN** the read-back reports the first as accepted and the second as expired
