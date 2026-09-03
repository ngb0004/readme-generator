import sys; sys.path.insert(0,'/home/user/readme-generator/institutional-selloff-backtest')
import numpy as np, pandas as pd
from scipy import stats as sps
from isb.yahoo import YahooClient, YahooError
from isb.events import MARKET_TZ, _reaction_position

AI=["NVDA","AMD","AVGO","MU","MRVL","SMCI","PLTR","WDC","SNDK","VRT","ANET",
    "LRCX","AMAT","KLAC","QCOM","INTC","MPWR","COHR","ONTO"]
MAXHOLD=120; RNG=np.random.default_rng(7)
c=YahooClient(); DATA={}
for t in AI:
    try:
        o=c.institutional_ownership(t)
        DATA[t]=(c.earnings_history(t).dropna(subset=["eps_actual","eps_estimate"]),
                 c.price_history(t), o.get("inst_pct"))
    except Exception: pass

def trail(px,i,stop,max_hold=MAXHOLD):
    entry=float(px.iloc[i]); peak=entry; end=min(i+max_hold,len(px)-1)
    for j in range(i+1,end+1):
        cl=float(px.iloc[j]); peak=max(peak,cl)
        if cl<=peak*(1-stop/100): return cl/entry-1.0
    return float(px.iloc[end])/entry-1.0

def variant(entry_off, require_d5_drop, stop, min_inst=0.75, start=None, beat_max=25.0):
    tr=[]; ct=[]
    for t,(e,p,inst) in DATA.items():
        if inst is None or inst<min_inst: continue
        px,days=p["adjclose"].astype(float),p.index
        lo=int(days.searchsorted(pd.Timestamp(start))) if start else 6
        for r in e.itertuples(index=False):
            if abs(r.eps_estimate)<0.05: continue
            sp=(r.eps_actual-r.eps_estimate)/abs(r.eps_estimate)*100
            if not (0<sp<=beat_max): continue
            pos,_=_reaction_position(days,r.timestamp.tz_convert(MARKET_TZ),"infer")
            if pos is None or pos<max(6,lo) or pos+MAXHOLD>=len(days): continue
            a=pos-1
            if px.iloc[pos]/px.iloc[a]-1>=0: continue
            if require_d5_drop and px.iloc[pos+4]/px.iloc[a]-1>=0: continue
            tr.append(trail(px,pos+entry_off,stop))
        hi=len(days)-MAXHOLD-1
        if hi>lo+10:
            for k in RNG.integers(max(lo,6),hi,size=25): ct.append(trail(px,int(k),stop))
    tr,ct=np.array(tr)*100,np.array(ct)*100
    if len(tr)<10: return None
    _,pv=sps.ttest_ind(tr,ct,equal_var=False)
    return dict(n=len(tr),mean=tr.mean(),hit=(tr>=3).mean()*100,
                ctrl=ct.mean(),ctrl_hit=(ct>=3).mean()*100,edge=tr.mean()-ct.mean(),p=pv)

print(f"{'variant':<52}{'n':>5}{'his':>8}{'random':>9}{'edge':>8}{'p':>7}")
print("-"*89)
for label,kw in [
  ("buy day-5 close, drop d1 only, 3% stop",      dict(entry_off=4,require_d5_drop=False,stop=3.0)),
  ("buy day-6 OPEN-ish (d5+1), drop d1, 3% stop", dict(entry_off=5,require_d5_drop=False,stop=3.0)),
  ("buy day-5 close, must drop THROUGH d5, 3%",   dict(entry_off=4,require_d5_drop=True, stop=3.0)),
  ("buy day-6, must drop through d5, 3% stop",    dict(entry_off=5,require_d5_drop=True, stop=3.0)),
  ("buy day-5 close, drop d1, 5% stop",           dict(entry_off=4,require_d5_drop=False,stop=5.0)),
  ("buy day-5 close, drop d1, 8% stop",           dict(entry_off=4,require_d5_drop=False,stop=8.0)),
  ("beat<=10% only, day-5 close, 3% stop",        dict(entry_off=4,require_d5_drop=False,stop=3.0,beat_max=10.0)),
  ("2023+, must drop through d5, 3% stop",        dict(entry_off=4,require_d5_drop=True, stop=3.0,start="2023-01-01")),
]:
    r=variant(**kw)
    if r is None: print(f"{label:<52}{'too few trades':>29}"); continue
    print(f"{label:<52}{r['n']:>5}{r['mean']:>+8.2f}{r['ctrl']:>+9.2f}{r['edge']:>+8.2f}{r['p']:>7.3f}")
print("\n('his' and 'random' are mean % return per trade; edge = his minus random)")
