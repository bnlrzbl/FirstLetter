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
  { name: 'Midnight', bg: '#09090b', text: '#fafafa', accent: '#3b82f6', font: 'serif' },
  { name: 'Paper', bg: '#f5f5f4', text: '#1c1917', accent: '#78716c', font: 'serif' },
  { name: 'Forest', bg: '#064e3b', text: '#ecfdf5', accent: '#10b981', font: 'sans-serif' },
  { name: 'Deep Sea', bg: '#1e3a8a', text: '#dbeafe', accent: '#60a5fa', font: 'sans-serif' },
  { name: 'Slate', bg: '#1e293b', text: '#f1f5f9', accent: '#94a3b8', font: 'serif' },
  { name: 'Rose', bg: '#4c0519', text: '#fff1f2', accent: '#fb7185', font: 'serif' },
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
        link.download = `${title || 'mnemonic'}-wallpaper.png`;
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
    const padding = canvas.width * 0.1;
    const maxWidth = canvas.width - padding * 2;
    
    // Draw Title
    ctx.fillStyle = selectedTheme.text;
    ctx.textAlign = 'center';
    
    const titleFontSize = Math.floor(canvas.width * 0.08);
    ctx.font = `italic 300 ${titleFontSize}px ${selectedTheme.font === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif'}`;
    
    const titleY = canvas.height * 0.2;
    if (title) {
      ctx.fillText(title.toUpperCase(), canvas.width / 2, titleY);
      
      // Divider line
      ctx.strokeStyle = selectedTheme.accent;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 40, titleY + 30);
      ctx.lineTo(canvas.width / 2 + 40, titleY + 30);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Draw Mnemonic Content
    let contentFontSize = Math.floor(canvas.width * 0.06);
    const minFontSize = Math.floor(canvas.width * 0.02);
    let lineHeight = contentFontSize * 1.6;
    
    const startY = canvas.height * 0.3;
    const endY = canvas.height * 0.9;
    const availableHeight = endY - startY;
    
    let lines: string[] = [];
    let fits = false;

    // Dynamic Font Sizing Loop
    while (!fits && contentFontSize >= minFontSize) {
      ctx.font = `400 ${contentFontSize}px ${selectedTheme.font === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif'}`;
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
            // We need to break.
            let breakIdx = -1;
            
            // Helper to check if a word is the start of a sentence
            const checkIsStartOfSentence = (idx: number, words: string[]) => {
              if (idx > 0) {
                const prevWord = words[idx - 1];
                return /[.!?]/.test(prevWord);
              } else if (lines.length > 0) {
                const prevLine = lines[lines.length - 1];
                return /[.!?]/.test(prevLine);
              }
              return false;
            };

            // 1. Try to find a punctuation break (.,;:!?)
            // Criteria: Line length >= 4 AND Last word is NOT the start of a new sentence
            for (let j = currentLineWords.length - 1; j >= 0; j--) {
              const candidateLine = currentLineWords.slice(0, j + 1).join(' ');
              if (candidateLine.length < 4) continue;

              const lastWord = currentLineWords[j];
              const isPunctuation = /[.,;:!?]/.test(lastWord);
              const isStartOfSentence = checkIsStartOfSentence(j, currentLineWords);

              if (isPunctuation && !isStartOfSentence) {
                breakIdx = j;
                break;
              }
            }

            // 2. If no punctuation break, try any break that isn't a start of sentence
            if (breakIdx === -1) {
              for (let j = currentLineWords.length - 1; j >= 0; j--) {
                const candidateLine = currentLineWords.slice(0, j + 1).join(' ');
                if (candidateLine.length < 4) continue;

                if (!checkIsStartOfSentence(j, currentLineWords)) {
                  breakIdx = j;
                  break;
                }
              }
            }

            // 3. Fallback: break at the last possible word that gives length >= 4
            if (breakIdx === -1) {
              for (let j = currentLineWords.length - 1; j >= 0; j--) {
                const candidateLine = currentLineWords.slice(0, j + 1).join(' ');
                if (candidateLine.length >= 4) {
                  breakIdx = j;
                  break;
                }
              }
            }

            // 4. Absolute fallback: just break at the last word
            if (breakIdx === -1) breakIdx = currentLineWords.length - 1;

            lines.push(currentLineWords.slice(0, breakIdx + 1).join(' '));
            const remaining = currentLineWords.slice(breakIdx + 1);
            currentLineWords = [...remaining, word];
          } else {
            currentLineWords.push(word);
          }
        }
        if (currentLineWords.length > 0) {
          lines.push(currentLineWords.join(' '));
        }
      }

      // Post-process: Ensure lines aren't too short (< 4 chars) by merging if they fit
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].length < 4) {
          const merged = lines[i-1] + ' ' + lines[i];
          if (ctx.measureText(merged).width <= maxWidth) {
            lines[i-1] = merged;
            lines.splice(i, 1);
            i--;
          }
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
    ctx.font = `400 ${contentFontSize}px ${selectedTheme.font === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif'}`;
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
    ctx.globalAlpha = 0.2;
    ctx.font = `300 ${Math.floor(canvas.width * 0.025)}px sans-serif`;
    ctx.fillText('MNEMONIC WALLPAPER', canvas.width / 2, canvas.height - 100);

  }, [title, mnemonic, selectedDevice, selectedTheme, textAlign]);

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#1c1917] font-sans selection:bg-blue-100">
      <header className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-serif italic tracking-tight"
          >
            Mnemonic
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm uppercase tracking-widest text-stone-500 mt-2 font-medium"
          >
            Memorization Wallpaper Maker
          </motion.p>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono text-stone-400">
          <span className="flex items-center gap-1"><Smartphone size={14} /> {selectedDevice.width}x{selectedDevice.height}</span>
          <span className="w-px h-4 bg-stone-200" />
          <span className="flex items-center gap-1"><Palette size={14} /> {selectedTheme.name}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Input Section */}
        <section className="lg:col-span-7 space-y-8">
          <div className="bg-blue-50/50 rounded-2xl p-4 flex gap-3 text-blue-700/80">
            <Info size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>How it works:</strong> We keep only the first letter of every word. This forces your brain to recall the full word, strengthening neural pathways for memorization. Use the generated wallpaper as your lock screen for constant, passive practice.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200/50 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 flex items-center gap-2">
                <Type size={12} /> Title (Optional)
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Psalm 1"
                className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-stone-200 transition-all outline-none text-lg font-serif italic"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 flex items-center gap-2">
                  <RefreshCw size={12} /> Text to Memorize
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${removeNumbers ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-400'}`}>
                      {removeNumbers && <Check size={10} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={removeNumbers}
                      onChange={(e) => setRemoveNumbers(e.target.checked)}
                    />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 group-hover:text-stone-600 transition-colors">Remove Numbers</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${keepLineBreaks ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-400'}`}>
                      {keepLineBreaks && <Check size={10} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={keepLineBreaks}
                      onChange={(e) => setKeepLineBreaks(e.target.checked)}
                    />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 group-hover:text-stone-600 transition-colors">Keep Line Breaks</span>
                  </label>
                </div>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your text here..."
                rows={8}
                className="w-full bg-stone-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-stone-200 transition-all outline-none font-serif text-lg leading-relaxed resize-none"
              />
              <AnimatePresence>
                {isTooLong && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 text-amber-600 bg-amber-50 rounded-xl p-3 text-[11px] leading-tight border border-amber-100"
                  >
                    <Info size={14} className="shrink-0" />
                    <p>
                      <strong>Note:</strong> This text is quite long ({content.length} chars). The mnemonic might be too small to read comfortably on the wallpaper. Consider breaking it into multiple wallpapers.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/50 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 flex items-center gap-2">
                  <AlignLeft size={12} /> Alignment
                </label>
                <div className="flex bg-stone-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setTextAlign('left')}
                    className={`p-1.5 rounded-md transition-all ${textAlign === 'left' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <AlignLeft size={14} />
                  </button>
                  <button 
                    onClick={() => setTextAlign('center')}
                    className={`p-1.5 rounded-md transition-all ${textAlign === 'center' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <AlignCenter size={14} />
                  </button>
                  <button 
                    onClick={() => setTextAlign('right')}
                    className={`p-1.5 rounded-md transition-all ${textAlign === 'right' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <AlignRight size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 flex items-center gap-2">
                  <Smartphone size={12} /> Target Device
                </label>
                <div className="space-y-2">
                  {DEVICES.map((device) => (
                    <button
                      key={device.name}
                      onClick={() => setSelectedDevice(device)}
                      className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-between ${
                        selectedDevice.name === device.name 
                          ? 'bg-stone-900 text-white' 
                          : 'hover:bg-stone-50 text-stone-600'
                      }`}
                    >
                      <span>{device.name}</span>
                      {selectedDevice.name === device.name && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/50 space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 flex items-center gap-2">
                <Palette size={12} /> Aesthetic Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setSelectedTheme(theme)}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedTheme.name === theme.name ? 'border-stone-900 scale-95' : 'border-transparent hover:scale-105'
                    }`}
                    title={theme.name}
                  >
                    <div className="absolute inset-0" style={{ backgroundColor: theme.bg }} />
                    <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <div className="absolute bottom-2 right-2 text-[8px] font-bold" style={{ color: theme.text }}>Aa</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-8 w-full max-w-[320px] space-y-6">
            <div className="relative group">
              {/* Phone Frame Mockup */}
              <div className="aspect-[9/19.5] w-full bg-stone-900 rounded-[3rem] p-2.5 shadow-2xl ring-1 ring-stone-200 overflow-hidden">
                <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden relative" style={{ containerType: 'size' }}>
                  {/* The actual canvas is hidden, we show a scaled preview */}
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-500"
                    style={{ 
                      backgroundColor: selectedTheme.bg,
                      color: selectedTheme.text,
                      fontFamily: selectedTheme.font === 'serif' ? 'Georgia, serif' : 'sans-serif'
                    }}
                  >
                    <div className="px-6 w-full space-y-8" style={{ textAlign: textAlign }}>
                      {title && (
                        <div className="space-y-2">
                          <h2 className="text-xl italic font-light uppercase tracking-widest opacity-90 text-center">{title}</h2>
                          <div className="w-8 h-px mx-auto" style={{ backgroundColor: selectedTheme.accent, opacity: 0.4 }} />
                        </div>
                      )}
                      <p 
                        className="leading-relaxed tracking-wide font-medium whitespace-pre-wrap"
                        style={{ 
                          fontSize: calculatedFontSize ? `${(calculatedFontSize / selectedDevice.width) * 100}cqw` : '1.125rem',
                          lineHeight: '1.6'
                        }}
                      >
                        {mnemonic || 'Your mnemonic will appear here...'}
                      </p>
                    </div>
                    
                    <div className="absolute bottom-8 text-[8px] tracking-[0.2em] opacity-20 uppercase font-bold">
                      Mnemonic Wallpaper
                    </div>
                  </div>
                </div>
                
                {/* Notch/Dynamic Island Mockup */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-stone-900 rounded-full z-10" />
              </div>

              {/* Hidden Canvas for Export */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <button
              onClick={handleExport}
              disabled={!content || isExporting}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 ${
                !content || isExporting
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-stone-800 hover:-translate-y-1'
              }`}
            >
              {isExporting ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Download size={20} />
              )}
              {isExporting ? 'Generating...' : 'Export Wallpaper'}
            </button>
            
            <p className="text-center text-[10px] text-stone-400 uppercase tracking-widest font-medium">
              High-resolution PNG • {selectedDevice.width}x{selectedDevice.height}
            </p>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-400 text-xs">
        <p>© 2026 Mnemonic Wallpaper Maker</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-stone-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-stone-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-stone-600 transition-colors">Help</a>
        </div>
      </footer>
    </div>
  );
}
