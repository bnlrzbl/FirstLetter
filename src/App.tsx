/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Download, Type, RefreshCw, Check, Info, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

// --- Types & Constants ---

interface Device {
  name: string;
  width: number;
  height: number;
}

const DEVICES: Device[] = [
  { name: 'iPhone 16 Pro Max', width: 1320, height: 2868 },
  { name: 'iPhone 16 Pro', width: 1206, height: 2622 },
  { name: 'iPhone 15/14 Pro Max', width: 1290, height: 2796 },
  { name: 'iPhone 15/14 Pro', width: 1179, height: 2556 },
  { name: 'Samsung S24 Ultra', width: 1440, height: 3120 },
  { name: 'Pixel 9 Pro XL', width: 1344, height: 2992 },
  { name: 'Generic 1080p', width: 1080, height: 1920 },
];

interface Theme {
  name: string;
  bg: string;
  text: string;
  accent: string;
  font: string;
}

const THEMES: Theme[] = [
  { name: 'Dark Charcoal', bg: '#2D2D2D', text: '#FFFFFF', accent: '#FFFFFF', font: 'sans-serif' },
  { name: 'Deep Navy', bg: '#1A2B3C', text: '#FFFFFF', accent: '#FFFFFF', font: 'sans-serif' },
  { name: 'Forest Green', bg: '#2D4A3E', text: '#FFFFFF', accent: '#FFFFFF', font: 'sans-serif' },
  { name: 'Burgundy', bg: '#6B1D23', text: '#FFFFFF', accent: '#FFFFFF', font: 'sans-serif' },
  { name: 'Midnight Blue', bg: '#152238', text: '#FFFFFF', accent: '#FFFFFF', font: 'sans-serif' },
  { name: 'Warm Taupe', bg: '#A69685', text: '#FFFFFF', accent: '#FFFFFF', font: 'sans-serif' },
];

// --- Helper Functions ---

const processTextToMnemonic = (text: string, removeNumbers: boolean, keepLineBreaks: boolean): string => {
  let processedText = text;
  if (removeNumbers) {
    // Remove digits
    processedText = processedText.replace(/[0-9]/g, '');
  }
  
  if (!keepLineBreaks) {
    // Replace all whitespace (including newlines) with a single space
    processedText = processedText.replace(/\s+/g, ' ');
  } else {
    // Keep newlines, but normalize other whitespace on each line
    processedText = processedText.split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n');
  }

  // Regex to match words while preserving punctuation and spacing
  // We want to replace each word with its first letter
  return processedText.trim().replace(/[a-zA-Z0-9]+/g, (word) => {
    return word.charAt(0);
  });
};

// --- Main Component ---

