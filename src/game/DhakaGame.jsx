/**
 * Dhaka Dhamaka 3D: Real Bangladesh
 * Complete 3D Open-City Driving Game Engine & Interactive React Interface
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { VEHICLE_CONFIGS, createVehicleMesh } from './vehicles.js';
import { buildDhakaCity } from './city.js';
import { TrafficManager } from './traffic.js';
import { soundManager } from './audio.js';
import {
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  Play,
  Pause,
  Award,
  Zap,
  Navigation,
  Compass,
  Gauge,
  Sliders,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// Pre-allocated math helpers outside tick loop (Zero GC)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _playerBox = new THREE.Box3();

export default function DhakaGame({ initialVehicle = 'cng', onBackToMenu }) {
  const mountRef = useRef(null);

  // Game UI State
  const [selectedVehicle, setSelectedVehicle] = useState(initialVehicle);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState('high');
  const [cameraMode, setCameraMode] = useState('chase'); // 'chase', 'cockpit', 'topdown'
  const [gameMode, setGameMode] = useState('free'); // 'free', 'challenge'

  // HUD Realtime Values
  const [speedKmh, setSpeedKmh] = useState(0);
  const [gear, setGear] = useState('D');
  const [score, setScore] = useState(0);
  const [takaCash, setTakaCash] = useState(150);
  const [distanceKm, setDistanceKm] = useState(0);
  const [dialogueToast, setDialogueToast] = useState(null);
  const [hudCollapsed, setHudCollapsed] = useState(false);

  // Challenge Mode State
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(60);
  const [completedTrips, setCompletedTrips] = useState(0);
  const [challengeGameOver, setChallengeGameOver] = useState(false);

  // References for mutable game loop state
  const gameStateRef = useRef({
    vehicleType: initialVehicle,
    vehicleConfig: VEHICLE_CONFIGS[initialVehicle],
    vehicleMeshGroup: null,
    vehicleWheels: [],
    pos: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    speed: 0,
    steeringAngle: 0,
    targetSteering: 0,
    pitch: 0,
    roll: 0,
    gear: 'D',
    inputs: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      handbrake: false,
      horn: false,
    },
    distance: 0,
    score: 0,
    cash: 150,
    cameraMode: 'chase',
    gameMode: 'free',
    quality: 'high',
    cityData: null,
    trafficManager: null,
    shakeIntensity: 0,
    dialogueTimer: 0,
    targetWaypointIndex: 0,
    challengeTime: 60,
    isChallengeActive: false,
    tripsDone: 0,
    audioInitialized: false,
  });

  // Touch control helper handlers
  const handleTouchStart = (action) => {
    soundManager.ensureContext();
    gameStateRef.current.inputs[action] = true;
    if (action === 'horn') {
      soundManager.playHorn(gameStateRef.current.vehicleType);
      if (gameStateRef.current.trafficManager) {
        gameStateRef.current.trafficManager.reactToPlayerHorn(gameStateRef.current.pos);
      }
    }
  };

  const handleTouchEnd = (action) => {
    gameStateRef.current.inputs[action] = false;
  };

  // Switch Vehicle
  const switchVehicle = (vType) => {
    setSelectedVehicle(vType);
    gameStateRef.current.vehicleType = vType;
    gameStateRef.current.vehicleConfig = VEHICLE_CONFIGS[vType];

    // Rebuild mesh in scene
    const scene = sceneRef.current;
    if (scene && gameStateRef.current.vehicleMeshGroup) {
      scene.remove(gameStateRef.current.vehicleMeshGroup);
      const newMesh = createVehicleMesh(vType);
      newMesh.root.position.copy(gameStateRef.current.pos);
      newMesh.root.rotation.y = gameStateRef.current.yaw;
      scene.add(newMesh.root);
      gameStateRef.current.vehicleMeshGroup = newMesh.root;
      gameStateRef.current.vehicleWheels = newMesh.wheels;
    }

    soundManager.stopEngine();
    soundManager.startEngine(vType);
  };

  // Reset / Flip Vehicle
  const resetVehiclePosition = () => {
    const s = gameStateRef.current;
    s.pos.set(0, 0, 0);
    s.yaw = 0;
    s.speed = 0;
    s.pitch = 0;
    s.roll = 0;
    if (s.vehicleMeshGroup) {
      s.vehicleMeshGroup.position.set(0, 0, 0);
      s.vehicleMeshGroup.rotation.set(0, 0, 0);
    }
    showToast('গাড়ি মাঝরাস্তায় সোজা করা হয়েছে!', 'success');
  };

  const showToast = (message, type = 'collision') => {
    setDialogueToast({ message, type, time: Date.now() });
    setTimeout(() => {
      setDialogueToast((cur) => (cur && Date.now() - cur.time >= 2800 ? null : cur));
    }, 3000);
  };

  const sceneRef = useRef(null);

  // Setup Three.js Scene and Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl && graphicsQuality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Scene & Fog (Dhaka warm afternoon golden atmosphere)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x93c5fd); // Light tropical sky blue
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.0075);

    // 3. Studio Environment Map for PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.8); // Warm sun
    sunLight.position.set(60, 90, 40);
    sunLight.castShadow = !isSoftwareGl && graphicsQuality !== 'low';
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 250;
      const d = 60;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 0.9);
    scene.add(hemiLight);

    // 5. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 350);
    camera.position.set(0, 4, -8);

    // 6. City Builder
    const cityData = buildDhakaCity(scene, graphicsQuality);
    gameStateRef.current.cityData = cityData;

    // 7. AI Traffic Simulation
    const trafficManager = new TrafficManager(scene, graphicsQuality);
    gameStateRef.current.trafficManager = trafficManager;

    // 8. Player Vehicle
    const initialMesh = createVehicleMesh(gameStateRef.current.vehicleType);
    scene.add(initialMesh.root);
    gameStateRef.current.vehicleMeshGroup = initialMesh.root;
    gameStateRef.current.vehicleWheels = initialMesh.wheels;

    // 9. Input Listeners
    const handleKeyDown = (e) => {
      soundManager.ensureContext();
      if (!gameStateRef.current.audioInitialized) {
        soundManager.startEngine(gameStateRef.current.vehicleType);
        gameStateRef.current.audioInitialized = true;
      }

      const key = e.key.toLowerCase();
      const inputs = gameStateRef.current.inputs;

      if (key === 'w' || key === 'arrowup') inputs.forward = true;
      if (key === 's' || key === 'arrowdown') inputs.backward = true;
      if (key === 'a' || key === 'arrowleft') inputs.left = true;
      if (key === 'd' || key === 'arrowright') inputs.right = true;
      if (key === ' ' || key === 'space') inputs.handbrake = true;
      if (key === 'h') {
        soundManager.playHorn(gameStateRef.current.vehicleType);
        trafficManager.reactToPlayerHorn(gameStateRef.current.pos);
      }
      if (key === 'c') {
        setCameraMode((prev) => {
          const next = prev === 'chase' ? 'cockpit' : (prev === 'cockpit' ? 'topdown' : 'chase');
          gameStateRef.current.cameraMode = next;
          return next;
        });
      }
      if (key === 'r') resetVehiclePosition();
      if (key === 'p' || key === 'escape') setIsPaused((p) => !p);
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      const inputs = gameStateRef.current.inputs;

      if (key === 'w' || key === 'arrowup') inputs.forward = false;
      if (key === 's' || key === 'arrowdown') inputs.backward = false;
      if (key === 'a' || key === 'arrowleft') inputs.left = false;
      if (key === 'd' || key === 'arrowright') inputs.right = false;
      if (key === ' ' || key === 'space') inputs.handbrake = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Main Animation Loop with Clock & Delta
    const clock = new THREE.Clock();
    let frameId = 0;
    let lastHudSync = 0;
    let collisionCooldown = 0;

    function afterDraw(cb) {
      const gl = renderer.getContext();
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();
      const s = gameStateRef.current;

      if (!isPaused) {
        // --- VEHICLE PHYSICS ---
        const cfg = s.vehicleConfig;
        const inputs = s.inputs;

        // Steering logic
        let steerTarget = 0;
        if (inputs.left) steerTarget += 1;
        if (inputs.right) steerTarget -= 1;
        s.targetSteering = THREE.MathUtils.damp(s.targetSteering, steerTarget, 10, delta);
        s.steeringAngle = s.targetSteering * 0.55; // Radians

        // Turn vehicle (faster turn at medium speeds, slower at near-stop)
        const speedFactor = Math.min(Math.abs(s.speed) / 10, 1.0);
        const reverseFactor = s.speed < 0 ? -1 : 1;
        s.yaw += s.steeringAngle * cfg.turnSpeed * speedFactor * reverseFactor * delta;

        // Acceleration / Braking
        if (inputs.forward) {
          s.speed += cfg.acceleration * delta;
          if (s.speed > cfg.maxSpeed) s.speed = cfg.maxSpeed;
          s.gear = 'D';
        } else if (inputs.backward) {
          if (s.speed > 1) {
            // Braking
            s.speed -= cfg.braking * delta;
            soundManager.playBrake();
          } else {
            // Reverse
            s.speed -= cfg.acceleration * 0.6 * delta;
            if (s.speed < -cfg.maxSpeed * 0.4) s.speed = -cfg.maxSpeed * 0.4;
            s.gear = 'R';
          }
        } else {
          // Friction & Drag
          s.speed *= Math.pow(cfg.drag, delta * 60);
          if (Math.abs(s.speed) < 0.2) s.speed = 0;
          if (s.speed === 0) s.gear = 'N';
        }

        // Handbrake
        if (inputs.handbrake) {
          s.speed *= Math.pow(0.85, delta * 60);
          soundManager.playBrake();
        }

        // Update Position
        const forwardVector = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw));
        const moveDist = s.speed * delta;
        s.pos.addScaledVector(forwardVector, moveDist);
        s.distance += Math.abs(moveDist) / 1000; // km

        // Road boundaries / wrap or natural bounce
        if (Math.abs(s.pos.x) > 175) {
          s.pos.x = Math.sign(s.pos.x) * 174;
          s.speed *= -0.5;
        }
        if (Math.abs(s.pos.z) > 175) {
          s.pos.z = Math.sign(s.pos.z) * 174;
          s.speed *= -0.5;
        }

        // Vehicle pitch & roll (suspension reaction)
        const targetPitch = (inputs.forward ? -0.04 : (inputs.backward ? 0.05 : 0));
        const targetRoll = -s.steeringAngle * (s.speed / cfg.maxSpeed) * 0.12;
        s.pitch = THREE.MathUtils.damp(s.pitch, targetPitch, 8, delta);
        s.roll = THREE.MathUtils.damp(s.roll, targetRoll, 8, delta);

        // Update 3D Vehicle Object
        if (s.vehicleMeshGroup) {
          s.vehicleMeshGroup.position.copy(s.pos);
          s.vehicleMeshGroup.rotation.set(s.pitch, s.yaw, s.roll);

          // Spin Wheels
          if (s.vehicleWheels.length > 0) {
            const spin = (s.speed / 0.35) * delta;
            s.vehicleWheels.forEach((w, idx) => {
              w.rotation.x += spin;
              // Steer front wheels
              if (idx === 0) {
                w.rotation.y = s.steeringAngle;
              }
            });
          }
        }

        // Update Engine Sound
        soundManager.updateEngine(s.speed, cfg.maxSpeed);

        // --- COLLISION DETECTION ---
        collisionCooldown -= delta;
        if (collisionCooldown <= 0 && s.vehicleMeshGroup) {
          _playerBox.setFromObject(s.vehicleMeshGroup);

          // 1. Collide with City objects (Dividers, Buildings, Tea Stalls)
          for (let i = 0; i < cityData.colliders.length; i++) {
            const c = cityData.colliders[i];
            if (_playerBox.intersectsBox(c.box)) {
              collisionCooldown = 1.2;
              s.speed *= -0.4;
              s.shakeIntensity = 0.6;
              soundManager.playCollision(1.0);
              showToast(c.dialogue || 'এই ভাই, দেখে চালান!', 'collision');
              break;
            }
          }

          // 2. Collide with AI Traffic
          const trafficHit = trafficManager.checkPlayerCollision(_playerBox, forwardVector);
          if (trafficHit) {
            collisionCooldown = 1.2;
            s.speed *= -0.5;
            s.shakeIntensity = 0.7;
            soundManager.playCollision(1.2);
            showToast(trafficHit.dialogue, 'collision');
          }
        }

        // --- COLLECTIBLES CHECK ---
        cityData.collectibles.forEach((c) => {
          if (!c.collected && s.pos.distanceTo(c.mesh.position) < 2.5) {
            c.collected = true;
            cityData.cityGroup.remove(c.mesh);
            s.score += c.value;
            s.cash += c.type === 'tea' ? 30 : 20;
            soundManager.playCollect();
            showToast(
              c.type === 'tea' ? '☕ গরম রং চা পাওয়া গেছে! +৳৩০' : '🟡 কয়েন পাওয়া গেছে! +৳২০',
              'collect'
            );
          }
        });

        // --- CHALLENGE WAYPOINTS CHECK ---
        if (s.gameMode === 'challenge') {
          s.challengeTime -= delta;
          if (s.challengeTime <= 0) {
            setChallengeGameOver(true);
            s.isChallengeActive = false;
          }

          const currentWp = cityData.waypoints[s.targetWaypointIndex];
          if (currentWp && s.pos.distanceTo(currentWp.mesh.position) < currentWp.radius + 1.5) {
            // Waypoint reached!
            s.tripsDone += 1;
            s.score += 500;
            s.cash += 120;
            s.challengeTime += 35; // Add extra time
            soundManager.playCollect();
            showToast(`🎯 গন্তব্যে পৌঁছেছেন: ${currentWp.name}! +৳১২০`, 'success');

            // Pick next destination
            s.targetWaypointIndex = (s.targetWaypointIndex + 1) % cityData.waypoints.length;
            setChallengeTarget(cityData.waypoints[s.targetWaypointIndex]);
          }
        }

        // --- TRAFFIC UPDATE ---
        trafficManager.update(delta, s.pos);
        cityData.update(delta, time);

        // --- CAMERA CONTROLLER ---
        // Smooth camera follow with shake
        let shakeOffset = new THREE.Vector3();
        if (s.shakeIntensity > 0) {
          s.shakeIntensity = Math.max(s.shakeIntensity - delta * 2.0, 0);
          shakeOffset.set(
            (Math.random() - 0.5) * s.shakeIntensity * 0.8,
            (Math.random() - 0.5) * s.shakeIntensity * 0.8,
            (Math.random() - 0.5) * s.shakeIntensity * 0.8
          );
        }

        if (s.cameraMode === 'cockpit') {
          // Hood / Cockpit Cam
          const offset = cfg.cockpitOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw);
          camera.position.copy(s.pos).add(offset).add(shakeOffset);
          const lookAtPos = s.pos.clone().add(forwardVector.clone().multiplyScalar(15)).add(offset);
          camera.lookAt(lookAtPos);
        } else if (s.cameraMode === 'topdown') {
          // Drone / Overview Cam
          camera.position.set(s.pos.x, 38, s.pos.z - 8);
          camera.lookAt(s.pos);
        } else {
          // Third-Person Chase Cam
          const offset = cfg.cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw);
          _camPos.copy(s.pos).add(offset).add(shakeOffset);
          camera.position.lerp(_camPos, Math.min(delta * 6.5, 1));

          const lookOffset = cfg.lookOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw);
          _camTarget.copy(s.pos).add(lookOffset);
          camera.lookAt(_camTarget);
        }

        // Sync lights with player so shadows follow
        sunLight.position.set(s.pos.x + 50, 80, s.pos.z + 30);
        sunLight.target.position.copy(s.pos);
        sunLight.target.updateMatrixWorld();

        // --- HUD THROTTLED STATE UPDATE ---
        if (time - lastHudSync > 0.12) {
          lastHudSync = time;
          setSpeedKmh(Math.round(Math.abs(s.speed) * 2.2));
          setGear(s.gear);
          setDistanceKm(parseFloat(s.distance.toFixed(1)));
          setScore(s.score);
          setTakaCash(s.cash);
          setChallengeTimeLeft(Math.max(0, Math.ceil(s.challengeTime)));
          setCompletedTrips(s.tripsDone);
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    // Initial challenge target
    if (cityData.waypoints.length > 0) {
      setChallengeTarget(cityData.waypoints[0]);
    }

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      soundManager.cleanup();
      trafficManager.cleanup();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [graphicsQuality, isPaused]);

  // Audio Toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  // Start Challenge Mode
  const startChallengeMode = () => {
    const s = gameStateRef.current;
    s.gameMode = 'challenge';
    s.challengeTime = 60;
    s.isChallengeActive = true;
    s.tripsDone = 0;
    s.targetWaypointIndex = 0;
    setGameMode('challenge');
    setChallengeGameOver(false);
    showToast('ধামাকা ট্রিপ শুরু! সময় শেষ হওয়ার আগে পৌঁছান!', 'success');
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* TOP BAR / GAME STATUS (Compact & Glassmorphic) */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none z-20">
        {/* Left: Branding & Game Mode */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="hud-panel rounded-xl px-4 py-2 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-2">
                ঢাকা ধামাকা ৩ডি <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">PRO</span>
              </h1>
              <p className="text-[11px] text-slate-300 font-medium">Real Bangladesh Open-City</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="hud-panel rounded-lg p-1 flex gap-1">
            <button
              onClick={() => {
                setGameMode('free');
                gameStateRef.current.gameMode = 'free';
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                gameMode === 'free'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              মুক্ত ড্রাইভ (Free)
            </button>
            <button
              onClick={startChallengeMode}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                gameMode === 'challenge'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              ধামাকা চ্যালেঞ্জ (Trip)
            </button>
          </div>
        </div>

        {/* Center: Challenge Objective Bar if active */}
        {gameMode === 'challenge' && challengeTarget && (
          <div className="hud-panel rounded-xl px-4 py-2 pointer-events-auto flex items-center gap-4 border border-amber-500/40">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-amber-400 animate-bounce" />
              <div>
                <div className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">
                  পরবর্তী গন্তব্য (Destination)
                </div>
                <div className="text-sm font-bold text-white bangla-text">
                  {challengeTarget.name}
                </div>
              </div>
            </div>
            <div className="border-l border-slate-700 pl-4 text-center">
              <div className="text-[10px] text-slate-400">সময় বাকি</div>
              <div className={`text-lg font-bold ${challengeTimeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                {challengeTimeLeft}s
              </div>
            </div>
            <div className="border-l border-slate-700 pl-4 text-center">
              <div className="text-[10px] text-slate-400">ট্রিপ সম্পন্ন</div>
              <div className="text-lg font-bold text-amber-300">{completedTrips}</div>
            </div>
          </div>
        )}

        {/* Right: Quick Controls & Cash */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hud-panel rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm">৳</span>
            <span className="text-sm font-bold text-slate-100">{takaCash}</span>
          </div>

          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            className="hud-panel rounded-xl p-2.5 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'Resume' : 'Pause'}
            className="hud-panel rounded-xl p-2.5 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* FUNNY BANGLA DIALOGUE POPUP (Comic Speech Bubble) */}
      {dialogueToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300">
          <div className="hud-panel rounded-2xl px-5 py-3 border-2 border-amber-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.7)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl shrink-0">
              🗣️
            </div>
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                ঢাকাইয়া ড্রাইভার প্রতিক্রিয়া
              </div>
              <div className="text-base font-bold text-white bangla-text drop-shadow">
                {dialogueToast.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPEEDOMETER & TELEMETRY HUD (Floating Clean Dial) */}
      <div className="absolute top-24 left-4 pointer-events-none z-20">
        <div className="hud-panel rounded-2xl p-4 w-44 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>স্পিড মিটার</span>
            <span className="font-bold text-emerald-400">{gear}</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-white speed-dial">
              {speedKmh}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase">km/h</span>
          </div>

          {/* Speed Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
              style={{ width: `${Math.min((speedKmh / 90) * 100, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>দূরত্ব: <strong className="text-slate-200">{distanceKm} km</strong></span>
            <span>স্কোর: <strong className="text-amber-400">{score}</strong></span>
          </div>
        </div>
      </div>

      {/* ON-SCREEN MOBILE TOUCH CONTROLS */}
      {/* Left Steering Touch Controls */}
      <div className="absolute bottom-24 left-4 flex gap-3 pointer-events-auto z-20 md:opacity-85">
        <button
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('left'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('left'); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouchEnd('left'); }}
          onMouseDown={() => handleTouchStart('left')}
          onMouseUp={() => handleTouchEnd('left')}
          onMouseLeave={() => handleTouchEnd('left')}
          aria-label="Steer Left"
          className="game-touch-btn w-16 h-16 rounded-2xl hud-panel flex items-center justify-center text-2xl font-bold text-white active:bg-emerald-600 active:scale-95 transition-transform"
        >
          ◀
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('right'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('right'); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouchEnd('right'); }}
          onMouseDown={() => handleTouchStart('right')}
          onMouseUp={() => handleTouchEnd('right')}
          onMouseLeave={() => handleTouchEnd('right')}
          aria-label="Steer Right"
          className="game-touch-btn w-16 h-16 rounded-2xl hud-panel flex items-center justify-center text-2xl font-bold text-white active:bg-emerald-600 active:scale-95 transition-transform"
        >
          ▶
        </button>
      </div>

      {/* Right Pedal Touch Controls (Gas, Brake, Horn) */}
      <div className="absolute bottom-24 right-4 flex items-end gap-3 pointer-events-auto z-20 md:opacity-85">
        {/* Dhaka Loud Horn */}
        <button
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('horn'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('horn'); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouchEnd('horn'); }}
          onMouseDown={() => handleTouchStart('horn')}
          onMouseUp={() => handleTouchEnd('horn')}
          onMouseLeave={() => handleTouchEnd('horn')}
          aria-label="Honk Horn"
          className="game-touch-btn w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 border border-amber-300 text-slate-950 flex flex-col items-center justify-center font-bold text-xs active:scale-90 transition-transform shadow-lg"
        >
          <span className="text-lg">📢</span>
          <span className="text-[10px] font-extrabold bangla-text">হর্ন</span>
        </button>

        {/* Handbrake / Reverse */}
        <button
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('backward'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('backward'); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouchEnd('backward'); }}
          onMouseDown={() => handleTouchStart('backward')}
          onMouseUp={() => handleTouchEnd('backward')}
          onMouseLeave={() => handleTouchEnd('backward')}
          aria-label="Brake or Reverse"
          className="game-touch-btn w-16 h-16 rounded-2xl hud-panel border-red-500/40 text-red-400 flex flex-col items-center justify-center font-bold text-xs active:bg-red-600 active:text-white active:scale-95 transition-transform"
        >
          <span className="text-xl">🛑</span>
          <span className="text-[10px] bangla-text">ব্রেক/পেছনে</span>
        </button>

        {/* Accelerator / Gas */}
        <button
          onTouchStart={(e) => { e.preventDefault(); handleTouchStart('forward'); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('forward'); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouchEnd('forward'); }}
          onMouseDown={() => handleTouchStart('forward')}
          onMouseUp={() => handleTouchEnd('forward')}
          onMouseLeave={() => handleTouchEnd('forward')}
          aria-label="Accelerate"
          className="game-touch-btn w-18 h-20 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 border border-emerald-400 text-white flex flex-col items-center justify-center font-bold text-sm active:scale-95 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <span className="text-2xl">⚡</span>
          <span className="text-[11px] font-extrabold bangla-text">এক্সিলারেটর</span>
        </button>
      </div>

      {/* ERGONOMIC COLLAPSIBLE BOTTOM CONTROL DOCK (Three.js Directive Compliant) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center transition-all duration-300 max-w-[94vw]">
        {/* Dock Collapse Toggle */}
        <button
          onClick={() => setHudCollapsed((c) => !c)}
          className="hud-panel px-3 py-1 rounded-t-lg text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 border-b-0 cursor-pointer"
        >
          {hudCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {hudCollapsed ? 'কন্ট্রোল ও গাড়ি নির্বাচন' : 'হাইড কন্ট্রোল'}
        </button>

        {/* Main Glass Dock */}
        {!hudCollapsed && (
          <div className="hud-panel rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 shadow-2xl border border-white/10">
            {/* Vehicle Selector Buttons */}
            <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">গাড়ি:</span>
              {Object.keys(VEHICLE_CONFIGS).map((vKey) => {
                const v = VEHICLE_CONFIGS[vKey];
                const isActive = selectedVehicle === vKey;
                return (
                  <button
                    key={vKey}
                    onClick={() => switchVehicle(vKey)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {vKey === 'cng' && '🛺 '}
                    {vKey === 'bus' && '🚌 '}
                    {vKey === 'rickshaw' && '🚲 '}
                    {vKey === 'car' && '🚗 '}
                    {v.nameBangla}
                  </button>
                );
              })}
            </div>

            {/* Camera View Switcher */}
            <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3">
              <span className="text-[11px] text-slate-400 font-semibold">ক্যামেরা:</span>
              <button
                onClick={() => {
                  const modes = ['chase', 'cockpit', 'topdown'];
                  const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
                  const next = modes[nextIdx];
                  setCameraMode(next);
                  gameStateRef.current.cameraMode = next;
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                {cameraMode === 'chase' && 'চেজ (Follow)'}
                {cameraMode === 'cockpit' && 'ককপিট (Hood)'}
                {cameraMode === 'topdown' && 'ড্রোন (Drone)'}
              </button>
            </div>

            {/* Graphics Quality Toggle */}
            <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3">
              <span className="text-[11px] text-slate-400 font-semibold">গ্রাফিক্স:</span>
              {['low', 'medium', 'high'].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setGraphicsQuality(q);
                    if (gameStateRef.current.trafficManager) {
                      gameStateRef.current.trafficManager.setQuality(q);
                    }
                  }}
                  className={`px-2 py-0.5 text-[11px] rounded uppercase font-bold ${
                    graphicsQuality === q
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Reset Vehicle Position */}
            <button
              onClick={resetVehiclePosition}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-amber-300 hover:bg-slate-700 flex items-center gap-1.5 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              সোজা করুন (R)
            </button>
          </div>
        )}
      </div>

      {/* PAUSE MODAL OVERLAY */}
      {isPaused && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="hud-panel rounded-3xl p-6 max-w-md w-full border border-emerald-500/30 flex flex-col gap-4 text-center">
            <h2 className="text-2xl font-bold text-emerald-400 bangla-text">
              খেলা বিরতি (Game Paused)
            </h2>
            <p className="text-xs text-slate-300">
              ঢাকা শহরের রাস্তায় ড্রাইভ করতে কিবোর্ডের WASD বা অন-স্ক্রিন বাটন ব্যবহার করুন।
            </p>

            <div className="bg-slate-900/90 rounded-2xl p-4 text-left text-xs space-y-2 border border-slate-800">
              <div className="font-bold text-amber-400 pb-1 border-b border-slate-800">
                কিবোর্ড শর্টকাট (Controls):
              </div>
              <div className="flex justify-between text-slate-300">
                <span>W / ↑ বাটন</span>
                <span className="font-semibold text-white">এক্সিলারেটর (Gas)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>S / ↓ বাটন</span>
                <span className="font-semibold text-white">ব্রেক / ব্যাক গিয়ার</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>A, D / ←, → বাটন</span>
                <span className="font-semibold text-white">ডানে-বামে স্টিয়ারিং</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>স্পেসবার (Space)</span>
                <span className="font-semibold text-white">হ্যান্ডব্রেক ড্রিফট</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>H বাটন</span>
                <span className="font-semibold text-white">ঢাকাইয়া হর্ন বাজান</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>C বাটন</span>
                <span className="font-semibold text-white">ক্যামেরা ভিউ বদল</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>R বাটন</span>
                <span className="font-semibold text-white">গাড়ি রিস্টার্ট / সোজা</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm transition"
              >
                খেলা চালিয়ে যান (Resume)
              </button>
              <button
                onClick={resetVehiclePosition}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold"
              >
                রিসেট পজিশন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHALLENGE GAME OVER MODAL */}
      {challengeGameOver && (
        <div className="absolute inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="hud-panel rounded-3xl p-6 max-w-sm w-full border border-amber-500/50 flex flex-col gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-3xl">
              🏆
            </div>
            <h2 className="text-xl font-bold text-white bangla-text">
              ধামাকা চ্যালেঞ্জ সমাপ্ত!
            </h2>
            <p className="text-xs text-slate-300">
              আপনি সফলভাবে <strong className="text-amber-400">{completedTrips}টি ট্রিপ</strong> সম্পন্ন করেছেন!
            </p>

            <div className="bg-slate-900 rounded-xl p-3 flex justify-around text-center border border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400">মোট আয়</div>
                <div className="text-lg font-bold text-emerald-400">৳{takaCash}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">মোট স্কোর</div>
                <div className="text-lg font-bold text-amber-400">{score}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startChallengeMode}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
              >
                আবার খেলুন
              </button>
              <button
                onClick={() => {
                  setChallengeGameOver(false);
                  setGameMode('free');
                }}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm"
              >
                মুক্ত ড্রাইভ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
