# steam-core Specification

## Purpose

Provides a neutral, dependency-free in-memory model of Steam trading behavior so integration tests can seed users, inventories, and offers and drive the full offer lifecycle deterministically without network or accounts.

## Requirements

### Requirement: Seeded identities are retrievable

The system SHALL let tests register fake user identities with an id, admin flag, and friend flag, retrieve them by id, and read per-user craft badges as `{ appId, level }` pairs seeded through the builder.

#### Scenario: Register and retrieve a user

- **WHEN** a test registers a user with id `buyer-1`, admin false, friend true
- **THEN** retrieving `buyer-1` returns those exact flags

#### Scenario: Unknown user returns nothing

- **WHEN** a test retrieves an id that was never registered
- **THEN** the system reports the user as absent without throwing

#### Scenario: Seeded badges are retrievable

- **WHEN** a test seeds badges `[{ appId: "730", level: 3 }]` for `buyer-1`
- **THEN** retrieving `buyer-1` returns those badges alongside the existing flags

### Requirement: Bot inventory holds complete sets per app

The system SHALL let tests seed a bot inventory where requesting N sets of an appId produces N complete 5-card sets for that app.

#### Scenario: Seed two sets of one app

- **WHEN** a test seeds 2 sets of app `730`
- **THEN** the bot inventory contains 10 cards forming exactly 2 complete sets of `730`

#### Scenario: Sets are independent per app

- **WHEN** a test seeds 1 set of app `730` and 1 set of app `440`
- **THEN** each app has exactly 1 complete set and neither affects the other

### Requirement: Sent offers move through an explicit lifecycle

The system SHALL track sent offers through states `Active`, `Accepted`, `Declined`, `InvalidItems`, `Cancelled`, and `InEscrow`. Accepting an `Active` offer SHALL move the offered items between the bot and partner inventories. Holding an `Active` offer SHALL move items identically and land in terminal `InEscrow`.

#### Scenario: Accept moves items

- **WHEN** a test sends an offer of 1 set and the partner accepts it while `Active`
- **THEN** the bot inventory decreases by that set and the partner inventory increases by it

#### Scenario: Decline leaves inventories unchanged

- **WHEN** a sent `Active` offer is declined
- **THEN** the offer state becomes `Declined` and both inventories are unchanged

#### Scenario: Missing items yield InvalidItems

- **WHEN** an offer is accepted after its items were removed from the giver inventory
- **THEN** the offer state becomes `InvalidItems` and no items move

#### Scenario: Hold moves items into escrow

- **WHEN** a test holds an `Active` offer whose items are still present
- **THEN** the offer state becomes `InEscrow` and inventories change exactly as on accept

#### Scenario: Escrow is terminal

- **WHEN** a test accepts, declines, cancels, or expires an `InEscrow` offer
- **THEN** the system rejects the transition because the offer is no longer active

### Requirement: Confirmations resolve explicitly

The system SHALL mark offers that need confirmation as pending, resolve them on confirm, and report an already-resolved confirmation as stale instead of failing silently.

#### Scenario: Confirm resolves a pending offer

- **WHEN** a test confirms a pending offer
- **THEN** the offer leaves the pending state exactly once

#### Scenario: Double confirm is stale

- **WHEN** a test confirms an offer that is already resolved
- **THEN** the system reports a stale-confirmation outcome and state is unchanged

### Requirement: Failures are queued and consumed in order

The system SHALL let tests queue send and inventory-fetch failures with a machine-readable code, consume them first-in-first-out on the matching operation, and succeed once the queue is empty. Fetch failures MAY carry a `{ userId?, appId? }` scope; on fetch, the first queued failure in insertion order whose scope matches wins, and unscoped entries match every fetch. When a queued failure fires, queued latency is left untouched.

#### Scenario: Two failures then success

- **WHEN** a test queues two send failures and then sends three offers
- **THEN** the first two sends report the queued codes in order and the third succeeds

#### Scenario: Failure queues are isolated per operation

- **WHEN** a test queues a fetch failure
- **THEN** send operations are unaffected and still succeed

#### Scenario: Scoped fetch failure only hits its scope

- **WHEN** a test queues a fetch failure scoped to user `buyer-1` and app `730`
- **THEN** fetching `buyer-1`/`730` reports the queued code while fetching another user or app succeeds and leaves the queued failure in place

### Requirement: Scripted latency is reported, never slept

The system SHALL let tests queue millisecond latencies per operation (send, fetch, confirm), consume at most one per operation attempt in queue order, and report the consumed milliseconds synchronously without waiting. Fetch latencies MAY carry a `{ userId?, appId? }` scope with the same match rule as fetch failures.

#### Scenario: Slow fetch reports its latency

- **WHEN** a test queues 1500ms of fetch latency and fetches an inventory
- **THEN** the result reports `latencyMs: 1500`, the recorded event carries `1500`, and the call returns immediately

#### Scenario: No queued latency reports zero

- **WHEN** a test sends an offer with an empty latency queue
- **THEN** the result reports `latencyMs: 0`

#### Scenario: Fired failure leaves latency queued

- **WHEN** a test queues both a fetch failure and fetch latency, then fetches
- **THEN** the fetch reports the failure code and a subsequent successful fetch still reports the queued latency

### Requirement: Asset identifiers are deterministic

The system SHALL derive asset identifiers deterministically from appId, class, and sequence number so identical seeds always produce identical inventories.

#### Scenario: Same seed reproduces inventory

- **WHEN** two fresh instances are seeded with 2 sets of app `730`
- **THEN** both inventories contain identical asset identifiers in identical order

### Requirement: Pending offers can be expired manually

The system SHALL let tests expire a pending `Active` offer on demand, moving it to a terminal expired state without moving items.

#### Scenario: Expire a pending offer

- **WHEN** a test expires an `Active` offer
- **THEN** the offer becomes terminally expired and both inventories are unchanged
