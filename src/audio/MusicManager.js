/**
 * MusicManager — procedural MIDI-style music via Web Audio API.
 * Each scene gets a unique ambient theme built from oscillators,
 * arpeggios, LFOs, and delay effects. No external audio files needed.
 */

// ── Note frequency table (A-minor / noir jazz palette) ──────────────
const N = {
    E2: 82.41, G2: 98, Ab2: 103.83, A2: 110,
    C3: 130.81, Db3: 138.59, D3: 146.83, Eb3: 155.56,
    E3: 164.81, F3: 174.61, Gb3: 185, G3: 196, Ab3: 207.65,
    A3: 220, Bb3: 233.08, B3: 246.94,
    C4: 261.63, Db4: 277.18, D4: 293.66, E4: 329.63, G4: 392,
    A4: 440, A5: 880
};

// ── Per-scene theme builders ────────────────────────────────────────
const THEMES = {
    /* Menu — dark noir lobby: Am drone + slow Am7 arpeggio with delay */
    MenuScene(m) {
        m._osc('sine', N.A2, 0.08);
        m._osc('sine', N.E2, 0.04);
        const arp = m._arp('triangle', [N.A3, N.C4, N.E4, N.G4, N.E4, N.C4], 2000, 0.03);
        m._delay(arp.gain, 0.6, 0.3);
        m._lfo(arp.gain.gain, 0.12, 0.015);
    },

    /* Conspiracy select — suspenseful beating Dm7 */
    ConspiracySelectScene(m) {
        m._osc('sine', N.D3, 0.05);
        m._osc('sine', N.D3 * 1.003, 0.05);
        m._arp('triangle', [N.D3, N.F3, N.A3, N.C4], 1500, 0.03);
    },

    /* Briefing — tense Am pulse */
    BriefingScene(m) {
        m._osc('sine', N.A2, 0.06);
        const pulse = m._osc('triangle', N.E3, 0.04);
        m._lfo(pulse.gain.gain, 0.5, 0.03);
        m._osc('sine', N.C3, 0.02);
    },

    /* Editor intro — sparse authority */
    EditorIntroScene(m) {
        m._osc('triangle', N.A2, 0.06);
        m._arp('sine', [N.C4, N.C4, N.E4, N.E4, N.A3, N.A3], 2500, 0.025);
    },

    /* Card scene — noir jazz walking bass + atmospheric pad */
    CardScene(m) {
        m._arp('triangle', [N.A2, N.C3, N.D3, N.E3, N.D3, N.C3], 3000, 0.06);
        m._osc('sine', N.A3, 0.025);
        m._osc('sine', N.C4, 0.02);
        m._osc('sine', N.E4, 0.015);
        const shim = m._osc('sine', N.A5, 0.008);
        m._lfo(shim.gain.gain, 2, 0.006);
    },

    /* Board — eerie conspiracy Em7 */
    BoardScene(m) {
        m._osc('sine', N.E2, 0.06);
        m._osc('sine', N.Eb3, 0.02);
        m._osc('sine', N.E3, 0.03);
        m._arp('triangle', [N.E3, N.G3, N.B3, N.D4, N.B3, N.G3], 3000, 0.025);
    },

    /* Publish — dramatic breathing Am chord */
    PublishScene(m) {
        const a = m._osc('sine', N.A3, 0.05);
        const c = m._osc('sine', N.C4, 0.04);
        const e = m._osc('sine', N.E4, 0.03);
        m._lfo(a.gain.gain, 0.2, 0.02);
        m._lfo(c.gain.gain, 0.18, 0.015);
        m._lfo(e.gain.gain, 0.22, 0.01);
        m._osc('sine', N.A2, 0.04);
    },

    /* Results — resolved A major */
    ResultsScene(m) {
        m._osc('sine', N.A3, 0.05);
        m._osc('triangle', N.Db4, 0.03);
        m._osc('sine', N.E4, 0.03);
        m._osc('sine', N.A2, 0.04);
        const shim = m._osc('triangle', N.A4, 0.015);
        m._lfo(shim.gain.gain, 0.3, 0.01);
    },

    /* Deadline — urgent alarm pulse */
    DeadlineScene(m) {
        const alarm = m._osc('triangle', N.A4, 0.07);
        m._lfo(alarm.gain.gain, 4, 0.06);
        m._osc('sine', N.D3, 0.06);
        m._osc('sine', N.Ab2, 0.04);
    },

    /* Game over — dark chromatic descent */
    GameOverScene(m) {
        m._osc('sine', N.A2, 0.06);
        m._arp('sine', [N.A3, N.Ab3, N.G3, N.Gb3, N.F3, N.E3, N.Eb3, N.D3], 2000, 0.04);
        m._osc('sine', N.E2, 0.03);
    }
};

