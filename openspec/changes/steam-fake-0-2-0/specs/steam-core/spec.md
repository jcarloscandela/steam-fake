# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
