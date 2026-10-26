/**
 * Dhaka Dhamaka 3D - Procedural Dhaka City Builder
 * Multi-lane avenues, authentic Bengali shops, roadside stalls, overbridges, trees, and collision barriers.
 */

import * as THREE from 'three';

// Shop Sign Canvas Texture Generator
function createShopSignTexture(text, subtitle, bgColor = '#047857', textColor = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  // Border
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 116);

  // Main Bengali Title
  ctx.fillStyle = textColor;
  ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 62);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = '#fef08a';
    ctx.font = '22px "Hind Siliguri", sans-serif';
    ctx.fillText(subtitle, 256, 102);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Road Marking Texture
function createRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Asphalt base with subtle noise
  ctx.fillStyle = '#262626';
  ctx.fillRect(0, 0, 1024, 1024);

  // White lane dividers (dashed)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  ctx.setLineDash([48, 48]);

  // Lane dividers
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 1024);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(768, 0);
  ctx.lineTo(768, 1024);
  ctx.stroke();

  // Double yellow center line
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 12;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(502, 0);
  ctx.lineTo(502, 1024);
  ctx.moveTo(522, 0);
  ctx.lineTo(522, 1024);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Zebra Crosswalk Texture
function createZebraTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#262626';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#ffffff';
  const stripeW = 36;
  const gap = 24;
  for (let x = 18; x < 512; x += stripeW + gap) {
    ctx.fillRect(x, 15, stripeW, 226);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const DHAKA_SHOPS = [
  { name: 'ঢাকা বিরিয়ানি হাউজ', sub: 'স্পেশাল কাচ্চি ও বোরহানি', bg: '#991b1b', text: '#ffffff' },
  { name: 'ভাই ভাই টেলিকম', sub: 'ফ্লেক্সিলোড ও বিকাশ এজেন্ট', bg: '#065f46', text: '#fef08a' },
  { name: 'হাজী মিষ্টি মেলা', sub: 'খাঁটি ছানার মিষ্টি ও দই', bg: '#b45309', text: '#ffffff' },
  { name: 'চায়ের দোকান (টং)', sub: 'গরম লেবু চা ও বিস্কুট', bg: '#1e3a8a', text: '#ffffff' },
  { name: 'সোনার বাংলা ফার্মেসী', sub: 'সকল প্রকার ঔষধ পাওয়া যায়', bg: '#15803d', text: '#ffffff' },
  { name: 'জননী ডিপার্টমেন্টাল স্টোর', sub: 'মুদি মালামাল ও প্রসাধন', bg: '#701a75', text: '#ffffff' },
  { name: 'মিরপুর ফ্যাশন টেইলার্স', sub: 'আধুনিক শার্ট প্যান্ট তৈরি', bg: '#831843', text: '#ffffff' },
  { name: 'ডিজিটাল সাইন ও প্রেস', sub: 'ব্যানার ও ভিজিটিং কার্ড', bg: '#0f766e', text: '#ffffff' },
];

export function buildDhakaCity(scene, quality = 'high') {
  const cityGroup = new THREE.Group();
  cityGroup.name = 'dhaka_city';

  const colliders = [];
  const roadSegments = [];
  const waypoints = [];
  const collectibles = [];

  // Ground base
  const groundGeo = new THREE.PlaneGeometry(600, 600);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.95,
    metalness: 0.05,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.receiveShadow = quality !== 'low';
  groundMesh.position.y = -0.05;
  cityGroup.add(groundMesh);

  // Common Materials
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // Dhaka yellow-black painted curb
    roughness: 0.7,
  });

  const buildingPalette = [
    0xf8fafc, 0xfde047, 0x93c5fd, 0xfbcfe8, 0xa7f3d0, 0xfed7aa, 0xe2e8f0, 0xd8b4fe
  ];

  const glassWindowMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.2,
    metalness: 0.8,
  });

  const waterTankMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Iconic black syntax water tank
    roughness: 0.6,
  });

  const roadTex = createRoadTexture();
  roadTex.repeat.set(1, 24);

  // --- CITY ROAD NETWORK ---
  // Grid layout: 3 horizontal avenues, 3 vertical avenues
  // Road width = 16 meters (4 lanes with central divider)
  const ROAD_WIDTH = 16;
  const HALF_ROAD = ROAD_WIDTH / 2;
  const BLOCK_SIZE = 70;
  const GRID_COUNT = 3; // -1, 0, 1 -> coords -70, 0, 70

  const roadCoords = [-BLOCK_SIZE, 0, BLOCK_SIZE];

  // Helper to add collider
  const addCollider = (box, type = 'solid', dialogue = null) => {
    colliders.push({ box, type, dialogue });
  };

  // 1. Horizontal Roads
  roadCoords.forEach((z) => {
    const roadGeo = new THREE.PlaneGeometry(360, ROAD_WIDTH);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(
      roadGeo,
      new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.8, metalness: 0.1 })
    );
    roadMesh.position.set(0, 0.01, z);
    roadMesh.receiveShadow = quality !== 'low';
    cityGroup.add(roadMesh);

    roadSegments.push({
      axis: 'x',
      center: z,
      min: -180,
      max: 180,
      width: ROAD_WIDTH,
    });

    // Sidewalks on both sides of road
    const swGeo = new THREE.BoxGeometry(360, 0.25, 3.5);
    const swNorth = new THREE.Mesh(swGeo, sidewalkMat);
    swNorth.position.set(0, 0.125, z + HALF_ROAD + 1.75);
    swNorth.receiveShadow = quality !== 'low';
    cityGroup.add(swNorth);

    const swSouth = new THREE.Mesh(swGeo, sidewalkMat);
    swSouth.position.set(0, 0.125, z - HALF_ROAD - 1.75);
    swSouth.receiveShadow = quality !== 'low';
    cityGroup.add(swSouth);

    // Central Divider with Green Hedge & Streetlights
    const dividerLength = 360;
    const dividerGeo = new THREE.BoxGeometry(dividerLength, 0.35, 1.0);
    const dividerMesh = new THREE.Mesh(dividerGeo, curbMat);
    dividerMesh.position.set(0, 0.18, z);
    cityGroup.add(dividerMesh);

    // Divider collider
    addCollider(
      new THREE.Box3(
        new THREE.Vector3(-180, 0, z - 0.5),
        new THREE.Vector3(180, 1.2, z + 0.5)
      ),
      'divider',
      'আরে ভাই! ডিভাইডারে উইঠা গেলেন ক্যান?!'
    );
  });

  // 2. Vertical Roads
  roadCoords.forEach((x) => {
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 360);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(
      roadGeo,
      new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.8, metalness: 0.1 })
    );
    roadMesh.position.set(x, 0.02, 0);
    roadMesh.receiveShadow = quality !== 'low';
    cityGroup.add(roadMesh);

    roadSegments.push({
      axis: 'z',
      center: x,
      min: -180,
      max: 180,
      width: ROAD_WIDTH,
    });

    // Sidewalks
    const swGeo = new THREE.BoxGeometry(3.5, 0.25, 360);
    const swEast = new THREE.Mesh(swGeo, sidewalkMat);
    swEast.position.set(x + HALF_ROAD + 1.75, 0.125, 0);
    cityGroup.add(swEast);

    const swWest = new THREE.Mesh(swGeo, sidewalkMat);
    swWest.position.set(x - HALF_ROAD - 1.75, 0.125, 0);
    cityGroup.add(swWest);
  });

  // Crosswalks / Zebra Crossings near intersections
  const zebraTex = createZebraTexture();
  const zebraMat = new THREE.MeshStandardMaterial({ map: zebraTex, roughness: 0.8 });

  roadCoords.forEach((rx) => {
    roadCoords.forEach((rz) => {
      // 4 pedestrian crossings around each intersection
      const offsets = [
        { x: rx, z: rz + 12, rot: 0, w: 14, h: 3 },
        { x: rx, z: rz - 12, rot: 0, w: 14, h: 3 },
        { x: rx + 12, z: rz, rot: Math.PI / 2, w: 14, h: 3 },
        { x: rx - 12, z: rz, rot: Math.PI / 2, w: 14, h: 3 },
      ];
      offsets.forEach((o) => {
        const zebra = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), zebraMat);
        zebra.rotateX(-Math.PI / 2);
        zebra.rotation.z = o.rot;
        zebra.position.set(o.x, 0.03, o.z);
        cityGroup.add(zebra);
      });
    });
  });

  // --- BUILDINGS & CITY BLOCKS ---
  // Blocks sit between the roads
  const blockCenters = [
    { x: -BLOCK_SIZE - 40, z: -BLOCK_SIZE - 40 },
    { x: 0, z: -BLOCK_SIZE - 40 },
    { x: BLOCK_SIZE + 40, z: -BLOCK_SIZE - 40 },
    { x: -BLOCK_SIZE - 40, z: 0 },
    { x: 0, z: 0 },
    { x: BLOCK_SIZE + 40, z: 0 },
    { x: -BLOCK_SIZE - 40, z: BLOCK_SIZE + 40 },
    { x: 0, z: BLOCK_SIZE + 40 },
    { x: BLOCK_SIZE + 40, z: BLOCK_SIZE + 40 },
  ];

  let shopIdx = 0;

  blockCenters.forEach((block, bIdx) => {
    // Generate 4-6 buildings per block
    const subPositions = [
      { dx: -16, dz: -16, w: 22, d: 22, h: 18 + (bIdx % 4) * 6 },
      { dx: 16, dz: -16, w: 22, d: 22, h: 14 + ((bIdx + 1) % 5) * 5 },
      { dx: -16, dz: 16, w: 22, d: 22, h: 20 + ((bIdx + 2) % 3) * 7 },
      { dx: 16, dz: 16, w: 22, d: 22, h: 16 + ((bIdx + 3) % 4) * 6 },
    ];

    subPositions.forEach((sub, sIdx) => {
      const bx = block.x + sub.dx;
      const bz = block.z + sub.dz;
      const bw = sub.w;
      const bd = sub.d;
      const bh = sub.h;

      const color = buildingPalette[(bIdx * 4 + sIdx) % buildingPalette.length];
      const buildingMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.1,
      });

      // Main tower
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), buildingMat);
      bMesh.position.set(bx, bh / 2, bz);
      bMesh.castShadow = quality !== 'low';
      bMesh.receiveShadow = quality !== 'low';
      cityGroup.add(bMesh);

      // Building Collider
      addCollider(
        new THREE.Box3(
          new THREE.Vector3(bx - bw / 2 - 0.4, 0, bz - bd / 2 - 0.4),
          new THREE.Vector3(bx + bw / 2 + 0.4, bh, bz + bd / 2 + 0.4)
        ),
        'building',
        'এই ভাই, বিল্ডিংয়ে ধাক্কা দেন ক্যান?! চোখ কি পকেটে?!'
      );

      // Rooftop Water Tank (Dhaka style)
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 1.8, 12),
        waterTankMat
      );
      tank.position.set(bx + (sIdx % 2 === 0 ? 3 : -3), bh + 0.9, bz);
      cityGroup.add(tank);

      // Ground Floor Bengali Shop Signboard
      const shopInfo = DHAKA_SHOPS[shopIdx % DHAKA_SHOPS.length];
      shopIdx++;

      const signTex = createShopSignTexture(shopInfo.name, shopInfo.sub, shopInfo.bg, shopInfo.text);
      const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 });
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.2), signMat);

      // Orient sign towards nearest street
      if (Math.abs(bz) < Math.abs(bx)) {
        signMesh.position.set(bx + (bx > 0 ? -bw / 2 - 0.05 : bw / 2 + 0.05), 3.2, bz);
        signMesh.rotation.y = bx > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        signMesh.position.set(bx, 3.2, bz + (bz > 0 ? -bd / 2 - 0.05 : bd / 2 + 0.05));
        signMesh.rotation.y = bz > 0 ? Math.PI : 0;
      }
      cityGroup.add(signMesh);
    });
  });

  // --- DHAKA STREET FURNITURE & ROADSIDE DETAILS ---

  // 1. Roadside Tea Stalls ("টংয়ের দোকান")
  const createTeaStall = (x, z, rotY) => {
    const stall = new THREE.Group();
    // Wooden shed
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const shed = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.4, 2.2), woodMat);
    shed.position.set(0, 1.2, 0);
    stall.add(shed);

    // Blue plastic canopy
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.15, 2.6), canopyMat);
    canopy.position.set(0, 2.45, 0.2);
    canopy.rotation.x = 0.1;
    stall.add(canopy);

    // Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.45), woodMat);
    bench.position.set(0, 0.25, 1.6);
    stall.add(bench);

    // Tea Kettle on counter
    const kettle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.35, 10),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 })
    );
    kettle.position.set(-0.6, 1.35, 1.1);
    stall.add(kettle);

    stall.position.set(x, 0, z);
    stall.rotation.y = rotY;
    cityGroup.add(stall);

    addCollider(
      new THREE.Box3(
        new THREE.Vector3(x - 2.0, 0, z - 2.0),
        new THREE.Vector3(x + 2.0, 2.6, z + 2.0)
      ),
      'stall',
      'টংয়ের গরম চা ছিটকায়া পড়লো তো ভাই! দেইখা চালান!'
    );
  };

  createTeaStall(-BLOCK_SIZE + 12, -HALF_ROAD - 3.8, 0);
  createTeaStall(BLOCK_SIZE - 12, HALF_ROAD + 3.8, Math.PI);
  createTeaStall(-HALF_ROAD - 3.8, BLOCK_SIZE - 20, Math.PI / 2);
  createTeaStall(HALF_ROAD + 3.8, -BLOCK_SIZE + 20, -Math.PI / 2);

  // 2. Dhaka Pedestrian Footbridge (Overbridge)
  const createOverbridge = (zPos) => {
    const bridgeGroup = new THREE.Group();
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });

    // Main walkway spanning across 16m road
    const span = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH + 8, 0.8, 3.2), bridgeMat);
    span.position.set(0, 5.6, zPos);
    bridgeGroup.add(span);

    // Stairs / Pillars on sides
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.6, 2.4), bridgeMat);
    leftPillar.position.set(-HALF_ROAD - 3.2, 2.8, zPos);
    bridgeGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.6, 2.4), bridgeMat);
    rightPillar.position.set(HALF_ROAD + 3.2, 2.8, zPos);
    bridgeGroup.add(rightPillar);

    // Banner on Overbridge
    const bannerTex = createShopSignTexture(
      'ঢাকা উত্তর সিটি কর্পোরেশন',
      'নিরাপদ পথচারী পারাপার ফুটওভার ব্রিজ',
      '#065f46',
      '#fef08a'
    );
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 1.4),
      new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.4 })
    );
    banner.position.set(0, 6.2, zPos + 1.62);
    bridgeGroup.add(banner);

    cityGroup.add(bridgeGroup);

    // Pillar colliders
    addCollider(
      new THREE.Box3(
        new THREE.Vector3(-HALF_ROAD - 4.2, 0, zPos - 1.4),
        new THREE.Vector3(-HALF_ROAD - 2.2, 5.6, zPos + 1.4)
      ),
      'bridge_pillar',
      'ফুটওভার ব্রিজের পিলারে ব্রেক কষলেন!'
    );
    addCollider(
      new THREE.Box3(
        new THREE.Vector3(HALF_ROAD + 2.2, 0, zPos - 1.4),
        new THREE.Vector3(HALF_ROAD + 4.2, 5.6, zPos + 1.4)
      ),
      'bridge_pillar',
      'ফুটওভার ব্রিজের পিলারে ব্রেক কষলেন!'
    );
  };

  createOverbridge(35);
  createOverbridge(-105);

  // 3. Streetlights & Trees
  const lightPoleMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.3,
  });

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

  roadCoords.forEach((rx) => {
    for (let z = -140; z <= 140; z += 40) {
      if (Math.abs(z - 0) < 15 || Math.abs(z - BLOCK_SIZE) < 15 || Math.abs(z + BLOCK_SIZE) < 15) continue;

      // Streetlight
      const pole = new THREE.Group();
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.5, 8), lightPoleMat);
      mast.position.y = 3.25;
      pole.add(mast);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), lightPoleMat);
      arm.position.set(0.9, 6.3, 0);
      arm.rotation.z = Math.PI / 3;
      pole.add(arm);

      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.15, 0.5),
        new THREE.MeshStandardMaterial({ emissive: 0xfef08a, emissiveIntensity: 0.8 })
      );
      lamp.position.set(1.6, 6.5, 0);
      pole.add(lamp);

      pole.position.set(rx + HALF_ROAD + 1.2, 0, z);
      cityGroup.add(pole);

      // Tree on opposite sidewalk
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.38, 3.8, 7), trunkMat);
      trunk.position.y = 1.9;
      tree.add(trunk);

      const foliage = new THREE.Mesh(new THREE.SphereGeometry(2.1, 8, 8), foliageMat);
      foliage.position.y = 4.5;
      tree.add(foliage);

      tree.position.set(rx - HALF_ROAD - 1.2, 0, z + 15);
      cityGroup.add(tree);
    }
  });

  // --- COLLECTIBLES (Bengali Tea Cups ☕, Gold Coins 🟡, Fuel Jerrycans ⛽) ---
  const coinGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.18, 16);
  coinGeo.rotateZ(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0xd97706,
    emissiveIntensity: 0.3,
  });

  const teaCupGeo = new THREE.CylinderGeometry(0.4, 0.25, 0.6, 12);
  const teaMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.4,
  });

  const spawnCollectible = (x, z, type = 'coin') => {
    const mesh = new THREE.Mesh(type === 'coin' ? coinGeo : teaCupGeo, type === 'coin' ? coinMat : teaMat);
    mesh.position.set(x, 0.9, z);
    cityGroup.add(mesh);
    collectibles.push({
      mesh,
      type,
      x,
      z,
      collected: false,
      value: type === 'coin' ? 50 : 100,
    });
  };

  // Scatter items on roads and alleys
  for (let i = -120; i <= 120; i += 30) {
    if (i !== 0) {
      spawnCollectible(i, -HALF_ROAD + 3, 'coin');
      spawnCollectible(i, HALF_ROAD - 3, 'tea');
      spawnCollectible(-HALF_ROAD + 3, i, 'coin');
      spawnCollectible(HALF_ROAD - 3, i, 'tea');
    }
  }

  // --- CHALLENGE WAYPOINTS (Dhaka Trip Checkpoints) ---
  const wpGeo = new THREE.TorusGeometry(2.2, 0.25, 12, 32);
  wpGeo.rotateX(Math.PI / 2);
  const wpMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Glowing emerald green
    emissive: 0x059669,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.85,
  });

  const waypointPositions = [
    { name: 'মিরপুর ১০ গোলচত্বর', x: -BLOCK_SIZE, z: -35 },
    { name: 'ফার্মগেট মোড়', x: 0, z: -35 },
    { name: 'শাহবাগ চত্বর', x: BLOCK_SIZE, z: 0 },
    { name: 'গুলিস্তান জিরো পয়েন্ট', x: 0, z: BLOCK_SIZE },
    { name: 'মতিঝিল শাপলা চত্বর', x: -BLOCK_SIZE, z: BLOCK_SIZE },
  ];

  waypointPositions.forEach((wp, idx) => {
    const mesh = new THREE.Mesh(wpGeo, wpMat);
    mesh.position.set(wp.x, 0.6, wp.z);
    cityGroup.add(mesh);

    waypoints.push({
      id: idx,
      name: wp.name,
      x: wp.x,
      z: wp.z,
      mesh,
      radius: 4.0,
    });
  });

  scene.add(cityGroup);

  return {
    cityGroup,
    colliders,
    roadSegments,
    waypoints,
    collectibles,
    update: (delta, time) => {
      // Animate collectibles (spin & bob)
      collectibles.forEach((c) => {
        if (!c.collected && c.mesh) {
          c.mesh.rotation.y += delta * 2.2;
          c.mesh.position.y = 0.85 + Math.sin(time * 3 + c.x) * 0.15;
        }
      });

      // Animate waypoints (pulse ring)
      waypoints.forEach((w) => {
        if (w.mesh) {
          w.mesh.rotation.z += delta * 1.5;
          const s = 1.0 + Math.sin(time * 4 + w.id) * 0.12;
          w.mesh.scale.set(s, s, s);
        }
      });
    },
  };
}
