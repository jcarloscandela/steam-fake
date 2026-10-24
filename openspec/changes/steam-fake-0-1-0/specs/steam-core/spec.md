# Spec Delta

## MODIFIED Requirements

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

### Requirement: Failures are queued and consumed in order

The system SHALL let tests queue send and inventory-fetch failures with a machine-readable code, consume them first-in-first-out on the matching operation, and succeed once the queue is empty. Fetch failures MAY carry a `{ userId?, appId? }` scope; on fetch, the first queued failure in insertion order whose scope matches wins, and unscoped entries match every fetch.

#### Scenario: Two failures then success

- **WHEN** a test queues two send failures and then sends three offers
- **THEN** the first two sends report the queued codes in order and the third succeeds

#### Scenario: Failure queues are isolated per operation

- **WHEN** a test queues a fetch failure
- **THEN** send operations are unaffected and still succeed

#### Scenario: Scoped fetch failure only hits its scope

- **WHEN** a test queues a fetch failure scoped to user `buyer-1` and app `730`
- **THEN** fetching `buyer-1`/`730` reports the queued code while fetching another user or app succeeds and leaves the queued failure in place
