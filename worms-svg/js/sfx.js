// Som sintetizado com Web Audio (sem arquivos de áudio)
(() => {
  const MS = window.MS = window.MS || {};

  MS.Sfx = (() => {
    let ctx = null, master = null, musicBus = null, noiseBuf = null, enabled = true, volume = 0.6;
    let chargeOsc = null, chargeGain = null, musicNext = 0, musicStep = 0;
    const r = (a, b) => a + Math.random() * (b - a);

    const level = () => 0.92 * volume;       // volume 0..1 (padrão 0,6 ≈ ganho 0,55)

    function unlock() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = enabled ? level() : 0; master.connect(ctx.destination);
        musicBus = ctx.createGain(); musicBus.gain.value = 0.09; musicBus.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        musicNext = ctx.currentTime + 0.3;
        setInterval(scheduleMusic, 30);
      }
      if (ctx.state === 'suspended') ctx.resume();
    }
    const ready = () => ctx && enabled;

    function tone({ type = 'sine', f = 440, f2 = 0, t = 0.2, vol = 0.3, delay = 0, attack = 0.005, dest, at }) {
      if (!ready()) return;
      const t0 = at !== undefined ? at : ctx.currentTime + delay;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, t0);
      if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t0 + t);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
      osc.connect(g); g.connect(dest || master);
      osc.start(t0); osc.stop(t0 + t + 0.05);
    }

    function noise({ t = 0.3, vol = 0.3, ftype = 'lowpass', f = 1000, f2 = 0, q = 1, delay = 0, attack = 0.005 }) {
      if (!ready()) return;
      const t0 = ctx.currentTime + delay;
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const flt = ctx.createBiquadFilter(); flt.type = ftype; flt.Q.value = q;
      flt.frequency.setValueAtTime(f, t0);
      if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t0 + t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
      src.connect(flt); flt.connect(g); g.connect(master);
      src.start(t0, Math.random() * 0.5); src.stop(t0 + t + 0.05);
    }

    // musiquinha de fundo: arpejo em 4 acordes + baixo
    const CHORDS = [[261.63, 329.63, 392.0, 523.25], [220.0, 261.63, 329.63, 440.0],
                    [174.61, 220.0, 261.63, 349.23], [196.0, 246.94, 293.66, 392.0]];
    const ARP = [0, 1, 2, 3, 2, 1, 2, 1], STEP = 0.24;
    function scheduleMusic() {
      if (!ctx) return;
      if (musicNext < ctx.currentTime) musicNext = ctx.currentTime + 0.05;
      while (musicNext < ctx.currentTime + 0.15) {
        const chord = CHORDS[Math.floor(musicStep / 8) % 4];
        tone({ type: 'triangle', f: chord[ARP[musicStep % 8]], t: 0.22, vol: 0.5, dest: musicBus, at: musicNext });
        if (musicStep % 8 === 0) tone({ f: chord[0] / 2, t: STEP * 7.5, vol: 0.7, dest: musicBus, at: musicNext, attack: 0.02 });
        musicNext += STEP; musicStep++;
      }
    }

    const api = {
      unlock,
      toggle() {
        enabled = !enabled;
        if (master) master.gain.setTargetAtTime(enabled ? level() : 0, ctx.currentTime, 0.02);
        if (!enabled) api.chargeStop();
        return enabled;
      },
      setVolume(v) {
        volume = Math.max(0, Math.min(1, v));
        if (master && enabled) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.02);
      },
      isOn: () => enabled,

      // som do disparo, de acordo com o "estilo" do ataque
      shoot(style) {
        switch (style) {
          case 'fire':
            noise({ t: 0.4, vol: 0.35, ftype: 'bandpass', f: 900, f2: 250, q: 0.8 });
            tone({ type: 'sawtooth', f: 180, f2: 70, t: 0.3, vol: 0.08 }); break;
          case 'leaf':
            for (let i = 0; i < 3; i++) noise({ t: 0.14, vol: 0.16, ftype: 'highpass', f: 2500, delay: i * 0.06 });
            tone({ type: 'triangle', f: 700, f2: 1300, t: 0.12, vol: 0.07 }); break;
          case 'water':
            tone({ f: 700, f2: 220, t: 0.25, vol: 0.18 });
            for (let i = 0; i < 4; i++) { const f = r(500, 1000); tone({ f, f2: f * 1.5, t: 0.06, vol: 0.08, delay: 0.05 + i * 0.05 }); }
            break;
          case 'thunder':
            noise({ t: 0.45, vol: 0.3, ftype: 'bandpass', f: 3000, q: 3 });
            for (let i = 0; i < 6; i++) noise({ t: 0.05, vol: 0.25, ftype: 'highpass', f: 2000, delay: i * 0.06 });
            tone({ type: 'square', f: 1400, f2: 200, t: 0.35, vol: 0.05 }); break;
          case 'normal':
            tone({ type: 'triangle', f: 380, f2: 160, t: 0.14, vol: 0.2 });
            noise({ t: 0.12, vol: 0.18, ftype: 'highpass', f: 1800 }); break;
          case 'gust':
            noise({ t: 0.5, vol: 0.3, ftype: 'bandpass', f: 500, f2: 2200, q: 1.2 });
            noise({ t: 0.4, vol: 0.2, ftype: 'bandpass', f: 700, f2: 2600, q: 1.5, delay: 0.1 }); break;
          case 'web':
            tone({ type: 'square', f: 1500, f2: 700, t: 0.18, vol: 0.05 });
            noise({ t: 0.25, vol: 0.12, ftype: 'highpass', f: 4500 }); break;
          case 'rock':
            tone({ type: 'square', f: 140, f2: 60, t: 0.25, vol: 0.14 });
            noise({ t: 0.3, vol: 0.3, ftype: 'lowpass', f: 900, f2: 200 }); break;
          case 'poison':
            noise({ t: 0.18, vol: 0.16, ftype: 'highpass', f: 2200, f2: 1200 });
            tone({ type: 'triangle', f: 850, f2: 300, t: 0.16, vol: 0.10 }); break;
          case 'dragon':
            noise({ t: 0.7, vol: 0.35, ftype: 'lowpass', f: 1200, f2: 150 });
            tone({ type: 'sawtooth', f: 130, f2: 55, t: 0.6, vol: 0.14 });
            tone({ type: 'sawtooth', f: 260, f2: 110, t: 0.5, vol: 0.06 }); break;
          default:
            tone({ f: 500, t: 0.1, vol: 0.1 });
        }
      },

      boom(style) {
        switch (style) {
          case 'fire':
            noise({ t: 1.0, vol: 0.7, f: 1500, f2: 80 });
            tone({ f: 110, f2: 35, t: 0.6, vol: 0.6 }); break;
          case 'thunder':
            noise({ t: 0.7, vol: 0.5, f: 2500, f2: 120 });
            tone({ f: 90, f2: 30, t: 0.5, vol: 0.45 });
            noise({ t: 0.3, vol: 0.2, ftype: 'highpass', f: 3000 }); break;
          case 'leaf':
            noise({ t: 0.35, vol: 0.28, ftype: 'bandpass', f: 1800, f2: 700, q: 0.7 });
            tone({ f: 160, f2: 70, t: 0.2, vol: 0.15 }); break;
          case 'normal':
            noise({ t: 0.35, vol: 0.4, f: 1400, f2: 120 });
            tone({ f: 140, f2: 50, t: 0.25, vol: 0.4 }); break;
          case 'gust':
            noise({ t: 0.4, vol: 0.25, ftype: 'bandpass', f: 1500, f2: 400, q: 0.8 }); break;
          case 'web':
            noise({ t: 0.25, vol: 0.2, ftype: 'highpass', f: 3500 });
            tone({ f: 200, f2: 90, t: 0.15, vol: 0.15 }); break;
          case 'rock':
            noise({ t: 0.9, vol: 0.65, f: 1100, f2: 70 });
            tone({ type: 'square', f: 90, f2: 30, t: 0.5, vol: 0.4 });
            for (let i = 0; i < 4; i++) noise({ t: 0.08, vol: 0.2, ftype: 'bandpass', f: 600, q: 2, delay: 0.15 + i * 0.09 }); break;
          case 'poison':
            noise({ t: 0.35, vol: 0.25, ftype: 'bandpass', f: 1100, f2: 350, q: 0.8 });
            tone({ type: 'sine', f: 300, f2: 100, t: 0.22, vol: 0.14 }); break;
          case 'dragon':
            noise({ t: 1.1, vol: 0.65, f: 1200, f2: 60 });
            tone({ type: 'sawtooth', f: 100, f2: 28, t: 0.8, vol: 0.5 }); break;
          default: // água
            noise({ t: 0.6, vol: 0.35, ftype: 'bandpass', f: 1400, f2: 300, q: 0.6 });
            for (let i = 0; i < 5; i++) { const f = r(300, 800); tone({ f, f2: f * 1.6, t: 0.07, vol: 0.07, delay: 0.08 + i * 0.06 }); }
        }
      },

      splash() {
        noise({ t: 0.5, vol: 0.3, ftype: 'bandpass', f: 1000, f2: 250, q: 0.7 });
        tone({ f: 400, f2: 120, t: 0.25, vol: 0.12 });
      },
      hurt()  { tone({ type: 'square', f: 620, f2: 280, t: 0.14, vol: 0.06 }); },
      death() { tone({ type: 'triangle', f: 520, f2: 110, t: 0.7, vol: 0.14 }); },
      turn()  { tone({ f: 660, t: 0.12, vol: 0.12 }); tone({ f: 990, t: 0.18, vol: 0.12, delay: 0.1 }); },
      step()  { tone({ type: 'triangle', f: r(150, 200), t: 0.04, vol: 0.035 }); },
      click() { tone({ f: 900, t: 0.04, vol: 0.06 }); },
      select() { tone({ f: 780, t: 0.07, vol: 0.1 }); tone({ f: 1040, t: 0.09, vol: 0.1, delay: 0.05 }); },
      voltWarn() {
        tone({ type: 'square', f: 250, f2: 1100, t: 1.2, vol: 0.045 });
        for (let i = 0; i < 5; i++) noise({ t: 0.04, vol: 0.12, ftype: 'highpass', f: 4000, delay: 0.1 + i * 0.2 });
      },
      win() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ type: 'triangle', f, t: 0.3, vol: 0.15, delay: i * 0.14 })); },
      lose() { [440, 370, 311, 247].forEach((f, i) => tone({ type: 'triangle', f, t: 0.35, vol: 0.14, delay: i * 0.2 })); },

      // efetividade de tipos
      superEff() { tone({ type: 'triangle', f: 880, t: 0.1, vol: 0.12 }); tone({ type: 'triangle', f: 1320, t: 0.15, vol: 0.12, delay: 0.09 }); },
      weakEff()  { tone({ type: 'triangle', f: 330, f2: 220, t: 0.2, vol: 0.1 }); },

      // Pokébola
      ballThrow() { tone({ type: 'triangle', f: 500, f2: 900, t: 0.18, vol: 0.1 }); noise({ t: 0.15, vol: 0.1, ftype: 'highpass', f: 2500 }); },
      ballHit()   { tone({ type: 'square', f: 300, f2: 900, t: 0.2, vol: 0.1 }); noise({ t: 0.25, vol: 0.18, ftype: 'bandpass', f: 2500, q: 2 }); },
      ballLand()  { tone({ f: 200, f2: 90, t: 0.1, vol: 0.2 }); },
      ballShake() { tone({ type: 'square', f: 420, t: 0.05, vol: 0.1 }); tone({ type: 'square', f: 560, t: 0.05, vol: 0.1, delay: 0.09 }); },
      ballCatch() { [660, 880, 1100, 1320, 1760].forEach((f, i) => tone({ type: 'triangle', f, t: 0.25, vol: 0.14, delay: i * 0.1 })); },
      ballFail()  { tone({ type: 'sawtooth', f: 500, f2: 150, t: 0.4, vol: 0.1 }); noise({ t: 0.3, vol: 0.12, f: 1800, f2: 400 }); },

      // evolução: brilho que sobe por ~3,5 s e fanfarra no fim
      evolve() {
        for (let i = 0; i < 28; i++) {
          const f = 330 + i * 38 + (i % 2) * 40;
          tone({ type: 'triangle', f, t: 0.16, vol: 0.09, delay: i * (0.17 - i * 0.003) });
        }
        tone({ type: 'sine', f: 300, f2: 1400, t: 3.4, vol: 0.05 });
      },
      evolveDone() {
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone({ type: 'triangle', f, t: 0.5, vol: 0.14, delay: i * 0.12 }));
        [523.25, 659.25, 783.99].forEach(f => tone({ type: 'sine', f, t: 1.2, vol: 0.1, delay: 0.7 }));
      },

      chargeStart() {
        if (!ready()) return;
        api.chargeStop();
        chargeOsc = ctx.createOscillator(); chargeOsc.type = 'triangle'; chargeOsc.frequency.value = 220;
        chargeGain = ctx.createGain();
        chargeGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        chargeGain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.05);
        chargeOsc.connect(chargeGain); chargeGain.connect(master); chargeOsc.start();
      },
      chargeSet(p) { if (chargeOsc) chargeOsc.frequency.setTargetAtTime(220 + p * 7, ctx.currentTime, 0.03); },
      chargeStop() {
        if (!chargeOsc) return;
        chargeGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02);
        chargeOsc.stop(ctx.currentTime + 0.1);
        chargeOsc = null; chargeGain = null;
      }
    };
    return api;
  })();
})();

