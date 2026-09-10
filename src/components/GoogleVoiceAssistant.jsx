import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ── Multi-lingual Knowledge Base for Voice Responses ────────────────────────
const VOICE_KNOWLEDGE = {
  En: {
    name: 'English',
    speechLang: 'en-IN',
    greeting: "Hi, I'm your Google Voice Assistant for FarmDirect. Ask me anything about crop prices, buyers, transport, or tell me where to go on the website.",
    listening: "Listening in English... (Speak now)",
    suggestions: ['Today\'s tomato price', 'Find verified buyers', 'Go to Marketplace', 'Open live bidding', 'Transport costs'],
    actions: {
      marketplace: ['marketplace', 'market', 'produce lots', 'buy produce', 'browse crops'],
      bidding: ['bidding', 'bid', 'auction', 'auctions', 'place bid'],
      logistics: ['logistics', 'transport', 'truck', 'routes', 'delivery'],
      dashboard: ['dashboard', 'my stats', 'analytics', 'portfolio'],
      publish: ['publish produce', 'sell crop', 'add crop', 'list produce'],
      home: ['home', 'main page', 'start'],
    },
    responses: {
      price: "Today's APMC market rates: Tomato is ₹28 to ₹32 per kg with a rising trend; Guntur Chilli is ₹60 to ₹65 per kg; Onions are stable at ₹34 per kg. Would you like to check a specific crop?",
      buyer: "There are 5 active verified buyers right now. Srinivas Agro Exports in Guntur has a 94% match score with a budget of ₹1,00,000. Navigating you to the marketplace to connect.",
      transport: "For Vizag to Guntur via NH-16 Express, distance is 120 km, estimated transit time is 2 hours 30 minutes, and freight cost is ₹1,800. AI route optimization saves you ₹400.",
      sell: "FarmAI Recommendation: For Chilli, hold for 3 to 5 days as festival demand will increase prices by ₹5 to ₹8 per kg. For Tomato, sell immediately as heavy arrivals are expected next week.",
      help: "You can ask: What is today's chilli rate? Find buyers for rice? Show transport routes? Or say: Open marketplace, or Open bidding.",
      fallback: "I heard you. Let me look that up on FarmDirect. You can ask for prices, buyers, logistics, or tell me to navigate anywhere.",
    }
  },
  Te: {
    name: 'తెలుగు (Telugu)',
    speechLang: 'te-IN',
    greeting: "నమస్కారం! నేను మీ గూగుల్ ఫార్మర్ వాయిస్ అసిస్టెంట్. నేటి పంట ధరలు, కొనుగోలుదారులు, రవాణా లేదా వెబ్‌సైట్ పేజీల గురించి అడగండి.",
    listening: "తెలుగులో వింటున్నాను... (ఇప్పుడు మాట్లాడండి)",
    suggestions: ['నేటి టమాటా ధర ఎంత?', 'కొనుగోలుదారులను చూపించు', 'మార్కెట్‌ప్లేస్ కి వెళ్ళు', 'లైవ్ బిడ్డింగ్ వేలం', 'రవాణా చార్జీలు'],
    actions: {
      marketplace: ['మార్కెట్', 'మార్కెట్‌ప్లేస్', 'పంటలు', 'కొనుగోలు'],
      bidding: ['బిడ్డింగ్', 'వేలం', 'వేలం పాట', 'ఆక్షన్'],
      logistics: ['రవాణా', 'లారీ', 'ట్రాన్స్‌పోర్ట్', 'లాజిస్టిక్స్', 'రూట్'],
      dashboard: ['డాష్‌బోర్డ్', 'నా ఖాతా', 'వివరాలు'],
      publish: ['పంట అమ్మాలి', 'పంట నమోదు', 'పబ్లిష్', 'అమ్మకం'],
      home: ['హోమ్', 'మొదటి పేజీ'],
    },
    responses: {
      price: "నేటి మార్కెట్ ధరల వివరాలు: టమాటా ధర కిలోకు ₹28 నుంచి ₹32 వరకు పలుకుతోంది. గుంటూరు మిర్చి ధర ₹60 నుంచి ₹65 వరకు పెరిగే ధోరణిలో ఉంది. ఉల్లిపాయ కిలో ₹34 వద్ద స్థిరంగా ఉంది.",
      buyer: "ప్రస్తుతం 5 మంది ధృవీకరించబడిన కొనుగోలుదారులు సిద్ధంగా ఉన్నారు. గుంటూరుకు చెందిన శ్రీనివాస్ ఆగ్రో ఎక్స్‌పోర్ట్స్ 94 శాతం సరిపోలింది. మీకు మార్కెట్‌ప్లేస్ చూపిస్తున్నాను.",
      transport: "విశాఖపట్నం నుంచి గుంటూరుకు NH-16 మీదుగా దూరం 120 కిలోమీటర్లు, ప్రయాణ సమయం 2 గంటల 30 నిమిషాలు, లారీ చార్జీ సుమారు ₹1,800 అవుతుంది. AI రవాణా ద్వారా ₹400 వరకు ఆదా అవుతుంది.",
      sell: "ఫార్మర్ AI సలహా: మిరపకాయలను మరో 3 నుంచి 5 రోజులు ఆగి అమ్మడం మంచిది, ధర కిలోకు ₹5 నుంచి ₹8 వరకు పెరిగే అవకాశం ఉంది. టమాటాలను వెంటనే విక్రయించడం ఉత్తమం.",
      help: "మీరు ఇలా అడగవచ్చు: మిరపకాయ ధర ఎంత? కొనుగోలుదారులను చూపించు, రవాణా ఖర్చు ఎంత? లేదా మార్కెట్‌ప్లేస్ ఓపెన్ చెయ్యి అని చెప్పండి.",
      fallback: "మీరు చెప్పినది విన్నాను. పంటల రేట్లు, కొనుగోలుదారులు, రవాణా వివరాల కోసం లేదా పేజీలను తెరవడానికి నన్ను అడగండి.",
    }
  },
  Hi: {
    name: 'हिन्दी (Hindi)',
    speechLang: 'hi-IN',
    greeting: "नमस्ते किसान भाई! मैं आपका गूगल वॉइस असिस्टेंट हूँ। आज के मंडी भाव, खरीदार, ट्रांसपोर्ट या किसी भी पेज पर जाने के लिए बोलें।",
    listening: "हिन्दी में सुन रहा हूँ... (अब बोलें)",
    suggestions: ['आज टमाटर का भाव क्या है?', 'खरीदार दिखाओ', 'मार्केटप्लेस खोलो', 'लाइव बिडिंग नीलामी', 'ट्रांसपोर्ट का खर्च'],
    actions: {
      marketplace: ['मार्केट', 'मार्केटप्लेस', 'मंडी', 'फसलें'],
      bidding: ['बिडिंग', 'नीलामी', 'बोली', 'ऑक्शन'],
      logistics: ['ट्रांसपोर्ट', 'लॉजिस्टिक्स', 'गाड़ी', 'ट्रक', 'किराया'],
      dashboard: ['डैशबोर्ड', 'मेरी जानकारी'],
      publish: ['फसल बेचनी है', 'फसल जोड़ो', 'पब्लिश'],
      home: ['होम', 'मुख्य पेज'],
    },
    responses: {
      price: "आज के ताजा मंडी भाव: टमाटर ₹28 से ₹32 प्रति किलो (तेजी पर है), गुंटूर लाल मिर्च ₹60 से ₹65 प्रति किलो, और प्याज ₹34 प्रति किलो पर स्थिर है।",
      buyer: "इस समय 5 सत्यापित खरीदार उपलब्ध हैं। श्रीनिवास एग्रो एक्सपोर्ट्स गुंटूर 94% मैच के साथ तैयार हैं। मैं आपको मार्केटप्लेस पर ले चलता हूँ।",
      transport: "विशाखापट्टनम से गुंटूर NH-16 होकर दूरी 120 किमी है, समय 2 घंटे 30 मिनट लगेगा और अनुमानित भाड़ा ₹1,800 है। AI से ₹400 की बचत होगी।",
      sell: "किसान AI सलाह: मिर्च 3 से 5 दिन रोककर बेचें, भाव में ₹5 से ₹8 प्रति किलो की तेजी आएगी। टमाटर तुरंत बेचें क्योंकि आवक बढ़ने वाली है।",
      help: "आप पूछ सकते हैं: आज मिर्च का भाव क्या है? खरीदार दिखाओ, ट्रांसपोर्ट का किराया कितना है? या बोलें: मार्केटप्लेस खोलो।",
      fallback: "मैंने आपकी बात सुनी। आप मंडी भाव, खरीदार, गाड़ी का खर्च या किसी भी पेज पर जाने के लिए बोल सकते हैं।",
    }
  }
};

