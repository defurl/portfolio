## High-Frequency Limit Order Simulator

Most backtesters treat order executions naively by assuming fills occur instantly at the bid or ask. In high-frequency trading, order queue priority and execution latency dictate actual strategy profitability.

This simulator models the full limit order book dynamics, tracking individual order queue positions at microsecond resolution. It processes Level 2 message feeds to account for order cancellations, queue depletion, and execution latency. The simulation captures queue position degradation and market impact to estimate realistic fill profiles.

The engine handles millions of book updates per second, providing strategy developers with high-fidelity execution estimations before deploying to production venues.

**Stack:** Rust, FlatBuffers, PyO3 bindings, Level 2 Market Data.
