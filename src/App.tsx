/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Loader2, Sparkles, Image as ImageIcon, Download, Share2, Check, Palette, Sun, Music, Video, 
  AlertCircle, Key, Home, Users, Eye, FileText, Mic, Languages, Send, Copy, Volume2, Menu, 
  Search, BookOpen, Calculator, Binary, Zap, Share, ArrowLeft, GraduationCap, School, Library, 
  Atom, Globe, FlaskConical, Microscope, Dna, Sigma, SquareFunction, PenTool, BookOpenCheck, 
  ScrollText, Trophy, MessageSquare, Activity, Percent, DollarSign, Ruler, CreditCard, Flame, 
  Clock, Variable, BarChart3, TrendingUp, Fuel, Utensils, Map, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const VIDEO_LOADING_MESSAGES = [
  "Initializing neural rendering engine...",
  "Synthesizing high-fidelity frames...",
  "Extending temporal coherence...",
  "Applying cinematic color grading...",
  "Optimizing motion vectors...",
  "Finalizing visual composition...",
  "Polishing artistic details...",
  "Synchronizing frame transitions..."
];

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`} />
);

const AILoadingState = ({ 
  message = "Processing...", 
  subMessage = "Our AI is working its magic",
  icon: Icon = Sparkles,
  className = ""
}: { 
  message?: string, 
  subMessage?: string, 
  icon?: any,
  className?: string
}) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={`flex flex-col items-center justify-center text-center p-8 space-y-6 ${className}`}
  >
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="w-24 h-24 rounded-full border-2 border-dashed border-orange-500/30"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-orange-500/20">
          <Icon className="w-8 h-8 text-orange-500" />
        </div>
      </motion.div>
      <motion.div
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-2 -right-2"
      >
        <Sparkles className="w-6 h-6 text-orange-400/50" />
      </motion.div>
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-bold tracking-tight text-white uppercase">{message}</h3>
      <p className="text-zinc-500 text-sm font-medium max-w-[200px] mx-auto leading-relaxed">{subMessage}</p>
    </div>
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          className="w-1.5 h-1.5 bg-orange-500 rounded-full"
        />
      ))}
    </div>
  </motion.div>
);

// Predefined Video Prompt Suggestions
const VIDEO_SUGGESTIONS = [
  {
    label: "Cyberpunk City",
    prompt: "A cinematic flyover of a neon-drenched cyberpunk city at night, rain-slicked streets reflecting glowing signs, flying vehicles weaving through skyscrapers, 8k, hyper-realistic."
  },
  {
    label: "Forest Waterfall",
    prompt: "A serene, lush tropical forest with a massive waterfall cascading into a crystal-clear turquoise pool, exotic birds flying past, sunlight filtering through the canopy, ethereal atmosphere."
  },
  {
    label: "Space Nebula",
    prompt: "A journey through a vibrant, swirling cosmic nebula, glowing stars being born, deep purples and oranges, cinematic camera movement, epic space odyssey style."
  },
  {
    label: "Desert Oasis",
    prompt: "A vast, golden sand desert at sunset, a hidden oasis with palm trees and a small lake, wind blowing sand across the dunes, dramatic long shadows, high contrast."
  },
  {
    label: "Underwater Reef",
    prompt: "A vibrant coral reef teeming with life, schools of colorful tropical fish, a sea turtle swimming gracefully, sunlight rays penetrating the deep blue water, peaceful underwater world."
  },
  {
    label: "Steampunk Workshop",
    prompt: "Inside a cluttered steampunk workshop, brass gears turning, steam hissing from pipes, a mechanical owl blinking its eyes, warm amber lighting, intricate details."
  }
];

// Predefined Styles (Prompts)
const STYLES = [
  {
    id: 'classic',
    name: 'Classic Orange',
    description: 'The iconic orange suit in a dark, anonymous crowd.',
    prompt: `a dashing man wearing a perfectly fitted bright orange suit, with a white shirt, orange tie, and orange fedora hat. He slightly holds the edge of his hat with one hand, his head tilted upward, he stares at the spectator with a very confident look. Around him is a dense crowd of identical men, arranged tightly in the background and in the foreground. All wearing black suits, black shirts, black ties, and black fedora hats. Their heads are totally covered with a black mask and hidden in the shadows under hats, heads lowered, making them anonymous and almost like silhouettes. The crowd creates a repetitive and uniform pattern in a very pronounced blur to emphasize the view of the subject at the center. The central character in orange is the only colorful element in the image, which makes it stand out strongly from the dark crowd. The color palette is dominated by deep black and dark grey, with bright orange as the main accent color.`
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Futuristic orange suit in a glowing neon metropolis.',
    prompt: `a dashing man wearing a high-tech, glowing bright orange suit with neon accents. He wears a matching orange fedora with a holographic band. He stands confidently in a rain-slicked cyberpunk city at night. The background is filled with glowing neon signs in teal and purple, but the subject remains the only orange element. The crowd around him consists of robotic silhouettes with glowing blue eyes. Dramatic cinematic lighting with reflections on the wet ground.`
  },
  {
    id: 'noir',
    name: 'Vintage Noir',
    description: '1940s detective style with a bold orange twist.',
    prompt: `a 1940s detective wearing a classic orange trench coat and matching orange fedora. He stands under a single street lamp in a foggy, dark alleyway. The entire scene is in high-contrast black and white noir style, EXCEPT for the man and his suit, which are vibrant, saturated orange. He holds a magnifying glass or a pipe, looking mysterious. Dramatic film noir shadows and atmosphere.`
  },
  {
    id: 'royal',
    name: 'Royal Gold',
    description: 'Opulent orange suit with gold details in a grand palace.',
    prompt: `a man in a regal orange velvet suit with intricate gold embroidery. He sits on a dark obsidian throne in a grand, dimly lit palace hall. The background features tall, dark marble pillars and faint candlelight. The orange suit is the centerpiece, glowing against the dark, luxurious environment. He has a confident, kingly expression.`
  },
  {
    id: 'street',
    name: 'Urban Street',
    description: 'Modern urban style with graffiti and street vibes.',
    prompt: `a man in a modern, slim-fit orange suit paired with high-end orange sneakers. He stands in front of a dark, grimy brick wall covered in artistic black and grey graffiti. The lighting is harsh and urban, like a street spotlight. He has a cool, effortless pose, leaning against the wall. The orange suit pops intensely against the industrial, dark background.`
  },
  {
    id: 'samurai',
    name: 'Cyber Samurai',
    description: 'Futuristic orange samurai armor in a dark dojo.',
    prompt: `a futuristic samurai wearing intricate bright orange cybernetic armor. He holds a glowing orange katana. He stands in a dark, traditional Japanese dojo with modern holographic elements. The background is dark wood and shadows, making the orange armor glow. Intense, focused expression.`
  },
  {
    id: 'wasteland',
    name: 'Wasteland Hero',
    description: 'Post-apocalyptic orange gear in a dusty desert.',
    prompt: `a post-apocalyptic survivor wearing rugged, weathered orange tactical gear and a tattered orange scarf. He stands in a vast, dark desert under a stormy sky. The environment is dusty and grey, with the orange gear being the only vibrant color. He has a determined, battle-worn look.`
  },
  {
    id: 'abstract',
    name: 'Abstract Fusion',
    description: 'Artistic paint-splatter style with bold orange strokes.',
    prompt: `an artistic, abstract portrait of a man where the orange suit is formed by bold, thick palette knife strokes and paint splatters. The background is a dark, textured canvas with drips of black and grey ink. The man's face is stylized but recognizable. The orange paint is thick and vibrant, creating a high-energy, modern art feel.`
  },
  {
    id: 'outdoorsman',
    name: 'Rugged Outdoorsman',
    description: 'A rugged man with a loyal German Shepherd.',
    prompt: `a rugged outdoorsman kneeling and embracing a loyal German Shepherd, conveying deep emotional bond and protection. The man wears practical adventure clothing with cargo pants, boots, watch and utility gear, slightly weathered face and beard, holding the dog close while the dog looks calm and alert. Render extreme micro-textures in skin, fabric fibers, leather, fur and metal details with razor-sharp clarity and ultra-high resolution. Use soft cinematic lighting with balanced highlights and shadows, gentle atmospheric background blur, shallow depth of field keeping both faces tack-sharp. Maintain rich natural tones with high dynamic range and clean contrast. Remove all text, logos and watermarks. Ultra-clean rendering with no blur, noise or artifacts, masterpiece quality, 8k photorealism.`
  },
  {
    id: 'tiny-people',
    name: 'Tiny People Portrait',
    description: 'A surreal portrait formed by thousands of tiny human figures.',
    prompt: `a surreal conceptual portrait created from thousands of tiny human figures forming the shape of a face, side profile composition based on the photo, miniature people walking, gathering, and standing together to build the structure of the face detailed eye, nose, and lips formed by dense crowds, colorful clothing creating natural shading and depth, white minimal background, dramatic lighting casting long shadows from the tiny people, ultra-detailed macro perspective, cinematic and symbolic concept.`
  },
  {
    id: 'citrus',
    name: 'Citrus Editorial',
    description: 'A surreal pop-art portrait emerging from a composition of oranges and grapefruits.',
    prompt: `a luxury fashion editorial portrait with a surreal pop-art twist where a man's face emerges from a dense composition of ripe oranges and grape fruits, filling the entire frame. He wears a textured fedora hat and dark aviator sunglasses, a playful, irreverent expression. One halved grape fruit placed near his mouth adds graphic contrast and bold texture. Saturated citrus color palette in vivid orange and coral tones. Clean, punchy studio lighting with soft specular highlights on fruit skins and subtle shadows around the face. Ultra-detailed textures, crisp focus, strong visual humor. Contemporary high-fashion editorial with ironic attitude, art-direction-driven composition, magazine-cover energy, bold surreal styling, no text.`
  },
  {
    id: 'infographic',
    name: 'Technical Infographic',
    description: 'A realistic render with technical annotation overlays and measurements.',
    prompt: `an infographic image of a man, combining a realistic photoreal render of him with technical annotation overlays placed directly on top. The annotations include blue-print style lines, measurements, and technical data points pointing to his suit, watch, and features. Clean, minimalist white background with a high-tech laboratory aesthetic. Ultra-detailed 8k render.`
  },
  {
    id: 'nanami',
    name: 'Nanami (JJK)',
    description: 'Kento Nanami from Jujutsu Kaisen with iconic outfit and stance.',
    prompt: `a man wearing the outfit of Nanami from the anime Jujutsu Kaisen, including the tattoo and accessories seen in the anime. Posed in his iconic stance. The image features sharp cinematic lighting and intense contrast, captured from a slightly low angle tilted upward to dramatize the jawline and neck, evoking dominance, photogenic presence, and sculptural elegance.`
  },
  {
    id: 'fb-card',
    name: 'FB Group Card',
    description: 'A futuristic transparent digital display card for the AI Prompts And Secrets group.',
    prompt: `a hyper-realistic, ultra-detailed 8K close-up shot of a futuristic transparent digital display card, positioned at a slight angle on a dark, finely textured matte desk surface. The card is made of clear glass-like material with glossy reflections and subtle edge refractions. At the top right corner of the card, a vibrant glowing Facebook logo (classic white “f” inside a luminous blue circle) emits a soft electric blue aura. A small glowing Facebook “f” icon is also visible in the upper left corner of the card. Centered on the card in glowing white modern sans-serif typography: Main Title (large, bold, cinematic glow): "AI Prompts And Secrets"; Tagline (slightly smaller, refined glow): Where Innovation Meets Imagination; Subtext (clean, elegant, minimal glow): Elite Facebook Group for AI Prompts & Creative Mastery; CTA Line (sleek, modern, spaced lettering at bottom section): Connect • Create • Elevate | 2026. On the left side of the card, a circular profile picture is displayed, featuring a man wearing a suit and glasses, looking directly at the viewer with a confident and professional expression. The circular frame has a highly detailed deep electric blue neon glow border, softly illuminating the surrounding glass surface. The entire bottom edge of the transparent card emits a strong electric blue neon light strip, casting subtle blue reflections and light spill onto the dark desk surface. Background: softly blurred (shallow depth of field) glass French press coffee maker and a small bowl of mixed nuts, creating depth and realism. The background remains out-of-focus with cinematic bokeh. Lighting: dramatic cinematic lighting with high contrast, emphasizing glowing elements, reflections, and the glossy transparent material.`
  },
  {
    id: 'torn-paper',
    name: 'Torn Paper Portrait',
    description: 'A museum-quality graphite and mixed-media portrait with a torn-paper monochrome-to-color contrast.',
    prompt: `a museum-quality graphite and mixed-media portrait of a man with a calm yet intense gaze, centered composition, pristine white background. The left half of his face rendered entirely in ultra-detailed graphite pencil with soft layered shading and subtle crosshatching texture visible throughout the skin and hair. Light natural freckles across the nose and cheeks. A dramatic vertical torn-paper opening splits the face, revealing the right half in hyper-realistic color. The revealed section shows a vivid black eye with a highly detailed iris, glossy reflection, and natural depth. Smooth skin with soft peach undertones and a gentle blush on the cheek. Curled, textured torn paper edges casting soft, realistic shadows onto the white background, emphasizing depth and dimension. Strong monochrome-to-color contrast. Ultra-refined fine art realism, high resolution, sharp focus, professional studio lighting, 8K detail.`
  },
  {
    id: 'synthwave',
    name: 'Retro Synthwave',
    description: '80s retro-futurism with vibrant pink and purple hues.',
    prompt: `a man in a sharp orange suit standing in front of a glowing wireframe grid sunset. The sky is a deep purple with a massive retro sun. Palm tree silhouettes and chrome reflections. The overall aesthetic is 80s synthwave with heavy chromatic aberration and scanline effects. The orange suit has neon pink highlights.`
  },
  {
    id: 'origami',
    name: 'Paper Origami',
    description: 'A portrait constructed from intricate folded paper.',
    prompt: `a man's portrait where his face and orange suit are entirely constructed from thousands of tiny, intricate origami folds. The paper has a subtle texture and visible fold lines. The background is a clean, soft-grey studio setting. Dramatic side lighting creates sharp shadows on the paper edges, emphasizing the three-dimensional geometric structure.`
  },
  {
    id: 'holographic',
    name: 'Prismatic Hologram',
    description: 'A shimmering, translucent holographic projection.',
    prompt: `a translucent, shimmering holographic projection of a man in an orange suit. The image has a prismatic effect with rainbow light refractions and digital glitch artifacts. He appears to be floating in a dark, high-tech server room. Glowing blue data streams flow around him. The orange suit has a pearlescent, iridescent quality.`
  },
  {
    id: 'charcoal',
    name: 'Gritty Charcoal',
    description: 'A raw, hand-drawn charcoal and chalk sketch.',
    prompt: `a raw and expressive charcoal sketch of a man in an orange suit. The drawing features heavy, gestural strokes and smudged textures. Bright orange chalk is used for the suit, creating a bold contrast against the dark charcoal shadows and the off-white, textured paper background. High-energy, artistic feel with visible hand-drawn imperfections.`
  }
];

