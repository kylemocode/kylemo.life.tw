// 紅白機（NES）風格的背景音樂：全部用 Web Audio 現場合成，不需要音檔。
// 聲道和 NES 一樣：兩個脈衝波（主旋律 50%、和弦切分 25%）、一個三角波（貝斯）、一個雜訊（鼓）。
// 曲子是原創的 8 小節循環，D 大調、126 BPM，迪斯可／放克的律動：
// 每拍一下大鼓、第 2 4 拍拍手、反拍開放 hi-hat、八度切分貝斯、十六分音符的和弦切分。
// 和弦：D Bm Em A / D Bm G A

const BPM = 126
const STEP = 60 / BPM / 4 // 十六分音符的秒數

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
function midi(name: string) {
  const m = name.match(/^([A-G])(#?)(\d)$/)!
  return 12 * (Number(m[3]) + 1) + NOTE_INDEX[m[1]] + (m[2] ? 1 : 0)
}
const freq = (n: number) => 440 * 2 ** ((n - 69) / 12)

// 主旋律：每格是一個十六分音符，'-' 延長前一個音，'.' 休止
const MELODY = [
  'F#5 - . F#5 A5 - . D6 - - A5 . F#5 - - .',
  'D6 - . D6 C#6 B5 - . F#5 - - D5 . F#5 - -',
  'E6 - . E6 D6 B5 - . G5 - A5 B5 - - . .',
  'C#6 - - . E6 - D6 C#6 A5 - - . E5 - A5 .',
  'F#5 - . F#5 A5 - . D6 - - F#6 - E6 D6 - .',
  'D6 - . D6 C#6 B5 - . F#5 - B5 - D6 - - .',
  'B5 - . B5 D6 - . G6 - - F#6 E6 D6 - B5 .',
  'E6 - D6 - C#6 - A5 - E5 - . E5 A5 - - .',
].map((b) => b.split(' '))
// 每小節的和弦音（切分用），以及貝斯的根音
const CHORDS: { root: string; tones: string[] }[] = [
  { root: 'D', tones: ['A4', 'D5', 'F#5'] },
  { root: 'B', tones: ['B4', 'D5', 'F#5'] },
  { root: 'E', tones: ['B4', 'E5', 'G5'] },
  { root: 'A', tones: ['A4', 'C#5', 'E5'] },
  { root: 'D', tones: ['A4', 'D5', 'F#5'] },
  { root: 'B', tones: ['B4', 'D5', 'F#5'] },
  { root: 'G', tones: ['B4', 'D5', 'G5'] },
  { root: 'A', tones: ['A4', 'C#5', 'E5'] },
]
// 貝斯（三角波）：[step, 距離根音的半音數]，經典的八度切分
const BASS: [number, number][] = [[0, 0], [2, 12], [3, 0], [6, 12], [8, 0], [10, 12], [11, 0], [14, 7]]
// 和弦切分出現的 step（反拍和十六分音符）
const STABS = new Set([3, 6, 7, 10, 11, 14])

type Note = { step: number; len: number; midi: number }
const LEAD: Note[] = []
MELODY.forEach((bar, b) => {
  bar.forEach((tok, i) => {
    const step = b * 16 + i
    if (tok === '.') return
    if (tok === '-') {
      const last = LEAD[LEAD.length - 1]
      if (last) last.len += 1
      return
    }
    LEAD.push({ step, len: 1, midi: midi(tok) })
  })
})
const TOTAL = 8 * 16

function pulse(ctx: AudioContext, duty: number) {
  const N = 32
  const real = new Float32Array(N)
  const imag = new Float32Array(N)
  for (let n = 1; n < N; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty)
  return ctx.createPeriodicWave(real, imag)
}

class Engine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private wave50!: PeriodicWave
  private wave25!: PeriodicWave
  private noise!: AudioBuffer
  private timer = 0
  private nextStep = 0
  private nextTime = 0
  playing = false

  // iOS：Web Audio 預設受靜音開關影響，而且要在點擊當下啟動。
  // 把音訊分類切到 playback，並同時放一段無聲的 <audio>，手機才會出聲
  private unlock() {
    try {
      const nav = navigator as unknown as { audioSession?: { type: string } }
      if (nav.audioSession) nav.audioSession.type = 'playback'
    } catch { /* 不支援就略過 */ }
    try {
      if (!this.keep) {
        const rate = 8000
        const n = rate // 1 秒
        const buf = new ArrayBuffer(44 + n)
        const v = new DataView(buf)
        const w = (o: number, str: string) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
        w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ')
        v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
        v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true)
        w(36, 'data'); v.setUint32(40, n, true)
        new Uint8Array(buf, 44).fill(128)
        const a = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })))
        a.loop = true
        a.setAttribute('playsinline', '')
        this.keep = a
      }
      void this.keep.play().catch(() => {})
    } catch { /* 略過 */ }
  }

  private keep: HTMLAudioElement | null = null

  start() {
    if (this.playing) return
    this.unlock()
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      // 脈衝波高頻很刺耳，用低通濾掉一些，聽起來比較圓潤
      const lp = this.ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 3600
      this.master.connect(lp).connect(this.ctx.destination)
      this.wave50 = pulse(this.ctx, 0.5)
      this.wave25 = pulse(this.ctx, 0.25)
      const len = this.ctx.sampleRate
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = this.noise.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    }
    const ctx = this.ctx
    void ctx.resume()
    // 部分 iOS 版本要先實際送一個極短的聲音，才會真正開始輸出
    const kick = ctx.createBufferSource()
    kick.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    kick.connect(ctx.destination)
    kick.start(0)
    this.master.gain.cancelScheduledValues(ctx.currentTime)
    this.master.gain.setValueAtTime(0, ctx.currentTime)
    this.master.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3)
    this.nextStep = 0
    this.nextTime = ctx.currentTime + 0.08
    this.playing = true
    this.timer = window.setInterval(() => this.tick(), 25)
    this.tick()
  }

  stop() {
    if (!this.playing || !this.ctx) return
    this.playing = false
    window.clearInterval(this.timer)
    const ctx = this.ctx
    this.master.gain.cancelScheduledValues(ctx.currentTime)
    this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime)
    this.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25)
    window.setTimeout(() => {
      if (!this.playing) {
        void ctx.suspend()
        this.keep?.pause()
      }
    }, 320)
  }

  // 分頁切到背景時暫停，回來再接著播
  pause() {
    if (this.playing && this.ctx) {
      void this.ctx.suspend()
      this.keep?.pause()
    }
  }
  resume() {
    if (this.playing && this.ctx) {
      void this.ctx.resume()
      void this.keep?.play().catch(() => {})
    }
  }

  private tick() {
    const ctx = this.ctx
    if (!ctx || !this.playing) return
    while (this.nextTime < ctx.currentTime + 0.2) {
      this.schedule(this.nextStep, this.nextTime)
      this.nextStep = (this.nextStep + 1) % TOTAL
      this.nextTime += STEP
    }
  }

  private schedule(step: number, t: number) {
    const bar = Math.floor(step / 16)
    const pos = step % 16
    const chord = CHORDS[bar]

    // 主旋律（方波）
    for (const n of LEAD) if (n.step === step) this.tone(this.wave50, freq(n.midi), t, n.len * STEP * 0.92, 0.3)

    // 和弦切分（25% 脈衝波，短促，像放克吉他的切音）
    if (STABS.has(pos)) for (const tn of chord.tones) this.tone(this.wave25, freq(midi(tn)), t, STEP * 0.7, 0.07)

    // 貝斯（三角波）
    for (const [s, semi] of BASS) if (s === pos) this.bass(freq(midi(chord.root + '2') + 12 + semi), t, STEP * 1.7)

    // 鼓：每拍大鼓；第 2、4 拍拍手；反拍開放 hi-hat；其餘十六分音符輕輕的 hi-hat
    if (pos % 4 === 0) this.kick(t)
    if (pos === 4 || pos === 12) this.drum(t, 0.12, 1800, 0.22)
    if (pos % 4 === 2) this.drum(t, 0.07, 7000, 0.07)
    else if (pos % 2 === 1) this.drum(t, 0.025, 8000, 0.025)
  }

  private tone(wave: PeriodicWave, f: number, t: number, dur: number, vol: number) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.setPeriodicWave(wave)
    osc.frequency.value = f
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.006)
    g.gain.exponentialRampToValueAtTime(vol * 0.6, t + Math.min(0.2, dur * 0.7))
    g.gain.linearRampToValueAtTime(0, t + dur)
    osc.connect(g).connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private bass(f: number, t: number, dur: number) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = f
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.75, t)
    g.gain.setValueAtTime(0.75, t + dur * 0.7)
    g.gain.linearRampToValueAtTime(0, t + dur)
    osc.connect(g).connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  // 大鼓：正弦波音高快速下滑
  private kick(t: number) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(160, t)
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.1)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.9, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
    osc.connect(g).connect(this.master)
    osc.start(t)
    osc.stop(t + 0.18)
  }

  private drum(t: number, dur: number, cutoff: number, vol: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = cutoff / 2
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(filter).connect(g).connect(this.master)
    src.start(t, Math.random() * 0.5)
    src.stop(t + dur + 0.02)
  }
}

export const music = new Engine()
