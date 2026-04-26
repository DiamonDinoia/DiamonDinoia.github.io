#!/usr/bin/env python3
"""
build_data.py — one-shot data pull for Part IV of the Investing & Trading series.

Pulls Yahoo Finance closes for the tickers used in the deck (IPO, IPOS, VTI, SPY,
TSLA, RSP, AVUV, AVDV, AVUS, DFSV, DFAC) and writes a JSON blob that gets pasted
into the HTML's <script id="deck-data"> tag.

Usage:
    python build_data.py > data.json

The deck embeds a snapshot of this JSON inline so it works offline. Re-run this
script to refresh the snapshot.

Tickers / series:
- IPO / IPOS  vs VTI : cumulative total-return since 2013-10-15 (Renaissance ETF)
- TSLA vs SPY        : cumulative total-return since 2020-12-21 (S&P 500 inclusion)
- (Optional) AVUV/DFSV/AVDV: small-cap-value reference for Lever 1 commentary

The static slides (Mag 7 weights, SpaceX valuation arc, Starlink subs/revenue,
P/S multiples, factor premia, Ritter low-float table, Zurita 2.9% bars,
Sammon-Shim drag) come from primary documents and are hardcoded in the deck —
they do not depend on yfinance.
"""

from __future__ import annotations
import json
import sys
from datetime import datetime, timezone

try:
    import yfinance as yf
except ImportError:
    print("Install: pip install yfinance pandas", file=sys.stderr)
    sys.exit(1)


def cumret(symbol: str, start: str) -> list[dict]:
    """Monthly cumulative total return (adjusted close) since `start`, normalised to 0."""
    df = yf.download(symbol, start=start, auto_adjust=True, progress=False)
    if df.empty:
        return []
    close = df["Close"]
    if hasattr(close, "columns"):
        close = close.iloc[:, 0]
    px = close.resample("ME").last().dropna()
    base = float(px.iloc[0])
    out = []
    for ts, v in px.items():
        out.append({"d": ts.strftime("%Y-%m-%d"), "v": round((float(v) / base - 1) * 100, 2)})
    return out


def main() -> None:
    data = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "ipo_vs_vti": {
            "since": "2013-10-15",
            "IPO":  cumret("IPO",  "2013-10-15"),
            "IPOS": cumret("IPOS", "2014-10-15"),
            "VTI":  cumret("VTI",  "2013-10-15"),
        },
        "tsla_vs_spy": {
            "since": "2020-12-21",
            "TSLA": cumret("TSLA", "2020-12-21"),
            "SPY":  cumret("SPY",  "2020-12-21"),
        },
    }
    json.dump(data, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
