## Real-Time Feature Engineering Pipeline

Quantitative models depend on continuous, high-quality feature inputs. In production, features must be computed on live trade and quote streams, matching the historical training feature definitions exactly.

This pipeline leverages distributed message queues to stream trade feeds into a stateful, event-driven feature computation engine. It processes raw tick events to construct sliding-window averages, exponential moving averages, and order flow imbalance statistics. High-efficiency local state caches prevent network round-trips, ensuring feature updates are broadcasted to model runners with minimal jitter.

The system handles input rates exceeding 500k messages/sec, guaranteeing zero-data-loss streaming and sub-millisecond calculation latency.

**Stack:** Go, Apache Kafka, Redis, gRPC, Protobuf.
