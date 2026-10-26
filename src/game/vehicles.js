/**
 * Dhaka Dhamaka 3D - Procedural Vehicle Builder & Physics Specifications
 * Features authentic Bangladeshi vehicles: CNG, Local Bus, Cycle Rickshaw, and Private Car.
 */

import * as THREE from 'three';

// Procedural Canvas Texture Helpers
function createRickshawArtTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Vibrant yellow-red floral backdrop
  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, '#f59e0b');
  grad.addColorStop(0.5, '#ef4444');
  grad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Decorative border
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 12;
  ctx.strokeRect(10, 10, 492, 236);

  // Rickshaw Peacock / Flower motif
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.arc(256, 128, 70, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ঢাকা রিকশা আর্ট', 256, 110);
  ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('সৌখিন যাত্রা', 256, 155);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBusBannerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Yellow banner with green border
  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, 0, 1024, 128);

  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 1024, 16);
  ctx.fillRect(0, 112, 1024, 16);

  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 48px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('মিরপুর ১০ ➔ ফার্মগেট ➔ গুলিস্তান ➔ মতিঝিল', 512, 75);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCngBackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#14532d'; // CNG dark green
  ctx.fillRect(0, 0, 512, 256);

  // Black and yellow warning stripes on bottom bumper
  const stripeWidth = 32;
  for (let x = 0; x < 512; x += stripeWidth * 2) {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x, 192, stripeWidth, 64);
    ctx.fillStyle = '#111827';
    ctx.fillRect(x + stripeWidth, 192, stripeWidth, 64);
  }

  // Bengali devotional slogan
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('মা বাবার দোয়া', 256, 75);

  // Dhaka Metro plate
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(106, 115, 300, 55);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(106, 115, 300, 55);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
  ctx.fillText('ঢাকা মেট্রো-থ ১১-৯৮৭২', 256, 153);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCarPlateTexture(plateNumber = 'ঢাকা মেট্রো-গ ২১-০৯৪৫') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 80);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 74);

  // Green circle for Bangladesh flag badge
  ctx.fillStyle = '#006a4e';
  ctx.beginPath();
  ctx.arc(36, 40, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f42a41';
  ctx.beginPath();
  ctx.arc(36, 40, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(plateNumber, 150, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Vehicle Definitions
export const VEHICLE_CONFIGS = {
  cng: {
    id: 'cng',
    name: 'সবুজ সিএনজি (Green CNG)',
    nameBangla: 'সিএনজি অটো-রিকশা',
    tagline: 'ঢাকাইয়া রোডের রাজা - চিপা দিয়ে কাট মারতে ওস্তাদ!',
    type: 'cng',
    maxSpeed: 65,
    acceleration: 24,
    braking: 35,
    turnSpeed: 3.4,
    drag: 0.985,
    mass: 550,
    length: 2.7,
    width: 1.35,
    height: 1.75,
    cameraOffset: new THREE.Vector3(0, 2.3, -4.8),
    lookOffset: new THREE.Vector3(0, 1.1, 2.5),
    cockpitOffset: new THREE.Vector3(0, 1.25, 0.2),
  },
  bus: {
    id: 'bus',
    name: 'স্বাধীন লোকাল বাস (Dhaka Bus)',
    nameBangla: 'লোকাল বাস এক্সপ্রেস',
    tagline: 'রাস্তা ক্লিয়ার না থাকলে ক্লিয়ার করে নেওয়া আমাদের দায়িত্ব!',
    type: 'bus',
    maxSpeed: 75,
    acceleration: 15,
    braking: 26,
    turnSpeed: 1.9,
    drag: 0.988,
    mass: 5500,
    length: 8.8,
    width: 2.55,
    height: 3.2,
    cameraOffset: new THREE.Vector3(0, 4.8, -10.5),
    lookOffset: new THREE.Vector3(0, 1.8, 4.0),
    cockpitOffset: new THREE.Vector3(-0.55, 2.2, 2.8),
  },
  rickshaw: {
    id: 'rickshaw',
    name: 'রংবেরঙের রিকশা (Cycle Rickshaw)',
    nameBangla: 'ঐতিহ্যবাহী প্যাডেল রিকশা',
    tagline: 'এক কাপ চা খাইয়া টান দে মামা! টিং টিং বেল বাজাও!',
    type: 'rickshaw',
    maxSpeed: 38,
    acceleration: 28,
    braking: 40,
    turnSpeed: 3.8,
    drag: 0.978,
    mass: 140,
    length: 2.3,
    width: 1.1,
    height: 1.6,
    cameraOffset: new THREE.Vector3(0, 2.0, -3.9),
    lookOffset: new THREE.Vector3(0, 1.0, 2.0),
    cockpitOffset: new THREE.Vector3(0, 1.35, -0.1),
  },
  car: {
    id: 'car',
    name: 'প্রাইভেট কার (Toyota Sedan)',
    nameBangla: 'গুলশান এক্সপ্রেস কার',
    tagline: 'এসি চালু, গান বাজবে ফুল সাউন্ডে - ভিআইপি ফিল!',
    type: 'car',
    maxSpeed: 95,
    acceleration: 30,
    braking: 42,
    turnSpeed: 2.8,
    drag: 0.987,
    mass: 1350,
    length: 4.4,
    width: 1.8,
    height: 1.45,
    cameraOffset: new THREE.Vector3(0, 2.6, -5.5),
    lookOffset: new THREE.Vector3(0, 1.0, 2.8),
    cockpitOffset: new THREE.Vector3(-0.35, 1.15, 0.1),
  },
};

// Procedural 3D Mesh Builders
export function createVehicleMesh(type = 'cng') {
  const root = new THREE.Group();
  root.name = `vehicle_${type}`;

  const wheels = [];

  // Wheel Helper
  const createWheel = (radius, width, rimColor = 0x334155) => {
    const wheelGroup = new THREE.Group();
    // Tire
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1,
    });
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width * 1.02, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: rimColor,
      roughness: 0.35,
      metalness: 0.85,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rimMesh);

    return wheelGroup;
  };

  // Reusable Materials
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    metalness: 0.2,
    reflectivity: 0.9,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.15,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    emissive: 0xffedd5,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });

  if (type === 'cng') {
    // --- GREEN CNG AUTO-RICKSHAW ---
    // 1. Lower Chassis
    const cngGreenMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Vibrant CNG green
      roughness: 0.45,
      metalness: 0.2,
    });
    const cngBlackRoofMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.9,
      metalness: 0.1,
    });
    const cngCageMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04, // Yellow wire/cage
      wireframe: true,
      roughness: 0.6,
      metalness: 0.4,
    });

    // Lower cabin
    const cabinGeo = new THREE.BoxGeometry(1.3, 0.7, 2.5);
    const cabinMesh = new THREE.Mesh(cabinGeo, cngGreenMat);
    cabinMesh.position.set(0, 0.65, 0);
    cabinMesh.castShadow = true;
    root.add(cabinMesh);

    // Front nose cone (tapered)
    const noseGeo = new THREE.CylinderGeometry(0.35, 0.65, 0.85, 12);
    noseGeo.rotateX(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, cngGreenMat);
    noseMesh.position.set(0, 0.65, 1.25);
    noseMesh.scale.set(1, 0.8, 1);
    noseMesh.castShadow = true;
    root.add(noseMesh);

    // Canvas Canopy Roof
    const roofGeo = new THREE.BoxGeometry(1.26, 0.65, 1.8);
    const roofMesh = new THREE.Mesh(roofGeo, cngBlackRoofMat);
    roofMesh.position.set(0, 1.35, -0.15);
    roofMesh.castShadow = true;
    root.add(roofMesh);

    // Sloped Windshield
    const windshieldGeo = new THREE.PlaneGeometry(0.9, 0.55);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMat);
    windshieldMesh.position.set(0, 1.15, 0.82);
    windshieldMesh.rotation.x = -0.35;
    root.add(windshieldMesh);

    // Side protective metal mesh cages
    const leftCage = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 1.4), cngCageMat);
    leftCage.position.set(0.64, 1.15, -0.1);
    root.add(leftCage);

    const rightCage = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 1.4), cngCageMat);
    rightCage.position.set(-0.64, 1.15, -0.1);
    root.add(rightCage);

    // Rear plate with Bengali slogan
    const rearMat = new THREE.MeshStandardMaterial({
      map: createCngBackTexture(),
      roughness: 0.5,
    });
    const rearMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.6), rearMat);
    rearMesh.position.set(0, 0.75, -1.26);
    rearMesh.rotation.y = Math.PI;
    root.add(rearMesh);

    // Front single headlight
    const lightMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), headlightMat);
    lightMesh.rotateX(Math.PI / 2);
    lightMesh.position.set(0, 0.8, 1.66);
    root.add(lightMesh);

    // Handlebars
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), chromeMat);
    handleBar.rotateZ(Math.PI / 2);
    handleBar.position.set(0, 1.05, 0.6);
    root.add(handleBar);

    // Wheels (3 wheels: 1 front, 2 rear)
    const frontWheel = createWheel(0.24, 0.14, 0x94a3b8);
    frontWheel.position.set(0, 0.24, 1.25);
    root.add(frontWheel);
    wheels.push(frontWheel);

    const rlWheel = createWheel(0.26, 0.16, 0x94a3b8);
    rlWheel.position.set(0.62, 0.26, -0.75);
    root.add(rlWheel);
    wheels.push(rlWheel);

    const rrWheel = createWheel(0.26, 0.16, 0x94a3b8);
    rrWheel.position.set(-0.62, 0.26, -0.75);
    root.add(rrWheel);
    wheels.push(rrWheel);

  } else if (type === 'bus') {
    // --- DHAKA COLORFUL LOCAL BUS ---
    const busBodyMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Vibrant blue base
      roughness: 0.4,
      metalness: 0.25,
    });
    const busStripeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Orange Dhaka stripe
      roughness: 0.4,
      metalness: 0.2,
    });
    const roofRackMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.6,
    });

    // Lower Main Body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.2, 8.4), busBodyMat);
    lowerBody.position.set(0, 1.0, 0);
    lowerBody.castShadow = true;
    root.add(lowerBody);

    // Orange Middle Slogan Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.47, 0.4, 8.42), busStripeMat);
    stripe.position.set(0, 1.35, 0);
    root.add(stripe);

    // Upper Cabin with Windows
    const upperBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 8.2), busBodyMat);
    upperBody.position.set(0, 2.15, 0);
    upperBody.castShadow = true;
    root.add(upperBody);

    // Large Windshields
    const frontWindshield = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.95), glassMat);
    frontWindshield.position.set(0, 2.15, 4.12);
    root.add(frontWindshield);

    const backWindshield = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.8), glassMat);
    backWindshield.position.set(0, 2.15, -4.12);
    backWindshield.rotation.y = Math.PI;
    root.add(backWindshield);

    // Side windows (cutouts look)
    const sideGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8,
    });
    const leftWindowRow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.65, 7.2), sideGlassMat);
    leftWindowRow.position.set(1.23, 2.15, -0.2);
    root.add(leftWindowRow);

    const rightWindowRow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.65, 7.2), sideGlassMat);
    rightWindowRow.position.set(-1.23, 2.15, -0.2);
    root.add(rightWindowRow);

    // Destination Signboard Banner on Front Roof
    const bannerMat = new THREE.MeshStandardMaterial({
      map: createBusBannerTexture(),
      roughness: 0.5,
    });
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.38), bannerMat);
    bannerMesh.position.set(0, 2.85, 4.15);
    root.add(bannerMesh);

    // Roof Luggage Carrier
    const carrier = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 5.5), roofRackMat);
    carrier.position.set(0, 2.85, -0.8);
    root.add(carrier);

    // Luggage sacks on roof
    const sackColors = [0x92400e, 0x15803d, 0x475569];
    for (let i = 0; i < 4; i++) {
      const sackGeo = new THREE.SphereGeometry(0.32, 8, 8);
      sackGeo.scale(1.2, 0.7, 1);
      const sack = new THREE.Mesh(
        sackGeo,
        new THREE.MeshStandardMaterial({ color: sackColors[i % sackColors.length], roughness: 0.9 })
      );
      sack.position.set((i % 2 === 0 ? -0.45 : 0.45), 3.15, -1.8 + i * 0.9);
      root.add(sack);
    }

    // Heavy Front Bumper
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.45, 0.35), chromeMat);
    bumper.position.set(0, 0.55, 4.25);
    root.add(bumper);

    // Dual Headlights
    const hl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), headlightMat);
    hl1.rotateX(Math.PI / 2);
    hl1.position.set(0.85, 0.85, 4.22);
    root.add(hl1);

    const hl2 = hl1.clone();
    hl2.position.set(-0.85, 0.85, 4.22);
    root.add(hl2);

    // Bus Wheels (6 wheels: 2 front, 4 rear duals)
    const flWheel = createWheel(0.48, 0.28, 0xd97706);
    flWheel.position.set(1.18, 0.48, 2.6);
    root.add(flWheel);
    wheels.push(flWheel);

    const frWheel = createWheel(0.48, 0.28, 0xd97706);
    frWheel.position.set(-1.18, 0.48, 2.6);
    root.add(frWheel);
    wheels.push(frWheel);

    const rlWheel = createWheel(0.48, 0.45, 0xd97706);
    rlWheel.position.set(1.15, 0.48, -2.5);
    root.add(rlWheel);
    wheels.push(rlWheel);

    const rrWheel = createWheel(0.48, 0.45, 0xd97706);
    rrWheel.position.set(-1.15, 0.48, -2.5);
    root.add(rrWheel);
    wheels.push(rrWheel);

  } else if (type === 'rickshaw') {
    // --- TRADITIONAL CYCLE RICKSHAW ---
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky blue painted frame
      metalness: 0.7,
      roughness: 0.3,
    });
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Red cushioned seat
      roughness: 0.6,
    });
    const footboardMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Wood grain footboard
      roughness: 0.8,
    });

    // Triangular chassis frame
    const baseBoard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 1.2), footboardMat);
    baseBoard.position.set(0, 0.48, -0.2);
    baseBoard.castShadow = true;
    root.add(baseBoard);

    // Passenger Padded Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.55), seatMat);
    seat.position.set(0, 0.7, -0.45);
    root.add(seat);

    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.12), seatMat);
    seatBack.position.set(0, 1.0, -0.68);
    root.add(seatBack);

    // Decorative Folding Rickshaw Hood / Canopy
    const hoodGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.88, 12, 1, false, 0, Math.PI);
    hoodGeo.rotateZ(Math.PI / 2);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 1.25, -0.45);
    hood.rotation.x = -0.3;
    root.add(hood);

    // Rickshaw Art Backplate
    const artMat = new THREE.MeshStandardMaterial({
      map: createRickshawArtTexture(),
      roughness: 0.4,
    });
    const artPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.45), artMat);
    artPlate.position.set(0, 0.85, -0.78);
    artPlate.rotation.y = Math.PI;
    root.add(artPlate);

    // Front Bicycle Half (Fork & Handlebars)
    const forkTube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8), chromeMat);
    forkTube.position.set(0, 0.65, 0.75);
    forkTube.rotation.x = -0.2;
    root.add(forkTube);

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), chromeMat);
    handlebar.rotateZ(Math.PI / 2);
    handlebar.position.set(0, 1.05, 0.68);
    root.add(handlebar);

    // Chrome Bell on Handlebar
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), chromeMat);
    bell.position.set(0.2, 1.08, 0.68);
    root.add(bell);

    // Puller's Saddle (Seat)
    const pullerSeat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.24), cngBlackRoofMat);
    pullerSeat.position.set(0, 0.8, 0.25);
    root.add(pullerSeat);

    // Traditional Rickshaw Wheels (Thin large spoked wheels)
    const frontWheel = createWheel(0.33, 0.06, 0xcbd5e1);
    frontWheel.position.set(0, 0.33, 0.95);
    root.add(frontWheel);
    wheels.push(frontWheel);

    const rlWheel = createWheel(0.38, 0.07, 0xcbd5e1);
    rlWheel.position.set(0.48, 0.38, -0.4);
    root.add(rlWheel);
    wheels.push(rlWheel);

    const rrWheel = createWheel(0.38, 0.07, 0xcbd5e1);
    rrWheel.position.set(-0.48, 0.38, -0.4);
    root.add(rrWheel);
    wheels.push(rrWheel);

  } else {
    // --- PRIVATE CAR (TOYOTA SEDAN) ---
    const carMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Metallic Golden Amber
      metalness: 0.85,
      roughness: 0.25,
    });
    const bottomTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });

    // Lower Body
    const carBase = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.55, 4.3), carMat);
    carBase.position.set(0, 0.48, 0);
    carBase.castShadow = true;
    root.add(carBase);

    // Cabin Greenhouse
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 2.2), glassMat);
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    // Car Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.06, 2.0), carMat);
    roof.position.set(0, 1.22, -0.2);
    root.add(roof);

    // Front Sloped Hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.12, 1.15), carMat);
    hood.position.set(0, 0.72, 1.45);
    hood.rotation.x = 0.08;
    root.add(hood);

    // Front Grille & Dhaka Plate
    const plateMat = new THREE.MeshStandardMaterial({
      map: createCarPlateTexture(),
      roughness: 0.4,
    });
    const plateMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.2), plateMat);
    plateMesh.position.set(0, 0.42, 2.16);
    root.add(plateMesh);

    // Dual Headlights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.1), headlightMat);
    hlL.position.set(0.62, 0.58, 2.12);
    root.add(hlL);

    const hlR = hlL.clone();
    hlR.position.set(-0.62, 0.58, 2.12);
    root.add(hlR);

    // Dual Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.08), taillightMat);
    tlL.position.set(0.62, 0.62, -2.16);
    root.add(tlL);

    const tlR = tlL.clone();
    tlR.position.set(-0.62, 0.62, -2.16);
    root.add(tlR);

    // 4 Wheels
    const flWheel = createWheel(0.32, 0.22, 0xe2e8f0);
    flWheel.position.set(0.85, 0.32, 1.35);
    root.add(flWheel);
    wheels.push(flWheel);

    const frWheel = createWheel(0.32, 0.22, 0xe2e8f0);
    frWheel.position.set(-0.85, 0.32, 1.35);
    root.add(frWheel);
    wheels.push(frWheel);

    const rlWheel = createWheel(0.32, 0.22, 0xe2e8f0);
    rlWheel.position.set(0.85, 0.32, -1.35);
    root.add(rlWheel);
    wheels.push(rlWheel);

    const rrWheel = createWheel(0.32, 0.22, 0xe2e8f0);
    rrWheel.position.set(-0.85, 0.32, -1.35);
    root.add(rrWheel);
    wheels.push(rrWheel);
  }

  // Common Contact Shadow ground plane
  const shadowGeo = new THREE.PlaneGeometry(
    type === 'bus' ? 3.0 : 2.0,
    type === 'bus' ? 9.0 : (type === 'rickshaw' ? 2.5 : 4.6)
  );
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  return { root, wheels };
}
