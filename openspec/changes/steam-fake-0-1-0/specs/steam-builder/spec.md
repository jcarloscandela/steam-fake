# Spec Delta

## MODIFIED Requirements

### Requirement: Fluent seeding verbs build a scenario

The system SHALL provide chainable seeding verbs to declare the bot identity, user identities, per-app set counts, individual cards, levels, per-user craft badges, and pre-existing pending offers, returning a ready instance at the end.

#### Scenario: Chain seeds into a ready instance

- **WHEN** a test chains bot identity, 2 sets of app `730` for the bot, a friend user, and a level for that user
- **THEN** the built instance exposes exactly that seeded state and is ready to use

#### Scenario: Shorthand sets expand to complete sets

- **WHEN** a test seeds 2 sets of app `730` through the shorthand verb
- **THEN** the instance holds 2 complete 5-card sets of `730`

#### Scenario: Badges seed onto a user

- **WHEN** a test seeds badges `[{ appId: "730", level: 2 }]` for a user
- **THEN** the built instance reports those badges for that user

### Requirement: Failure verbs queue scripted errors

The system SHALL provide verbs to queue one-shot send, fetch, and confirm failures with a machine-readable code, consumed in the order they were queued. Fetch failures MAY carry a `{ userId?, appId? }` scope that restricts which fetches consume them.

#### Scenario: Queue two send failures

- **WHEN** a test queues two send failures and sends three offers
- **THEN** the first two sends report the queued codes in order and the third succeeds

#### Scenario: Confirm failure is scriptable

- **WHEN** a test queues a stale-confirmation failure for the next confirm
- **THEN** the next confirm reports stale and the following confirm resolves

#### Scenario: Scoped fetch failure is scriptable

- **WHEN** a test queues a fetch failure scoped to one user and app
- **THEN** only fetches matching that scope consume it
