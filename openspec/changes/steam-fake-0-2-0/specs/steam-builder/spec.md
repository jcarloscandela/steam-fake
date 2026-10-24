# Spec Delta

## ADDED Requirements

### Requirement: Latency verbs script slow responses

The system SHALL provide verbs to queue one-shot millisecond latencies per operation, consumed in the order they were queued. Fetch latencies MAY carry a `{ userId?, appId? }` scope that restricts which fetches consume them.

#### Scenario: Slow the next fetch once

- **WHEN** a test scripts 1500ms of fetch latency and fetches twice
- **THEN** the first fetch reports `latencyMs: 1500` and the second reports `latencyMs: 0`

#### Scenario: Scoped fetch latency is scriptable

- **WHEN** a test scripts fetch latency scoped to one user and app
- **THEN** only fetches matching that scope consume it
