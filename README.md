# CrudeAI Terminal

Build a complete, premium, production-quality FRONTEND-ONLY trading platform UI called CrudeAI.

IMPORTANT:
This phase is UI/UX and interaction only.

Do NOT build real broker API integration.
Do NOT execute real trades.
Do NOT require real market data APIs.
Do NOT build the actual ML model yet.

Instead, build the entire application with realistic MOCK market data, mock AI predictions, mock orders, mock P&L and mock strategy results so that every button and user flow works visually and interactively.

The future backend will be:

* Python
* FastAPI
* XGBoost/ML prediction engine
* Supabase
* Broker API
* WebSockets
* Linux VPS

Design the frontend so it can later connect to these APIs without redesigning the UI.

==================================================

1. PRODUCT
   ==================================================

Product name:

CrudeAI

Tagline:

"Predict the next move. Validate the strategy. Trade with discipline."

Primary market:

MCX Crude Oil Futures

Primary timeframe:

5 Minutes

The product is an AI-powered probabilistic market-analysis and automated-strategy platform.

Core concept:

LIVE CANDLE
↓
AI NEXT-CANDLE PREDICTION
↓
STRATEGY CONFIRMATION
↓
TRADE SETUP
↓
PAPER / AUTO EXECUTION
↓
ACTUAL CANDLE
↓
COMPARE PREDICTION VS ACTUAL
↓
LEARN FROM RESULT

The UI must communicate that predictions are probabilistic and NOT guaranteed.

==================================================
2. DESIGN DIRECTION
===================

Create a sophisticated professional quantitative trading terminal.

DO NOT make it look like:

* a generic SaaS dashboard
* a crypto meme website
* a beginner trading app
* a flashy AI landing page
* a casino
* a neon gaming interface

Use:

* near-black / charcoal background
* white and soft-gray typography
* restrained green for bullish
* restrained red for bearish
* amber/yellow for warnings
* subtle borders
* glass-like panels only where useful
* compact data-dense layouts
* professional financial terminal aesthetics
* smooth micro-interactions
* subtle motion
* excellent spacing
* clean typography

The interface should feel like:

Bloomberg Terminal + TradingView + modern AI product.

Do not overuse gradients.

Do not use excessive rounded cards.

Use rounded corners moderately.

Charts must be the visual focus.

==================================================
3. AUTHENTICATION FLOW
======================

Create a complete frontend authentication experience.

Routes:

/
/login
/signup
/forgot-password
/reset-password
/verify-email
/dashboard

Landing page:

Hero:

"Predict the next move before the candle closes."

Subtitle:

"AI-powered probabilistic analysis for MCX Crude Oil Futures with real-time strategy validation and automated paper trading."

Buttons:

"Get Started"
"View Demo"

Login:

Email
Password
Remember me
Forgot password
Login

Signup:

Full name
Email
Password
Confirm password
Accept terms

After login:

Redirect to /dashboard

Create a mock authenticated state using local storage/context.

Architecture should later be replaceable with Supabase Auth.

==================================================
4. LANDING PAGE
===============

Create an impressive landing page.

Hero:

CrudeAI

"Predict the next move.
Validate it against reality."

Animated background:
Very subtle moving market-grid / candle visualization.

Hero CTA:
Get Started

Secondary:
Explore Dashboard

Show a miniature fake live chart with:

AI Prediction
73% confidence
Next candle: UP

Sections:

01 — AI Next Candle
02 — Strategy Engine
03 — Auto Trading
04 — Prediction Accuracy
05 — Backtesting
06 — Risk Management

Disclaimer near bottom:

"CrudeAI provides probabilistic market analysis and simulated trading tools. It does not guarantee profits and is not financial advice."

==================================================
5. APP SHELL
============

After login create:

LEFT SIDEBAR

CrudeAI logo

Navigation:

Overview
Live Terminal
AI Predictions
Watchlist
Strategies
Auto Trading
Orders
Positions
Trade History
Backtesting
Performance
Alerts
Settings

Bottom:

Paper Trading badge
User profile
Logout

