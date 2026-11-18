<p align="center"><img src="docs/readme/hero.jpg" width="100%" alt="Upright. Sit up straight. Your webcam keeps count."></p>

<p align="center"><img src="docs/readme/demo.gif" width="100%" alt="A skeleton in front of the camera sways, pushes the head forward and tilts the shoulders while the posture score reacts"></p>

<p align="center"><img src="docs/readme/live.jpg" width="100%" alt="Feedback while you work, not a lecture after"></p>

<p align="center"><img src="docs/readme/app-live.gif" width="100%" alt="The real app in demo mode: a synthetic figure slouches and the live view highlights it"></p>

<p align="center"><img src="docs/readme/breaks.jpg" width="100%" alt="Breaks that fit the day"></p>

<p align="center"><img src="docs/readme/stats.jpg" width="100%" alt="See the pattern, not just the minute"></p>

<p align="center"><img src="docs/readme/care.jpg" width="100%" alt="Knows when an app is not enough"></p>

<p align="center"><img src="docs/readme/engineering.jpg" width="100%" alt="Small, local, and private by design"></p>

<p align="center"><img src="docs/readme/run.jpg" width="100%" alt="Running on your machine in a minute"></p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-44-47848F" alt="Electron 44">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6" alt="TypeScript">
  <img src="https://img.shields.io/badge/MediaPipe-Pose%20%2B%20Face-0F9D58" alt="MediaPipe">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS-555" alt="Windows and macOS">
</p>

<details>
<summary><b>Run it</b></summary>

<br>

Node.js 22.13 or newer and a webcam.

```bash
npm install
npm start          # build and open the app
npm run demo       # no camera: a synthetic figure that slouches now and then
npm run seed-demo  # 12 days of sample data in ./demo-data, then: npm run demo:stats
npm test           # unit tests for the analysis core
npm run dist:win   # installer (.exe), or dist:mac for a .dmg
```

The MediaPipe models ship in `assets/models`, so the app works offline. On first start it asks you to calibrate your upright posture; the window closes to the tray and the analysis keeps running.

</details>

<details>
<summary><b>How the score works</b></summary>

<br>

The camera usually sits on the monitor, so it sees you from the front. Every metric is measured against your own calibration:

| Metric | Measured as | Warning at |
| --- | --- | --- |
| Head forward | nose to shoulder line ÷ shoulder width, plus head pitch | 15% drop |
| Head tilted back | head pitch above calibration | 15° |
| Slouching | ear line above shoulders ÷ shoulder width | 10% drop |
| Shoulders raised | shoulders moving up towards the ears | 15% drop |
| Shoulder tilt | angle of the shoulder line | 5° |
| Too close to the screen | distance between the eyes in pixels | 15% larger face |
| Head tilt | angle of the eye line | 10° |
| Torso twist | shoulder width ÷ eye distance | 15% drop |
| Sitting still | head movement over 5 min | almost none for 30 min |

Score = 100 × (1 − weighted penalties ÷ 0.6), smoothed over about 12 s. Fatigue combines PERCLOS, blink rate, long blinks, yawns, posture trend and time since the last break, and is hidden when the eye data is unreliable. It is a habit tool, not a medical diagnosis.

</details>
