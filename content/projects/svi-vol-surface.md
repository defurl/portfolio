## No-Arbitrage Vol Surface

Equity options desks quote a few dozen strikes per expiry. Pricing anything
in between — or stress-testing a book — needs the whole surface, and a naive
interpolation will quietly produce arbitrage: negative densities, calendar
spreads that pay you to wait.

This fits Gatheral's SVI parameterization per expiry, then enforces the
no-arbitrage conditions as hard constraints in the solve rather than checking
them after the fact. Butterfly arbitrage is ruled out by keeping each slice's
density non-negative; calendar arbitrage by keeping total variance monotone
in maturity.

The fit runs in roughly 2ms for a full surface, so it sits comfortably inside
a pricing loop rather than a nightly batch.

**Stack:** Python, NumPy, a hand-rolled SLSQP wrapper, SVI.