Top header:

MCX CRUDE OIL
LIVE

Current price
Change
Market status
Connection status
Notifications
User avatar

==================================================
6. DASHBOARD OVERVIEW
=====================

Dashboard should immediately answer:

"What is happening now?"

Top KPI cards:

Crude Oil Price
Daily Change
AI Direction
AI Confidence
Strategy Status
Today's P&L

Example:

CRUDE OIL
₹6,842.00
+1.24%

AI DIRECTION
UP
73%

STRATEGY
LONG BIAS

TODAY'S P&L
+₹1,240

Use MOCK DATA ONLY.

Make data dynamically change periodically to simulate a live market.

==================================================
7. MAIN LIVE TERMINAL
=====================

This is the MOST IMPORTANT SCREEN.

Layout:

LEFT:
Watchlist

CENTER:
Large candlestick chart

RIGHT:
AI + Strategy panel

BOTTOM:
Order / position / prediction timeline

==================================================
8. WATCHLIST
============

Create watchlist panel.

Example:

⭐ CRUDEOIL
₹6,842
+1.24%

GOLD
₹72,430
+0.42%

NIFTY
25,240
+0.31%

Allow:

* Add symbol
* Remove symbol
* Search
* Star
* Drag/reorder

Persist mock watchlist using localStorage.

For MVP highlight:

MCX CRUDE OIL

==================================================
9. LIVE CANDLE CHART
====================

Use a professional candlestick chart.

Prefer Lightweight Charts if available.

Create realistic mock OHLC data.

Chart controls:

1m
3m
5m
15m
30m
1H

Default:

5m

Chart overlays:

EMA 9
EMA 21
EMA 50
VWAP
Support
Resistance

Volume below chart.

Add toggle controls:

☑ EMA 9
☑ EMA 21
☑ EMA 50
☑ VWAP
☑ Volume
☑ AI Prediction
☑ Strategy Zones

==================================================
10. AI NEXT-CANDLE PREDICTION
=============================

This is the core visual feature.

At the latest candle, display a visually distinct FUTURE/PREDICTED candle.

It must NOT look identical to actual candles.

Use:

* semi-transparent body
* dashed outline
* AI glow
* arrow
* "AI PREDICTION" label

Example:

CURRENT CANDLE
↓
🕯️
↓
AI PREDICTED CANDLE
↓
🟢 UP

Panel:

NEXT CANDLE

UP

73% CONFIDENCE

UP probability
73%

DOWN probability
27%

Expected range:
₹6,840 – ₹6,858

Prediction timestamp:
10:25:00

Model:
XGB v1

==================================================
11. PREDICTION VS ACTUAL
========================

This is a UNIQUE CORE FEATURE.

When the mock next candle closes:

Move the predicted candle into historical data.

Then display:

AI PREDICTION
UP

ACTUAL
UP

RESULT
✓ CORRECT

or:

AI PREDICTION
UP

ACTUAL
DOWN

RESULT
✕ WRONG

Show a small marker on the chart.

Clicking it opens:

Prediction Details

Prediction:
UP

Confidence:
73%

Actual:
DOWN

Result:
WRONG

Model:
XGB v1

Prediction timestamp:
10:25:00

Actual candle:
10:30:00

IMPORTANT:

Predictions must never visually repaint.

Once a prediction becomes historical, lock it.

==================================================
12. AI REASONING PANEL
======================

Show why the AI predicted the next candle.

Example:

AI ANALYSIS

Trend
Bullish ✓

EMA Structure
Bullish ✓

VWAP
Above ✓

RSI
64 ✓

MACD
Positive ✓

Volume
Strong ✓

Open Interest
Supportive ✓

Market Structure
Bullish ✓

Overall:

7 / 8 confirmations

AI:
UP

73%

Make these values dynamically change with mock data.

==================================================
13. STRATEGY ENGINE
===================

Create a Strategy panel.

Strategy:

"CrudeAI Momentum + Confirmation"

Conditions:

AI confidence >= 70%

AND

