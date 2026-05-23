## On Lookahead

Lookahead bias is the quietest way to lose money. It never shows up as a
crash or a stack trace. It shows up as a backtest that is a little too good,
a Sharpe that survives every robustness check you think to run, and then a
live book that bleeds.

The mechanism is always the same: at training time the model sees a number
it could not have seen at the timestamp that number is attached to. A
corporate action restated last week. A bar that closed two minutes after the
decision it informed. A feature joined on the event date instead of the date
it became *knowable*.

The fix is not vigilance. Vigilance fails — there are too many joins. The fix
is to make point-in-time correctness structural: store every value with the
moment it became available, and make as-of joins the only kind of join the
system knows how to do. Then lookahead is not a bug you hunt. It is a state
the system cannot represent.

The discipline is annoying right up until the first time it catches something
you would never have found by reading code.
