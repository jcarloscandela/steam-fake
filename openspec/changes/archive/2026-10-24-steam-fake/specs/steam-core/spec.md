# Spec Delta

## Purpose

Provides a neutral, dependency-free in-memory model of Steam trading behavior so integration tests can seed users, inventories, and offers and drive the full offer lifecycle deterministically without network or accounts.

## ADDED Requirements

### Requirement: Seeded identities are retrievable

The system SHALL let tests register fake user identities with an id, admin flag, and friend flag, and retrieve them by id.

#### Scenario: Register and retrieve a user

- **WHEN** a test registers a user with id `buyer-1`, admin false, friend true
- **THEN** retrieving `buyer-1` returns those exact flags

#### Scenario: Unknown user returns nothing

- **WHEN** a test retrieves an id that was never registered
- **THEN** the system reports the user as absent without throwing

### Requirement: Bot inventory holds complete sets per app

The system SHALL let tests seed a bot inventory where requesting N sets of an appId produces N complete 5-card sets for that app.

#### Scenario: Seed two sets of one app

- **WHEN** a test seeds 2 sets of app `730`
- **THEN** the bot inventory contains 10 cards forming exactly 2 complete sets of `730`

#### Scenario: Sets are independent per app

- **WHEN** a test seeds 1 set of app `730` and 1 set of app `440`
- **THEN** each app has exactly 1 complete set and neither affects the other

### Requirement: Sent offers move through an explicit lifecycle

The system SHALL track sent offers through states `Active`, `Accepted`, `Declined`, `InvalidItems`, and `Cancelled`, and accepting an `Active` offer SHALL move the offered items between the bot and partner inventories.

#### Scenario: Accept moves items

- **WHEN** a test sends an offer of 1 set and the partner accepts it while `Active`
- **THEN** the bot inventory decreases by that set and the partner inventory increases by it

#### Scenario: Decline leaves inventories unchanged

- **WHEN** a sent `Active` offer is declined
- **THEN** the offer state becomes `Declined` and both inventories are unchanged

#### Scenario: Missing items yield InvalidItems

- **WHEN** an offer is accepted after its items were removed from the giver inventory
- **THEN** the offer state becomes `InvalidItems` and no items move

### Requirement: Confirmations resolve explicitly

The system SHALL mark offers that need confirmation as pending, resolve them on confirm, and report an already-resolved confirmation as stale instead of failing silently.

#### Scenario: Confirm resolves a pending offer

- **WHEN** a test confirms a pending offer
- **THEN** the offer leaves the pending state exactly once

#### Scenario: Double confirm is stale

- **WHEN** a test confirms an offer that is already resolved
- **THEN** the system reports a stale-confirmation outcome and state is unchanged

### Requirement: Failures are queued and consumed in order

The system SHALL let tests queue send and inventory-fetch failures with a machine-readable code, consume them first-in-first-out on the matching operation, and succeed once the queue is empty.

#### Scenario: Two failures then success

- **WHEN** a test queues two send failures and then sends three offers
- **THEN** the first two sends report the queued codes in order and the third succeeds

#### Scenario: Failure queues are isolated per operation

- **WHEN** a test queues a fetch failure
- **THEN** send operations are unaffected and still succeed

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
