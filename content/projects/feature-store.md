## Point-in-Time Feature Store

The most expensive bug in a trading model is lookahead: a feature that, at
training time, quietly knows something it could not have known at the
timestamp it is attached to. The model learns it, backtests beautifully, and
loses money in production.

This feature store makes point-in-time correctness the default. Every feature
is stored with the timestamp it became *knowable*, and every training-set join
is an as-of join against that timestamp — never the event timestamp. A model
trained through it sees exactly what it would have seen live.

It also memoizes feature computation, so a backtest over five years of data
doesn't recompute the same rolling windows on every run.

**Stack:** Python, DuckDB for the as-of joins, Parquet on disk.
