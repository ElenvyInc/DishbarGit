import type { DishArt, DishTone } from '@/lib/dishes';

const TONE_BG: Record<DishTone, string> = {
  peach: 'bg-[#F6DCC8]',
  sage: 'bg-[#D7E6C8]',
  lilac: 'bg-[#E5D4EA]',
  butter: 'bg-[#F6E7B2]',
  sky: 'bg-[#D5E6F6]',
  rose: 'bg-[#F0D4DE]',
};

export function toneClass(tone: DishTone) {
  return TONE_BG[tone];
}

export function DishIllustration({ art, className = '' }: { art: DishArt; className?: string }) {
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden="true">
      {art === 'chicken' && <Chicken />}
      {art === 'herbs' && <Herbs />}
      {art === 'eggplant' && <Eggplant />}
      {art === 'rice' && <Rice />}
      {art === 'soup' && <Soup />}
      {art === 'stew' && <Stew />}
      {art === 'pastry' && <Pastry />}
    </svg>
  );
}

function Chicken() {
  return (
    <>
      <ellipse cx="78" cy="118" rx="36" ry="8" fill="#E7C3A4" opacity="0.7" />
      <path d="M96 96c18 2 28-8 30-18 1-6-4-8-8-6-6 4-14 2-18-4" fill="none" stroke="#F4E4CF" strokeWidth="8" strokeLinecap="round" />
      <path d="M46 78c8-28 40-40 62-22 10 8 12 22 4 34-10 16-40 28-62 16-8-4-10-16-4-28z" fill="#E39A45" />
      <path d="M58 70c10-8 28-8 36 2" fill="none" stroke="#F6C98A" strokeWidth="6" strokeLinecap="round" />
      <circle cx="70" cy="62" r="3" fill="#F8E7C8" />
    </>
  );
}

function Herbs() {
  return (
    <>
      <ellipse cx="80" cy="118" rx="34" ry="7" fill="#B7CBA4" />
      <path d="M80 108c-2-24 6-40 8-58" stroke="#3E6B45" strokeWidth="3" fill="none" />
      <path d="M70 100c-16-8-28-6-36 2 10 2 20 0 28-8" fill="#6FA56A" />
      <path d="M74 86c-18-14-22-26-14-34 12 6 18 16 16 30" fill="#4E8A52" />
      <path d="M86 92c16-6 30-2 36 8-12 4-22 2-30-6" fill="#7FB56A" />
      <path d="M88 74c14-16 30-16 36-6-14 2-24 8-28 18" fill="#2F6B45" />
      <path d="M78 64c-2-16 8-28 20-32-2 14-8 24-16 30" fill="#8FCB78" />
      <circle cx="96" cy="40" r="6" fill="#DDE8A8" />
    </>
  );
}

function Eggplant() {
  return (
    <>
      <ellipse cx="80" cy="120" rx="32" ry="7" fill="#D7C0DE" />
      <path d="M78 108c-6-28-2-52 16-70 16 20 18 46 10 70-8 4-20 4-26 0z" fill="#7A4E86" />
      <path d="M86 48c8-16 22-18 28-10-12 2-20 8-22 18-6-2-8-4-6-8z" fill="#6E9A55" />
      <path d="M96 46c-2-14 8-22 16-20 0 10-4 16-12 20" fill="#4F7A3E" />
      <path d="M90 78c6 8 8 16 4 24" stroke="#C9A4D4" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  );
}

function Rice() {
  return (
    <>
      <ellipse cx="80" cy="108" rx="46" ry="14" fill="#F7F4EE" />
      <path d="M40 96c0 16 18 28 40 28s40-12 40-28c0-8-18-16-40-16s-40 8-40 16z" fill="#FBF8F2" stroke="#E7D3A8" strokeWidth="3" />
      <path d="M52 90c6-22 18-36 28-36s20 14 26 36" fill="#F4D48A" />
      <path d="M70 70c4-10 10-16 16-16 2 8 0 16-4 24" fill="#E7B04A" />
      <circle cx="96" cy="78" r="3.5" fill="#C4483A" />
      <circle cx="78" cy="86" r="2.5" fill="#C4483A" />
      <circle cx="88" cy="92" r="2" fill="#6F8A3A" />
    </>
  );
}

