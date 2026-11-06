import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { site } from '../data/site'
import { useLang } from '../i18n'

// 支援 Spotify 與 YouTube 播放清單連結，轉成嵌入網址
function playerEmbed(url: string): { src: string; kind: 'spotify' | 'youtube' } | null {
  const sp = url.match(/open\.spotify\.com\/(playlist|album|track)\/([A-Za-z0-9]+)/)
  if (sp) return { kind: 'spotify', src: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}?theme=0` }
  const yt = url.match(/youtu(?:\.be|be\.com)\/.*[?&]list=([A-Za-z0-9_-]+)/)
  if (yt) return { kind: 'youtube', src: `https://www.youtube.com/embed/videoseries?list=${yt[1]}` }
  return null
}

const wood = (c = 0x8a5a3c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })

function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = m.receiveShadow = true
  return m
}

function buildRoom() {
  const g = new THREE.Group()
  const wall = new THREE.MeshStandardMaterial({ color: 0xe9dcc6, roughness: 0.95 })

  // 地板、地毯、牆
  g.add(box(8, 0.1, 8, wood(0xb98b62), 0, -0.05, 0))
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.02, 48), new THREE.MeshStandardMaterial({ color: 0x9c4a32, roughness: 1 }))
  rug.position.set(0.3, 0.01, 0.9)
  rug.receiveShadow = true
  g.add(rug)
  g.add(box(8, 4, 0.1, wall, 0, 2, -4)) // 後牆
  g.add(box(0.1, 4, 8, wall, -4, 2, 0)) // 左牆

  // 窗戶（後牆）：發光的夜空藍
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ color: 0x9fc4e8 }))
  win.position.set(1.6, 2.3, -3.94)
  g.add(win)
  const frame = wood(0x5a3a26)
  g.add(box(2.4, 0.1, 0.12, frame, 1.6, 3.15, -3.93), box(2.4, 0.1, 0.12, frame, 1.6, 1.45, -3.93))
  g.add(box(0.1, 1.8, 0.12, frame, 0.45, 2.3, -3.93), box(0.1, 1.8, 0.12, frame, 2.75, 2.3, -3.93), box(0.06, 1.7, 0.12, frame, 1.6, 2.3, -3.93))

  // 書桌
  const desk = wood(0x6b4429)
  g.add(box(2.6, 0.12, 1.1, desk, -1.2, 1.0, -3.2))
  for (const [x, z] of [[-2.4, -3.65], [-2.4, -2.75], [0, -3.65], [0, -2.75]]) g.add(box(0.1, 1.0, 0.1, desk, x, 0.5, z))
  // 螢幕與鍵盤
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.4 })
  g.add(box(1.0, 0.6, 0.05, dark, -1.2, 1.5, -3.5), box(0.08, 0.22, 0.08, dark, -1.2, 1.16, -3.5))
  g.add(box(0.95, 0.04, 0.3, new THREE.MeshStandardMaterial({ color: 0x3a3a40 }), -1.2, 1.08, -3.05))
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.52), new THREE.MeshBasicMaterial({ color: 0x2b3a55 }))
  screen.position.set(-1.2, 1.5, -3.472)
  g.add(screen)
  // 馬克杯
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.15, 20), new THREE.MeshStandardMaterial({ color: 0xf4efe6 }))
  mug.position.set(-0.3, 1.14, -3.0)
  mug.castShadow = true
  g.add(mug)

  // 椅子
  const chair = wood(0x3d5a4a)
  g.add(box(0.7, 0.1, 0.7, chair, -1.2, 0.6, -2.2), box(0.7, 0.8, 0.08, chair, -1.2, 1.0, -1.88))
  for (const [x, z] of [[-1.5, -2.5], [-0.9, -2.5], [-1.5, -1.9], [-0.9, -1.9]]) g.add(box(0.06, 0.55, 0.06, chair, x, 0.28, z))

  // 書架（左牆）+ 書
  const shelf = wood(0x5a3a26)
  g.add(box(0.5, 3.0, 2.2, shelf, -3.7, 1.5, -0.5))
  const colors = [0xc0583a, 0x3d6b8a, 0xd8a94a, 0x5a8a5e, 0x7a4a7a, 0xe0d3b8]
  for (let row = 0; row < 4; row++) {
    g.add(box(0.5, 0.05, 2.2, shelf, -3.7, 0.4 + row * 0.7, -0.5))
    let z = -1.5
    for (let i = 0; i < 7; i++) {
      const w = 0.1 + ((i * 7 + row * 3) % 5) * 0.025
      const h = 0.4 + ((i * 3 + row) % 4) * 0.06
      g.add(box(0.28, h, w, new THREE.MeshStandardMaterial({ color: colors[(i + row) % colors.length], roughness: 0.8 }), -3.58, 0.43 + row * 0.7 + h / 2, z))
      z += w + 0.04
    }
  }

  // 黑膠唱機（會轉）+ 小邊櫃
  g.add(box(1.4, 0.7, 0.6, wood(0x7a5233), 2.6, 0.35, -3.5))
  g.add(box(0.8, 0.08, 0.55, dark, 2.45, 0.74, -3.5))
  const record = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.015, 40), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.3 }))
  record.position.set(2.45, 0.8, -3.5)
  record.name = 'record'
  g.add(record)
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 24), new THREE.MeshStandardMaterial({ color: 0xc0583a }))
  label.position.y = 0.002
  record.add(label)

  // 植物
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.4, 20), new THREE.MeshStandardMaterial({ color: 0xc27b52 }))
  pot.position.set(3.4, 0.2, -2.2)
  pot.castShadow = true
  g.add(pot)
  const leaf = new THREE.MeshStandardMaterial({ color: 0x4f8a4f, roughness: 0.8 })
  for (let i = 0; i < 7; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), leaf)
    const a = (i / 7) * Math.PI * 2
    l.position.set(3.4 + Math.cos(a) * 0.2, 0.7 + (i % 3) * 0.2, -2.2 + Math.sin(a) * 0.2)
    l.scale.set(0.7, 1.3, 0.7)
    l.castShadow = true
    g.add(l)
  }

  // 沙發椅 / 懶骨頭
  const bean = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), new THREE.MeshStandardMaterial({ color: 0xd9a05b, roughness: 1 }))
  bean.scale.y = 0.65
  bean.position.set(0.3, 0.35, 0.9)
  bean.castShadow = true
  g.add(bean)

  return g
}