// ── Manager class ───────────────────────────────────────────────────
class MusicManager {
    constructor() {
        this._ctx = null;
        this._master = null;
        this._filter = null;
        this._muted = localStorage.getItem('rr_muted') === 'true';
        this._theme = null;
        this._nodes = [];
        this._timers = new Set();
    }

    /* Lazy-init AudioContext (needs user gesture to resume) */
    _ensureCtx() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._master = this._ctx.createGain();
            this._master.gain.value = this._muted ? 0 : 0.5;

            // Warm low-pass filter for vintage noir feel
            this._filter = this._ctx.createBiquadFilter();
            this._filter.type = 'lowpass';
            this._filter.frequency.value = 2000;
            this._filter.Q.value = 0.7;
            this._master.connect(this._filter);
            this._filter.connect(this._ctx.destination);

            const resume = () => {
                if (this._ctx.state === 'suspended') this._ctx.resume();
                document.removeEventListener('pointerdown', resume);
            };
            document.addEventListener('pointerdown', resume);
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
    }

    /* Switch to a scene's theme (crossfade) */
    play(name) {
        this._ensureCtx();
        if (this._theme === name) return;
        if (this._nodes.length > 0) {
            const t = this._ctx.currentTime;
            this._master.gain.linearRampToValueAtTime(0, t + 0.15);
            setTimeout(() => {
                this._stopAll();
                this._master.gain.value = this._muted ? 0 : 0.5;
                this._theme = name;
                THEMES[name]?.(this);
            }, 160);
        } else {
            this._theme = name;
            THEMES[name]?.(this);
        }
    }

    _stopAll() {
        this._timers.forEach(id => clearInterval(id));
        this._timers.clear();
        this._nodes.forEach(n => {
            try { n.stop?.(); } catch (_) { /* already stopped */ }
            try { n.disconnect?.(); } catch (_) { /* ok */ }
        });
        this._nodes = [];
    }

    stop() { this._stopAll(); this._theme = null; }

    toggleMute() {
        this._ensureCtx();
        this._muted = !this._muted;
        localStorage.setItem('rr_muted', String(this._muted));
        this._master.gain.setTargetAtTime(this._muted ? 0 : 0.5, this._ctx.currentTime, 0.05);
        return this._muted;
    }

    get muted() { return this._muted; }

    // ── Synth primitives ────────────────────────────────────────────

    /** Single oscillator → gain → master */
    _osc(type, freq, vol) {
        const o = this._ctx.createOscillator();
        const g = this._ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = vol;
        o.connect(g);
        g.connect(this._master);
        o.start();
        this._nodes.push(o, g);
        return { osc: o, gain: g };
    }

    /** Arpeggiator — cycles through note array */
    _arp(type, notes, intervalMs, vol) {
        let idx = 0;
        const { osc, gain } = this._osc(type, notes[0], vol);
        const id = setInterval(() => {
            idx = (idx + 1) % notes.length;
            osc.frequency.setTargetAtTime(notes[idx], this._ctx.currentTime, 0.05);
        }, intervalMs);
        this._timers.add(id);
        return { osc, gain };
    }

    /** Low-frequency oscillator modulating an AudioParam */
    _lfo(param, rate, depth) {
        const lfo = this._ctx.createOscillator();
        const g = this._ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = rate;
        g.gain.value = depth;
        lfo.connect(g);
        g.connect(param);
        lfo.start();
        this._nodes.push(lfo, g);
    }

    /** Feedback delay send from a source node */
    _delay(source, time, feedback) {
        const d = this._ctx.createDelay();
        const fb = this._ctx.createGain();
        d.delayTime.value = time;
        fb.gain.value = feedback;
        source.connect(d);
        d.connect(fb);
        fb.connect(d);
        d.connect(this._master);
        this._nodes.push(d, fb);
    }
}

/** Singleton — import this everywhere */
export const musicManager = new MusicManager();