function Soup() {
  return (
    <>
      <ellipse cx="80" cy="112" rx="40" ry="10" fill="#BFD3EA" />
      <path d="M42 78h76c-4 28-20 42-38 42S46 106 42 78z" fill="#F7FBFF" stroke="#8FB4D8" strokeWidth="3" />
      <path d="M52 86c8 4 12 4 18 0s12-2 18 2 12 2 16-2" fill="none" stroke="#3E6B45" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 98c10 3 14 2 20-2s12-1 18 3 10 2 14-2" fill="none" stroke="#C9A15A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="74" r="5" fill="#E07A68" />
      <circle cx="96" cy="70" r="4" fill="#F4D48A" />
    </>
  );
}

function Stew() {
  return (
    <>
      <ellipse cx="80" cy="114" rx="42" ry="10" fill="#E2C2CC" />
      <path d="M40 80h80c-4 26-20 40-40 40S44 106 40 80z" fill="#F8F1EE" stroke="#D7A3B0" strokeWidth="3" />
      <ellipse cx="80" cy="86" rx="30" ry="14" fill="#6A3A32" />
      <ellipse cx="74" cy="82" rx="12" ry="5" fill="#8A5244" />
      <circle cx="98" cy="84" r="5" fill="#C9864A" />
      <path d="M92 78c6-8 14-8 16-2" fill="#C4483A" />
    </>
  );
}

function Pastry() {
  return (
    <>
      <ellipse cx="80" cy="116" rx="36" ry="8" fill="#E7C3A4" />
      <path d="M48 92l32-40 32 40-32 16z" fill="#E7B15A" />
      <path d="M80 52l32 40H80z" fill="#F2CB7A" />
      <path d="M64 84h32" stroke="#C4483A" strokeWidth="2" />
      <path d="M70 74c8 6 12 6 20 0" fill="none" stroke="#3E6B45" strokeWidth="3" strokeLinecap="round" />
      <circle cx="80" cy="70" r="3" fill="#2F6B45" />
    </>
  );
}

export function HeroPlate() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <svg viewBox="0 0 520 520" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="270" cy="270" r="210" fill="none" stroke="#E7D3BC" strokeWidth="1.5" />
        <circle cx="270" cy="270" r="168" fill="none" stroke="#E7D3BC" strokeWidth="1.5" />
        <circle cx="262" cy="262" r="132" fill="#FFFDF9" />
        <ellipse cx="262" cy="300" rx="92" ry="28" fill="#F4E7D4" opacity="0.65" />
      </svg>
      <div className="absolute left-[18%] top-[16%] w-[30%]">
        <DishIllustration art="rice" className="h-auto w-full drop-shadow-sm" />
      </div>
      <div className="absolute right-[14%] top-[14%] w-[30%]">
        <DishIllustration art="herbs" className="h-auto w-full drop-shadow-sm" />
      </div>
      <div className="absolute bottom-[16%] right-[18%] w-[30%]">
        <DishIllustration art="stew" className="h-auto w-full drop-shadow-sm" />
      </div>
      <div className="absolute bottom-[14%] left-[16%] w-[32%]">
        <DishIllustration art="chicken" className="h-auto w-full drop-shadow-sm" />
      </div>
    </div>
  );
}

export function AvatarCluster() {
  const faces = ['#F3C1A5', '#E7A888', '#F6D3B0'];
  return (
    <span className="flex" aria-hidden="true">
      {faces.map((color, index) => (
        <svg
          key={color}
          viewBox="0 0 36 36"
          className={`h-8 w-8 rounded-full ring-2 ring-[#FBF6EF] ${index ? '-ms-2' : ''}`}
        >
          <circle cx="18" cy="18" r="18" fill={color} />
          <circle cx="18" cy="15" r="6" fill="#F8E6D4" />
          <path d="M8 30c2-6 6-8 10-8s8 2 10 8" fill="#F8E6D4" />
        </svg>
      ))}
    </span>
  );
}

const STORY_ARTS: DishArt[] = ['soup', 'pastry', 'chicken', 'herbs'];

export function StoryMarks() {
  return (
    <div className="flex" aria-hidden="true">
      {STORY_ARTS.map((art, index) => (
        <span
          key={art}
          className={`grid h-16 w-16 place-items-center rounded-full bg-[#F7F1E8] ring-4 ring-[#14352C] sm:h-[4.5rem] sm:w-[4.5rem] ${index ? '-ms-4' : ''}`}
        >
          <DishIllustration art={art} className="h-12 w-12" />
        </span>
      ))}
    </div>
  );
}