const LIGHTING_DESCRIPTIONS = {
  dramatic: "The lighting is dramatic, with high contrast and deep shadows.",
  soft: "The lighting is soft and diffused, creating a gentle and elegant look.",
  studio: "The lighting is professional studio lighting, bright and clear with well-defined details.",
  neon: "The lighting is vibrant neon, with glowing colors and sharp highlights in teal and pink.",
  cinematic: "The lighting is cinematic, with a warm golden hour glow and deep anamorphic shadows.",
  vintage: "The lighting is vintage, with a warm sepia tone and soft, grainy highlights.",
};

const FILTERS = [
  { name: 'Original', filter: 'none' },
  { name: 'Cinematic', filter: 'contrast(1.2) saturate(1.1) brightness(0.9)' },
  { name: 'Vintage', filter: 'sepia(0.4) contrast(0.9) brightness(1.05)' },
  { name: 'B&W', filter: 'grayscale(1) contrast(1.2)' },
  { name: 'Dramatic', filter: 'contrast(1.4) brightness(0.8) saturate(1.2)' },
  { name: 'Warm', filter: 'sepia(0.2) saturate(1.5) brightness(1.1)' },
];

// Reference image provided in the prompt
const REFERENCE_IMAGE_URL = "https://storage.googleapis.com/applet-assets/orange-suit-ref.jpg"; // Placeholder, I will use the actual base64 if needed, but for now I'll assume I can fetch it or it's provided. Actually, I should probably allow the user to upload or just use the one provided in the prompt context.

