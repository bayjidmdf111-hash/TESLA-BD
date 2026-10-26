/**
 * Dhaka Dhamaka 3D: Real Bangladesh
 * Main Application & Vehicle Selection Menu
 */

import React, { useState } from 'react';
import DhakaGame from './game/DhakaGame.jsx';
import { VEHICLE_CONFIGS } from './game/vehicles.js';
import { Play, Sparkles, Trophy, Compass, ShieldCheck, ArrowRight, Volume2 } from 'lucide-react';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('cng');
  const [gameMode, setGameMode] = useState('free');

  const vehicles = [
    {
      id: 'cng',
      emoji: '🛺',
      name: 'সবুজ সিএনজি',
      englishName: 'Green CNG Auto-Rickshaw',
      tagline: 'ঢাকাইয়া ট্রাফিকের অলিখিত বাদশাহ! চিপা দিয়ে কাট মারুন!',
      speed: 70,
      handling: 90,
      durability: 60,
      badge: 'সবচেয়ে জনপ্রিয়',
    },
    {
      id: 'bus',
      emoji: '🚌',
      name: 'স্বাধীন লোকাল বাস',
      englishName: 'Dhaka Local Bus Express',
      tagline: 'রাস্তা ক্লিয়ার না থাকলে ক্লিয়ার করে নেওয়া আমাদের দায়িত্ব!',
      speed: 80,
      handling: 45,
      durability: 98,
      badge: 'রোড মাস্টার',
    },
    {
      id: 'rickshaw',
      emoji: '🚲',
      name: 'রংবেরঙের রিকশা',
      englishName: 'Traditional Cycle Rickshaw',
      tagline: 'টিং টিং বেল বাজাইয়া হেলেদুলে যান, খাঁটি ঢাকা ফিল নিন!',
      speed: 40,
      handling: 95,
      durability: 40,
      badge: 'ঐতিহ্যবাহী আর্ট',
    },
    {
      id: 'car',
      emoji: '🚗',
      name: 'প্রাইভেট কার',
      englishName: 'Toyota Sedan',
      tagline: 'গুলশান টু ধানমন্ডি হাইস্পিড ক্রুজিং, ফুল এসির মজা!',
      speed: 95,
      handling: 80,
      durability: 75,
      badge: 'ভিআইপি স্পিড',
    },
  ];

  if (isPlaying) {
    return (
      <DhakaGame
        initialVehicle={selectedVehicle}
        initialMode={gameMode}
        onBackToMenu={() => setIsPlaying(false)}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto selection:bg-emerald-500 selection:text-white">
      {/* HEADER BAR */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            🛺
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              ঢাকা ধামাকা ৩ডি <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Bangladesh</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Real Dhaka 3D Open-City Driving Simulator</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            3D ইঞ্জিন সক্রিয়
          </span>
          <span className="text-slate-600">•</span>
          <span>প্রসিডিউরাল ঢাকা সিটি</span>
        </div>
      </header>

      {/* HERO & VEHICLE SELECTION */}
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        {/* Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            বাংলাদেশের প্রথম রিয়েল ৩ডি ওপেন সিটি সিমুলেটর
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white bangla-text">
            গাড়ি পছন্দ করে ঢাকায় নামুন!
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-2 max-w-xl mx-auto">
            সবুজ সিএনজি, লোকাল বাস, কিংবা আর্ট করা রিকশা নিয়ে ঢাকার ট্রাফিকের জ্যাম এড়িয়ে ড্রাইভ করুন।
          </p>
        </div>

        {/* Vehicle Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {vehicles.map((v) => {
            const isSelected = selectedVehicle === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={`relative rounded-2xl p-5 cursor-pointer transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.02]'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                {/* Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-4xl">{v.emoji}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {v.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white bangla-text">{v.name}</h3>
                  <div className="text-xs text-slate-400 font-medium mb-2">{v.englishName}</div>
                  <p className="text-xs text-slate-300 bangla-text line-clamp-2 mb-4 leading-relaxed">
                    {v.tagline}
                  </p>
                </div>

                {/* Stats bars */}
                <div className="space-y-2 pt-3 border-t border-slate-800 text-[11px]">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>গতি (Speed)</span>
                      <span className="font-semibold text-slate-200">{v.speed}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${v.speed}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>হ্যান্ডলিং (Handling)</span>
                      <span className="font-semibold text-slate-200">{v.handling}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${v.handling}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Game Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setIsPlaying(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.35)] active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span className="bangla-text text-lg">খেলা শুরু করুন (Start Driving)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 pt-8 border-t border-slate-800/80 text-center">
          <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <div className="text-emerald-400 font-bold text-xs uppercase mb-1">প্রসিডিউরাল ঢাকা</div>
            <div className="text-xs text-slate-400">দোকান, টং, ওভারব্রিজ ও সাইনবোর্ড</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <div className="text-amber-400 font-bold text-xs uppercase mb-1">আসল ঢাকাইয়া ডায়লগ</div>
            <div className="text-xs text-slate-400">ধাক্কা লাগলেই মজার বাংলা কথা!</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <div className="text-cyan-400 font-bold text-xs uppercase mb-1">এআই ট্রাফিক সিস্টেম</div>
            <div className="text-xs text-slate-400">বাস, কার, রিকশা ও সিএনজি চলাচল</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
            <div className="text-purple-400 font-bold text-xs uppercase mb-1">মোবাইল ও পিসি ফ্রেন্ডলি</div>
            <div className="text-xs text-slate-400">টাচ বাটন ও WASD কিবোর্ড সাপোর্ট</div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950">
        ঢাকা ধামাকা ৩ডি • Real Bangladesh • Powered by Three.js & Web Audio API
      </footer>
    </div>
  );
}