EMA 9 > EMA 21

AND

Price > VWAP

AND

RSI confirms momentum

AND

Volume above average

AND

OI confirmation

AND

Risk/Reward >= 1:2

If all conditions pass:

LONG SETUP

If opposite:

SHORT SETUP

If conditions conflict:

NO TRADE

Show each condition individually.

Example:

✓ AI confidence 73%
✓ EMA bullish
✓ VWAP bullish
✓ RSI bullish
✓ Volume strong
✓ OI supportive
✓ R:R 1:2.3

STRATEGY:

LONG

==================================================
14. ENTRY / SL / TARGET
=======================

Strategy panel should calculate/display:

Entry zone
Stop loss
Target 1
Target 2
Risk/Reward

Example:

ENTRY
₹6,842–₹6,846

STOP LOSS
₹6,826

TARGET 1
₹6,874

TARGET 2
₹6,892

R:R
1 : 2.8

Add buttons:

"Create Order"

"Set Alert"

"Ignore Setup"

==================================================
15. NO TRADE STATE
==================

This is extremely important.

Do not force trades.

If conditions fail:

NO TRADE

Show reason:

"AI is bullish, but volume confirmation is weak and resistance is too close."

Button:

"View Conditions"

==================================================
16. AUTO TRADING PAGE
=====================

Create a complete Auto Trading interface.

IMPORTANT:

This is SIMULATION/PAPER TRADING ONLY.

Page title:

AUTO TRADING

Status:

● PAPER MODE

Large toggle:

AUTO TRADING
OFF / ON

When OFF:

"Strategy is monitoring the market but will not create simulated orders."

When ON:

"Strategy will automatically create PAPER orders when all conditions are satisfied."

Settings:

Strategy:
CrudeAI Momentum

Instrument:
MCX CRUDE OIL

Timeframe:
5m

Minimum AI confidence:
70%

Minimum Risk/Reward:
1:2

Max trades per day:
3

Max daily loss:
₹1,000

Position size:
1 lot

Trailing stop:
ON/OFF

Cooldown after loss:
15 minutes

Require confirmation:
ON/OFF

==================================================
17. AUTO BUY / AUTO SELL SIMULATION
===================================

When strategy triggers:

Show:

AUTO TRADE TRIGGERED

LONG

Reason:

AI:
74%

Trend:
Bullish

VWAP:
Bullish

Volume:
Strong

OI:
Supportive

Entry:
₹6,844

SL:
₹6,828

Target:
₹6,880

Then create a simulated order.

For short:

AUTO TRADE TRIGGERED

SHORT

Show the inverse logic.

Never connect to a real broker.

==================================================
18. ORDER PANEL
===============

Create:

BUY
SELL

buttons.

Order form:

Instrument
Order type
Quantity
Entry
Stop Loss
Target

Buttons:

BUY / LONG

SELL / SHORT

CANCEL

Since this is mock mode:

Every order is simulated.

==================================================
19. POSITIONS
=============

Show open simulated positions.

Example:

MCX CRUDE OIL

LONG
1 LOT

Entry:
₹6,844

LTP:
₹6,858

P&L:
+₹700

SL:
₹6,828

Target:
₹6,880

Buttons:

Close Position
Modify SL
Modify Target

==================================================
20. TRADE HISTORY
=================

Create trade-history table.

Columns:

Time
Instrument
Side
Entry
Exit
SL
Target
P&L
Strategy
Reason
Status

Filters:

Today
7 Days
30 Days

Side:
Long
Short

Result:
Win
Loss

==================================================
21. PERFORMANCE PAGE
====================

Create analytics dashboard.

Cards:

Total Trades
Win Rate
Profit Factor
Net P&L
Average Win
Average Loss
Max Drawdown
Average R:R

Charts:

Cumulative P&L
Win/Loss distribution
Prediction accuracy
Confidence vs actual accuracy
Daily performance

Also show:

AI PREDICTION PERFORMANCE

Total predictions:
1,842

Correct:
1,163

Wrong:
679

Accuracy:
63.14%

