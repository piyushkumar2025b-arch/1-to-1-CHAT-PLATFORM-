import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Clock, Smile, ThumbsUp, Heart, Sparkles, Coffee, Cat } from 'lucide-react';

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: { char: string; name: string; keywords: string[] }[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: <Smile className="w-4 h-4" />,
    emojis: [
      { char: '😀', name: 'grinning face', keywords: ['smile', 'happy', 'grin'] },
      { char: '😃', name: 'smiling face with big eyes', keywords: ['smile', 'happy', 'joy'] },
      { char: '😄', name: 'grinning face with smiling eyes', keywords: ['smile', 'happy', 'laugh'] },
      { char: '😁', name: 'beaming face', keywords: ['grin', 'smile', 'happy'] },
      { char: '😆', name: 'grinning squinting face', keywords: ['laugh', 'happy', 'haha'] },
      { char: '😅', name: 'grinning face with sweat', keywords: ['sweat', 'relief', 'nervous'] },
      { char: '😂', name: 'face with tears of joy', keywords: ['tears', 'laugh', 'crying', 'lol'] },
      { char: '🤣', name: 'rolling on the floor laughing', keywords: ['rofl', 'laugh', 'lol'] },
      { char: '😊', name: 'smiling face with smiling eyes', keywords: ['blush', 'warm', 'smile'] },
      { char: '😇', name: 'smiling face with halo', keywords: ['angel', 'innocent', 'halo'] },
      { char: '🙂', name: 'slightly smiling face', keywords: ['smile', 'ok', 'calm'] },
      { char: '🙃', name: 'upside-down face', keywords: ['silly', 'sarcasm', 'irony'] },
      { char: '😉', name: 'winking face', keywords: ['wink', 'flirt', 'joke'] },
      { char: '😌', name: 'relieved face', keywords: ['relief', 'calm', 'peaceful'] },
      { char: '😍', name: 'smiling face with heart-eyes', keywords: ['love', 'crush', 'heart'] },
      { char: '🥰', name: 'smiling face with hearts', keywords: ['love', 'affection', 'fond'] },
      { char: '😘', name: 'face blowing a kiss', keywords: ['kiss', 'flirt', 'love'] },
      { char: '😗', name: 'kissing face', keywords: ['kiss', 'whistle'] },
      { char: '😚', name: 'kissing face with closed eyes', keywords: ['kiss', 'gentle'] },
      { char: '😋', name: 'face savoring food', keywords: ['yum', 'delicious', 'tasty', 'tongue'] },
      { char: '😛', name: 'face with tongue', keywords: ['tongue', 'playful', 'joke'] },
      { char: '😜', name: 'winking face with tongue', keywords: ['playful', 'wink', 'crazy'] },
      { char: '🤪', name: 'zany face', keywords: ['crazy', 'wild', 'goofy'] },
      { char: '😝', name: 'squinting face with tongue', keywords: ['playful', 'teasing'] },
      { char: '🤑', name: 'money-mouth face', keywords: ['rich', 'money', 'dollar'] },
      { char: '🤗', name: 'smiling face with open hands', keywords: ['hug', 'embrace', 'warmth'] },
      { char: '🤭', name: 'face with hand over mouth', keywords: ['oops', 'giggle', 'secret'] },
      { char: '🤫', name: 'shushing face', keywords: ['quiet', 'secret', 'shh'] },
      { char: '🤔', name: 'thinking face', keywords: ['hmm', 'consider', 'ponder', 'think'] },
      { char: '🤐', name: 'zipper-mouth face', keywords: ['silent', 'secret', 'zip'] },
      { char: '🤨', name: 'face with raised eyebrow', keywords: ['skeptical', 'doubt', 'suspicious'] },
      { char: '😐', name: 'neutral face', keywords: ['meh', 'straight', 'plain'] },
      { char: '😑', name: 'expressionless face', keywords: ['blank', 'unimpressed'] },
      { char: '😶', name: 'face without mouth', keywords: ['speechless', 'silent'] },
      { char: '😏', name: 'smirking face', keywords: ['smirk', 'cool', 'flirt'] },
      { char: '😒', name: 'unamused face', keywords: ['bored', 'annoyed', 'meh'] },
      { char: '🙄', name: 'face with rolling eyes', keywords: ['eye roll', 'whatever', 'eyeroll'] },
      { char: '😬', name: 'grimacing face', keywords: ['awkward', 'nervous', 'yikes'] },
      { char: '🤥', name: 'lying face', keywords: ['pinocchio', 'lie', 'fake'] },
      { char: '😌', name: 'relieved face', keywords: ['relaxed', 'phew'] },
      { char: '😔', name: 'pensive face', keywords: ['sad', 'down', 'thoughtful'] },
      { char: '😪', name: 'sleepy face', keywords: ['tired', 'rest'] },
      { char: '🤤', name: 'drooling face', keywords: ['drool', 'craving', 'sleep'] },
      { char: '😴', name: 'sleeping face', keywords: ['sleep', 'zzz', 'night'] },
      { char: '😷', name: 'face with medical mask', keywords: ['sick', 'mask', 'covid'] },
      { char: '🤒', name: 'face with thermometer', keywords: ['fever', 'sick', 'ill'] },
      { char: '🤕', name: 'face with head-bandage', keywords: ['hurt', 'injury', 'ouch'] },
      { char: '🤢', name: 'nauseated face', keywords: ['gross', 'disgust', 'vomit'] },
      { char: '🤮', name: 'face vomiting', keywords: ['puke', 'barf', 'sick'] },
      { char: '🤧', name: 'sneezing face', keywords: ['achoo', 'cold', 'tissue'] },
      { char: '🥵', name: 'hot face', keywords: ['heat', 'summer', 'spicy'] },
      { char: '🥶', name: 'cold face', keywords: ['freezing', 'ice', 'winter'] },
      { char: '🥴', name: 'woozy face', keywords: ['dizzy', 'drunk', 'tired'] },
      { char: '😵', name: 'face with crossed-out eyes', keywords: ['ko', 'dead', 'shock'] },
      { char: '🤯', name: 'exploding head', keywords: ['mind blown', 'shocked', 'boom'] },
      { char: '🤠', name: 'cowboy hat face', keywords: ['yeehaw', 'western', 'hat'] },
      { char: '🥳', name: 'partying face', keywords: ['party', 'celebrate', 'birthday'] },
      { char: '😎', name: 'smiling face with sunglasses', keywords: ['cool', 'shades', 'awesome'] },
      { char: '🤓', name: 'nerd face', keywords: ['geek', 'glasses', 'smart'] },
      { char: '🧐', name: 'face with monocle', keywords: ['curious', 'inspect', 'detective'] },
      { char: '😕', name: 'confused face', keywords: ['unsure', 'what'] },
      { char: '😟', name: 'worried face', keywords: ['anxious', 'concerned'] },
      { char: '🙁', name: 'slightly frowning face', keywords: ['frown', 'sad'] },
      { char: '😮', name: 'face with open mouth', keywords: ['wow', 'surprised'] },
      { char: '😯', name: 'hushed face', keywords: ['silent', 'surprised'] },
      { char: '😲', name: 'astonished face', keywords: ['shocked', 'gasp'] },
      { char: '😳', name: 'flushed face', keywords: ['blush', 'embarrassed', 'shy'] },
      { char: '🥺', name: 'pleading face', keywords: ['puppy eyes', 'begging', 'please'] },
      { char: '😦', name: 'frowning face with open mouth', keywords: ['aww', 'scared'] },
      { char: '😧', name: 'anguished face', keywords: ['pain', 'shock'] },
      { char: '😨', name: 'fearful face', keywords: ['scared', 'dread'] },
      { char: '😰', name: 'anxious face with sweat', keywords: ['panic', 'nervous'] },
      { char: '😥', name: 'sad but relieved face', keywords: ['phew', 'sweat'] },
      { char: '😢', name: 'crying face', keywords: ['tear', 'sad', 'cry'] },
      { char: '😭', name: 'loudly crying face', keywords: ['sob', 'bawl', 'cry'] },
      { char: '😱', name: 'face screaming in fear', keywords: ['scream', 'scared', 'horror'] },
      { char: '😖', name: 'confounded face', keywords: ['frustrated', 'stressed'] },
      { char: '😣', name: 'persevering face', keywords: ['struggle', 'grit'] },
      { char: '😞', name: 'disappointed face', keywords: ['bummed', 'sad'] },
      { char: '😓', name: 'downcast face with sweat', keywords: ['hard work', 'stress'] },
      { char: '😩', name: 'weary face', keywords: ['tired', 'done', 'whine'] },
      { char: '😫', name: 'tired face', keywords: ['exhausted', 'ugh'] },
      { char: '🥱', name: 'yawning face', keywords: ['yawn', 'sleepy', 'bored'] },
      { char: '😤', name: 'face with steam from nose', keywords: ['triumph', 'angry', 'huff'] },
      { char: '😡', name: 'enraged face', keywords: ['mad', 'angry', 'rage'] },
      { char: '😠', name: 'angry face', keywords: ['annoyed', 'mad'] },
      { char: '🤬', name: 'face with symbols on mouth', keywords: ['curse', 'swear', 'furious'] },
      { char: '😈', name: 'smiling face with horns', keywords: ['devil', 'mischief', 'evil'] },
      { char: '👿', name: 'angry face with horns', keywords: ['devil', 'demon'] },
      { char: '💀', name: 'skull', keywords: ['dead', 'death', 'skeleton', 'i am dead'] },
      { char: '☠️', name: 'skull and crossbones', keywords: ['danger', 'poison', 'pirate'] },
      { char: '💩', name: 'pile of poo', keywords: ['poop', 'crap', 'funny'] },
      { char: '🤡', name: 'clown face', keywords: ['clown', 'circus', 'fool'] },
      { char: '👻', name: 'ghost', keywords: ['spooky', 'halloween', 'boo'] },
      { char: '👽', name: 'alien', keywords: ['ufo', 'extraterrestrial', 'space'] },
      { char: '🤖', name: 'robot', keywords: ['bot', 'ai', 'machine'] },
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures & People',
    icon: <ThumbsUp className="w-4 h-4" />,
    emojis: [
      { char: '👋', name: 'waving hand', keywords: ['wave', 'hello', 'bye', 'hi'] },
      { char: '🤚', name: 'raised back of hand', keywords: ['stop', 'high five'] },
      { char: '🖐️', name: 'hand with fingers splayed', keywords: ['five', 'hand'] },
      { char: '✋', name: 'raised hand', keywords: ['stop', 'high five', 'halt'] },
      { char: '🖖', name: 'vulcan salute', keywords: ['spock', 'star trek'] },
      { char: '👌', name: 'ok hand', keywords: ['perfect', 'okay', 'fine'] },
      { char: '🤌', name: 'pinched fingers', keywords: ['italian', 'chef kiss', 'what'] },
      { char: '🤏', name: 'pinching hand', keywords: ['small', 'little', 'tiny'] },
      { char: '✌️', name: 'victory hand', keywords: ['peace', 'two', 'v'] },
      { char: '🤞', name: 'crossed fingers', keywords: ['luck', 'hope', 'wish'] },
      { char: '🤟', name: 'love-you gesture', keywords: ['ily', 'rock on'] },
      { char: '🤘', name: 'sign of the horns', keywords: ['rock', 'metal', 'horns'] },
      { char: '🤙', name: 'call me hand', keywords: ['shaka', 'phone', 'hang loose'] },
      { char: '👈', name: 'backhand index pointing left', keywords: ['left', 'point'] },
      { char: '👉', name: 'backhand index pointing right', keywords: ['right', 'point'] },
      { char: '👆', name: 'backhand index pointing up', keywords: ['up', 'point'] },
      { char: '👇', name: 'backhand index pointing down', keywords: ['down', 'point'] },
      { char: '☝️', name: 'index pointing up', keywords: ['one', 'first', 'point'] },
      { char: '👍', name: 'thumbs up', keywords: ['yes', 'like', 'approve', 'good'] },
      { char: '👎', name: 'thumbs down', keywords: ['no', 'dislike', 'bad'] },
      { char: '✊', name: 'raised fist', keywords: ['power', 'solidarity'] },
      { char: '👊', name: 'oncoming fist', keywords: ['fist bump', 'punch'] },
      { char: '🤛', name: 'left-facing fist', keywords: ['fist bump'] },
      { char: '🤜', name: 'right-facing fist', keywords: ['fist bump'] },
      { char: '👏', name: 'clapping hands', keywords: ['applause', 'bravo', 'clap'] },
      { char: '🙌', name: 'raising hands', keywords: ['celebrate', 'hooray', 'cheer'] },
      { char: '👐', name: 'open hands', keywords: ['hug', 'open'] },
      { char: '🤲', name: 'palms up together', keywords: ['prayer', 'dua', 'open'] },
      { char: '🤝', name: 'handshake', keywords: ['deal', 'agree', 'meeting'] },
      { char: '🙏', name: 'folded hands', keywords: ['pray', 'please', 'thanks', 'hope'] },
      { char: '✍️', name: 'writing hand', keywords: ['write', 'pen', 'note'] },
      { char: '💪', name: 'flexed biceps', keywords: ['strong', 'muscle', 'workout', 'fit'] },
      { char: '🧠', name: 'brain', keywords: ['smart', 'intellect', 'think'] },
      { char: '👀', name: 'eyes', keywords: ['look', 'see', 'watch', 'peek'] },
      { char: '👁️', name: 'eye', keywords: ['look', 'vision'] },
      { char: '👅', name: 'tongue', keywords: ['taste', 'lick'] },
      { char: '👄', name: 'mouth', keywords: ['lips', 'kiss'] },
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts & Symbols',
    icon: <Heart className="w-4 h-4" />,
    emojis: [
      { char: '❤️', name: 'red heart', keywords: ['love', 'like', 'romance', 'passion'] },
      { char: '🧡', name: 'orange heart', keywords: ['love', 'friendship', 'warmth'] },
      { char: '💛', name: 'yellow heart', keywords: ['love', 'friendship', 'sun'] },
      { char: '💚', name: 'green heart', keywords: ['nature', 'jealousy', 'love'] },
      { char: '💙', name: 'blue heart', keywords: ['loyalty', 'peace', 'love'] },
      { char: '💜', name: 'purple heart', keywords: ['wealth', 'magic', 'love'] },
      { char: '🖤', name: 'black heart', keywords: ['dark', 'goth', 'love'] },
      { char: '🤍', name: 'white heart', keywords: ['pure', 'clean', 'love'] },
      { char: '🤎', name: 'brown heart', keywords: ['chocolate', 'earth', 'love'] },
      { char: '💔', name: 'broken heart', keywords: ['heartbreak', 'sad', 'loss'] },
      { char: '❣️', name: 'heart exclamation', keywords: ['love', 'alert'] },
      { char: '💕', name: 'two hearts', keywords: ['love', 'affection'] },
      { char: '💞', name: 'revolving hearts', keywords: ['love', 'spinning'] },
      { char: '💓', name: 'beating heart', keywords: ['heartbeat', 'alive'] },
      { char: '💗', name: 'growing heart', keywords: ['excited', 'warm'] },
      { char: '💖', name: 'sparkling heart', keywords: ['sparkle', 'magic', 'love'] },
      { char: '💘', name: 'heart with arrow', keywords: ['cupid', 'crush'] },
      { char: '💝', name: 'heart with ribbon', keywords: ['gift', 'present', 'love'] },
      { char: '✨', name: 'sparkles', keywords: ['magic', 'shine', 'clean', 'new', 'star'] },
      { char: '⭐', name: 'star', keywords: ['yellow star', 'favorite', 'rating'] },
      { char: '🌟', name: 'glowing star', keywords: ['bright', 'shining'] },
      { char: '💫', name: 'dizzy star', keywords: ['sparkle', 'magic'] },
      { char: '⚡', name: 'high voltage', keywords: ['lightning', 'fast', 'energy', 'zap'] },
      { char: '💥', name: 'collision', keywords: ['boom', 'explode', 'bang'] },
      { char: '🔥', name: 'fire', keywords: ['lit', 'hot', 'flame', 'hype'] },
      { char: '💯', name: 'hundred points', keywords: ['100', 'perfect', 'keep it 100'] },
      { char: '🎉', name: 'party popper', keywords: ['celebrate', 'congrats', 'tada'] },
      { char: '🎊', name: 'confetti ball', keywords: ['celebration', 'party'] },
      { char: '🚀', name: 'rocket', keywords: ['launch', 'moon', 'fast', 'space'] },
      { char: '💡', name: 'light bulb', keywords: ['idea', 'eureka', 'bright'] },
      { char: '🔒', name: 'locked', keywords: ['secure', 'private', 'safety'] },
      { char: '🔓', name: 'unlocked', keywords: ['open', 'free'] },
      { char: '🔑', name: 'key', keywords: ['password', 'secret', 'access'] },
      { char: '🛡️', name: 'shield', keywords: ['protect', 'defense', 'security'] },
    ],
  },
  {
    id: 'activities',
    name: 'Objects & Activities',
    icon: <Sparkles className="w-4 h-4" />,
    emojis: [
      { char: '🎮', name: 'video game', keywords: ['game', 'controller', 'play'] },
      { char: '🎲', name: 'game die', keywords: ['dice', 'luck', 'chance'] },
      { char: '🎯', name: 'bullseye', keywords: ['target', 'goal', 'hit'] },
      { char: '🏆', name: 'trophy', keywords: ['winner', 'first place', 'champion'] },
      { char: '🥇', name: '1st place medal', keywords: ['gold', 'first', 'winner'] },
      { char: '🥈', name: '2nd place medal', keywords: ['silver', 'second'] },
      { char: '🥉', name: '3rd place medal', keywords: ['bronze', 'third'] },
      { char: '⚽', name: 'soccer ball', keywords: ['football', 'sport'] },
      { char: '🏀', name: 'basketball', keywords: ['hoop', 'nba'] },
      { char: '🏈', name: 'american football', keywords: ['nfl', 'ball'] },
      { char: '🎾', name: 'tennis', keywords: ['racket', 'court'] },
      { char: '🎬', name: 'clapper board', keywords: ['movie', 'film', 'cinema'] },
      { char: '🎧', name: 'headphone', keywords: ['music', 'audio', 'listen'] },
      { char: '🎤', name: 'microphone', keywords: ['sing', 'karaoke', 'voice'] },
      { char: '🎨', name: 'artist palette', keywords: ['art', 'paint', 'design', 'draw'] },
      { char: '💻', name: 'laptop', keywords: ['computer', 'code', 'tech'] },
      { char: '📱', name: 'mobile phone', keywords: ['iphone', 'smartphone', 'call'] },
      { char: '📸', name: 'camera with flash', keywords: ['photo', 'picture'] },
      { char: '⏰', name: 'alarm clock', keywords: ['time', 'wake up'] },
      { char: '⌛', name: 'hourglass done', keywords: ['time', 'sand', 'wait'] },
      { char: '☕', name: 'hot beverage', keywords: ['coffee', 'tea', 'cafe'] },
      { char: '🍕', name: 'pizza', keywords: ['food', 'slice', 'italian'] },
      { char: '🍔', name: 'hamburger', keywords: ['burger', 'fast food'] },
      { char: '🍻', name: 'clinking beer mugs', keywords: ['cheers', 'drink', 'beer'] },
      { char: '🥂', name: 'clinking glasses', keywords: ['toast', 'celebrate', 'champagne'] },
    ],
  },
  {
    id: 'nature',
    name: 'Animals & Nature',
    icon: <Cat className="w-4 h-4" />,
    emojis: [
      { char: '🐶', name: 'dog face', keywords: ['puppy', 'pet', 'cute'] },
      { char: '🐱', name: 'cat face', keywords: ['kitty', 'kitten', 'meow'] },
      { char: '🐭', name: 'mouse face', keywords: ['rodent', 'cheese'] },
      { char: '🐹', name: 'hamster', keywords: ['cute', 'small'] },
      { char: '🐰', name: 'rabbit face', keywords: ['bunny', 'easter'] },
      { char: '🦊', name: 'fox', keywords: ['clever', 'wild'] },
      { char: '🐻', name: 'bear', keywords: ['grizzly', 'wild'] },
      { char: '🐼', name: 'panda', keywords: ['bamboo', 'cute'] },
      { char: '🐨', name: 'koala', keywords: ['australia', 'eucalyptus'] },
      { char: '🐯', name: 'tiger face', keywords: ['stripes', 'wild'] },
      { char: '🦁', name: 'lion', keywords: ['king', 'mane', 'safari'] },
      { char: '🐮', name: 'cow face', keywords: ['moo', 'milk', 'farm'] },
      { char: '🐷', name: 'pig face', keywords: ['oink', 'bacon'] },
      { char: '🐸', name: 'frog', keywords: ['ribbit', 'amphibian'] },
      { char: '🐵', name: 'monkey face', keywords: ['banana', 'ape'] },
      { char: '🦄', name: 'unicorn', keywords: ['fantasy', 'magic', 'horse'] },
      { char: '🐝', name: 'honeybee', keywords: ['bee', 'honey', 'buzz'] },
      { char: '🦋', name: 'butterfly', keywords: ['insect', 'nature', 'wings'] },
      { char: '🌺', name: 'hibiscus', keywords: ['flower', 'tropical'] },
      { char: '🌸', name: 'cherry blossom', keywords: ['sakura', 'pink', 'flower'] },
      { char: '🍀', name: 'four leaf clover', keywords: ['lucky', 'luck', 'green'] },
      { char: '🌈', name: 'rainbow', keywords: ['colors', 'pride', 'sky'] },
      { char: '☀️', name: 'sun', keywords: ['sunny', 'weather', 'warmth'] },
      { char: '🌙', name: 'crescent moon', keywords: ['night', 'sleep', 'dark'] },
    ],
  },
];

const RECENT_KEY = 'private_chat_recent_emojis';
const DEFAULT_RECENTS = ['😀', '😂', '😍', '🔥', '👍', '❤️', '🎉', '✨'];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_RECENTS;
    } catch {
      return DEFAULT_RECENTS;
    }
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Auto-focus search input when opened
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSelect = (emojiChar: string) => {
    onSelectEmoji(emojiChar);

    // Update recents
    setRecentEmojis((prev) => {
      const filtered = prev.filter((e) => e !== emojiChar);
      const next = [emojiChar, ...filtered].slice(0, 16);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore local storage errors
      }
      return next;
    });
  };

  const filteredEmojis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;

    const results: { char: string; name: string }[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const emoji of cat.emojis) {
        if (
          emoji.name.toLowerCase().includes(q) ||
          emoji.keywords.some((kw) => kw.includes(q))
        ) {
          results.push({ char: emoji.char, name: emoji.name });
        }
      }
    }
    return results;
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      id="emoji-picker-popover"
      className="absolute bottom-16 right-0 sm:right-auto sm:left-4 z-50 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-slate-100"
      style={{ maxHeight: '420px' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Search */}
      <div className="p-3 border-b border-white/10 bg-slate-950/40 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            id="emoji-search-input"
            type="text"
            placeholder="Search emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          id="emoji-picker-close-btn"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Tabs (shown when not searching) */}
      {!searchQuery && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/5 bg-slate-950/20 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All
          </button>
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title={cat.name}
            >
              {cat.icon}
              <span className="hidden sm:inline">{cat.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Scrollable Emojis Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[300px] overscroll-contain">
        {/* Search Results */}
        {filteredEmojis ? (
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2 px-1">
              Search Results ({filteredEmojis.length})
            </div>
            {filteredEmojis.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No emojis found for "{searchQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map((item, idx) => (
                  <button
                    key={`${item.char}-${idx}`}
                    onClick={() => handleSelect(item.char)}
                    title={item.name}
                    className="h-10 text-xl flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
                  >
                    {item.char}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Recent Emojis */}
            {activeTab === 'all' && recentEmojis.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1.5 px-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Recent & Frequently Used
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {recentEmojis.map((char, idx) => (
                    <button
                      key={`recent-${char}-${idx}`}
                      onClick={() => handleSelect(char)}
                      className="h-10 text-xl flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Emojis */}
            {EMOJI_CATEGORIES.filter(
              (cat) => activeTab === 'all' || activeTab === cat.id
            ).map((category) => (
              <div key={category.id}>
                <div className="text-xs font-semibold text-slate-400 mb-1.5 px-1 flex items-center gap-1.5">
                  {category.icon}
                  {category.name}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji.name}
                      onClick={() => handleSelect(emoji.char)}
                      title={emoji.name}
                      className="h-10 text-xl flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
                    >
                      {emoji.char}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer quick action bar */}
      <div className="p-2 border-t border-white/5 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400 px-3">
        <span>Click any emoji to insert</span>
        <div className="flex items-center gap-1">
          {['👍', '❤️', '😂', '🔥', '🎉'].map((quick) => (
            <button
              key={quick}
              onClick={() => handleSelect(quick)}
              className="px-1.5 py-0.5 rounded hover:bg-white/10 text-base"
            >
              {quick}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
