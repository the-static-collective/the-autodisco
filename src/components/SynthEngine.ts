// SynthEngine.ts - Web Audio API Synthesizer and Sequencer Scheduler
// Designed for polyphonic chord textures and flowing monophonic melodies

export interface NoteEvent {
  midi: number;
  time: number; // in beats (0 to 15)
  duration: number; // in beats
}

export interface ChordEvent {
  notes: number[];
  time: number; // in beats (usually 0, 4, 8, 12)
  duration: number; // in beats
}

export interface Composition {
  key: string;
  scale: string;
  bpm: number;
  chords: ChordEvent[];
  melody: NoteEvent[];
}

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private schedulerTimer: any = null;
  private currentPlayheadCallback: ((beat: number) => void) | null = null;
  private playbackStartTime: number = 0;
  private bpm: number = 90;
  private isPlaying: boolean = false;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      // Lazy load to comply with browser autoplay policies
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Convert MIDI to frequency
  private mToF(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  public stopAll() {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    this.activeOscillators.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {
        // Already stopped or disconnected
      }
    });
    this.activeOscillators = [];
  }

  // Play a single note immediately (with ADSR envelope to prevent popping)
  public playNoteImmediate(midi: number, type: "sine" | "sawtooth" | "triangle" = "triangle") {
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(this.mToF(midi), this.ctx.currentTime);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05); // Attack
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime + 0.15); // Sustain
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4); // Decay/Release

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);

    const oscPair = { osc, gain };
    this.activeOscillators.push(oscPair);
    setTimeout(() => {
      this.activeOscillators = this.activeOscillators.filter(item => item !== oscPair);
    }, 450);
  }

  // Plays a composition structure polyphonically
  public playComposition(
    comp: Composition,
    onPlayheadUpdate: (beat: number) => void
  ) {
    this.initCtx();
    if (!this.ctx) return;

    this.stopAll();
    this.isPlaying = true;
    this.bpm = comp.bpm || 90;
    this.currentPlayheadCallback = onPlayheadUpdate;
    this.playbackStartTime = this.ctx.currentTime;

    const secondsPerBeat = 60 / this.bpm;
    const totalDurationBeats = 16;
    const totalDurationSeconds = totalDurationBeats * secondsPerBeat;

    // Schedule all Chords
    comp.chords.forEach(chord => {
      const startTime = this.playbackStartTime + chord.time * secondsPerBeat;
      const duration = chord.duration * secondsPerBeat;
      
      chord.notes.forEach(midi => {
        this.scheduleTone(midi, startTime, duration, "triangle", 0.08);
      });
    });

    // Schedule Melody line
    comp.melody.forEach(note => {
      const startTime = this.playbackStartTime + note.time * secondsPerBeat;
      const duration = note.duration * secondsPerBeat;
      this.scheduleTone(note.midi, startTime, duration, "sine", 0.12);
    });

    // Trigger Playhead ticker via setTimeout sequence
    this.animatePlayhead(0, secondsPerBeat);
  }

  private scheduleTone(
    midi: number,
    startTime: number,
    duration: number,
    type: "sine" | "sawtooth" | "triangle" | "square",
    maxVolume: number
  ) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(this.mToF(midi), startTime);

    // ADSR dynamic envelope setup using linearRampToValueAtTime
    gainNode.gain.setValueAtTime(0, startTime);
    // Attack
    gainNode.gain.linearRampToValueAtTime(maxVolume, startTime + 0.03);
    // Decay / Sustain / Release
    const decayStart = startTime + 0.03;
    const releaseStart = Math.max(decayStart, startTime + duration - 0.05);
    
    gainNode.gain.setValueAtTime(maxVolume, releaseStart);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);

    const oscPair = { osc, gain: gainNode };
    this.activeOscillators.push(oscPair);
  }

  private animatePlayhead(currentBeat: number, secondsPerBeat: number) {
    if (!this.isPlaying) return;

    if (this.currentPlayheadCallback) {
      this.currentPlayheadCallback(currentBeat);
    }

    const nextBeat = (currentBeat + 1) % 16;
    
    this.schedulerTimer = setTimeout(() => {
      this.animatePlayhead(nextBeat, secondsPerBeat);
    }, secondsPerBeat * 1000);
  }
}
