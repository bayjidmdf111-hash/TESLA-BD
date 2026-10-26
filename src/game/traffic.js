/**
 * Dhaka Dhamaka 3D - AI Traffic Simulation & Collision Dialogue Engine
 * Simulates bustling Dhaka traffic with realistic vehicle types, lane movement, and avoidance.
 */

import * as THREE from 'three';
import { createVehicleMesh, VEHICLE_CONFIGS } from './vehicles.js';

export const BANGLA_COLLISION_DIALOGUES = [
  'এই ভাই, দেখে চালান!',
  'ঢাকায় স্বাগতম!',
  'হর্ন দিয়া লাভ নাই ভাই!',
  'আরে মামা, একটু সাইড দে!',
  'আমার নতুন রঙের গাড়িটারে কি বানাইলা রে ভাই!',
  'ব্রেক কষেন নাই কেন?! চোখ কি পকেটে?!',
  'চিপা দিয়া গাড়ি ঢুকায় দিলেন তো!',
  'রাস্তা কি আপনার বাপের?!',
  'রিকশাওয়ালার লগে লাগাইতে আইসেন না ভাই!',
  'বাসের সামনে হাত দিয়েন না, চাপ দিলে খবর আছে!',
  'ডিভাইডারে ধাক্কা মারলেন ক্যান ভাই?!',
  'টংয়ের চা খাইতে মন চাইলে গাড়ি সাইড করেন!',
];

export class TrafficManager {
  constructor(scene, quality = 'high') {
    this.scene = scene;
    this.quality = quality;
    this.vehicles = [];
    this.trafficGroup = new THREE.Group();
    this.trafficGroup.name = 'traffic_system';
    this.scene.add(this.trafficGroup);

    // Target count based on quality
    this.targetCount = quality === 'low' ? 8 : (quality === 'medium' ? 16 : 24);

    this.routes = [
      // East-West lanes at z = -70, 0, 70
      { start: new THREE.Vector3(-170, 0, -70 - 4), dir: new THREE.Vector3(1, 0, 0), length: 340 },
      { start: new THREE.Vector3(170, 0, -70 + 4), dir: new THREE.Vector3(-1, 0, 0), length: 340 },
      { start: new THREE.Vector3(-170, 0, 0 - 4), dir: new THREE.Vector3(1, 0, 0), length: 340 },
      { start: new THREE.Vector3(170, 0, 0 + 4), dir: new THREE.Vector3(-1, 0, 0), length: 340 },
      { start: new THREE.Vector3(-170, 0, 70 - 4), dir: new THREE.Vector3(1, 0, 0), length: 340 },
      { start: new THREE.Vector3(170, 0, 70 + 4), dir: new THREE.Vector3(-1, 0, 0), length: 340 },

      // North-South lanes at x = -70, 0, 70
      { start: new THREE.Vector3(-70 - 4, 0, -170), dir: new THREE.Vector3(0, 0, 1), length: 340 },
      { start: new THREE.Vector3(-70 + 4, 0, 170), dir: new THREE.Vector3(0, 0, -1), length: 340 },
      { start: new THREE.Vector3(0 - 4, 0, -170), dir: new THREE.Vector3(0, 0, 1), length: 340 },
      { start: new THREE.Vector3(0 + 4, 0, 170), dir: new THREE.Vector3(0, 0, -1), length: 340 },
      { start: new THREE.Vector3(70 - 4, 0, -170), dir: new THREE.Vector3(0, 0, 1), length: 340 },
      { start: new THREE.Vector3(70 + 4, 0, 170), dir: new THREE.Vector3(0, 0, -1), length: 340 },
    ];

    this.initTraffic();
  }

  setQuality(quality) {
    this.quality = quality;
    const newTarget = quality === 'low' ? 8 : (quality === 'medium' ? 16 : 24);
    if (newTarget < this.vehicles.length) {
      // Remove excess
      while (this.vehicles.length > newTarget) {
        const v = this.vehicles.pop();
        this.trafficGroup.remove(v.mesh.root);
      }
    } else if (newTarget > this.vehicles.length) {
      const needed = newTarget - this.vehicles.length;
      for (let i = 0; i < needed; i++) {
        this.spawnOneVehicle(i);
      }
    }
    this.targetCount = newTarget;
  }