export function Workspace() {
  const { t } = useLang()
  const mount = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(true)
  const embed = playerEmbed(site.playlistUrl)

  // 進入這頁時整頁變成滿版 3D（隱藏頁尾、鎖住捲動）
  useEffect(() => {
    document.body.classList.add('cowork')
    return () => document.body.classList.remove('cowork')
  }, [])

  useEffect(() => {
    const el = mount.current
    if (!el) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x2a2118)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50)
    camera.position.set(4.5, 3.6, 5.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.2, -1)
    controls.enableDamping = true
    controls.minDistance = 3
    controls.maxDistance = 11
    controls.maxPolarAngle = Math.PI / 2 - 0.05
    controls.minAzimuthAngle = -0.2
    controls.maxAzimuthAngle = Math.PI / 2 + 0.2

    const room = buildRoom()
    scene.add(room)

    // 燈光：柔和環境光 + 檯燈暖光 + 窗外光
    scene.add(new THREE.HemisphereLight(0xfff1dc, 0x5a4636, 0.9))
    const lamp = new THREE.PointLight(0xffb667, 14, 9, 1.6)
    lamp.position.set(-2.2, 1.9, -3.2)
    lamp.castShadow = true
    scene.add(lamp)
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }))
    bulb.position.copy(lamp.position)
    scene.add(bulb)
    const sun = new THREE.DirectionalLight(0xbcd8ff, 1.1)
    sun.position.set(3, 4, -2)
    scene.add(sun)

    function resize() {
      const w = el!.clientWidth
      const h = el!.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const record = room.getObjectByName('record')!
    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      const t = clock.getElapsedTime()
      record.rotation.y = t * 1.5
      lamp.intensity = 14 + Math.sin(t * 2) * 0.4 // 燈光微微呼吸
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <section className="workspace">
      <h1 className="visually-hidden">{t('cowork.title')}</h1>
      <div className="stage" ref={mount} />
      <p className="stage-hint">{t('cowork.hint')}</p>
      <div className="player-float">
        {embed ? (
          <>
            <iframe
              className={`player ${embed.kind}`}
              style={open ? undefined : { display: 'none' }}
              title={t('cowork.playlist')}
              src={embed.src}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
            <button type="button" className="player-toggle" onClick={() => setOpen(!open)}>
              {open ? t('cowork.minimize') : t('cowork.expand')}
            </button>
          </>
        ) : (
          <p className="player-error">{t('cowork.badUrl')}</p>
        )}
      </div>
    </section>
  )
}
