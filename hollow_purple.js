/*
 * Backrooms — Hollow Purple (procedural, no image assets required)
 *
 * This file intentionally uses browser JavaScript rather than TypeScript at runtime.
 * TypeScript is not required for HTML buttons; GitHub Pages can run this file directly.
 *
 * Integration: add before the final </body> tag in index.html:
 *   <script src="hollow_purple.js"></script>
 *
 * Controls after integration:
 *   P = charge/fire
 *   The HUD button can also be clicked.
 */
(function () {
    'use strict';

    const STYLE_ID = 'hollow-purple-style';
    const BUTTON_ID = 'hollow-purple-button';
    const STATUS_ID = 'hollow-purple-status';

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${BUTTON_ID} {
                display:none;
                width:100%;
                margin-top:10px;
                padding:11px 14px;
                border:2px solid #c78cff;
                border-radius:7px;
                background:linear-gradient(90deg,#25104b,#6f1bd1,#28104e);
                color:#fff;
                font:700 13px 'Courier New',monospace;
                letter-spacing:2px;
                text-shadow:0 0 8px #fff,0 0 16px #c78cff;
                box-shadow:0 0 10px rgba(169,73,255,.55), inset 0 0 18px rgba(255,255,255,.08);
                cursor:pointer;
                transition:.18s ease;
                pointer-events:auto;
            }
            #${BUTTON_ID}:hover { transform:scale(1.02); box-shadow:0 0 22px rgba(196,125,255,.95); }
            #${BUTTON_ID}:active { transform:scale(.98); }
            #${BUTTON_ID}.charging {
                animation: hpPulse .42s ease-in-out infinite alternate;
            }
            @keyframes hpPulse {
                from { filter:brightness(1); }
                to   { filter:brightness(1.65); }
            }
            #${STATUS_ID} {
                position:fixed;
                left:50%;
                top:16%;
                transform:translate(-50%,-50%) scale(.75);
                color:#fff;
                font:900 clamp(22px,4vw,46px) 'Courier New',monospace;
                letter-spacing:5px;
                text-align:center;
                text-shadow:0 0 6px #fff,0 0 16px #ba64ff,0 0 32px #6a00ff;
                opacity:0;
                pointer-events:none;
                z-index:300;
                white-space:nowrap;
            }
            #${STATUS_ID}.show {
                animation: hpTitle 1.2s ease-out forwards;
            }
            @keyframes hpTitle {
                0% { opacity:0; transform:translate(-50%,-50%) scale(.55); filter:blur(5px); }
                22% { opacity:1; transform:translate(-50%,-50%) scale(1.08); filter:blur(0); }
                70% { opacity:1; transform:translate(-50%,-50%) scale(1); }
                100% { opacity:0; transform:translate(-50%,-55%) scale(1.15); }
            }
        `;
        document.head.appendChild(style);
    }

    function ensureUi() {
        injectStyle();
        if (!document.getElementById(STATUS_ID)) {
            const label = document.createElement('div');
            label.id = STATUS_ID;
            label.textContent = 'IMAGINARY TECHNIQUE: HOLLOW PURPLE';
            document.body.appendChild(label);
        }

        if (document.getElementById(BUTTON_ID)) return;
        const hud = document.getElementById('hud');
        if (!hud) return;

        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.type = 'button';
        button.textContent = '◎  HOLLOW PURPLE  [P]';
        button.addEventListener('click', function () {
            fire();
        });
        hud.appendChild(button);
    }

    function setHudVisible(visible) {
        const button = document.getElementById(BUTTON_ID);
        if (!button) return;
        button.style.display = visible ? 'block' : 'none';
    }

    function showTitle() {
        const label = document.getElementById(STATUS_ID);
        if (!label) return;
        label.classList.remove('show');
        void label.offsetWidth;
        label.classList.add('show');
    }

    function shakeScreen() {
        const root = document.body;
        root.animate([
            { transform:'translate(0,0)' },
            { transform:'translate(5px,-3px)' },
            { transform:'translate(-6px,4px)' },
            { transform:'translate(4px,2px)' },
            { transform:'translate(-3px,-2px)' },
            { transform:'translate(0,0)' }
        ], { duration:260, easing:'ease-out' });
    }

    function playTone(type) {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'charge') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(820, now + .75);
                gain.gain.setValueAtTime(.0001, now);
                gain.gain.exponentialRampToValueAtTime(.12, now + .12);
                gain.gain.exponentialRampToValueAtTime(.0001, now + .82);
                osc.start(now);
                osc.stop(now + .85);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1000, now);
                osc.frequency.exponentialRampToValueAtTime(90, now + .5);
                gain.gain.setValueAtTime(.0001, now);
                gain.gain.exponentialRampToValueAtTime(.28, now + .02);
                gain.gain.exponentialRampToValueAtTime(.0001, now + .55);
                osc.start(now);
                osc.stop(now + .58);
            }
            setTimeout(() => { try { ctx.close(); } catch (_) {} }, 1000);
        } catch (_) {}
    }

    function makeEnergySphere(color, radius) {
        const group = new THREE.Group();
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 32, 32),
            new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.95 })
        );
        group.add(core);

        const shell = new THREE.Mesh(
            new THREE.SphereGeometry(radius * 1.35, 32, 32),
            new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.12, blending:THREE.AdditiveBlending, depthWrite:false })
        );
        group.add(shell);

        const light = new THREE.PointLight(color, 4.5, 12);
        group.add(light);

        return group;
    }

    function createPurpleProjectile(origin, direction) {
        const group = new THREE.Group();
        group.position.copy(origin);

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(.65, 32, 32),
            new THREE.MeshBasicMaterial({ color:0xeee6ff })
        );
        group.add(core);

        const aura = new THREE.Mesh(
            new THREE.SphereGeometry(1.45, 40, 40),
            new THREE.MeshBasicMaterial({ color:0x8f2dff, transparent:true, opacity:.2, blending:THREE.AdditiveBlending, depthWrite:false })
        );
        group.add(aura);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.1, .05, 12, 64),
            new THREE.MeshBasicMaterial({ color:0xf2d7ff, transparent:true, opacity:.9, blending:THREE.AdditiveBlending })
        );
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const pointLight = new THREE.PointLight(0x9b35ff, 8, 24);
        group.add(pointLight);

        group.userData.direction = direction.clone().normalize();
        group.userData.speed = 62;
        group.userData.life = 1.6;
        group.userData.radius = 2.2;
        group.userData.rings = [ring];
        return group;
    }

    function explodePurple(position) {
        const burst = new THREE.Group();
        burst.position.copy(position);
        scene.add(burst);

        const center = new THREE.Mesh(
            new THREE.SphereGeometry(.5, 20, 20),
            new THREE.MeshBasicMaterial({ color:0xffffff })
        );
        burst.add(center);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.2, .09, 12, 64),
            new THREE.MeshBasicMaterial({ color:0xb86cff, transparent:true, opacity:.9, blending:THREE.AdditiveBlending })
        );
        burst.add(ring);

        const particles = [];
        for (let i = 0; i < 34; i++) {
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(.06 + Math.random() * .08, 8, 8),
                new THREE.MeshBasicMaterial({ color: i % 2 ? 0x8f2dff : 0xffffff, transparent:true, opacity:1, blending:THREE.AdditiveBlending })
            );
            mesh.position.set(0,0,0);
            mesh.userData.v = new THREE.Vector3(
                (Math.random()-.5) * 20,
                (Math.random()-.5) * 20,
                (Math.random()-.5) * 20
            );
            burst.add(mesh);
            particles.push(mesh);
        }

        const started = performance.now();
        function animateBurst(now) {
            const t = (now - started) / 1000;
            const scale = 1 + t * 7;
            ring.scale.set(scale, scale, scale);
            ring.rotation.x += .07;
            for (const p of particles) {
                p.position.addScaledVector(p.userData.v, .016);
                p.material.opacity = Math.max(0, 1 - t * 1.5);
            }
            center.scale.setScalar(Math.max(0.05, 1 + t * 9));
            center.material.opacity = Math.max(0, 1 - t * 3);
            if (t < .75) requestAnimationFrame(animateBurst);
            else scene.remove(burst);
        }
        requestAnimationFrame(animateBurst);
    }

    function damageEntity(position) {
        try {
            if (typeof entity !== 'undefined' && entity && entityActive) {
                const hit = entity.position.distanceTo(position) < 8;
                if (hit) {
                    entityActive = false;
                    entity.visible = false;
                    if (typeof showToast === 'function') showToast('THE ENTITY WAS ERASED');
                }
            }
        } catch (_) {}
    }

    let firing = false;
    function fire() {
        if (firing) return;
        if (typeof THREE === 'undefined' || typeof scene === 'undefined' || typeof camera === 'undefined') return;
        if (typeof gameActive !== 'undefined' && !gameActive) return;

        firing = true;
        const button = document.getElementById(BUTTON_ID);
        if (button) {
            button.disabled = true;
            button.classList.add('charging');
            button.textContent = '◎  CHARGING...';
        }
        showTitle();
        playTone('charge');

        let chargeA, chargeB;
        try {
            const offset = new THREE.Vector3(.95, -.15, -1.9).applyQuaternion(camera.quaternion);
            const start = camera.position.clone().add(offset);
            const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(.75);
            chargeA = makeEnergySphere(0x2f69ff, .72);
            chargeB = makeEnergySphere(0xff3158, .72);
            chargeA.position.copy(start).add(right);
            chargeB.position.copy(start).sub(right);
            scene.add(chargeA, chargeB);
        } catch (_) {}

        const started = performance.now();
        const chargeDuration = 760;
        function animateCharge(now) {
            const t = Math.min(1, (now - started) / chargeDuration);
            if (chargeA && chargeB) {
                const offset = new THREE.Vector3(.95 * (1-t), -.15, -1.9).applyQuaternion(camera.quaternion);
                const start = camera.position.clone().add(offset);
                const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(.85 * (1-t));
                chargeA.position.lerp(start.clone().add(right), .2);
                chargeB.position.lerp(start.clone().sub(right), .2);
                chargeA.scale.setScalar(1 + t * .3);
                chargeB.scale.setScalar(1 + t * .3);
            }

            if (t < 1) requestAnimationFrame(animateCharge);
            else release();
        }
        requestAnimationFrame(animateCharge);

        function release() {
            try {
                if (chargeA) scene.remove(chargeA);
                if (chargeB) scene.remove(chargeB);

                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);
                const projectile = createPurpleProjectile(camera.position.clone().add(direction.clone().multiplyScalar(2)), direction);
                scene.add(projectile);
                playTone('fire');
                shakeScreen();
                const startedFire = performance.now();

                function animateProjectile(now) {
                    const dt = Math.min(.033, (now - animateProjectile.last) / 1000 || .016);
                    animateProjectile.last = now;
                    projectile.position.addScaledVector(projectile.userData.direction, projectile.userData.speed * dt);
                    projectile.rotation.x += dt * 5;
                    projectile.rotation.y += dt * 9;
                    projectile.userData.life -= dt;

                    try { damageEntity(projectile.position); } catch (_) {}

                    if (projectile.userData.life <= 0) {
                        const pos = projectile.position.clone();
                        scene.remove(projectile);
                        explodePurple(pos);
                        shakeScreen();
                        firing = false;
                        if (button) {
                            button.disabled = false;
                            button.classList.remove('charging');
                            button.textContent = '◎  HOLLOW PURPLE  [P]';
                        }
                        return;
                    }
                    requestAnimationFrame(animateProjectile);
                }
                animateProjectile.last = startedFire;
                requestAnimationFrame(animateProjectile);
            } catch (_) {
                firing = false;
                if (button) {
                    button.disabled = false;
                    button.classList.remove('charging');
                    button.textContent = '◎  HOLLOW PURPLE  [P]';
                }
            }
        }
    }

    function bindKeyboard() {
        document.addEventListener('keydown', function (event) {
            if (event.repeat) return;
            if (event.code === 'KeyP') {
                event.preventDefault();
                fire();
            }
        });
    }

    function watchGameState() {
        setHudVisible(typeof gameActive === 'undefined' ? true : !!gameActive);
        setTimeout(watchGameState, 300);
    }

    function init() {
        ensureUi();
        bindKeyboard();
        watchGameState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once:true });
    } else {
        init();
    }
})();
