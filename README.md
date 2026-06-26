# VividGrasp — Interactive Web Demo

A browser recreation of the [VividGrasp](https://github.com/LenekyRadish/VividGrasp) PyBullet sorting simulation
(Stanford AI4ALL). A 2-axis robotic arm picks tennis balls, baseballs, and ping-pong balls off a table and
sorts each into its matching color-coded tray. The site mirrors the original Python sim's geometry,
ball specs, inverse kinematics, and HSV color-detection pipeline — all in-browser with no backend.

## Run locally

Open `index.html` directly in any modern browser (Chrome, Safari, Firefox, Edge).
No build step, no dev server required.

If your browser blocks loading from `file://`, run a tiny static server:

```sh
cd vividgrasp-web
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Controls

- **▶ Play** — start the auto-sort routine. Press again to pause.
- **+ Tennis / + Baseball / + Ping Pong** — drop another ball on the table.
- **Reset** — clear the table and re-center the arm.
- **Mouse drag** — orbit the camera.  **Scroll** — zoom.

The right sidebar shows the simulated overhead "camera view" and three live HSV color masks —
one per ball type — produced exactly the way `hsv_masking.py` does in the original repo.

## Deploy to GitHub Pages

Push this folder to a repo (or to `/docs` of an existing repo), then in the repo settings turn
on Pages → `main` / root (or `/docs`). No build step needed.

## Mapping back to the Python repo

| Python source                | Browser equivalent (main.js)                       |
|------------------------------|----------------------------------------------------|
| `constants.py` ball radii    | `BALL_SPECS`                                        |
| `simulate_objects.py`        | `spawnBall()`, `randomSafePosition()`, tray meshes |
| 2-axis arm URDF              | `arm` group: base + yaw + shoulder + elbow links   |
| PyBullet IK                  | `ik()` — closed-form 2-link planar solution        |
| Sinusoidal motion plan       | `easeSinusoidal()` + `tickMove()`                  |
| Fixed-constraint pickup      | `routine.target.attached` snap-to-end-effector    |
| `hsv_masking.py`             | `runDetector()` — render target + `rgbToHsv()`    |
