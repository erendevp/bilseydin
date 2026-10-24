"""Telifsiz piyano fon müziği üretir.
Kullanım: python3 tools/music.py <sure_sn> <cikti.wav> [tohum] [ton]
  ton: "am" (varsayılan, hüzünlü La minör) | "em" | "dm"  -> tüm notalar kaydırılır
Kapanış kartı son ~6.5 sn'ye denk gelecek şekilde sade akorlarla biter.
"""
import sys
import numpy as np, scipy.signal as ss, scipy.io.wavfile as wf
SR=44100; DUR=float(sys.argv[1]); OUT=sys.argv[2]; SEED=int(sys.argv[3]) if len(sys.argv)>3 else 3
SHIFT={'am':0,'em':-5,'dm':5}.get(sys.argv[4] if len(sys.argv)>4 else 'am',0)
N=int(SR*DUR)
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(SEED)
def midi(m): return 440*2**((m+SHIFT-69)/12)
def piano(f, dur, vel):
    n=int(SR*min(dur+2.5,6)); t=np.arange(n)/SR
    y=np.zeros(n)
    for h in range(1,8):
        fh=f*h*(1+0.0004*h*h)
        if fh>SR/2.2: break
        amp=vel/(h**1.35)*(1.0 if h>1 else 1.2)
        dec=np.exp(-t*(0.9+0.55*h)*(1+f/900))
        y+=amp*np.sin(2*np.pi*fh*t+rng.uniform(0,6))*dec
    att=np.minimum(1,t/0.006)
    rel=np.ones(n); off=int(SR*dur)
    if off<n: rel[off:]=np.exp(-(t[off:]-t[off])*3.2)
    return y*att*rel
def add(m, start, dur, vel, pan=0.0):
    y=piano(midi(m),dur,vel); i=int(start*SR); j=min(N,i+len(y)); y=y[:j-i]
    L[i:j]+=y*(1-pan)*0.7; R[i:j]+=y*(1+pan)*0.7
def pad(ms, start, dur, vol):
    n=int(SR*dur); t=np.arange(n)/SR; y=np.zeros(n)
    for m in ms:
        f=midi(m)
        for d in (-0.08,0.08): y+=np.sin(2*np.pi*f*(1+d/100)*t)+0.25*np.sin(2*np.pi*2*f*t)
    env=np.minimum(1,t/1.2)*np.minimum(1,(dur-t)/1.2)
    y*=env*vol; i=int(start*SR); j=min(N,i+n)
    L[i:j]+=y[:j-i]; R[i:j]+=y[:j-i]
bpm=66; beat=60/bpm; bar=4*beat
# Am F C G | Am F C E | F G Am Am ... (A minor)
prog=[('Am',[57,60,64]),('F',[53,57,60]),('C',[48,55,60,64]),('G',[55,59,62])]
chords={'Am':(45,[57,60,64,69]),'F':(41,[53,57,60,65]),'C':(48,[55,60,64,67]),'G':(43,[55,59,62,67]),'E':(40,[56,59,64,68]),'Dm':(50,[57,62,65,69])}
seq=['Am','F','C','G']*5+['F','G','Am','Am','F','G','C','C']
nbars=int(DUR/bar)+1
mel={2:[(0,76),(2,74)],3:[(0,72),(2,71)],4:[(0,76),(2,77),(3,76)],5:[(0,72),(2,69)],6:[(0,72),(1,71),(2,72)],7:[(0,71),(2,67)],
     8:[(0,76),(2,74)],9:[(0,72),(2,71)],10:[(0,76),(2,79)],11:[(0,77),(2,76)],12:[(0,72),(2,72),(3,74)],13:[(0,74),(2,71)],
     14:[(0,76),(2,74)],15:[(0,72),(2,71)],16:[(0,69),(2,72)],17:[(0,72),(2,71)],18:[(0,76)],19:[(0,74)],
     20:[(0,77),(2,76)],21:[(0,74),(1,76),(2,79)],22:[(0,76),(2,72)],23:[(0,76)],24:[(0,77),(2,76)],25:[(0,74),(2,79)]}
for b in range(nbars):
    st=b*bar
    if st>DUR-1: break
    name=seq[b%len(seq)]; root,tones=chords[name]
    end_card = st>=DUR-6.5
    vel=0.42 if b<2 else (0.55 if b<20 else 0.68)
    if end_card: vel=0.35
    add(root, st, bar*0.95, vel*0.5, -0.1); add(root+12, st, bar*0.95, vel*0.32, -0.1)
    pad([root+12]+tones[:3], st, bar+0.6, 0.010 if b>=2 else 0.006)
    if b>=1 and not end_card:
        pat=[0,1,2,3,2,1,2,3]
        for k,p in enumerate(pat):
            add(tones[p], st+k*beat/2, beat*0.9, vel*(0.42 if k%2==0 else 0.33), 0.2*(p-1.5)/1.5)
    if end_card:
        for k,p in enumerate([0,1,2,3]): add(tones[p], st+k*beat*0.75, beat*2, vel*0.4, 0.1)
    for (bt,m) in mel.get(b,[]):
        if st+bt*beat<DUR-2: add(m, st+bt*beat, beat*1.8, vel*0.62, 0.05)
# final chord
E=DUR-3.6; add(45, E, 3.0, 0.35); add(57,E,3,0.25); add(64,E+0.2,3,0.22); add(69,E+0.4,3,0.2); add(72,E+0.6,3,0.18)
# reverb
def ir(seed):
    r=np.random.default_rng(seed); n=int(SR*2.8); t=np.arange(n)/SR
    x=r.standard_normal(n)*np.exp(-t*2.3); x=ss.lfilter([1],[1,-0.6],x); x[0]=0; return x/np.abs(x).sum()*6
wetL=ss.fftconvolve(L,ir(1))[:N]; wetR=ss.fftconvolve(R,ir(2))[:N]
outL=L*0.75+wetL*0.5; outR=R*0.75+wetR*0.5
# fade in/out
t=np.arange(N)/SR
env=np.minimum(1,t/1.5)*np.clip((DUR-t)/3.0,0,1)
out=np.stack([outL*env,outR*env],1)
out=ss.lfilter(*ss.butter(2,7500/(SR/2)),out,axis=0)
out=out/np.abs(out).max()*0.85
wf.write(OUT,SR,(out*32767).astype(np.int16))
print('ok',out.shape[0]/SR)
