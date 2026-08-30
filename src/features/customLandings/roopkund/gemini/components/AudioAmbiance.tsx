/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioAmbianceProps {
  theme?: 'light' | 'dark';
}

export const AudioAmbiance: React.FC<AudioAmbianceProps> = ({ theme = 'light' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioNode | null>(null);

  const toggleAudio = () => {
    if (!isPlaying) {
      startAmbiance();
    } else {
      stopAmbiance();
    }
  };

  const startAmbiance = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 3);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Synthetic pink-noise ambience.
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Gentle low-pass filter for the ambient texture.
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      // Low frequency modulation for wind gusts
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(140, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();
      noiseSourceRef.current = whiteNoise;

      // Soft synthetic tonal layer.
      const bellOsc = ctx.createOscillator();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(216, ctx.currentTime);
      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0.015, ctx.currentTime);
      bellOsc.connect(bellGain);
      bellGain.connect(masterGain);
      bellOsc.start();

      setIsPlaying(true);
    } catch (e) {
      console.warn('Audio ambiance could not initialize:', e);
    }
  };

  const stopAmbiance = () => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      gainNodeRef.current.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1);
      setTimeout(() => {
        audioCtxRef.current?.close();
        setIsPlaying(false);
      }, 1000);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleAudio}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-nunito font-medium transition-all duration-300 border ${
        isPlaying
          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
          : 'bg-white/5 border-emerald-900/60 text-white/70 hover:text-white hover:border-emerald-500/40'
      }`}
      title={isPlaying ? 'Mute synthetic ambient sound' : 'Play synthetic ambient sound'}
      aria-label="Toggle synthetic ambient sound"
    >
      {isPlaying ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Soundscape On</span>
        </>
      ) : (
        <>
          <VolumeX className="w-3.5 h-3.5 opacity-60" />
          <span className="hidden sm:inline">Ambient Audio</span>
        </>
      )}
    </button>
  );
};

export default AudioAmbiance;