Confidence buckets:

60–65%
65–70%
70–75%
75–80%
80%+

Make the charts interactive.

==================================================
22. PREDICTION HISTORY
======================

Create detailed prediction-history page.

Columns:

Timestamp
Direction
Confidence
Actual
Result
Move
Strategy
Model

Example:

10:25
UP
73%
UP
✓
+0.18%
LONG
XGB v1

10:30
DOWN
68%
UP
✕
-0.07%
NO TRADE
XGB v1

Click a row to open detailed prediction analysis.

==================================================
23. BACKTESTING PAGE
====================

Create an attractive backtesting interface.

Inputs:

Instrument
Timeframe
Start Date
End Date
Strategy
Confidence threshold
Risk/Reward
Position size

Button:

RUN BACKTEST

After clicking, show animated progress.

Then:

BACKTEST COMPLETE

Trades:
1,284

Win rate:
61.7%

Profit factor:
1.74

Net simulated P&L:
₹84,200

Max drawdown:
-8.4%

Average R:R:
1:2.1

Clearly label:

SIMULATED HISTORICAL RESULTS

==================================================
24. ALERTS
==========

Create alerts center.

Types:

AI Prediction
Long Setup
Short Setup
Target
Stop Loss
Auto Trade
Prediction Result

Allow:

Create alert
Delete alert
Enable/disable alert

Example:

"Alert me when CrudeAI confidence exceeds 75%."

==================================================
25. SETTINGS
============

Sections:

Account
Trading
Strategy
Risk
Notifications
Chart
Appearance

Risk settings:

Max daily loss
Max trades/day
Position size
Max simultaneous positions

Trading mode:

PAPER TRADING

Show:

"Live broker execution is disabled in this prototype."

==================================================
26. TOP-LEVEL MODE SWITCHER
===========================

Create a highly visible mode switch:

PAPER
LIVE

Default:

PAPER

If user clicks LIVE:

Show confirmation modal:

"Live trading requires a connected broker and real-money execution can result in financial loss."

For this prototype:

LIVE MODE MUST REMAIN DISABLED.

Display:

"Coming when broker integration is connected."

==================================================
27. MICRO-INTERACTIONS
======================

Add subtle animations:

* Candle updates
* Price tick changes
* Prediction appearing
* Confidence meter
* Signal transitions
* Order creation
* Position P&L changes
* Toast notifications
* Sidebar transitions
* Modal transitions

Do NOT animate everything.

Animations should feel like a professional financial terminal.

==================================================
28. MOCK LIVE ENGINE
====================

Since there is no backend yet, create a frontend mock market engine.

It should:

* update price periodically
* update candles
* update volume
* update OI
* update indicators
* change prediction
* change confidence
* simulate next candle
* settle predictions
* generate simulated trades
* update P&L

Use deterministic/randomized mock data that looks realistic.

Do NOT claim the data is real.

Display:

"SIMULATION"

in the interface.

==================================================
29. IMPORTANT DATA FLOW
=======================

Implement the frontend architecture as if backend APIs will later replace the mock engine.

Create service interfaces such as:

marketDataService
predictionService
strategyService
orderService
portfolioService
backtestService

Initially these services return mock data.

Later they can be replaced with:

FastAPI
WebSockets
Supabase
Broker API

Do not tightly couple UI components directly to mock data.

==================================================
30. SUPABASE-READY AUTH
=======================

Structure the authentication context so it can later be connected to:

Supabase Auth

For now:

Mock login/signup.

Store a mock user session.

Example user:

name:
Tirth

email:
[user@example.com](mailto:user@example.com)

Do not hard-code this as a production credential.

==================================================
31. DATABASE-READY STRUCTURE
============================

Create TypeScript interfaces/types for:

User
WatchlistItem
Candle
Prediction
PredictionResult
Strategy
StrategySignal
Order
Position
Trade
Backtest
Alert
PortfolioStats

Make the frontend components consume these typed objects.

==================================================
32. RESPONSIVENESS
==================

Desktop:
Full trading terminal.