const FAMOUS_CALCULATORS = [
  { id: 'scientific', name: 'Scientific Calculator', icon: Calculator, desc: 'Advanced mathematical functions including trigonometry and logarithms.' },
  { id: 'bmi', name: 'BMI Calculator', icon: Activity, desc: 'Calculate your Body Mass Index to assess your health status.' },
  { id: 'mortgage', name: 'Mortgage Calculator', icon: Home, desc: 'Estimate your monthly home loan payments and interest.' },
  { id: 'currency', name: 'Currency Converter', icon: Globe, desc: 'Real-time exchange rates for global currencies.' },
  { id: 'age', name: 'Age Calculator', icon: Calendar, desc: 'Find your exact age in years, months, and days.' },
  { id: 'percentage', name: 'Percentage Calculator', icon: Percent, desc: 'Calculate percentages, increases, and decreases easily.' },
  { id: 'gpa', name: 'GPA Calculator', icon: GraduationCap, desc: 'Calculate your Grade Point Average for academic tracking.' },
  { id: 'tip', name: 'Tip Calculator', icon: DollarSign, desc: 'Split bills and calculate tips for group dining.' },
  { id: 'unit', name: 'Unit Converter', icon: Ruler, desc: 'Convert between length, weight, volume, and more.' },
  { id: 'loan', name: 'Loan Calculator', icon: CreditCard, desc: 'Calculate interest and payments for personal or auto loans.' },
  { id: 'bmr', name: 'BMR Calculator', icon: Flame, desc: 'Basal Metabolic Rate to determine daily calorie needs.' },
  { id: 'date', name: 'Date Calculator', icon: Clock, desc: 'Calculate days between dates or add/subtract time.' },
  { id: 'binary', name: 'Binary Converter', icon: Binary, desc: 'Convert between Binary, Hex, Octal, and Decimal.' },
  { id: 'gcd-lcm', name: 'GCD/LCM Calculator', icon: Sigma, desc: 'Find Greatest Common Divisor and Least Common Multiple.' },
  { id: 'quadratic', name: 'Quadratic Solver', icon: Variable, desc: 'Solve quadratic equations (ax² + bx + c) instantly.' },
  { id: 'stats', name: 'Standard Deviation', icon: BarChart3, desc: 'Calculate statistical variance and standard deviation.' },
  { id: 'compound', name: 'Compound Interest', icon: TrendingUp, desc: 'See how your savings grow with compound interest.' },
  { id: 'fuel', name: 'Fuel Cost Calculator', icon: Fuel, desc: 'Estimate trip expenses based on distance and efficiency.' },
  { id: 'calorie', name: 'Calorie Calculator', icon: Utensils, desc: 'Daily calorie intake based on your fitness goals.' },
  { id: 'timezone', name: 'Time Zone Converter', icon: Map, desc: 'Compare times across different global time zones.' }
];

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={onClick}
    className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
  >
    <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
      <ArrowLeft size={20} />
    </div>
    <span className="font-bold uppercase tracking-widest text-xs">Back</span>
  </motion.button>
);

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<{url: string, ratio: string, lighting: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [base64Image2, setBase64Image2] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  
  // Load preferences from localStorage
  const savedAspectRatio = typeof window !== 'undefined' ? localStorage.getItem('mi_studio_aspect_ratio') : null;
  const savedLighting = typeof window !== 'undefined' ? localStorage.getItem('mi_studio_lighting') : null;
  const savedStyleId = typeof window !== 'undefined' ? localStorage.getItem('mi_studio_style_id') : null;

  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "3:4" | "4:3">((savedAspectRatio as any) || "1:1");
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [lighting, setLighting] = useState<keyof typeof LIGHTING_DESCRIPTIONS>((savedLighting as any) || "dramatic");
  const [selectedStyle, setSelectedStyle] = useState(() => {
    if (savedStyleId) {
      return STYLES.find(s => s.id === savedStyleId) || STYLES[0];
    }
    return STYLES[0];
  });
  const [isStyleSelectorOpen, setIsStyleSelectorOpen] = useState(false);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('mi_studio_aspect_ratio', aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    localStorage.setItem('mi_studio_lighting', lighting);
  }, [lighting]);

  useEffect(() => {
    localStorage.setItem('mi_studio_style_id', selectedStyle.id);
  }, [selectedStyle]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      // Hide/Show toolbar logic
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setIsToolbarVisible(false);
      } else {
        setIsToolbarVisible(true);
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Convert the initial image to base64 for the API call
  useEffect(() => {
    const fetchRefImage = async () => {
      try {
        // In a real scenario, we'd use the image from the prompt. 
        // For this app, I'll provide a way to upload or use a default.
        // Since I can't easily "get" the image from the prompt as a URL here, 
        // I'll implement an upload feature so the user can use the image they just saw.
      } catch (err) {
        console.error("Failed to load reference image", err);
      }
    };
    fetchRefImage();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (slot === 1) setBase64Image(reader.result as string);
        else setBase64Image2(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async () => {
    if (!base64Image) {
      setError("Please upload a reference image first.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const parts: any[] = [];

      // Add first image with label
      parts.push({ text: "Reference Image 1:" });
      const mimeType1 = base64Image.split(';')[0].split(':')[1];
      const data1 = base64Image.split(',')[1];
      parts.push({
        inlineData: {
          data: data1,
          mimeType: mimeType1,
        },
      });

      // Add second image if exists with label
      if (base64Image2) {
        parts.push({ text: "Reference Image 2:" });
        const mimeType2 = base64Image2.split(';')[0].split(':')[1];
        const data2 = base64Image2.split(',')[1];
        parts.push({
          inlineData: {
            data: data2,
            mimeType: mimeType2,
          },
        });
      }

      const mergeInstruction = base64Image2 
        ? "CRITICAL: You are provided with TWO reference images (Reference Image 1 and Reference Image 2). You MUST create an image featuring TWO separate individuals standing side-by-side. The first individual must have the facial features and hair of Reference Image 1, and the second individual must have the facial features and hair of Reference Image 2. BOTH individuals must be styled identically according to the description below. Treat the description as applying to BOTH people in the scene: " 
        : "Using Reference Image 1 as the reference for the central character, ";
      
      let stylePrompt = selectedStyle.prompt;
      if (base64Image2) {
        stylePrompt = stylePrompt
          .replace(/^a dashing man/i, "two dashing men")
          .replace(/^a man/i, "two men")
          .replace(/^a 1940s detective/i, "two 1940s detectives")
          .replace(/^a futuristic samurai/i, "two futuristic samurais")
          .replace(/^a post-apocalyptic survivor/i, "two post-apocalyptic survivors")
          .replace(/^a rugged outdoorsman/i, "two rugged outdoorsmen")
          .replace(/^a surreal conceptual portrait created from thousands of tiny human figures forming the shape of a face/i, "two surreal conceptual portraits created from thousands of tiny human figures forming the shapes of two faces")
          .replace(/^a luxury fashion editorial portrait with a surreal pop-art twist where a man's face emerges/i, "two luxury fashion editorial portraits with a surreal pop-art twist where two men's faces emerge")
          .replace(/^an infographic image of a man/i, "two infographic images of two men")
          .replace(/^a hyper-realistic, ultra-detailed 8K close-up shot of a futuristic transparent digital display card/i, "a hyper-realistic, ultra-detailed 8K close-up shot of two futuristic transparent digital display cards")
          .replace(/^a museum-quality graphite and mixed-media portrait of a man/i, "two museum-quality graphite and mixed-media portraits of two men")
          .replace(/^a man's portrait/i, "two men's portraits")
          .replace(/^a translucent, shimmering holographic projection of a man/i, "two translucent, shimmering holographic projections of two men")
          .replace(/^a raw and expressive charcoal sketch of a man/i, "two raw and expressive charcoal sketches of two men")
          .replace(/^an artistic, abstract portrait of a man/i, "an artistic, abstract portrait of two men");
      }
      
      const finalPrompt = `${mergeInstruction}Create an image of ${stylePrompt} ${LIGHTING_DESCRIPTIONS[lighting]}`;
      parts.push({ text: finalPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          setGeneratedImage(newImageUrl);
          setHistory(prev => [{ url: newImageUrl, ratio: aspectRatio, lighting }, ...prev].slice(0, 10));
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated in the response.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getFilteredImageData = async (): Promise<string> => {
    if (!generatedImage || selectedFilter.filter === 'none') return generatedImage || '';

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = selectedFilter.filter;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(generatedImage || '');
        }
      };
      img.src = generatedImage || '';
    });
  };

  const [showSplash, setShowSplash] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [activeSection, setActiveSection] = useState<'home' | 'image' | 'video' | 'music' | 'about' | 'vision' | 'script' | 'voice' | 'translate' | 'research' | 'book' | 'calc' | 'math' | 'manifest' | 'edu' | 'chat'>('home');
  
  // Pakistan Education States
  const [eduStep, setEduStep] = useState<'boards' | 'classes' | 'subjects' | 'content'>('boards');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [eduContent, setEduContent] = useState<string | null>(null);
  const [isEduLoading, setIsEduLoading] = useState(false);
  const [eduTheme, setEduTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [eduFontSize, setEduFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');

  useEffect(() => {
    if (activeSection === 'edu') {
      setEduStep('boards');
      setSelectedBoard(null);
      setSelectedClass(null);
      setSelectedSubject(null);
      setEduContent(null);
    }
  }, [activeSection]);
  const [musicPrompt, setMusicPrompt] = useState('');
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedMusicInfo, setGeneratedMusicInfo] = useState<null | { title: string, description: string, lyrics: string }>(null);

  // AI Vision State
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionAnalysis, setVisionAnalysis] = useState('');
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);

  // AI Scriptwriter State
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // AI Voiceover State
  const [voiceText, setVoiceText] = useState('');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);

  // AI Translator State
  const [translateText, setTranslateText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [translatedResult, setTranslatedResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // AI Research State
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState('');
  const [isResearching, setIsResearching] = useState(false);

  // AI Book Reading State
  const [bookTitle, setBookTitle] = useState('');
  const [bookAnalysis, setBookAnalysis] = useState('');
  const [isReadingBook, setIsReadingBook] = useState(false);

  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatInstanceRef = useRef<any>(null);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatting(true);
    setChatError(null);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      if (!chatInstanceRef.current) {
        chatInstanceRef.current = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: "You are a helpful AI assistant named Mi Studio Chat. You are professional, creative, and concise. You can help with coding, writing, analysis, and general questions. You are part of the Mi Studio creative suite created by Mehar Ali Mehrani.",
          },
        });
      }

      const response = await chatInstanceRef.current.sendMessage({ message: userMessage });
      const botResponse = response.text;
      
      if (botResponse) {
        setChatMessages(prev => [...prev, { role: 'model', text: botResponse }]);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatError(err.message || "Something went wrong. Please try again.");
      // Reset chat instance on error to allow fresh start
      chatInstanceRef.current = null;
    } finally {
      setIsChatting(false);
    }
  };

  // World Calculators State
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedCalculator, setSelectedCalculator] = useState<typeof FAMOUS_CALCULATORS[0] | null>(null);

  // AI Mathematics Helper State
  const [mathProblem, setMathProblem] = useState('');
  const [mathSolution, setMathSolution] = useState('');
  const [isSolvingMath, setIsSolvingMath] = useState(false);

  // PWA Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // AI Manifestation State
  const [manifestationTopic, setManifestationTopic] = useState('');
  const [manifestationAffirmation, setManifestationAffirmation] = useState('');
  const [isManifesting, setIsManifesting] = useState(false);

  // Education AI Chat State
  const [eduChatQuery, setEduChatQuery] = useState('');
  const [eduChatHistory, setEduChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isEduChatLoading, setIsEduChatLoading] = useState(false);

  const [videoPrompt, setVideoPrompt] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isRealisticMode, setIsRealisticMode] = useState(false);
  const [targetDuration, setTargetDuration] = useState(7);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('720p');
  const [videoProgress, setVideoProgress] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingVideo) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % VIDEO_LOADING_MESSAGES.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isGeneratingVideo]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt) return;
    setIsGeneratingVideo(true);
    setVideoUrl(null);
    setCurrentDuration(0);
    setVideoProgress(5);
    setVideoStatus('Initializing video generation...');

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const modelName = isRealisticMode ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
      
      let operation = await ai.models.generateVideos({
        model: modelName,
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: videoResolution,
          aspectRatio: videoAspectRatio
        }
      });

      setVideoStatus('Generating initial clip (7s)...');
      setVideoProgress(15);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setVideoStatus('Processing initial video frames...');
        setVideoProgress((prev) => Math.min(prev + 5, 40));
      }

      let currentOp = operation;
      let duration = 7;
      setCurrentDuration(duration);
      setVideoProgress(50);

      // Extension loop if target duration is higher
      const totalSegments = Math.ceil(targetDuration / 7);
      let currentSegment = 1;

      while (duration < targetDuration) {
        const nextTarget = Math.min(duration + 7, targetDuration);
        currentSegment++;
        setVideoStatus(`Extending video to ${nextTarget}s... this will take more time.`);
        
        currentOp = await ai.models.generateVideos({
          model: 'veo-3.1-generate-preview', 
          prompt: `Continue the scene: ${videoPrompt}`,
          video: currentOp.response?.generatedVideos?.[0]?.video,
          config: {
            numberOfVideos: 1,
            resolution: videoResolution,
            aspectRatio: videoAspectRatio
          }
        });

        while (!currentOp.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          currentOp = await ai.operations.getVideosOperation({ operation: currentOp });
          setVideoStatus(`Processing extension to ${nextTarget}s...`);
          const baseProgress = 50 + ((currentSegment - 1) / totalSegments) * 40;
          setVideoProgress((prev) => Math.min(prev + 2, baseProgress + 10));
        }
        
        duration = nextTarget;
        setCurrentDuration(duration);
        setVideoProgress(50 + (currentSegment / totalSegments) * 40);
      }

      const downloadLink = currentOp.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoStatus('Finalizing video...');
        setVideoProgress(95);
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY || '',
          },
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
        setVideoProgress(100);
        setVideoStatus('');
      }
    } catch (err: any) {
      console.error('Error generating video:', err);
      setVideoProgress(0);
      if (err.message?.includes('Requested entity was not found')) {
        setHasApiKey(false);
        setVideoStatus('API Key error. Please re-select your key.');
      } else {
        setVideoStatus('Error generating video. Please try again.');
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleAnalyzeVision = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setVisionImage(base64);
      setIsAnalyzingVision(true);
      setVisionAnalysis('');

      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            {
              parts: [
                { text: "Analyze this image in detail. Describe the scene, the lighting, the mood, and the key elements. Then, suggest a creative prompt that could be used to generate a similar artistic image." },
                { inlineData: { mimeType: file.type, data: base64.split(',')[1] } }
              ]
            }
          ]
        });
        setVisionAnalysis(response.text || 'Could not analyze image.');
      } catch (err: any) {
        console.error('Vision error:', err);
        setVisionAnalysis(`Error: ${err.message || "Please try again."}`);
      } finally {
        setIsAnalyzingVision(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateScript = async () => {
    if (!scriptPrompt) return;
    setIsGeneratingScript(true);
    setGeneratedScript('');

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a cinematic, high-end movie script based on this prompt: "${scriptPrompt}". Include scene headings, character names, dialogue, and detailed action descriptions. Format it professionally.`,
      });
      setGeneratedScript(response.text || 'Could not generate script.');
    } catch (err: any) {
      console.error('Script error:', err);
      setGeneratedScript(`Error: ${err.message || "Please try again."}`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!voiceText) return;
    setIsGeneratingVoice(true);
    setVoiceAudioUrl(null);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: voiceText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBlob = await (await fetch(`data:audio/mp3;base64,${base64Audio}`)).blob();
        const url = URL.createObjectURL(audioBlob);
        setVoiceAudioUrl(url);
      } else {
        throw new Error("No audio was generated.");
      }
    } catch (err: any) {
      console.error('Voice error:', err);
      alert(err.message || "Error generating voiceover. Please try again.");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleTranslate = async () => {
    if (!translateText) return;
    setIsTranslating(true);
    setTranslatedResult('');

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following text into ${targetLang}. Preserve the tone and artistic intent: "${translateText}"`,
      });
      setTranslatedResult(response.text || 'Could not translate.');
    } catch (err: any) {
      console.error('Translate error:', err);
      setTranslatedResult(`Error: ${err.message || "Please try again."}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleResearch = async () => {
    if (!researchQuery) return;
    setIsResearching(true);
    setResearchResult('');
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: researchQuery,
        config: { tools: [{ googleSearch: {} }] },
      });
      setResearchResult(response.text || 'No research results found.');
    } catch (err: any) {
      console.error('Research error:', err);
      setResearchResult(`Error: ${err.message || "Please try again."}`);
    } finally {
      setIsResearching(false);
    }
  };

  const handleReadBook = async () => {
    if (!bookTitle) return;
    setIsReadingBook(true);
    setBookAnalysis('');
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a detailed summary, key themes, and critical analysis of the book: "${bookTitle}".`,
      });
      setBookAnalysis(response.text || 'Could not analyze book.');
    } catch (err: any) {
      console.error('Book reading error:', err);
      setBookAnalysis(`Error: ${err.message || "Please try again."}`);
    } finally {
      setIsReadingBook(false);
    }
  };

  const handleCalculate = async () => {
    if (!calcInput) return;
    setIsCalculating(true);
    setCalcResult('');
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const context = selectedCalculator ? `Using the ${selectedCalculator.name} (${selectedCalculator.desc}), solve the following: ` : '';
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${context}"${calcInput}". Perform the calculation or conversion and explain the steps clearly.`,
      });
      setCalcResult(response.text || 'Could not perform calculation.');
    } catch (err: any) {
      console.error('Calculator error:', err);
      setCalcResult(`Error: ${err.message || "Please try again."}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleEduBack = () => {
    if (eduStep === 'content') setEduStep('subjects');
    else if (eduStep === 'subjects') setEduStep('classes');
    else if (eduStep === 'classes') setEduStep('boards');
    else setActiveSection('home');
  };

  const handleImageBack = () => {
    if (generatedImage) setGeneratedImage(null);
    else setActiveSection('home');
  };

  const handleVideoBack = () => {
    if (videoUrl) setVideoUrl(null);
    else setActiveSection('home');
  };

  const handleMusicBack = () => {
    if (generatedMusicInfo) setGeneratedMusicInfo(null);
    else setActiveSection('home');
  };

  const handleVisionBack = () => {
    if (visionImage) {
      setVisionImage(null);
      setVisionAnalysis('');
    } else setActiveSection('home');
  };

  const handleScriptBack = () => {
    if (generatedScript) setGeneratedScript('');
    else setActiveSection('home');
  };

  const handleVoiceBack = () => {
    if (voiceAudioUrl) setVoiceAudioUrl(null);
    else setActiveSection('home');
  };

  const handleTranslateBack = () => {
    if (translatedResult) setTranslatedResult('');
    else setActiveSection('home');
  };

  const handleResearchBack = () => {
    if (researchResult) setResearchResult('');
    else setActiveSection('home');
  };

  const handleBookBack = () => {
    if (bookAnalysis) setBookAnalysis('');
    else setActiveSection('home');
  };

  const handleCalcBack = () => {
    if (calcResult) setCalcResult('');
    else if (selectedCalculator) setSelectedCalculator(null);
    else setActiveSection('home');
  };

  const handleMathBack = () => {
    if (mathSolution) setMathSolution('');
    else setActiveSection('home');
  };

  const handleManifestBack = () => {
    if (manifestationAffirmation) setManifestationAffirmation('');
    else setActiveSection('home');
  };

  const handleEduChat = async () => {
    if (!eduChatQuery || !eduContent) return;
    const userMsg = eduChatQuery;
    setEduChatQuery('');
    setEduChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsEduChatLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `You are an expert academic assistant for Pakistani education. 
      The student is reading the following content:
      ---
      ${eduContent}
      ---
      The student asks: "${userMsg}"
      
      Provide a clear, helpful, and accurate answer based on the content and your knowledge of the Pakistani syllabus. 
      Format in Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setEduChatHistory(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      console.error("Failed to fetch edu chat response", err);
      setEduChatHistory(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsEduChatLoading(false);
    }
  };

  const handleFetchEduContent = async (board: string, className: string, subject: string) => {
    setIsEduLoading(true);
    setEduContent(null);
    setEduChatHistory([]); // Reset chat history for new content
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `You are an expert academic assistant for Pakistani education. 
      Provide a detailed solved exercise for the following:
      Board: ${board}
      Class: ${className}
      Subject: ${subject}
      
      Include:
      1. Chapter Name (pick a common one for this subject/class)
      2. Key Definitions
      3. Solved Short Questions
      4. Solved Long Questions
      5. Important MCQs with answers
      
      Format the output in clean Markdown with bold headings and bullet points. 
      Ensure the content is accurate according to the latest 2026 syllabus.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setEduContent(response.text);
    } catch (err) {
      console.error("Failed to fetch edu content", err);
      setEduContent("Failed to load content. Please try again.");
    } finally {
      setIsEduLoading(false);
    }
  };

  const handleFetchSpecialContent = async (type: 'GK' | 'MCQS') => {
    setIsEduLoading(true);
    setEduContent(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = type === 'GK' 
        ? "Provide a comprehensive guide on Pakistan General Knowledge. Include history, geography, important personalities, and current affairs (up to 2026). Format in Markdown."
        : "Provide 20 high-quality solved Computer Science MCQs with explanations. (Note: In a real app, this would be a full database of 1000, but for this demo, provide 20 representative ones). Format in Markdown.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setEduContent(response.text);
    } catch (err) {
      console.error("Failed to fetch special content", err);
      setEduContent("Failed to load content. Please try again.");
    } finally {
      setIsEduLoading(false);
    }
  };

  const EDU_BOARDS = [
    "Sindh Text Book Board",
    "Punjab Text Book Board",
    "Balochistan Text Book Board",
    "KPK Text Book Board",
    "Federal Board",
    "Pakistan General Knowledge",
    "1000 Computer Solved MCQs"
  ];

  const EDU_CLASSES = [
    "KG", "Nursery", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", 
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "First Year (11)", "Intermediate (12)"
  ];

  const EDU_SUBJECTS = [
    "Sindhi", "Urdu", "English", "Physics", "Chemistry", "Mathematics", 
    "Biology", "Computer Science", "Islamiat", "Pakistan Studies"
  ];

  const getEduClassIcon = (cls: string) => {
    if (cls === "KG" || cls === "Nursery") return <School size={24} />;
    if (cls.includes("Class")) {
      const num = parseInt(cls.split(" ")[1]);
      if (num <= 5) return <GraduationCap size={24} />;
      if (num <= 8) return <Library size={24} />;
      return <BookOpenCheck size={24} />;
    }
    return <Trophy size={24} />;
  };

  const getEduSubjectIcon = (sub: string) => {
    switch (sub) {
      case "Mathematics": return <Sigma size={24} />;
      case "Physics": return <Atom size={24} />;
      case "Chemistry": return <FlaskConical size={24} />;
      case "Biology": return <Microscope size={24} />;
      case "Computer Science": return <Binary size={24} />;
      case "English": return <Languages size={24} />;
      case "Urdu":
      case "Sindhi": return <ScrollText size={24} />;
      case "Pakistan Studies":
      case "Islamiat": return <Globe size={24} />;
      default: return <FileText size={24} />;
    }
  };

  const handleSolveMath = async () => {
    if (!mathProblem) return;
    setIsSolvingMath(true);
    setMathSolution('');
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Solve this mathematics problem step-by-step: "${mathProblem}". Provide clear explanations for each step.`,
      });
      setMathSolution(response.text || 'Could not solve math problem.');
    } catch (err: any) {
      console.error('Math error:', err);
      setMathSolution(`Error: ${err.message || "Please try again."}`);
    } finally {
      setIsSolvingMath(false);
    }
  };

  const handleManifest = async () => {
    if (!manifestationTopic) return;
    setIsManifesting(true);
    setManifestationAffirmation('');
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please configure it in the AI Studio secrets panel.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a powerful manifestation affirmation and a visualization prompt for the following goal: "${manifestationTopic}". Make it inspiring and positive.`,
      });
      setManifestationAffirmation(response.text || 'Could not generate manifestation.');
    } catch (err: any) {
      console.error('Manifestation error:', err);
      setManifestationAffirmation(`Error: ${err.message || "Please try again."}`);
    } finally {
      setIsManifesting(false);
    }
  };

  const handleShareImage = async () => {
    const imageData = await getFilteredImageData();
    if (!imageData) return;
    
    if (navigator.share) {
      try {
        const blob = await (await fetch(imageData)).blob();
        const file = new File([blob], 'aura-studio-art.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Mi Studio AI Art',
          text: 'Check out this amazing AI-generated art from Mi Studio!',
        });
      } catch (err) {
        console.error('Share error:', err);
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleDownloadVideo = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `ai-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMusicInfo = () => {
    if (!generatedMusicInfo) return;
    const content = `Title: ${generatedMusicInfo.title}\n\nDescription: ${generatedMusicInfo.description}\n\nLyrics:\n${generatedMusicInfo.lyrics || 'No lyrics generated.'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedMusicInfo.title.replace(/\s+/g, '-').toLowerCase()}-score.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!generatedImage) return;

    try {
      const filteredImage = await getFilteredImageData();
      if (navigator.share) {
        const response = await fetch(filteredImage);
        const blob = await response.blob();
        const file = new File([blob], 'orange-suit-stylized.png', { type: 'image/png' });

        await navigator.share({
          title: 'Orange Suit Stylizer',
          text: 'Check out my stylized portrait! #OrangeSuitStylizer #AIArt',
          files: [file],
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
      } catch (clipErr) {
        console.error('Clipboard error:', clipErr);
      }
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert("To install Mi Studio on your phone:\n\n1. Open this app in Chrome on Android.\n2. Tap the three dots (⋮) in the top right.\n3. Select 'Install App' or 'Add to Home Screen'.\n\nThis will create an icon on your phone and it will work just like a native app!");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (selectedFilter.filter === 'none') return;
    
    e.preventDefault();
    const filteredImage = await getFilteredImageData();
    const link = document.createElement('a');
    link.href = filteredImage;
    link.download = 'orange-suit-stylized.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 1.5, 
              ease: "easeOut"
            }}
            className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-tr from-orange-600/20 to-orange-400/20 rounded-[3rem] flex items-center justify-center shadow-[0_0_100px_rgba(234,88,12,0.2)] mb-12 overflow-hidden relative border border-white/10"
          >
            <img 
              src="https://lh3.googleusercontent.com/d/1YK5GCGHUe6m9XqEBvxki4ck6_1sdsmKD" 
              className="absolute inset-0 w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-5xl sm:text-7xl font-black tracking-tighter text-white mb-4"
          >
            MI STUDIO
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.2, duration: 1 }}
            className="h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent w-full mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="text-zinc-400 uppercase tracking-[0.6em] text-xs font-bold"
          >
            AI Creative Suite
          </motion.p>
        </motion.div>
        
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px]" 
          />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
        </div>

        {/* Loading Bar */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="w-full h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30 pb-24 md:pb-0"
    >
      {/* Hamburger Menu & Overlay */}
      <div className="fixed top-0 right-0 z-[60]">
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1]"
              />
              
              {/* Menu Content */}
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="fixed top-0 right-0 h-screen w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 p-8 shadow-2xl"
              >
                <h2 className="text-2xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Mi Studio</h2>
                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                  {[
                    { id: 'image', title: 'Image Stylizer', icon: Palette, color: 'orange', desc: 'Transform portraits with AI' },
                    { id: 'video', title: 'Video Generator', icon: Video, color: 'blue', desc: 'Create videos from text' },
                    { id: 'music', title: 'Music Creator', icon: Music, color: 'emerald', desc: 'AI musical compositions' },
                    { id: 'vision', title: 'AI Vision', icon: Eye, color: 'purple', desc: 'Analyze images with AI' },
                    { id: 'script', title: 'AI Scriptwriter', icon: FileText, color: 'pink', desc: 'Generate cinematic scripts' },
                    { id: 'voice', title: 'AI Voiceover', icon: Mic, color: 'cyan', desc: 'Text to high-quality speech' },
                    { id: 'translate', title: 'AI Translator', icon: Languages, color: 'yellow', desc: 'Translate creative content' },
                    { id: 'research', title: 'AI Research', icon: Search, color: 'indigo', desc: 'Deep research with AI' },
                    { id: 'book', title: 'AI Book Reading', icon: BookOpen, color: 'rose', desc: 'Analyze and summarize books' },
                    { id: 'calc', title: 'World Calculators', icon: Calculator, color: 'amber', desc: 'Solve complex calculations' },
                    { id: 'math', title: 'AI Math Helper', icon: Binary, color: 'teal', desc: 'Step-by-step math solutions' },
                    { id: 'edu', title: 'Pakistan Education', icon: BookOpen, color: 'emerald', desc: 'Latest syllabus & solved exercises' },
                    { id: 'manifest', title: 'AI Manifestation', icon: Zap, color: 'violet', desc: 'Personalized affirmations' },
                    { id: 'chat', title: 'AI Chat (GPT Style)', icon: MessageSquare, color: 'blue', desc: 'Chat with powerful AI' }
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id as any);
                        setIsMenuOpen(false);
                      }}
                      className="w-full block group text-left"
                    >
                      <div className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-${item.color}-500/50 hover:bg-white/10 transition-all`}>
                        <div className={`p-3 bg-${item.color}-500/20 rounded-xl text-${item.color}-400`}>
                          <item.icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-white group-hover:text-white transition-colors">{item.title}</h3>
                          <p className="text-[10px] text-zinc-500">{item.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="absolute bottom-8 left-8 right-8 space-y-3">
                  <button 
                    onClick={handleInstallApp}
                    className="w-full py-3 bg-orange-500 text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all active:scale-95"
                  >
                    <Download size={18} />
                    Install App
                  </button>
                  <button 
                    onClick={() => {
                      window.location.href = '/api/download-app';
                    }}
                    className="w-full py-3 bg-white/10 text-white border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95"
                  >
                    <FileText size={18} />
                    Export to ZIP
                  </button>
                  <p className="text-xs text-zinc-600 text-center pt-2">© 2026 Mi Studio • AI Creative Suite</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Logo - Top Left */}
        <div className="fixed top-8 left-8 z-[70] flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase hidden sm:block">Mi Studio</span>
        </div>
      </div>

      {/* Sliding Floating Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
        <motion.div
          initial={false}
          animate={{ 
            y: isToolbarVisible ? 0 : 80,
            opacity: isToolbarVisible ? 1 : 0.5,
            scale: isToolbarVisible ? 1 : 0.9
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl flex items-center justify-between gap-1"
        >
          {/* Drag Handle / Toggle Button */}
          <button
            onClick={() => setIsToolbarVisible(!isToolbarVisible)}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-8 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-t-3xl flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-white transition-colors"
          >
            <div className="w-8 h-1 bg-white/20 rounded-full" />
            <motion.div
              animate={{ rotate: isToolbarVisible ? 0 : 180 }}
            >
              <Check size={14} className="rotate-90" />
            </motion.div>
          </button>

          <button 
            onClick={() => { setActiveSection('home'); setIsToolbarVisible(true); }}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${activeSection === 'home' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Home size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
          </button>

          <button 
            onClick={() => { setActiveSection('image'); setIsToolbarVisible(true); }}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${activeSection === 'image' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Palette size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Stylizer</span>
          </button>

          <button 
            onClick={() => { setActiveSection('video'); setIsToolbarVisible(true); }}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${activeSection === 'video' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Video size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Video</span>
          </button>

          <button 
            onClick={() => { setActiveSection('music'); setIsToolbarVisible(true); }}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${activeSection === 'music' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Music size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Music</span>
          </button>

          <button 
            onClick={() => { 
              setActiveSection('home'); 
              setTimeout(() => {
                document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
              setIsToolbarVisible(true); 
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${activeSection === 'about' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">About</span>
          </button>

          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Menu size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">More</span>
          </button>
        </motion.div>
      </div>

      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/20 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 pt-24 pb-32">
        {/* Home / Hero Section */}
        {activeSection === 'home' && (
          <section id="home" className="max-w-7xl mx-auto px-6 mb-32">
            {/* Hero Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-20 pt-12"
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/20 mx-auto mb-8 overflow-hidden relative group">
                <img 
                  src="https://picsum.photos/seed/mistudio/200/200" 
                  className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700" 
                  referrerPolicy="no-referrer"
                />
                <Zap className="w-12 h-12 text-black relative z-10" />
              </div>
              <h1 className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
                MI STUDIO
              </h1>
              <p className="text-zinc-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light px-4">
                The ultimate AI creative suite created by Mehar Ali Mehrani. <br className="hidden md:block" />
                High-end image stylization, cinematic video generation, and musical compositions.
              </p>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-4"
              >
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="px-8 py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2"
                >
                  <Menu size={18} />
                  Explore Tools
                </button>
                <a 
                  href="/api/download-app" 
                  download="mi-studio-source.zip"
                  className="px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Download size={18} />
                  Download App (ZIP)
                </a>
              </motion.div>
            </motion.div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-16 relative group">
              <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-zinc-900/50 border border-white/10 rounded-2xl p-2 backdrop-blur-xl focus-within:border-orange-500/50 transition-all">
                <Search className="w-6 h-6 text-zinc-500 ml-4" />
                <input 
                  type="text" 
                  placeholder="Search for tools (e.g. 'video', 'math', 'education')..." 
                  className="w-full bg-transparent border-none focus:ring-0 text-white px-4 py-3 text-lg placeholder:text-zinc-600"
                  onChange={(e) => {
                    const query = e.target.value.toLowerCase();
                    const cards = document.querySelectorAll('.tool-card');
                    const categories = document.querySelectorAll('.category-section');
                    
                    let hasVisibleCards = false;
                    cards.forEach((card: any) => {
                      const title = card.getAttribute('data-title')?.toLowerCase() || '';
                      const desc = card.getAttribute('data-desc')?.toLowerCase() || '';
                      if (title.includes(query) || desc.includes(query)) {
                        card.style.display = 'flex';
                        hasVisibleCards = true;
                      } else {
                        card.style.display = 'none';
                      }
                    });

                    categories.forEach((cat: any) => {
                      const visibleCards = cat.querySelectorAll('.tool-card[style="display: flex;"]');
                      cat.style.display = visibleCards.length > 0 || query === '' ? 'block' : 'none';
                    });
                  }}
                />
              </div>
            </div>

            {/* Bento Grid Categories */}
            <div className="space-y-24">
              {[
                {
                  title: 'Creative Studio',
                  icon: Sparkles,
                  color: 'text-orange-500',
                  tools: [
                    { id: 'image', title: 'Image Stylizer', icon: Palette, color: 'orange', desc: 'Transform portraits into cinematic masterpieces.', size: 'large', accent: 'bg-orange-500/20 text-orange-400', border: 'bg-orange-500' },
                    { id: 'video', title: 'Video Generator', icon: Video, color: 'blue', desc: 'Cinematic scenes from text prompts.', size: 'medium', accent: 'bg-blue-500/20 text-blue-400', border: 'bg-blue-500' },
                    { id: 'music', title: 'Music Creator', icon: Music, color: 'emerald', desc: 'Compose unique melodies and scores.', size: 'small', accent: 'bg-emerald-500/20 text-emerald-400', border: 'bg-emerald-500' },
                    { id: 'vision', title: 'AI Vision', icon: Eye, color: 'purple', desc: 'Analyze and understand scenes.', size: 'small', accent: 'bg-purple-500/20 text-purple-400', border: 'bg-purple-500' },
                  ]
                },
                {
                  title: 'Writing & Language',
                  icon: FileText,
                  color: 'text-pink-500',
                  tools: [
                    { id: 'script', title: 'AI Scriptwriter', icon: FileText, color: 'pink', desc: 'Professional cinematic scripts.', size: 'medium', accent: 'bg-pink-500/20 text-pink-400', border: 'bg-pink-500' },
                    { id: 'voice', title: 'AI Voiceover', icon: Mic, color: 'cyan', desc: 'Natural-sounding speech synthesis.', size: 'small', accent: 'bg-cyan-500/20 text-cyan-400', border: 'bg-cyan-500' },
                    { id: 'translate', title: 'AI Translator', icon: Languages, color: 'yellow', desc: 'Break global language barriers.', size: 'small', accent: 'bg-yellow-500/20 text-yellow-400', border: 'bg-yellow-500' },
                    { id: 'chat', title: 'AI Chat (GPT Style)', icon: MessageSquare, color: 'blue', desc: 'Chat with powerful AI for any task.', size: 'medium', accent: 'bg-blue-500/20 text-blue-400', border: 'bg-blue-500' },
                  ]
                },
                {
                  title: 'Education & Research',
                  icon: GraduationCap,
                  color: 'text-emerald-500',
                  tools: [
                    { id: 'edu', title: 'Pakistan Education', icon: BookOpen, color: 'emerald', desc: 'Latest academic syllabus and solved exercises.', size: 'large', accent: 'bg-emerald-500/20 text-emerald-400', border: 'bg-emerald-500' },
                    { id: 'math', title: 'AI Math Helper', icon: Binary, color: 'teal', desc: 'Step-by-step math solutions.', size: 'medium', accent: 'bg-teal-500/20 text-teal-400', border: 'bg-teal-500' },
                    { id: 'research', title: 'AI Research', icon: Search, color: 'indigo', desc: 'Deep research on any topic.', size: 'small', accent: 'bg-indigo-500/20 text-indigo-400', border: 'bg-indigo-500' },
                    { id: 'book', title: 'AI Book Reading', icon: BookOpen, color: 'rose', desc: 'Summarize and analyze books.', size: 'small', accent: 'bg-rose-500/20 text-rose-400', border: 'bg-rose-500' },
                    { id: 'calc', title: 'World Calculators', icon: Calculator, color: 'amber', desc: 'Complex unit and currency solver.', size: 'small', accent: 'bg-amber-500/20 text-amber-400', border: 'bg-amber-500' },
                  ]
                },
                {
                  title: 'Personal Growth',
                  icon: Zap,
                  color: 'text-violet-500',
                  tools: [
                    { id: 'manifest', title: 'AI Manifestation', icon: Zap, color: 'violet', desc: 'Personalized affirmations and visualization.', size: 'medium', accent: 'bg-violet-500/20 text-violet-400', border: 'bg-violet-500' }
                  ]
                }
              ].map((category, catIdx) => (
                <div key={catIdx} className="category-section space-y-8">
                  <div className="flex items-center gap-4 px-2">
                    <div className={`p-2 rounded-lg bg-white/5 ${category.color}`}>
                      <category.icon size={20} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-500">{category.title}</h2>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.tools.map((tool) => (
                      <motion.button
                        key={tool.id}
                        data-title={tool.title}
                        data-desc={tool.desc}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        onClick={() => {
                          setActiveSection(tool.id as any);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`tool-card group p-8 bg-zinc-900/50 border border-white/10 rounded-[2.5rem] hover:bg-white/5 transition-all text-left relative overflow-hidden flex flex-col gap-6 ${
                          tool.size === 'large' ? 'md:col-span-2' : ''
                        }`}
                      >
                        <div className={`w-14 h-14 shrink-0 rounded-2xl ${tool.accent} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                          <tool.icon size={28} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black mb-2 uppercase tracking-tight group-hover:text-white transition-colors">{tool.title}</h3>
                          <p className="text-zinc-500 leading-relaxed text-sm group-hover:text-zinc-400 transition-colors">{tool.desc}</p>
                        </div>
                        
                        {/* Interactive Arrow */}
                        <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-600 group-hover:text-white transition-colors">
                          <span>Open Tool</span>
                          <ArrowLeft className="rotate-180 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Decorative Background Glow */}
                        <div className={`absolute -right-12 -bottom-12 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${tool.border}`} />
                        
                        {/* Hover Border Accent */}
                        <div className={`absolute bottom-0 left-0 w-full h-1 ${tool.border} scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500`} />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* About Section - Portfolio */}
            <section id="about-us" className="mt-32 pt-32 border-t border-white/5">
              <header className="text-center mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6"
                >
                  <Users size={14} />
                  <span>THE VISIONARY CREATOR</span>
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-black tracking-tighter mb-6"
                >
                  MEHAR ALI MEHRANI
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-zinc-400 text-lg max-w-2xl mx-auto font-light"
                >
                  Hailing from the historic land of <span className="text-white font-medium">Sindh, Pakistan</span>, specifically from the beautiful village of <span className="text-white font-medium">Ahmed Abad in Khairpur Mir's</span>.
                </motion.p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  <div className="aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
                    <img 
                      src="https://lh3.googleusercontent.com/d/1zEgcmw21YxauHfmRH2AMsqr1B8BXY5JO" 
                      alt="Mehar Ali Mehrani" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
                      <p className="text-white font-bold text-2xl md:text-3xl tracking-tight">Mehar Ali Mehrani</p>
                      <p className="text-orange-400 text-xs md:text-sm font-medium uppercase tracking-widest">Founder and Visionary</p>
                    </div>
                  </div>
                  {/* Decorative Glow */}
                  <div className="absolute -inset-4 bg-orange-500/10 blur-3xl -z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-10 text-left"
                >
                  <div className="space-y-6">
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Why I Created Mi Studio</h3>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-base md:text-lg">
                      <p>
                        My purpose in creating Mi Studio was to bridge the gap between advanced technology and the dreams of every student and creator in Pakistan and beyond. I believe that education and creativity should not be limited by resources.
                      </p>
                      <p>
                        I wanted to build a platform where a student from a small village like <span className="text-white">Ahmed Abad</span> can access the same high-quality AI tools and educational support as someone in a major global city. This app is my contribution to empowering the next generation of thinkers, artists, and leaders.
                      </p>
                      <p className="text-white font-medium italic">
                        "My vision is to see every student feel easy and confident in their educational journey, supported by the best that modern AI has to offer."
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <div className="p-6 md:p-8 rounded-3xl bg-orange-500/5 border border-orange-500/10 backdrop-blur-xl">
                      <p className="text-zinc-300 text-base md:text-lg italic leading-relaxed">
                        "I sincerely hope that this app will be a useful companion for all users and students. May it light the path to your success. I only ask for your prayers for my goodness and well-being as I continue to serve our community through technology."
                      </p>
                      <p className="mt-4 text-orange-400 font-bold">— Mehar Ali Mehrani</p>
                    </div>

                    <div className="pt-6">
                      <a 
                        href="/api/download-app" 
                        download="mi-studio-source.zip"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all group"
                      >
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Download Source Code (ZIP)</span>
                      </a>
                      <p className="mt-3 text-zinc-500 text-xs">
                        Get the full source code of Mi Studio to run locally or publish yourself.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>
          </section>
        )}

        {/* Image Stylizer Section */}
        {activeSection === 'image' && (
          <section id="image-stylizer" className="max-w-6xl mx-auto px-6 mb-32">
            <BackButton onClick={handleImageBack} />
            <header className="mb-16 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-orange-500 bg-clip-text text-transparent uppercase">
              MI <br className="hidden sm:block" /> STUDIO
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto lg:mx-0">
              Transform your portrait into a cinematic masterpiece. Stand out from the crowd with dramatic lighting and bold artistic styles.
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Input */}
          <div className="space-y-8">
              <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
                <button 
                  onClick={() => setIsStyleSelectorOpen(!isStyleSelectorOpen)}
                  className="w-full flex items-center justify-between group"
                >
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    Choose Your Style
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                      {selectedStyle.name}
                    </span>
                    <motion.div
                      animate={{ rotate: isStyleSelectorOpen ? 180 : 0 }}
                      className="text-zinc-500 group-hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {isStyleSelectorOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-3">
                        {STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => {
                              setSelectedStyle(style);
                              setIsStyleSelectorOpen(false);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              selectedStyle.id === style.id
                                ? "bg-orange-500/10 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                : "bg-zinc-800/30 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-bold ${selectedStyle.id === style.id ? 'text-orange-500' : 'text-white'}`}>
                                {style.name}
                              </span>
                              {selectedStyle.id === style.id && <Check className="w-4 h-4 text-orange-500" />}
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed">{style.description}</p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-orange-500" />
                  Reference Images
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Slot 1 */}
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 1)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className={`aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
                      ${base64Image ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'}`}>
                      {base64Image ? (
                        <img src={base64Image} alt="Reference 1" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Image 1</p>
                        </div>
                      )}
                    </div>
                    {base64Image && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setBase64Image(null); }}
                        className="absolute top-2 right-2 z-30 bg-black/60 p-1 rounded-full text-white/70 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Slot 2 */}
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 2)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className={`aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
                      ${base64Image2 ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'}`}>
                      {base64Image2 ? (
                        <img src={base64Image2} alt="Reference 2" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Image 2 (Optional)</p>
                        </div>
                      )}
                    </div>
                    {base64Image2 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setBase64Image2(null); }}
                        className="absolute top-2 right-2 z-30 bg-black/60 p-1 rounded-full text-white/70 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-4 text-center">
                  {base64Image2 ? "Both images will be merged into your selected style." : "Upload a second image to merge features."}
                </p>

              {/* Aspect Ratio Selection */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Aspect Ratio</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {(["1:1", "16:9", "9:16", "3:4", "4:3"] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${
                          aspectRatio === ratio
                            ? "bg-orange-500 border-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                            : "bg-zinc-800/50 border-white/5 text-zinc-400 hover:border-white/10"
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
              </div>

              {/* Lighting Selection */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Lighting Style
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(LIGHTING_DESCRIPTIONS) as Array<keyof typeof LIGHTING_DESCRIPTIONS>).map((style) => (
                    <button
                      key={style}
                      onClick={() => setLighting(style)}
                      className={`py-2 rounded-xl border text-[10px] font-bold transition-all capitalize ${
                        lighting === style
                          ? "bg-orange-500 border-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                          : "bg-zinc-800/50 border-white/5 text-zinc-400 hover:border-white/10"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateImage}
                disabled={isGenerating || !base64Image}
                className={`w-full mt-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]
                  ${isGenerating || !base64Image 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_30px_rgba(249,115,22,0.3)]'}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Stylizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate Masterpiece
                  </>
                )}
              </button>

              {error && (
                <p className="mt-4 text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">The Vision</h3>
              <p className="text-zinc-400 text-sm italic leading-relaxed">
                "{selectedStyle.prompt.slice(0, 200)}..."
              </p>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="sticky top-12 space-y-6">
            <div className={`bg-zinc-900/50 border border-white/10 rounded-3xl p-4 backdrop-blur-xl relative overflow-hidden group transition-all duration-500 ${
              aspectRatio === "1:1" ? "aspect-square" : 
              aspectRatio === "16:9" ? "aspect-video" : 
              "aspect-[9/16]"
            }`}>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col items-center justify-center"
                  >
                    <AILoadingState 
                      message="Crafting Scene" 
                      subMessage="Our neural engine is synthesizing your cinematic vision..." 
                      icon={ImageIcon}
                    />
                  </motion.div>
                ) : generatedImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full relative"
                  >
                    <img 
                      src={generatedImage} 
                      alt="Generated result" 
                      className="w-full h-full object-cover rounded-2xl shadow-2xl transition-all duration-300"
                      style={{ filter: selectedFilter.filter }}
                      referrerPolicy="no-referrer"
                    />
                    {/* Hover overlay for quick download */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8 gap-4">
                      <a 
                        href={generatedImage} 
                        download="orange-suit-stylized.png"
                        onClick={handleDownload}
                        className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </a>
                      <button 
                        onClick={handleShareImage}
                        className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/20 transition-colors border border-white/20"
                      >
                        <Share2 className="w-5 h-5" />
                        Share
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col items-center justify-center text-zinc-600"
                  >
                    <div className="text-center p-12">
                      <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-zinc-700" />
                      </div>
                      <p className="text-xl font-medium mb-2">Ready to Stylize</p>
                      <p className="text-zinc-500">Upload a portrait and click generate to see the magic happen.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filters Section */}
            {generatedImage && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
              >
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Apply Filter
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelectedFilter(f)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border ${
                        selectedFilter.name === f.name
                          ? "bg-orange-500 border-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                          : "bg-zinc-800/50 border-white/5 text-zinc-400 hover:border-white/10"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Persistent Action Buttons */}
            {generatedImage && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <a 
                  href={generatedImage} 
                  download="orange-suit-stylized.png"
                  onClick={handleDownload}
                  className="py-4 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-6 h-6 text-orange-500" />
                  Save Image
                </a>
                <button 
                  onClick={handleShare}
                  className="py-4 bg-orange-500 hover:bg-orange-400 text-black rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                >
                  {isCopying ? (
                    <>
                      <Check className="w-6 h-6" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-6 h-6" />
                      Share Portrait
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* History Section */}
            {history.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-8 border-t border-white/5"
              >
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Recent Generations</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setGeneratedImage(item.url);
                        setAspectRatio(item.ratio as any);
                        setLighting(item.lighting as any);
                      }}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${
                        generatedImage === item.url ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={item.url} alt={`History ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    )}

      {/* Video Generator Section */}
      {activeSection === 'video' && (
        <section id="video-generator" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
          <BackButton onClick={handleVideoBack} />
          <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <Video size={14} />
              <span>VEO 3.1 FAST</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter mb-6">
              AI VIDEO <br className="hidden sm:block" /> GENERATION
            </h2>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
              Transform your ideas into high-quality videos. Describe the scene you want to see, and our AI will bring it to life.
            </p>

            {!hasApiKey ? (
              <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl mb-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Key className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Advanced Video Generation</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                      To use the high-end <strong>Veo</strong> video generation models, Google requires an API key from a paid Google Cloud project.
                    </p>
                  </div>
                  
                  <div className="w-full space-y-4">
                    <button
                      onClick={handleOpenKeySelector}
                      className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      <Key size={18} />
                      Select API Key
                    </button>
                    
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-zinc-600"><span className="bg-zinc-950 px-4">Or</span></div>
                    </div>

                    <button
                      onClick={() => {
                        const el = document.getElementById('image-stylizer');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                    >
                      <Palette size={18} />
                      Use Free Image Stylizer
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-500">
                    Don't have a key? <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-medium">Learn about Google's billing</a>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Video Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Quality</label>
                    <button 
                      onClick={() => setIsRealisticMode(!isRealisticMode)}
                      className={`w-full py-2 rounded-xl text-[10px] font-bold transition-all border ${
                        isRealisticMode 
                          ? "bg-blue-500 border-blue-500 text-white" 
                          : "bg-zinc-800 border-white/5 text-zinc-400"
                      }`}
                    >
                      {isRealisticMode ? "Realistic" : "Fast"}
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Format</label>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setVideoAspectRatio('16:9')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          videoAspectRatio === '16:9' 
                            ? "bg-blue-500 border-blue-500 text-white" 
                            : "bg-zinc-800 border-white/5 text-zinc-400"
                        }`}
                      >
                        16:9
                      </button>
                      <button 
                        onClick={() => setVideoAspectRatio('9:16')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          videoAspectRatio === '9:16' 
                            ? "bg-blue-500 border-blue-500 text-white" 
                            : "bg-zinc-800 border-white/5 text-zinc-400"
                        }`}
                      >
                        9:16
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Resolution</label>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setVideoResolution('720p')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          videoResolution === '720p' 
                            ? "bg-blue-500 border-blue-500 text-white" 
                            : "bg-zinc-800 border-white/5 text-zinc-400"
                        }`}
                      >
                        720p
                      </button>
                      <button 
                        onClick={() => setVideoResolution('1080p')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                          videoResolution === '1080p' 
                            ? "bg-blue-500 border-blue-500 text-white" 
                            : "bg-zinc-800 border-white/5 text-zinc-400"
                        }`}
                      >
                        1080p
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Duration: {targetDuration}s</label>
                    <input 
                      type="range" 
                      min="7" 
                      max="60" 
                      step="7"
                      value={targetDuration}
                      onChange={(e) => setTargetDuration(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Quick Suggestions</label>
                  <div className="flex flex-wrap gap-2">
                    {VIDEO_SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setVideoPrompt(suggestion.prompt)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white transition-all"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g. A neon hologram of a cat driving a futuristic car at top speed through a digital city..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  />
                  <button
                    onClick={handleGenerateVideo}
                    disabled={isGeneratingVideo || !videoPrompt}
                    className="absolute bottom-4 right-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl font-semibold transition-all flex items-center gap-2"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Create Video
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <AnimatePresence mode="wait">
              {isGeneratingVideo ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-8 space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">
                        {VIDEO_LOADING_MESSAGES[loadingMessageIndex]}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{Math.round(videoProgress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${videoProgress}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 mt-0.5">
                      <Loader2 size={16} className="animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-100">{videoStatus}</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Video generation is a complex process. We're currently processing {targetDuration} seconds of cinematic footage. Please stay on this page.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : videoStatus && videoStatus.includes('Error') ? (
                <motion.p 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-red-400 flex items-center gap-2"
                >
                  <AlertCircle size={14} />
                  {videoStatus}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-video rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden flex items-center justify-center relative group/player">
              <AnimatePresence mode="wait">
                {isGeneratingVideo ? (
                  <AILoadingState 
                    key="loading"
                    message={videoStatus || "Generating Video"} 
                    subMessage={`Rendering and extending your scene... (${currentDuration}s / ${targetDuration}s)`} 
                    icon={Video}
                  />
                ) : videoUrl ? (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full relative"
                  >
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover/player:opacity-100 transition-opacity">
                      <button 
                        onClick={handleDownloadVideo}
                        className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/80 text-white transition-all shadow-xl"
                        title="Download Video"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center space-y-4 p-8"
                  >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                      <Video size={40} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-500">No Video Generated</h3>
                      <p className="text-sm text-zinc-600 max-w-[240px] mx-auto">Enter a prompt and click generate to start.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-zinc-800/20 blur-2xl rounded-full" />
          </motion.div>
        </div>

        {/* Video Resources & Tips */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                <Video size={16} />
              </div>
              Social Formats
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                <strong>9:16:</strong> Perfect for Reels, Shorts, & TikTok.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                <strong>16:9:</strong> Best for YouTube & Cinematic views.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                <strong>1080p:</strong> High definition for crisp details.
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                <Sparkles size={16} />
              </div>
              Prompting Tips
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-orange-500 rounded-full" />
                Be specific about lighting (e.g. "Golden hour").
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-orange-500 rounded-full" />
                Describe camera movement (e.g. "Drone shot").
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-orange-500 rounded-full" />
                Mention textures (e.g. "Rain on glass").
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                <Check size={16} />
              </div>
              Best Practices
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                Use "Realistic" mode for human subjects.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                Use "Fast" mode for quick abstract tests.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                Longer videos take more time to render.
              </li>
            </ul>
          </div>
        </div>
      </section>
    )}

      {/* Music Creator Section */}
      {activeSection === 'music' && (
        <section id="music-creator" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
          <BackButton onClick={handleMusicBack} />
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6">
              <Music size={14} />
              <span>NEW FEATURE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter mb-6">
              AI MUSIC <br className="hidden sm:block" /> CREATION
            </h2>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
              Describe the mood, genre, and style of the music you want to create. Our AI will generate a composition description and lyrics for you.
            </p>
            
            <div className="relative group">
              <textarea
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="e.g. A lo-fi hip hop beat with a melancholic piano and a smooth bassline for a rainy night..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
              />
              <button
                onClick={async () => {
                  if (!musicPrompt) return;
                  setIsGeneratingMusic(true);
                  try {
                    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                    const response = await ai.models.generateContent({
                      model: "gemini-3-flash-preview",
                      contents: `Generate a music composition idea based on this prompt: "${musicPrompt}". Provide a catchy title, a detailed musical description (instruments, mood, tempo), and a short set of lyrics (if applicable). Format as JSON with keys: title, description, lyrics.`,
                      config: { responseMimeType: "application/json" }
                    });
                    const data = JSON.parse(response.text);
                    setGeneratedMusicInfo(data);
                  } catch (err) {
                    console.error('Error generating music:', err);
                  } finally {
                    setIsGeneratingMusic(false);
                  }
                }}
                disabled={isGeneratingMusic || !musicPrompt}
                className="absolute bottom-4 right-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                {isGeneratingMusic ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate
                  </>
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5 p-8 flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {isGeneratingMusic ? (
                  <AILoadingState 
                    key="loading"
                    message="Composing Music" 
                    subMessage="Crafting unique melodies and professional arrangements..." 
                    icon={Music}
                  />
                ) : generatedMusicInfo ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400">
                        <Music size={32} className="animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{generatedMusicInfo.title}</h3>
                        <p className="text-sm text-zinc-500">AI Generated Composition</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Musical Description</h4>
                        <p className="text-zinc-300 leading-relaxed italic">"{generatedMusicInfo.description}"</p>
                      </div>
                      
                      {generatedMusicInfo.lyrics && (
                        <div>
                          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Lyrics Snippet</h4>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-zinc-400 whitespace-pre-line leading-relaxed">
                              {generatedMusicInfo.lyrics}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-1 bg-orange-500/50 rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                      <button 
                        onClick={handleDownloadMusicInfo}
                        className="flex items-center gap-2 text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium group"
                      >
                        <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                        Download Score (TXT)
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                      <Music size={40} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-500">No Music Generated Yet</h3>
                      <p className="text-sm text-zinc-600 max-w-[200px] mx-auto">Enter a prompt to start your musical journey</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-zinc-800/20 blur-2xl rounded-full" />
          </motion.div>
        </div>
      </section>
    )}

        {/* AI Vision Section */}
        {activeSection === 'vision' && (
          <section id="ai-vision" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleVisionBack} />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
                <Eye size={14} />
                <span>AI VISION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">SCENE ANALYZER</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Upload any image to get a deep, creative analysis. Our AI identifies lighting, mood, and composition to help you generate better prompts.
              </p>
              
              <div className="space-y-4">
                <label className="block w-full cursor-pointer">
                  <div className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                    <ImageIcon size={18} />
                    {isAnalyzingVision ? 'Analyzing...' : 'Upload Image to Analyze'}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAnalyzeVision} disabled={isAnalyzingVision} />
                </label>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5 p-8 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {isAnalyzingVision ? (
                    <AILoadingState 
                      key="loading"
                      message="Analyzing Scene" 
                      subMessage="Deconstructing composition, lighting, and artistic elements..." 
                      icon={Eye}
                    />
                  ) : visionImage ? (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col gap-6"
                    >
                      <div className="h-1/2 rounded-2xl overflow-hidden border border-white/10">
                        <img src={visionImage} alt="Vision Input" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">AI Analysis</h4>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(visionAnalysis);
                              alert('Analysis copied to clipboard!');
                            }}
                            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
                            title="Copy Analysis"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{visionAnalysis || 'Analysis complete.'}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                        <Eye size={40} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-500">No Image Analyzed</h3>
                        <p className="text-sm text-zinc-600 max-w-[200px] mx-auto">Upload a scene to unlock its creative secrets</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full" />
            </motion.div>
          </div>
        </section>
      )}

        {/* AI Scriptwriter Section */}
        {activeSection === 'script' && (
          <section id="ai-scriptwriter" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleScriptBack} />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="aspect-[3/4] rounded-3xl bg-zinc-900 border border-white/5 p-6 md:p-8 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {isGeneratingScript ? (
                    <AILoadingState 
                      key="loading"
                      message="Writing Script" 
                      subMessage="Drafting cinematic dialogue and professional scene directions..." 
                      icon={FileText}
                    />
                  ) : generatedScript ? (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Generated Script</h4>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedScript);
                            alert('Script copied to clipboard!');
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-6 rounded-2xl border border-white/5">
                        <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">{generatedScript}</pre>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                        <FileText size={40} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-500">No Script Generated</h3>
                        <p className="text-sm text-zinc-600 max-w-[200px] mx-auto">Describe your vision to generate a cinematic script</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium mb-6">
                <FileText size={14} />
                <span>AI SCRIPTWRITER</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">CINEMATIC SCRIPTS</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Turn your ideas into professional screenplays. Perfect for planning your next AI-generated video or creative project.
              </p>
              
              <div className="space-y-4">
                <textarea
                  value={scriptPrompt}
                  onChange={(e) => setScriptPrompt(e.target.value)}
                  placeholder="Describe your story idea (e.g., A cyberpunk detective discovers a dark secret...)"
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-pink-500 transition-colors resize-none"
                />
                <button
                  onClick={handleGenerateScript}
                  disabled={isGeneratingScript || !scriptPrompt}
                  className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={18} />
                  {isGeneratingScript ? 'Generating...' : 'Generate Script'}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

        {/* AI Voiceover Section */}
        {activeSection === 'voice' && (
          <section id="ai-voiceover" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleVoiceBack} />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
                <Mic size={14} />
                <span>AI VOICEOVER</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">TEXT TO SPEECH</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Bring your scripts to life with high-quality AI voices. Perfect for narration, character dialogue, or creative audio projects.
              </p>
              
              <div className="space-y-4">
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="Enter text to convert to speech..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
                <button
                  onClick={handleGenerateVoice}
                  disabled={isGeneratingVoice || !voiceText}
                  className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Volume2 size={18} />
                  {isGeneratingVoice ? 'Generating Audio...' : 'Generate Voiceover'}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-video rounded-3xl bg-zinc-900 border border-white/5 p-8 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  {isGeneratingVoice ? (
                    <AILoadingState 
                      key="loading"
                      message="Generating Voice" 
                      subMessage="Synthesizing high-quality audio with natural intonation..." 
                      icon={Mic}
                    />
                  ) : voiceAudioUrl ? (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6 w-full"
                    >
                      <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 mx-auto">
                        <Mic size={40} className="animate-pulse" />
                      </div>
                      <audio src={voiceAudioUrl} controls className="w-full custom-audio-player" />
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = voiceAudioUrl;
                          link.download = `voiceover-${Date.now()}.mp3`;
                          link.click();
                        }}
                        className="text-cyan-400 text-sm font-bold hover:underline"
                      >
                        Download Audio
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700 mx-auto">
                        <Mic size={40} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-500">No Audio Generated</h3>
                        <p className="text-sm text-zinc-600">Your voiceover will appear here</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>
      )}

        {/* AI Translator Section */}
        {activeSection === 'translate' && (
          <section id="ai-translator" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleTranslateBack} />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="aspect-video rounded-3xl bg-zinc-900 border border-white/5 p-6 md:p-8 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {isTranslating ? (
                    <AILoadingState 
                      key="loading"
                      message="Translating Content" 
                      subMessage={`Converting your text into ${targetLang} while preserving artistic tone...`} 
                      icon={Languages}
                    />
                  ) : translatedResult ? (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Translation Result ({targetLang})</h4>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(translatedResult);
                            alert('Translation copied to clipboard!');
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
                          title="Copy Translation"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5 overflow-y-auto custom-scrollbar">
                        <p className="text-white leading-relaxed">{translatedResult}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                        <Languages size={40} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-500">No Translation Yet</h3>
                        <p className="text-sm text-zinc-600">Translate your content globally</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium mb-6">
                <Languages size={14} />
                <span>AI TRANSLATOR</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">GLOBAL POLYGLOT</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Break language barriers. Translate your scripts, lyrics, or creative ideas into any language while maintaining artistic tone.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <textarea
                    value={translateText}
                    onChange={(e) => setTranslateText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="flex-1 h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                  />
                  <div className="w-32 space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target</label>
                    <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                    >
                      {['Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Urdu', 'Arabic', 'Italian', 'Russian', 'Hindi'].map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !translateText}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Languages size={18} />
                  {isTranslating ? 'Translating...' : 'Translate Now'}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

        {/* AI Research Section */}
        {activeSection === 'research' && (
          <section id="ai-research" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleResearchBack} />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
                <Search size={14} />
                <span>AI RESEARCH</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">DEEP ANALYZER</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Harness the power of Google Search and AI to conduct deep research on any topic. Get summaries, key facts, and verified sources in seconds.
              </p>
              
              <div className="space-y-4">
                <textarea
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  placeholder="What would you like to research today?"
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
                <button
                  onClick={handleResearch}
                  disabled={isResearching || !researchQuery}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Search size={18} />
                  {isResearching ? 'Researching...' : 'Start Research'}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5 p-8 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {isResearching ? (
                    <AILoadingState 
                      key="loading"
                      message="Conducting Research" 
                      subMessage="Searching Google and synthesizing key findings with AI..." 
                      icon={Search}
                    />
                  ) : researchResult ? (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Research Findings</h4>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(researchResult);
                            alert('Research copied to clipboard!');
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-6 rounded-2xl border border-white/5">
                        <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {researchResult}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                        <Search size={40} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-500">No Research Data</h3>
                        <p className="text-sm text-zinc-600 max-w-[200px] mx-auto">Enter a query to begin your deep dive</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>
      )}

        {/* AI Book Reading Section */}
        {activeSection === 'book' && (
          <section id="ai-book" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleBookBack} />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="aspect-[3/4] rounded-3xl bg-zinc-900 border border-white/5 p-6 md:p-8 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {isReadingBook ? (
                    <AILoadingState 
                      key="loading"
                      message="Analyzing Book" 
                      subMessage="Synthesizing themes, characters, and key takeaways..." 
                      icon={BookOpen}
                    />
                  ) : bookAnalysis ? (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Book Analysis</h4>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(bookAnalysis);
                            alert('Analysis copied to clipboard!');
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-6 rounded-2xl border border-white/5">
                        <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                          {bookAnalysis}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                        <BookOpen size={40} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-500">No Book Analyzed</h3>
                        <p className="text-sm text-zinc-600 max-w-[200px] mx-auto">Enter a book title to get insights</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium mb-6">
                <BookOpen size={14} />
                <span>AI BOOK READING</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">LITERARY COMPANION</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Get instant summaries, character analysis, and thematic deep-dives for any book. Perfect for students, researchers, and avid readers.
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter book title and author..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
                <button
                  onClick={handleReadBook}
                  disabled={isReadingBook || !bookTitle}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <BookOpen size={18} />
                  {isReadingBook ? 'Analyzing Book...' : 'Analyze Book'}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

        {/* World Calculators Section */}
        {activeSection === 'calc' && (
          <section id="world-calculators" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleCalcBack} />
            {!selectedCalculator ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium uppercase tracking-widest">
                    <Calculator size={14} />
                    <span>Global Tools</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">World Calculators</h2>
                  <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                    Access a curated collection of the most famous and useful calculators from around the globe. Powered by AI for precision and clarity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {FAMOUS_CALCULATORS.map((calc, idx) => (
                    <motion.button
                      key={calc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedCalculator(calc)}
                      className="group p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-amber-500 hover:border-amber-500 transition-all text-left flex flex-col gap-4"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-black/10 flex items-center justify-center text-amber-500 group-hover:text-black transition-colors">
                        <calc.icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-black transition-colors mb-1">{calc.name}</h3>
                        <p className="text-xs text-zinc-500 group-hover:text-black/60 transition-colors line-clamp-2">{calc.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
                    <selectedCalculator.icon size={14} />
                    <span>{selectedCalculator.name.toUpperCase()}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">
                    {selectedCalculator.name.split(' ')[0]} <span className="text-amber-500">SOLVER</span>
                  </h2>
                  <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                    {selectedCalculator.desc} AI will process your input and provide a detailed breakdown of the result.
                  </p>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={calcInput}
                      onChange={(e) => setCalcInput(e.target.value)}
                      placeholder={`Enter values for ${selectedCalculator.name}...`}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      onClick={handleCalculate}
                      disabled={isCalculating || !calcInput}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <selectedCalculator.icon size={18} />
                      {isCalculating ? 'Calculating...' : 'Calculate Now'}
                    </button>
                    <button 
                      onClick={() => setSelectedCalculator(null)}
                      className="w-full py-3 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      Choose different calculator
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="aspect-video rounded-3xl bg-zinc-900 border border-white/5 p-8 flex flex-col overflow-hidden">
                    <AnimatePresence mode="wait">
                      {isCalculating ? (
                        <AILoadingState 
                          key="loading"
                          message="Solving Equation" 
                          subMessage={`Processing ${selectedCalculator.name} operations...`} 
                          icon={selectedCalculator.icon}
                        />
                      ) : calcResult ? (
                        <motion.div 
                          key="content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full flex flex-col"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedCalculator.name} Result</h4>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(calcResult);
                                alert('Result copied to clipboard!');
                              }}
                              className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                          <div className="flex-1 bg-amber-500/5 rounded-2xl p-6 border border-amber-500/20 overflow-y-auto custom-scrollbar">
                            <div className="text-amber-200 font-mono text-lg leading-relaxed prose prose-invert prose-amber max-w-none">
                              <ReactMarkdown>{calcResult}</ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                          <selectedCalculator.icon size={48} />
                          <p className="text-sm font-medium uppercase tracking-widest">Awaiting Input</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            )}
        </section>
      )}

        {/* AI Math Helper Section */}
        {activeSection === 'math' && (
          <section id="ai-math" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleMathBack} />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5 p-6 md:p-8 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                  {isSolvingMath ? (
                    <AILoadingState 
                      key="loading"
                      message="Solving Math Problem" 
                      subMessage="Analyzing variables and calculating step-by-step solutions..." 
                      icon={Binary}
                    />
                  ) : mathSolution ? (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Step-by-Step Solution</h4>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(mathSolution);
                            alert('Solution copied to clipboard!');
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-6 rounded-2xl border border-white/5">
                        <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                          {mathSolution}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                        <Binary size={40} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-500">No Problem Solved</h3>
                        <p className="text-sm text-zinc-600 max-w-[200px] mx-auto">Enter a math problem to see the solution</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-6">
                <Binary size={14} />
                <span>AI MATH HELPER</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">MATHEMATICAL GENIUS</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                From algebra to calculus, get step-by-step solutions and clear explanations for any mathematical problem. Learning math has never been easier.
              </p>
              
              <div className="space-y-4">
                <textarea
                  value={mathProblem}
                  onChange={(e) => setMathProblem(e.target.value)}
                  placeholder="Enter your math problem here..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
                <button
                  onClick={handleSolveMath}
                  disabled={isSolvingMath || !mathProblem}
                  className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Binary size={18} />
                  {isSolvingMath ? 'Solving Problem...' : 'Solve Problem'}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

        {/* Pakistan Education Section */}
        {activeSection === 'edu' && (
          <section id="pakistan-education" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleEduBack} />
            
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
                <BookOpen size={14} />
                <span>PAKISTAN EDUCATION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">
                {eduStep === 'boards' && "Education Boards"}
                {eduStep === 'classes' && `${selectedBoard}`}
                {eduStep === 'subjects' && `${selectedClass} - ${selectedBoard}`}
                {eduStep === 'content' && `${selectedSubject} - ${selectedClass}`}
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl">
                {eduStep === 'boards' && "Select your provincial or federal textbook board to access the latest academic resources."}
                {eduStep === 'classes' && "Choose your grade level to view available subjects and solved materials."}
                {eduStep === 'subjects' && "Select a subject to view solved exercises and syllabus details."}
                {eduStep === 'content' && "AI-powered solved exercises and academic content updated for 2026."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {eduStep === 'boards' && (
                <motion.div
                  key="boards"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {EDU_BOARDS.map((board) => (
                    <button
                      key={board}
                      onClick={() => {
                        setSelectedBoard(board);
                        if (board === "Pakistan General Knowledge") {
                          setEduStep('content');
                          handleFetchSpecialContent('GK');
                        } else if (board === "1000 Computer Solved MCQs") {
                          setEduStep('content');
                          handleFetchSpecialContent('MCQS');
                        } else {
                          setEduStep('classes');
                        }
                      }}
                      className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all text-left group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <BookOpen size={24} />
                        </div>
                        <ArrowLeft className="rotate-180 text-zinc-600 group-hover:text-emerald-500 transition-colors" size={20} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{board}</h3>
                      <p className="text-zinc-500 text-sm">Latest 2026 Syllabus & Resources</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {eduStep === 'classes' && (
                <motion.div
                  key="classes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4"
                >
                  {EDU_CLASSES.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => {
                        setSelectedClass(cls);
                        setEduStep('subjects');
                      }}
                      className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-emerald-500 hover:text-black transition-all flex flex-col items-center justify-center gap-4 text-center font-bold relative overflow-hidden"
                    >
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-black/20 group-hover:text-black transition-all">
                        {getEduClassIcon(cls)}
                      </div>
                      <span className="text-sm uppercase tracking-wider">{cls}</span>
                      <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </motion.div>
              )}

              {eduStep === 'subjects' && (
                <motion.div
                  key="subjects"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {EDU_SUBJECTS.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubject(sub);
                        setEduStep('content');
                        handleFetchEduContent(selectedBoard!, selectedClass!, sub);
                      }}
                      className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all flex items-center gap-6 group relative overflow-hidden"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all shrink-0">
                        {getEduSubjectIcon(sub)}
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-xl mb-1 uppercase tracking-tight">{sub}</span>
                        <span className="text-xs text-zinc-500 group-hover:text-emerald-500/60 transition-colors">View Solved Exercises</span>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </button>
                  ))}
                </motion.div>
              )}

              {eduStep === 'content' && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-[2.5rem] border border-white/10 min-h-[60vh] relative overflow-hidden transition-colors duration-500 ${
                    eduTheme === 'dark' ? 'bg-zinc-900' : 
                    eduTheme === 'sepia' ? 'bg-[#f4ecd8]' : 'bg-white'
                  }`}
                >
                  <div className={`absolute inset-0 pointer-events-none ${
                    eduTheme === 'dark' ? 'bg-gradient-to-br from-emerald-500/5 to-transparent' : 'opacity-0'
                  }`} />
                  
                  {isEduLoading ? (
                    <div className="h-full flex flex-col items-center justify-center py-20">
                      <AILoadingState 
                        message="Preparing Educational Content" 
                        subMessage="Fetching the latest 2026 syllabus and synthesizing solved exercises..." 
                        icon={GraduationCap}
                      />
                    </div>
                  ) : (
                    <div className="relative z-10 p-6 md:p-12">
                      <div className={`flex flex-col md:flex-row md:items-center justify-between mb-8 pb-8 border-b ${eduTheme === 'dark' ? 'border-white/5' : 'border-zinc-200'} gap-6`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${eduTheme === 'dark' ? 'bg-emerald-500 text-black' : 'bg-emerald-600 text-white'}`}>
                            <BookOpen size={24} />
                          </div>
                          <div>
                            <h3 className={`text-2xl font-black tracking-tight uppercase ${eduTheme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                              {selectedSubject || selectedBoard}
                            </h3>
                            <p className="text-zinc-500 text-sm">{selectedClass || "General Resource"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 self-end md:self-auto">
                          {/* Theme Toggles */}
                          <div className="flex bg-black/5 p-1.5 rounded-2xl border border-white/5">
                            {(['dark', 'sepia', 'light'] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => setEduTheme(t)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                  eduTheme === t ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                                title={`${t.charAt(0).toUpperCase() + t.slice(1)} Mode`}
                              >
                                {t === 'dark' && <Sun size={14} className="rotate-180" />}
                                {t === 'sepia' && <Palette size={14} />}
                                {t === 'light' && <Sun size={14} />}
                              </button>
                            ))}
                          </div>

                          {/* Font Size Toggles */}
                          <div className="flex bg-black/5 p-1.5 rounded-2xl border border-white/5">
                            {(['sm', 'base', 'lg', 'xl'] as const).map((s) => (
                              <button
                                key={s}
                                onClick={() => setEduFontSize(s)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all font-bold ${
                                  eduFontSize === s ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                                title={`Font Size: ${s}`}
                              >
                                {s.toUpperCase()}
                              </button>
                            ))}
                          </div>

                          <button 
                            onClick={() => {
                              if (eduContent) {
                                navigator.clipboard.writeText(eduContent);
                                alert('Content copied to clipboard!');
                              }
                            }}
                            className={`p-3 rounded-xl transition-all ${
                              eduTheme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                            }`}
                          >
                            <Copy size={20} />
                          </button>
                        </div>
                      </div>
                      
                      <div className={`prose max-w-none transition-all duration-300 ${
                        eduTheme === 'dark' ? 'prose-invert prose-emerald' : 
                        eduTheme === 'sepia' ? 'prose-stone' : 'prose-zinc'
                      } ${
                        eduFontSize === 'sm' ? 'prose-sm' : 
                        eduFontSize === 'base' ? 'prose-base' : 
                        eduFontSize === 'lg' ? 'prose-lg' : 'prose-xl'
                      }`}>
                        <div className={`leading-relaxed font-light education-content ${
                          eduTheme === 'dark' ? 'text-zinc-300' : 
                          eduTheme === 'sepia' ? 'text-[#5b4636]' : 'text-zinc-800'
                        }`}>
                          <ReactMarkdown>
                            {eduContent || ''}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* AI Chat for Students */}
                      <div className="mt-16 pt-16 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                            <Sparkles size={20} />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold">Ask AI about this Exercise</h4>
                            <p className="text-zinc-500 text-sm">Get instant help with any question related to this subject.</p>
                          </div>
                        </div>

                        <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                          {eduChatHistory.map((msg, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-orange-500 text-black font-medium' : 'bg-white/5 border border-white/10 text-zinc-300'}`}>
                                <div className="prose prose-sm prose-invert max-w-none">
                                  {msg.text}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {isEduChatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                                <Loader2 size={16} className="animate-spin text-orange-500" />
                                <span className="text-zinc-500 text-sm">AI is thinking...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={eduChatQuery}
                            onChange={(e) => setEduChatQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEduChat()}
                            placeholder="Ask a question about this subject..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-16 text-white focus:outline-none focus:border-orange-500 transition-colors"
                          />
                          <button
                            onClick={handleEduChat}
                            disabled={isEduChatLoading || !eduChatQuery}
                            className="absolute right-2 top-2 bottom-2 px-4 bg-orange-500 hover:bg-orange-600 text-black rounded-xl font-bold transition-all disabled:opacity-50"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* AI Chat Section */}
        {activeSection === 'chat' && (
          <section id="ai-chat" className="max-w-4xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={() => setActiveSection('home')} />
            <div className="flex flex-col h-[70vh] bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              {/* Chat Header */}
              <div className="p-6 border-b border-white/5 bg-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Chat (GPT Style)</h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Powered by Gemini 3 Flash</p>
                  </div>
                </div>
                <button 
                  onClick={() => setChatMessages([])}
                  className="text-zinc-500 hover:text-white transition-colors text-sm font-medium"
                >
                  Clear Chat
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <div className="p-6 bg-white/5 rounded-full">
                      <Sparkles size={48} className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Welcome to Mi Studio Chat</h3>
                      <p className="text-sm max-w-xs">Ask me anything! I can help with coding, writing, research, or just chat.</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white/5 text-zinc-200 border border-white/10 rounded-tl-none'
                      }`}>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10 flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                      <span className="text-sm text-zinc-500">AI is thinking...</span>
                    </div>
                  </div>
                )}
                {chatError && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} />
                      {chatError}
                    </div>
                    <button 
                      onClick={handleSendMessage}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-white/5 bg-zinc-900/80">
                <div className="relative">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message here..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-16 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none min-h-[60px] max-h-[200px]"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isChatting || !chatInput.trim()}
                    className="absolute right-3 bottom-3 p-3 bg-blue-500 hover:bg-blue-600 text-black rounded-xl transition-all disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
                <p className="mt-3 text-[10px] text-zinc-600 text-center">
                  Press Enter to send, Shift+Enter for new line.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* AI Manifestation Section */}
        {activeSection === 'manifest' && (
          <section id="ai-manifestation" className="max-w-6xl mx-auto px-6 py-12 md:py-20 border-t border-white/5">
            <BackButton onClick={handleManifestBack} />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
                <Zap size={14} />
                <span>AI MANIFESTATION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">DREAM MANIFESTOR</h2>
              <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                Turn your goals into reality. Generate powerful affirmations, visualization prompts, and manifestation scripts tailored to your personal journey.
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={manifestationTopic}
                  onChange={(e) => setManifestationTopic(e.target.value)}
                  placeholder="What are you manifesting today? (e.g., Success, Love, Health)"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  onClick={handleManifest}
                  disabled={isManifesting || !manifestationTopic}
                  className="w-full py-4 bg-violet-500 hover:bg-violet-600 text-black rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap size={18} />
                  {isManifesting ? 'Manifesting...' : 'Generate Affirmations'}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="aspect-square rounded-3xl bg-zinc-900 border border-white/5 p-8 flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                <AnimatePresence mode="wait">
                  {isManifesting ? (
                    <AILoadingState 
                      key="loading"
                      message="Manifesting Dreams" 
                      subMessage="Aligning intentions and generating powerful affirmations for your journey..." 
                      icon={Zap}
                    />
                  ) : manifestationAffirmation ? (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col relative z-10"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Your Affirmations</h4>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(manifestationAffirmation);
                            alert('Affirmations copied to clipboard!');
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-violet-200 text-xl font-serif italic leading-relaxed text-center py-8">
                          {manifestationAffirmation}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-zinc-700">
                        <Zap size={40} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-500">Ready to Manifest</h3>
                        <p className="text-sm text-zinc-600">Your affirmations will appear here</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>
      )}

        {/* Sections */}

      </main>

      {/* API Key Warning */}
      {!process.env.GEMINI_API_KEY && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-500"
          >
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">API Key Missing</h4>
              <p className="text-xs opacity-90">Please configure your Gemini API Key in the AI Studio Secrets panel to use the tools.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Zap size={20} />
            </button>
          </motion.div>
        </div>
      )}

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-white/5 text-center space-y-4">
        <p className="text-zinc-600 text-sm">© 2026 Mi Studio • Powered by Mehar Ali Mehrani</p>
        <div className="flex items-center justify-center gap-6">
          <a href="/api/download-app" download="mi-studio-source.zip" className="text-orange-500 hover:text-orange-400 font-medium text-sm flex items-center gap-2">
            <Download size={14} />
            Download Source Code (ZIP)
          </a>
          <button onClick={() => setActiveSection('about')} className="text-zinc-500 hover:text-white font-medium text-sm">About Creator</button>
        </div>
      </footer>
    </motion.div>
  );
}
