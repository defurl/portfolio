## Limit-Order-Book Execution Sim

A strategy's paper P&L is a lie if the backtest assumes you always get filled
at the touch. Real fills depend on where you sit in the queue and how much
volume trades ahead of you.

This replays Level-2 order-book data tick by tick and tracks a simulated
order's queue position explicitly — every cancel ahead of it, every partial
fill, every price level it has to re-join. The output is a fill-probability
and slippage estimate that holds up when the strategy goes live.

Built it after a market-making idea that looked profitable in a touch-fill
backtest and was flat-to-negative once queue dynamics were honest.

**Stack:** Rust core for the replay loop, Python bindings for analysis.