Tablet:
Compressed panels.

Mobile:
Bottom navigation.

Mobile order:

Price
AI prediction
Chart
Strategy
Entry/SL/Target
Position
Performance

==================================================
33. EMPTY / ERROR STATES
========================

Create realistic states for:

Loading
No data
Disconnected
Market closed
Prediction unavailable
Insufficient candles
No trade
No open positions
No watchlist items
Backtest running
Backtest completed

Example:

DATA DISCONNECTED

"Market data connection has been interrupted. Predictions are paused."

==================================================
34. NOTIFICATIONS
=================

Create toast system.

Examples:

"AI prediction updated"

"Long setup detected"

"Paper order created"

"Target reached"

"Prediction correct"

"Prediction incorrect"

"Market data disconnected"

==================================================
35. DEMO MODE
=============

Create a "Launch Demo" button.

Demo should automatically show:

Live-looking market movement
Prediction
Strategy
Simulated order
Position
Prediction result
Performance update

This should make the product immediately demonstrable to judges/users without any API keys.

==================================================
36. CODE QUALITY
================

Use reusable components.

Do NOT put the entire dashboard in one giant component.

Create reusable components such as:

CandleChart
PredictionCard
StrategyPanel
Watchlist
OrderPanel
PositionCard
PerformanceCard
ConfidenceMeter
PredictionMarker
TradeHistory
BacktestPanel
RiskPanel
ModeSwitcher
Sidebar
TopBar
ToastSystem

Keep data and UI separated.

==================================================
37. FINAL USER FLOW
===================

User opens:

crudeai.tech

↓
Landing page

↓
Get Started

↓
Signup/Login

↓
Dashboard

↓
Live Terminal

↓
Select:

MCX CRUDE OIL

↓
5m chart

↓
AI predicts:

NEXT CANDLE
UP
73%

↓
Strategy evaluates:

7/8 confirmations

↓
LONG SETUP

Entry
SL
Target

↓
User can:

Create Paper Order

OR

Enable Auto Trading

↓
Auto Trading waits for valid strategy signal

↓
Paper order created

↓
Position appears

↓
Next candle closes

↓
AI prediction compared with actual

↓
✓ CORRECT / ✕ WRONG

↓
Performance updates

↓
Prediction history stores result

==================================================
38. MOST IMPORTANT VISUAL REQUIREMENT
=====================================

The chart must visually communicate:

PAST
│
│ actual candles
│
│
CURRENT CANDLE
│
├──── AI PREDICTION
│       ↓
│      🟢
│       ↓
│   expected move
│
FUTURE
│
└──── actual candle arrives

After the future candle arrives:

AI PREDICTION → ACTUAL

✓ CORRECT

or

✕ WRONG

This should be one of the most visually impressive features of the entire application.

==================================================
39. DO NOT BUILD THESE YET
==========================

Do NOT implement:

* Real broker login
* Real order placement
* Real auto-buy
* Real auto-sell
* Real-money trading
* Real API keys
* Real market data
* Actual ML training
* Actual model deployment

The frontend must simulate these behaviors cleanly.

==================================================
40. FINAL QUALITY BAR
=====================

The finished UI should look like a real startup product that could be shown to:

* traders
* developers
* hackathon judges
* investors
* technical reviewers

It should NOT look like a generated template.

Every major button must have a working frontend interaction.

Every page must be reachable.

No dead navigation links.

No fake buttons that do nothing.

Use realistic mock data.

Use polished loading states.

Use polished empty states.

Use realistic financial terminology.

Make the chart the centerpiece.

Make the AI prediction → actual comparison the signature feature.

Make Auto Trading / Paper Trading feel like a serious strategy engine rather than a simple toggle.

The entire application should be visually coherent from landing page through login → dashboard → live terminal → prediction → strategy → simulated order → position → prediction result → performance.

Build the frontend now with mock services and clean abstraction boundaries so the real Python/FastAPI/Supabase/broker backend can be connected later without redesigning the UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9c646a75-d591-4e8a-93cd-8076789eeec2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
