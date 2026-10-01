import React from "react";

const EcoHeroIllustration = () => {
  return (
    <div className="eco-hero-living-art">
      <svg
        viewBox="0 0 560 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="eco-living-svg"
      >
        <defs>
          <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="earthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="binGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#166534" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* 1. Animated Sun with Rays */}
        <g className="anim-sun-group" transform="translate(470, 75)">
          <circle cx="0" cy="0" r="34" fill="url(#sunGrad)" />
          {/* Rotating rays */}
          <g className="anim-spin-slow">
            <path d="M0 -46 L0 -54 M0 46 L0 54 M-46 0 L-54 0 M46 0 L54 0 M-32 -32 L-39 -39 M32 32 L39 39 M-32 32 L-39 39 M32 -32 L39 -39" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" opacity="0.85" />
          </g>
          {/* Happy sun face */}
          <circle cx="-10" cy="-4" r="3" fill="#854d0e" />
          <circle cx="10" cy="-4" r="3" fill="#854d0e" />
          <path d="M-6 4 Q0 10 6 4" stroke="#854d0e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <ellipse cx="-13" cy="2" rx="4" ry="2" fill="#f472b6" opacity="0.6" />
          <ellipse cx="13" cy="2" rx="4" ry="2" fill="#f472b6" opacity="0.6" />
        </g>

        {/* 2. Floating Clouds */}
        <g className="anim-cloud-1" opacity="0.8">
          <path d="M60 90 Q 70 65, 95 70 Q 120 60, 135 80 Q 155 75, 160 95 Q 165 110, 145 115 L 75 115 Q 55 110, 60 90 Z" fill="#ffffff" />
        </g>
        <g className="anim-cloud-2" opacity="0.7">
          <path d="M320 60 Q 330 40, 350 45 Q 370 35, 385 50 Q 400 45, 405 60 Q 410 75, 390 80 L 330 80 Q 315 75, 320 60 Z" fill="#ffffff" />
        </g>

        {/* 3. Floating Hearts & Butterflies */}
        <g className="anim-flutter-1">
          <path d="M380 95 C380 88 388 84 394 90 C400 84 408 88 408 95 C408 105 394 115 394 115 C394 115 380 105 380 95 Z" fill="#f87171" />
        </g>
        <g className="anim-flutter-2">
          <path d="M360 120 C360 115 366 112 370 117 C374 112 380 115 380 120 C380 127 370 135 370 135 C370 135 360 127 360 120 Z" fill="#fb7185" opacity="0.85" />
        </g>
        <g className="anim-butterfly">
          {/* Butterfly wings */}
          <path d="M290 85 Q 280 70, 270 80 Q 260 90, 275 95 Z" fill="#f472b6" />
          <path d="M290 85 Q 300 70, 310 80 Q 320 90, 305 95 Z" fill="#fb7185" />
          <circle cx="290" cy="88" r="3" fill="#881337" />
        </g>

        {/* 4. Layered Background Rolling Hills */}
        <path d="M200 400 Q 280 210, 430 400 Z" fill="#bbf7d0" opacity="0.6" />
        <path d="M-10 400 Q 140 240, 330 400 Z" fill="url(#hillGrad1)" opacity="0.5" />
        <path d="M210 400 Q 380 250, 560 400 Z" fill="#86efac" opacity="0.6" />
        <path d="M-30 400 Q 270 270, 580 400 Z" fill="url(#hillGrad2)" opacity="0.85" />

        {/* 5. Animated Wooden Direction Post (Sways gently) */}
        <g className="anim-sway-signs" transform="translate(425, 115)" filter="url(#softGlow)">
          <rect x="52" y="5" width="10" height="240" rx="4" fill="#b45309" />
          
          {/* Sign 1: CLEANER */}
          <g className="sign-board">
            <path d="M10 20 L95 20 L105 35 L95 50 L10 50 L0 35 Z" fill="#fde68a" stroke="#d97706" strokeWidth="2.5" />
            <text x="50" y="38" fontSize="12" fontWeight="900" fill="#78350f" textAnchor="middle" fontFamily="Quicksand, sans-serif" letterSpacing="1.2">CLEANER</text>
          </g>

          {/* Sign 2: GREENER */}
          <g className="sign-board">
            <path d="M5 62 L90 62 L100 77 L90 92 L5 92 L15 77 Z" fill="#fef08a" stroke="#d97706" strokeWidth="2.5" />
            <text x="50" y="80" fontSize="12" fontWeight="900" fill="#78350f" textAnchor="middle" fontFamily="Quicksand, sans-serif" letterSpacing="1.2">GREENER</text>
          </g>

          {/* Sign 3: HAPPIER */}
          <g className="sign-board">
            <path d="M10 104 L95 104 L105 119 L95 134 L10 134 L0 119 Z" fill="#fde68a" stroke="#d97706" strokeWidth="2.5" />
            <text x="50" y="122" fontSize="12" fontWeight="900" fill="#78350f" textAnchor="middle" fontFamily="Quicksand, sans-serif" letterSpacing="1.2">HAPPIER</text>
          </g>

          {/* Sign 4: TOGETHER */}
          <g className="sign-board">
            <path d="M5 146 L90 146 L100 161 L90 176 L5 176 L15 161 Z" fill="#fef08a" stroke="#d97706" strokeWidth="2.5" />
            <text x="50" y="164" fontSize="11" fontWeight="900" fill="#78350f" textAnchor="middle" fontFamily="Quicksand, sans-serif" letterSpacing="1.2">TOGETHER</text>
          </g>
        </g>

        {/* 6. Living Cute Earth Character (Left) */}
        <g className="anim-earth-breathe" filter="url(#softGlow)">
          {/* Earth Body */}
          <circle cx="210" cy="235" r="76" fill="url(#earthGrad)" />
          
          {/* Green Continents */}
          <path d="M168 205 Q 188 190, 205 205 T 235 195 T 255 215 Q 240 245, 215 240 Q 185 250, 168 205 Z" fill="#4ade80" />
          <path d="M162 255 Q 182 260, 192 280 Q 177 295, 157 285 Q 152 265, 162 255 Z" fill="#4ade80" />
          <path d="M225 260 Q 255 255, 270 270 Q 260 290, 235 285 Z" fill="#4ade80" />

          {/* Cheeks */}
          <ellipse cx="180" cy="242" rx="9" ry="6" fill="#f472b6" opacity="0.65" />
          <ellipse cx="238" cy="242" rx="9" ry="6" fill="#f472b6" opacity="0.65" />

          {/* Eyes (Happy Wink & Open Eyes) */}
          <g className="anim-eyes-blink">
            <path d="M184 228 Q 192 218, 200 228" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M218 228 Q 226 218, 234 228" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>

          {/* Big Open Smile */}
          <path d="M198 242 Q 209 260, 220 242 Z" fill="#0f172a" />
          <path d="M203 249 Q 209 256, 215 249 Z" fill="#f43f5e" />

          {/* Animated Sprout on Earth Head */}
          <g className="anim-sprout-bob" transform="translate(0, 0)">
            <path d="M210 160 Q 206 148, 210 138" stroke="#15803d" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M210 138 Q 194 128, 203 118 Q 215 124, 210 138 Z" fill="#22c55e" />
            <path d="M210 140 Q 226 130, 222 118 Q 210 124, 210 140 Z" fill="#4ade80" />
          </g>

          {/* Waving / High-five Arm */}
          <g className="anim-earth-arm">
            <path d="M280 232 Q 312 210, 332 222" stroke="#38bdf8" strokeWidth="13" strokeLinecap="round" fill="none" />
          </g>
          <path d="M138 240 Q 115 258, 126 275" stroke="#38bdf8" strokeWidth="13" strokeLinecap="round" fill="none" />
        </g>

        {/* 7. Cute Green Recycling Bin Character (Right) */}
        <g className="anim-bin-bob" filter="url(#softGlow)" transform="translate(45, 12)">
          {/* Bin Base */}
          <path d="M285 178 L370 178 L356 295 Q 354 306, 342 306 L312 306 Q 300 306, 298 295 Z" fill="url(#binGrad)" stroke="#166534" strokeWidth="3.5" />
          
          {/* Bin Lid */}
          <path d="M272 166 L382 166 Q 386 166, 384 176 L376 182 L276 182 L270 176 Q 268 166, 272 166 Z" fill="#22c55e" stroke="#166534" strokeWidth="3.5" />
          <path d="M312 152 Q 327 145, 342 152 L342 166 L312 166 Z" fill="#15803d" />

          {/* Recycle Symbol on Bin (Pulses) */}
          <g className="anim-pulse-badge" transform="translate(320, 248) scale(0.7)">
            <path d="M15 0 L25 15 L5 15 Z" fill="#ffffff" />
            <path d="M2 15 Q 15 5, 25 15 M25 25 Q 35 35, 20 40 M10 38 Q -2 30, 2 15" stroke="#ffffff" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </g>

          {/* Face on Bin */}
          <ellipse cx="304" cy="208" rx="8" ry="4.5" fill="#f472b6" opacity="0.65" />
          <ellipse cx="350" cy="208" rx="8" ry="4.5" fill="#f472b6" opacity="0.65" />
          {/* Eyes */}
          <circle cx="310" cy="200" r="5" fill="#0f172a" />
          <circle cx="312" cy="198" r="1.8" fill="#ffffff" />
          <circle cx="344" cy="200" r="5" fill="#0f172a" />
          <circle cx="346" cy="198" r="1.8" fill="#ffffff" />
          {/* Smile */}
          <path d="M320 210 Q 327 222, 335 210" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />

          {/* High Five Arm meeting Earth */}
          <g className="anim-bin-arm">
            <path d="M285 220 Q 268 208, 250 218" stroke="#16a34a" strokeWidth="12" strokeLinecap="round" fill="none" />
          </g>
          <path d="M370 220 Q 390 232, 395 248" stroke="#16a34a" strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>

        {/* 8. Little animated flowers & grass at the bottom */}
        <g transform="translate(60, 325)">
          <g className="anim-sway">
            <circle cx="40" cy="20" r="9" fill="#fef08a" />
            <circle cx="40" cy="20" r="4.5" fill="#f59e0b" />
          </g>
          <g className="anim-sway" style={{ animationDelay: "0.5s" }}>
            <circle cx="80" cy="30" r="11" fill="#fbcfe8" />
            <circle cx="80" cy="30" r="5.5" fill="#db2777" />
          </g>
          <g className="anim-sway" style={{ animationDelay: "1s" }}>
            <circle cx="360" cy="25" r="10" fill="#fef08a" />
            <circle cx="360" cy="25" r="5" fill="#f59e0b" />
          </g>
          <g className="anim-sway" style={{ animationDelay: "1.5s" }}>
            <circle cx="440" cy="20" r="9" fill="#fed7aa" />
            <circle cx="440" cy="20" r="4.5" fill="#ea580c" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default EcoHeroIllustration;