  initTraffic() {
    for (let i = 0; i < this.targetCount; i++) {
      this.spawnOneVehicle(i);
    }
  }

  spawnOneVehicle(index) {
    const types = ['cng', 'bus', 'rickshaw', 'car', 'cng', 'bus', 'car'];
    const type = types[index % types.length];
    const config = VEHICLE_CONFIGS[type];
    const meshData = createVehicleMesh(type);

    const route = this.routes[index % this.routes.length];
    // Spread along the route
    const progress = (index / this.targetCount) * route.length;
    const pos = route.start.clone().add(route.dir.clone().multiplyScalar(progress));

    meshData.root.position.copy(pos);

    // Compute heading rotation
    const angle = Math.atan2(route.dir.x, route.dir.z);
    meshData.root.rotation.y = angle;

    const baseSpeed =
      type === 'rickshaw'
        ? 5 + Math.random() * 3
        : type === 'cng'
        ? 12 + Math.random() * 6
        : type === 'bus'
        ? 14 + Math.random() * 7
        : 15 + Math.random() * 8;

    this.trafficGroup.add(meshData.root);

    this.vehicles.push({
      id: index,
      type,
      config,
      mesh: meshData,
      route,
      progress,
      speed: baseSpeed,
      targetSpeed: baseSpeed,
      radius: type === 'bus' ? 4.4 : (type === 'car' ? 2.5 : 1.8),
      wheels: meshData.wheels,
      honkTimer: 0,
    });
  }

  update(delta, playerPos, onDialogue) {
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];

      // 1. Check distance to forward traffic on the same route to prevent pileups
      let brakeForAhead = false;
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (other.route === v.route) {
          const distDiff = other.progress - v.progress;
          if (distDiff > 0 && distDiff < (v.type === 'bus' ? 14 : 9)) {
            brakeForAhead = true;
            v.targetSpeed = other.speed * 0.85;
            break;
          }
        }
      }

      if (!brakeForAhead) {
        v.targetSpeed =
          v.type === 'rickshaw' ? 6 : (v.type === 'cng' ? 14 : (v.type === 'bus' ? 15 : 18));
      }

      // Smooth acceleration / deceleration
      v.speed = THREE.MathUtils.damp(v.speed, v.targetSpeed, 2.0, delta);
      v.progress += v.speed * delta;

      // Wrap around road length
      if (v.progress > v.route.length) {
        v.progress = 0;
      }

      // Update position along route
      const newPos = v.route.start.clone().add(v.route.dir.clone().multiplyScalar(v.progress));
      v.mesh.root.position.copy(newPos);

      // Spin wheels
      if (v.wheels) {
        const wheelRot = (v.speed / (v.type === 'rickshaw' ? 0.35 : 0.45)) * delta;
        v.wheels.forEach((w) => {
          w.rotation.x += wheelRot;
        });
      }

      // If honkTimer is active
      if (v.honkTimer > 0) {
        v.honkTimer -= delta;
      }
    }
  }

  // React to player horn
  reactToPlayerHorn(playerPos) {
    this.vehicles.forEach((v) => {
      const d = v.mesh.root.position.distanceTo(playerPos);
      if (d < 22 && v.honkTimer <= 0) {
        v.honkTimer = 3.0;
        // CNG or car swerves slightly to yield
        if (v.type === 'cng' || v.type === 'car') {
          v.speed = Math.max(v.speed - 3, 2);
        }
      }
    });
  }

  // Collision test against player
  checkPlayerCollision(playerBox, playerVelocity) {
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const vBox = new THREE.Box3().setFromObject(v.mesh.root);

      if (playerBox.intersectsBox(vBox)) {
        // Collision detected!
        const dialogue =
          BANGLA_COLLISION_DIALOGUES[Math.floor(Math.random() * BANGLA_COLLISION_DIALOGUES.length)];

        // Compute repulsion push
        const pushDir = new THREE.Vector3()
          .subVectors(playerBox.getCenter(new THREE.Vector3()), v.mesh.root.position)
          .normalize();
        pushDir.y = 0;

        return {
          collided: true,
          otherVehicle: v,
          dialogue,
          pushDir,
        };
      }
    }
    return null;
  }

  cleanup() {
    this.vehicles.forEach((v) => {
      this.trafficGroup.remove(v.mesh.root);
    });
    this.vehicles = [];
    this.scene.remove(this.trafficGroup);
  }
}
