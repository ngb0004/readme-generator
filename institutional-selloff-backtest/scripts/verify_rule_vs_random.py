"""His exact rule vs a matched random-entry control on the same stocks."""
import sys; sys.path.insert(0,'/home/user/readme-generator/institutional-selloff-backtest')
import numpy as np, pandas as pd
from isb.yahoo import YahooClient, YahooError
from isb.events import MARKET_TZ, _reaction_position

AI = ["NVDA","AMD","AVGO","MU","MRVL","SMCI","PLTR","WDC","SNDK","VRT","ANET",
      "LRCX","AMAT","KLAC","QCOM","INTC","MPWR","COHR","ONTO"]
STOP, MAXHOLD, RNG = 3.0, 120, np.random.default_rng(42)

def trail(px, i, stop=STOP, max_hold=MAXHOLD):
    entry = float(px.iloc[i]); peak = entry
    end = min(i+max_hold, len(px)-1)
    for j in range(i+1, end+1):
        c = float(px.iloc[j]); peak = max(peak, c)
        if c <= peak*(1-stop/100): return c/entry-1.0, j-i
    return float(px.iloc[end])/entry-1.0, end-i

def run(tickers, start=None, beat_max=25.0, min_inst=0.75):
    c = YahooClient(); trades=[]; controls=[]; skipped=[]
    for t in tickers:
        try:
            own = c.institutional_ownership(t)
            inst = own.get("inst_pct")
            if inst is None or inst < min_inst:
                skipped.append((t, f"inst={inst}")); continue
            e = c.earnings_history(t).dropna(subset=["eps_actual","eps_estimate"])
            p = c.price_history(t); px, days = p["adjclose"].astype(float), p.index
        except (YahooError,KeyError,ValueError) as ex:
            skipped.append((t,str(ex)[:30])); continue
        lo_i = int(days.searchsorted(pd.Timestamp(start))) if start else 6
        for r in e.itertuples(index=False):
            if abs(r.eps_estimate) < 0.05: continue
            sp=(r.eps_actual-r.eps_estimate)/abs(r.eps_estimate)*100
            if not (0 < sp <= beat_max): continue
            pos,_=_reaction_position(days, r.timestamp.tz_convert(MARKET_TZ), "infer")
            if pos is None or pos<max(6,lo_i) or pos+MAXHOLD>=len(days): continue
            a=pos-1
            if px.iloc[pos]/px.iloc[a]-1 >= 0: continue          # must drop day 1
            ret,held = trail(px, pos+4)                           # buy day-5 close
            trades.append({"ticker":t,"date":days[pos].date(),"surprise":sp,"ret":ret,"held":held})
            # matched control: same stock, same era, random entry days
            hi=len(days)-MAXHOLD-1
            if hi>lo_i+10:
                for k in RNG.integers(max(lo_i,6), hi, size=25):
                    rr,hh=trail(px,int(k))
                    controls.append({"ticker":t,"ret":rr,"held":hh})
    return pd.DataFrame(trades), pd.DataFrame(controls), skipped

def summarize(name, df):
    if df.empty: return f"{name}: no trades"
    r=df["ret"].to_numpy()*100
    return (f"{name}\n"
            f"   trades {len(r):>5}   mean {r.mean():+6.2f}%   median {np.median(r):+6.2f}%\n"
            f"   hit >=3% {(r>=3).mean():6.1%}   any gain {(r>0).mean():6.1%}   "
            f"median hold {df['held'].median():.0f}d")

for label,start in [("FULL HISTORY", None), ("AI ERA (2023 onward)", "2023-01-01")]:
    tr,ct,sk = run(AI, start=start)
    print(f"\n{'='*66}\n{label} -- AI stocks, >=75% institutional, beat & dropped day 1\n{'='*66}")
    print(summarize("HIS RULE  (buy day-5 close, 3% trailing stop)", tr))
    print(summarize("CONTROL   (same stocks, RANDOM entry day, same stop)", ct))
    if not tr.empty and not ct.empty:
        d=tr["ret"].mean()*100-ct["ret"].mean()*100
        from scipy import stats as sps
        t,pv=sps.ttest_ind(tr["ret"],ct["ret"],equal_var=False)
        print(f"\n   EDGE FROM THE EARNINGS TIMING: {d:+.2f} percentage points  (p={pv:.3f})")
    if sk: print(f"   [excluded by ownership screen: {', '.join(x[0] for x in sk)}]")