export default function GoogleVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('Te'); // Default to Telugu as requested in prompt, with En and Hi switches
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [voiceVolume, setVoiceVolume] = useState(1);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    // Global event listener to trigger Google Assistant from Navbar or any component
    const handleGlobalTrigger = (e) => {
      setIsOpen(true);
      if (e?.detail?.lang) {
        setLanguage(e.detail.lang);
      }
      setTimeout(() => startListening(), 400);
    };
    window.addEventListener('open_google_voice_assistant', handleGlobalTrigger);

    return () => {
      window.removeEventListener('open_google_voice_assistant', handleGlobalTrigger);
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = VOICE_KNOWLEDGE[language]?.speechLang || 'en-IN';
    }
  }, [language]);

  // Set greeting on open
  useEffect(() => {
    if (isOpen && !assistantReply) {
      const greeting = VOICE_KNOWLEDGE[language].greeting;
      setAssistantReply(greeting);
      speakText(greeting, language);
    }
  }, [isOpen, language]);

  // Handle Speech Output (TTS)
  const speakText = (text, langKey) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Stop ongoing speech

    const utter = new SpeechSynthesisUtterance(text);
    const targetLang = VOICE_KNOWLEDGE[langKey]?.speechLang || 'en-IN';
    utter.lang = targetLang;
    utter.rate = 0.95; // Clear and easy to understand for farmers
    utter.pitch = 1.0;

    // Pick best available voice matching language
    const voices = synthRef.current.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(targetLang.slice(0, 2)) || v.lang.includes(targetLang));
    if (matchedVoice) {
      utter.voice = matchedVoice;
    }

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utter);
  };

  const stopSpeaking = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
  };

  // Start Speech-to-Text
  const startListening = () => {
    stopSpeaking();
    setTranscript('');
    if (!recognitionRef.current) {
      setAssistantReply('Microphone speech recognition is not supported in this browser. Please use the quick prompt buttons below.');
      return;
    }

    try {
      recognitionRef.current.lang = VOICE_KNOWLEDGE[language]?.speechLang || 'en-IN';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          processVoiceInput(currentTranscript, language);
        }
      };

      recognitionRef.current.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Process Voice Query & Navigation Commands
  const processVoiceInput = (userQuery, currentLangKey) => {
    setIsListening(false);
    const query = userQuery.toLowerCase().trim();
    if (!query) return;

    const langData = VOICE_KNOWLEDGE[currentLangKey];
    let reply = '';
    let actionTriggered = null;

    // Check voice navigation commands
    if (langData.actions.marketplace.some(k => query.includes(k))) {
      reply = currentLangKey === 'Te'
        ? 'సరే! నేను మిమ్మల్ని మార్కెట్‌ప్లేస్ పేజీకి తీసుకువెళుతున్నాను.'
        : currentLangKey === 'Hi'
        ? 'ठीक है! मैं आपको मार्केटप्लेस पेज पर ले चल रहा हूँ।'
        : 'Opening the produce marketplace for you now.';
      actionTriggered = () => navigate('/marketplace');
    } else if (langData.actions.bidding.some(k => query.includes(k))) {
      reply = currentLangKey === 'Te'
        ? 'లైవ్ బిడ్డింగ్ మరియు వేలం పేజీని తెరుస్తున్నాను.'
        : currentLangKey === 'Hi'
        ? 'लाइव बिडिंग और नीलामी पेज खोल रहा हूँ।'
        : 'Navigating to live farmer auctions and bidding.';
      actionTriggered = () => navigate('/bidding');
    } else if (langData.actions.logistics.some(k => query.includes(k))) {
      reply = currentLangKey === 'Te'
        ? 'రవాణా మరియు లాజిస్టిక్స్ ట్రాకింగ్ పేజీని చూపిస్తున్నాను.'
        : currentLangKey === 'Hi'
        ? 'ट्रांसपोर्ट और लॉजिस्टिक्स पेज दिखा रहा हूँ।'
        : 'Taking you to the logistics and transport optimizer.';
      actionTriggered = () => navigate('/logistics');
    } else if (langData.actions.dashboard.some(k => query.includes(k))) {
      reply = currentLangKey === 'Te'
        ? 'మీ అగ్రి డాష్‌బోర్డ్ తెరుస్తున్నాను.'
        : currentLangKey === 'Hi'
        ? 'आपका किसान डैशबोर्ड खोल रहा हूँ।'
        : 'Opening your farmer dashboard.';
      actionTriggered = () => navigate('/dashboard');
    } else if (langData.actions.publish.some(k => query.includes(k))) {
      reply = currentLangKey === 'Te'
        ? 'మీ పంటను అమ్మకానికి నమోదు చేసే ఫారంను తెరుస్తున్నాను. మీ పంట ఫోటోను కూడా ఇక్కడ స్కాన్ చేయవచ్చు.'
        : currentLangKey === 'Hi'
        ? 'फसल पब्लिश करने का फॉर्म खोल रहा हूँ। आप अपनी फसल का फोटो भी स्कैन कर सकते हैं।'
        : 'Opening the publish produce modal so you can scan and list your crop.';
      actionTriggered = () => {
        navigate('/marketplace');
        setTimeout(() => window.dispatchEvent(new Event('open_publish_produce_modal')), 400);
      };
    } else if (langData.actions.home.some(k => query.includes(k))) {
      reply = currentLangKey === 'Te' ? 'హోమ్ పేజీకి తీసుకువెళుతున్నాను.' : currentLangKey === 'Hi' ? 'होम पेज पर ले जा रहा हूँ।' : 'Going to homepage.';
      actionTriggered = () => navigate('/');
    }
    // Check subject domain responses
    if (query.includes('ధర') || query.includes('rate') || query.includes('price') || query.includes('भाव') || query.includes('రేటు') || query.includes('tomato') || query.includes('టమాటా') || query.includes('टमाटर') || query.includes('chilli') || query.includes('మిర్చి')) {
      reply = langData.responses.price;
    } else if (query.includes('buyer') || query.includes('కొనుగోలు') || query.includes('खरीदार') || query.includes('व्यापारी')) {
      reply = langData.responses.buyer;
    } else if (query.includes('transport') || query.includes('రవాణా') || query.includes('किराया') || query.includes('truck') || query.includes('లారీ')) {
      reply = langData.responses.transport;
    } else if (query.includes('sell') || query.includes('when') || query.includes('ఎప్పుడు') || query.includes('कब') || query.includes('లాభం') || query.includes('मुनाफा')) {
      reply = langData.responses.sell;
    } else if (query.includes('help') || query.includes('సహాయం') || query.includes('मदद') || query.includes('నమస్కారం') || query.includes('hello')) {
      reply = langData.responses.help;
    } else {
      reply = langData.responses.fallback;
    }

    setAssistantReply(reply);
    speakText(reply, currentLangKey);

    // Also asynchronously fetch enhanced response from backend AI if network available
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userQuery, lang: currentLangKey.toLowerCase(), role: 'farmer' })
    }).then(r => r.json()).then(res => {
      if (res.success && res.reply && res.reply !== reply) {
        setAssistantReply(res.reply);
      }
    }).catch(() => {});

    if (actionTriggered) {
      setTimeout(() => actionTriggered(), 1200);
    }
  };

  const handleSuggestionClick = (prompt) => {
    setTranscript(prompt);
    processVoiceInput(prompt, language);
  };

  return (
    <>
      {/* ─── Google Assistant Interactive Slide-Up Overlay ─── */}
      {isOpen && (
        <div
          id="google-assistant-sheet"
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            width: '420px',
            maxWidth: 'calc(100vw - 48px)',
            background: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 24px 70px rgba(0,0,0,0.25), 0 0 0 1px rgba(66, 133, 244, 0.2)',
            zIndex: 1500,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'googleAssistantOpen 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          {/* Header with Google Colors Bar */}
          <div style={{ position: 'relative' }}>
            {/* Top 4-Color Accent Line */}
            <div style={{ height: '4px', display: 'flex' }}>
              <div style={{ flex: 1, background: '#4285F4' }} />
              <div style={{ flex: 1, background: '#EA4335' }} />
              <div style={{ flex: 1, background: '#FBBC05' }} />
              <div style={{ flex: 1, background: '#34A853' }} />
            </div>

            <div style={{
              padding: '1rem 1.25rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #F1F3F4'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* 4 Google Assistant Animated Orb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4285F4' }} />
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EA4335' }} />
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FBBC05' }} />
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34A853' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#202124' }}>
                  Google Assistant <span style={{ fontWeight: 400, color: '#5F6368', fontSize: '0.8rem' }}>· Farmer AI</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  stopListening();
                  stopSpeaking();
                  setIsOpen(false);
                }}
                style={{
                  background: '#F1F3F4',
                  border: 'none',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  color: '#5F6368',
                }}
                title="Close Voice Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 3-Language Switcher (Telugu, English, Hindi) */}
          <div style={{
            padding: '0.5rem 1.25rem',
            background: '#F8F9FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F3F4'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#5F6368' }}>
              🌐 Language:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'Te', label: 'తెలుగు (Telugu)' },
                { key: 'En', label: 'English' },
                { key: 'Hi', label: 'हिन्दी (Hindi)' },
              ].map(lang => (
                <button
                  key={lang.key}
                  id={`voice-lang-${lang.key.toLowerCase()}`}
                  onClick={() => {
                    setLanguage(lang.key);
                    const newGreeting = VOICE_KNOWLEDGE[lang.key].greeting;
                    setAssistantReply(newGreeting);
                    speakText(newGreeting, lang.key);
                  }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: language === lang.key ? 700 : 500,
                    background: language === lang.key ? '#4285F4' : '#FFFFFF',
                    color: language === lang.key ? '#FFFFFF' : '#3C4043',
                    border: language === lang.key ? '1px solid #4285F4' : '1px solid #DADCE0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Voice Display & Dialogue Area */}
          <div style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '320px',
            overflowY: 'auto',
          }}>
            {/* Live Audio Equalizer Wave when Listening / Speaking */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '36px',
              padding: '4px 0',
            }}>
              {[
                { color: '#4285F4', h1: '12px', h2: '32px', delay: '0s' },
                { color: '#EA4335', h1: '16px', h2: '36px', delay: '0.15s' },
                { color: '#FBBC05', h1: '20px', h2: '30px', delay: '0.3s' },
                { color: '#34A853', h1: '14px', h2: '34px', delay: '0.45s' },
              ].map((bar, i) => (
                <span
                  key={i}
                  style={{
                    width: '6px',
                    borderRadius: '4px',
                    background: bar.color,
                    height: (isListening || isSpeaking) ? bar.h2 : '8px',
                    animation: (isListening || isSpeaking) ? `googleWave 0.8s ${bar.delay} infinite ease-in-out alternate` : 'none',
                    transition: 'height 0.2s ease',
                  }}
                />
              ))}
            </div>

            {/* Status Text */}
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: isListening ? '#1A73E8' : '#5F6368', fontWeight: 600 }}>
              {isListening
                ? VOICE_KNOWLEDGE[language].listening
                : isSpeaking
                ? '🔊 Speaking...'
                : 'Tap microphone to speak or choose a topic'}
            </div>

            {/* User Speech Transcript */}
            {transcript && (
              <div style={{
                alignSelf: 'flex-end',
                background: '#E8F0FE',
                color: '#1967D2',
                padding: '0.6rem 0.9rem',
                borderRadius: '16px 16px 4px 16px',
                fontSize: '0.84rem',
                fontWeight: 500,
                maxWidth: '85%',
              }}>
                🗣️ "{transcript}"
              </div>
            )}

            {/* Assistant Response Card */}
            {assistantReply && (
              <div style={{
                alignSelf: 'flex-start',
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                padding: '0.75rem 1rem',
                borderRadius: '16px 16px 16px 4px',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                color: '#202124',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                maxWidth: '92%',
                whiteSpace: 'pre-line'
              }}>
                {assistantReply}

                {/* Speech audio controls */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #F1F3F4' }}>
                  {isSpeaking ? (
                    <button
                      onClick={stopSpeaking}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: '#FCE8E6', color: '#D93025', border: 'none',
                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', cursor: 'pointer'
                      }}
                    >
                      ⏹️ Stop Voice
                    </button>
                  ) : (
                    <button
                      onClick={() => speakText(assistantReply, language)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: '#E8F0FE', color: '#1A73E8', border: 'none',
                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', cursor: 'pointer'
                      }}
                    >
                      🔊 Replay Voice
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Suggestion Chips */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#80868B', marginBottom: '6px', fontWeight: 600 }}>
                💡 Suggested Questions:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {VOICE_KNOWLEDGE[language].suggestions.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(prompt)}
                    style={{
                      background: '#F1F3F4',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '14px',
                      fontSize: '0.75rem',
                      color: '#3C4043',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#E8EAED'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F1F3F4'}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action Footer with Mic Button */}
          <div style={{
            padding: '0.75rem 1.25rem 1rem',
            borderTop: '1px solid #F1F3F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#5F6368' }}>
              Works across the whole website
            </div>

            {/* Central Mic Button */}
            <button
              id="google-assistant-mic-btn"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
              }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isListening
                  ? 'linear-gradient(135deg, #EA4335, #D93025)'
                  : 'linear-gradient(135deg, #4285F4, #34A853)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '1.3rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening
                  ? '0 0 0 6px rgba(234, 67, 53, 0.25), 0 4px 12px rgba(234, 67, 53, 0.4)'
                  : '0 4px 12px rgba(66, 133, 244, 0.35)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isListening ? 'micPulse 1.2s infinite' : 'none',
              }}
              title={isListening ? 'Tap to Stop Listening' : 'Tap to Speak'}
            >
              {isListening ? '⏹️' : '🎙️'}
            </button>
          </div>
        </div>
      )}

      {/* Google Assistant Animations */}
      <style>{`
        @keyframes googleDotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        @keyframes googleWave {
          0% { height: 10px; }
          100% { height: 32px; }
        }
        @keyframes micPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes googleAssistantOpen {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