export default function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [removeNumbers, setRemoveNumbers] = useState(false);
  const [keepLineBreaks, setKeepLineBreaks] = useState(true);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0]);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [calculatedFontSize, setCalculatedFontSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mnemonic = processTextToMnemonic(content, removeNumbers, keepLineBreaks);
  const isTooLong = content.length > 600;

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    
    // Small delay to ensure canvas is rendered
    setTimeout(() => {
      try {
        const link = document.createElement('a');
        link.download = `${title || 'firstletter'}-wallpaper.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.error('Export failed', err);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = selectedDevice.width;
    canvas.height = selectedDevice.height;

    // Background
    ctx.fillStyle = selectedTheme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Styling
    const padding = canvas.width * 0.15;
    const maxWidth = canvas.width - padding * 2;
    
    // Draw Title
    ctx.fillStyle = selectedTheme.text;
    ctx.textAlign = 'center';
    
    const titleFontSize = Math.floor(canvas.width * 0.06);
    ctx.font = `400 ${titleFontSize}px "Inter", sans-serif`;
    
    const titleY = canvas.height * 0.15;
    if (title) {
      ctx.globalAlpha = 0.6;
      ctx.fillText(title.toUpperCase(), canvas.width / 2, titleY);
      ctx.globalAlpha = 1.0;
    }

    // Draw Mnemonic Content
    let contentFontSize = Math.floor(canvas.width * 0.08);
    const minFontSize = Math.floor(canvas.width * 0.02);
    let lineHeight = contentFontSize * 1.6;
    
    const startY = canvas.height * 0.25;
    const endY = canvas.height * 0.85;
    const availableHeight = endY - startY;
    
    let lines: string[] = [];
    let fits = false;

    // Dynamic Font Sizing Loop
    while (!fits && contentFontSize >= minFontSize) {
      ctx.font = `400 ${contentFontSize}px "Inter", sans-serif`;
      lineHeight = contentFontSize * 1.6;
      lines = [];
      
      const paragraphs = mnemonic.split('\n');
      
      for (const paragraph of paragraphs) {
        const wordsInPara = paragraph.split(' ').filter(w => w.length > 0);
        let currentLineWords: string[] = [];
        
        for (let i = 0; i < wordsInPara.length; i++) {
          const word = wordsInPara[i];
          const testLine = [...currentLineWords, word].join(' ');
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLineWords.length > 0) {
            lines.push(currentLineWords.join(' '));
            currentLineWords = [word];
          } else {
            currentLineWords.push(word);
          }
        }
        if (currentLineWords.length > 0) {
          lines.push(currentLineWords.join(' '));
        }
      }

      const totalHeight = lines.length * lineHeight;
      if (totalHeight <= availableHeight) {
        fits = true;
      } else {
        contentFontSize -= 2;
      }
    }

    setCalculatedFontSize(contentFontSize);

    // Draw the calculated lines
    ctx.font = `400 ${contentFontSize}px "Inter", sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = textAlign;
    
    const totalTextHeight = lines.length * lineHeight;
    // Center vertically in the available area
    let currentY = startY + (availableHeight - totalTextHeight) / 2 + lineHeight / 2;
    const xPos = textAlign === 'center' ? canvas.width / 2 : textAlign === 'left' ? padding : canvas.width - padding;

    lines.forEach(line => {
      ctx.fillText(line, xPos, currentY);
      currentY += lineHeight;
    });

    // Footer / Subtle Branding
    ctx.globalAlpha = 0.3;
    ctx.font = `400 ${Math.floor(canvas.width * 0.025)}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('FIRSTLETTER', canvas.width / 2, canvas.height - 100);

  }, [title, mnemonic, selectedDevice, selectedTheme, textAlign]);

  return (
    <div className="min-h-screen bg-[#f9f8f3] text-[#141414] font-sans selection:bg-stone-200">
      <header className="max-w-7xl mx-auto px-6 md:px-8 pt-10 md:pt-16 pb-8 md:pb-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-serif font-bold tracking-tight"
        >
          FirstLetter
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[9px] sm:text-xs md:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] md:tracking-[0.25em] font-bold text-[#141414] mt-3 whitespace-nowrap"
        >
          Memorize any verse — one letter at a time
        </motion.p>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-8 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Section: Inputs */}
        <section className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 card-shadow border border-stone-100 space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-stone-400">
                Title (Optional)
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Psalm 23"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-stone-100 transition-all outline-none text-lg"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-stone-400">
                Text to Memorize
              </label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your text here..."
                rows={10}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-stone-100 transition-all outline-none text-lg leading-relaxed resize-none"
              />
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${removeNumbers ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-400'}`}>
                  {removeNumbers && <Check size={12} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={removeNumbers}
                  onChange={(e) => setRemoveNumbers(e.target.checked)}
                />
                <span className="text-[11px] uppercase tracking-widest font-bold text-stone-900">Remove Numbers</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${keepLineBreaks ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-400'}`}>
                  {keepLineBreaks && <Check size={12} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={keepLineBreaks}
                  onChange={(e) => setKeepLineBreaks(e.target.checked)}
                />
                <span className="text-[11px] uppercase tracking-widest font-bold text-stone-900">Keep Line Breaks</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 card-shadow border border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-stone-400">
                Alignment
              </label>
              <div className="flex bg-stone-100 p-1 rounded-xl">
                {['Left', 'Center', 'Right'].map((align) => (
                  <button 
                    key={align}
                    onClick={() => setTextAlign(align.toLowerCase() as any)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${textAlign === align.toLowerCase() ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-widest font-bold text-stone-400">
                Target Device
              </label>
              <div className="relative">
                <select
                  value={selectedDevice.name}
                  onChange={(e) => {
                    const device = DEVICES.find(d => d.name === e.target.value);
                    if (device) setSelectedDevice(device);
                  }}
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-stone-100 transition-all outline-none text-sm font-medium text-stone-900 appearance-none cursor-pointer"
                >
                  {DEVICES.map((device) => (
                    <option key={device.name} value={device.name}>
                      {device.name} ({device.width}x{device.height})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                  <Smartphone size={14} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Center Section: Phone Mockup */}
        <section className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-[360px]">
            {/* Realistic Phone Frame */}
            <div className="aspect-[9/19.5] w-full bg-[#1c1c1e] rounded-[3.5rem] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] ring-1 ring-stone-800 relative">
              {/* Inner Screen */}
              <div className="w-full h-full bg-black rounded-[2.8rem] overflow-hidden relative" style={{ containerType: 'size' }}>
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out"
                  style={{ 
                    backgroundColor: selectedTheme.bg,
                    color: selectedTheme.text,
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <div className="px-10 w-full space-y-10" style={{ textAlign: textAlign }}>
                    {title && (
                      <div className="space-y-3">
                        <h2 className="text-xl font-medium uppercase tracking-[0.2em] opacity-60 text-center">{title}</h2>
                      </div>
                    )}
                    <p 
                      className="leading-relaxed tracking-wide font-medium whitespace-pre-wrap"
                      style={{ 
                        fontSize: calculatedFontSize ? `${(calculatedFontSize / selectedDevice.width) * 100}cqw` : '1.25rem',
                        lineHeight: '1.6'
                      }}
                    >
                      {mnemonic || 'Your mnemonic will appear here...'}
                    </p>
                  </div>
                  
                  <div className="absolute bottom-10 text-[10px] tracking-[0.3em] opacity-30 uppercase font-bold">
                    FirstLetter
                  </div>
                </div>
              </div>
              
              {/* Dynamic Island */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-10" />
              
              {/* Side Buttons */}
              <div className="absolute top-32 -left-1 w-1 h-12 bg-stone-800 rounded-r-sm" />
              <div className="absolute top-48 -left-1 w-1 h-16 bg-stone-800 rounded-r-sm" />
              <div className="absolute top-68 -left-1 w-1 h-16 bg-stone-800 rounded-r-sm" />
              <div className="absolute top-48 -right-1 w-1 h-24 bg-stone-800 rounded-l-sm" />
            </div>

            {/* Hidden Canvas for Export */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </section>

        {/* Right Section: Themes & Export */}
        <section className="lg:col-span-3 space-y-10">
          <div className="space-y-6">
            <label className="text-[11px] uppercase tracking-widest font-bold text-stone-400">
              Aesthetic Theme
            </label>
            <div className="grid grid-cols-2 gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setSelectedTheme(theme)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div 
                    className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                      selectedTheme.name === theme.name ? 'border-stone-900 scale-95 shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: theme.bg }}
                  >
                    <span className="text-2xl font-medium" style={{ color: theme.text }}>Aa</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${selectedTheme.name === theme.name ? 'text-stone-900' : 'text-stone-400'}`}>
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <button
              onClick={handleExport}
              disabled={!content || isExporting}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all shadow-xl active:scale-95 ${
                !content || isExporting
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#2D2D2D] text-white hover:bg-black hover:-translate-y-1'
              }`}
            >
              {isExporting ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isExporting ? 'Generating...' : 'Export Wallpaper'}
            </button>
            
            <p className="text-center text-[10px] text-stone-400 uppercase tracking-widest font-bold">
              High-resolution PNG • {selectedDevice.width}x{selectedDevice.height}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
