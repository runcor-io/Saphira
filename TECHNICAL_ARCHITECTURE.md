# Saphira Interview System - Technical Architecture Analysis

**Generated:** March 2026  
**Purpose:** Complete technical breakdown of the interview system architecture

---

## Table of Contents

1. [Interview Flow](#1-interview-flow)
2. [AI Model Usage](#2-ai-model-usage)
3. [Panelist Architecture](#3-panelist-architecture)
4. [Conversation Memory](#4-conversation-memory)
5. [Question Generation](#5-question-generation)
6. [Panel Interaction Logic](#6-panel-interaction-logic)
7. [Voice System](#7-voice-system)
8. [Country Dataset Integration](#8-country-dataset-integration)
9. [Weaknesses in Current Architecture](#9-weaknesses-in-the-current-architecture)
10. [Current User Experience](#10-current-user-experience)

---

## 1. Interview Flow

### Step-by-Step Flow:

#### A. User Clicks "Start Interview"
```typescript
startInterview() function in page.tsx (line 631)
```

#### B. What Happens:

**1. Custom Panel Setup** (if using custom panelists)
- Maps user-configured panelists to PanelMember objects
- Assigns voice IDs based on gender
- Determines personality from slider values

**2. Session Context Building**
- Creates `sessionContext` object with useCase-specific fields
- Example for business_pitch: `startupName`, `industry`, `fundingStage`
- Example for job_interview: `jobRole`, `company`

**3. Session Creation** (`createSession()` in panelEngine.ts, line 27)
```typescript
createSession(selectedType, sessionContext)
```
- Generates unique session ID
- Loads default panel from useCaseConfigs
- Sets max questions from config
- Initializes empty messages array

**4. Start Session** (`startSession()` in panelEngine.ts)
- Calls `generatePanelIntroductions()` - creates static intro messages
- Each panelist introduces themselves with useCase-specific greetings
- Example: "Good morning. You have 10 minutes for your pitch. I'm Chief Okafor..."

**5. Voice Playback Sequence**
```typescript
speakNext() function (line 713)
```
- Iterates through intro messages
- Calls `speakText()` for each message
- Updates `personas.speaking` state for UI animation
- Sequential playback (waits for each to finish)

**6. Start Listening** (`startListening()`, line 491)
- Initializes Web Speech API (webkitSpeechRecognition)
- Sets `recognition.continuous = true`
- Sets `recognition.interimResults = true`
- Begins listening for user speech

#### C. User Speaks → Response Generated

**1. Speech Captured**
- `recognition.onresult` collects transcript
- `finalTranscriptRef` accumulates final results
- `liveTranscript` state updates UI in real-time

**2. User Stops Speaking** (clicks "Stop Speaking" or silence detected)
- `stopListening()` sets `isManuallyStoppedRef = true`
- Recognition stops, `onend` event fires
- `handleCandidateResponse(text)` called with transcript

**3. Response Processing** (`handleCandidateResponse`, line 345)
```typescript
// 1. Determine interview phase
const phase = determinePhase(sessionWithUserMessage);
// opening → exploration → pressure → closing

// 2. Determine sector context
const sector = determineSector(topic, company);

// 3. Generate AI response
const result = await generateImmersiveResponse(
  sessionWithUserMessage,
  text,
  { topic, sector, seniority: 'mid', tone, currentPhase: phase }
);
```

**4. AI Response Generated** (immersiveEngine.ts, line 365)
- Builds system prompt with cultural context
- Builds conversation context (last 8 messages)
- Selects which panelist speaks (`selectNextSpeaker`)
- Calls OpenAI API via `/api/saphira/generate`
- Validates response (checks if contextual)
- Returns messages array with 1-3 messages (main + side remarks)

**5. Feedback Generated** (async, non-blocking)
- Calls `generateFeedback()` with last question + user response
- Displays feedback popup with score, strengths, improvements

**6. Voice Playback** (line 451)
```typescript
for (const message of result.messages) {
  await speakText(message.text, member);
  await delay(300-600ms);
}
```
- Sequential playback with delays
- Updates UI speaking states

**7. Restart Listening** (line 473)
- `setTimeout(() => startListening(), 200)`
- Loop continues until interview complete

#### D. Interview Ends
- Either: User clicks "End Session"
- Or: `result.isComplete = true` (AI signals end)
- `generateSessionSummary()` creates final report
- UI switches to summary view

---

## 2. AI Model Usage

### Model: **GPT-4o**

```typescript
// app/api/saphira/generate/route.ts (line 24-33)
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  response_format: { type: 'json_object' },
  temperature: 0.7,
  max_tokens: 500,
});
```

### System Prompt Structure:

```typescript
// buildImmersiveSystemPrompt() in immersiveEngine.ts (line 237)

`You are an AI panel of ${session.panel.length} interviewers conducting a ${useCase} in ${country}.

## ⚠️ CRITICAL: THIS IS A ${useCase.toUpperCase()} - ACT ACCORDINGLY
${useCaseConfig}  // <-- Use-case specific instructions (e.g., "NEVER ask job questions")

## YOUR PANEL MEMBERS
1. ${member.name} - ${member.role} (${personality})
   Role: Lead interviewer / Panel member

## CULTURAL CONTEXT
${culturalContext}  // <-- From verified dataset (Nigeria/Kenya/SA)

## COMMUNICATION STYLE
${toneGuide}  // <-- Pidgin phrases, fillers, local expressions

## INTERVIEW PHASE: ${phase}
## SECTOR CONTEXT
## CRITICAL INSTRUCTION: RESPOND TO WHAT THE CANDIDATE ACTUALLY SAID
## EXAMPLES OF GOOD CONTEXTUAL FOLLOW-UPS
## CONVERSATION DYNAMICS
## RESPONSE TYPES
## AUTHENTIC PATTERNS
## RULES`
```

### User Prompt Structure:

```typescript
// generateImmersiveResponse() in immersiveEngine.ts (line 385-402)

`## YOUR ROLE
You are ${speakingMember.name}, ${speakingMember.role}.
Context: ${useCaseConfig}

## CONVERSATION HISTORY
CONVERSATION HISTORY (last 8 exchanges):
Panelist: "..."
Candidate: "..."
=== CANDIDATE JUST SAID ===
"${candidateResponse}"
=== END ===

RESPONSE ANALYSIS:
- Confidence: medium/10
- ✗ Lacks specific example - ASK FOR ONE
- Word count: 45

YOUR STRATEGY:
- Candidate was vague. Ask for a SPECIFIC example.

## EXAMPLES OF APPROPRIATE QUESTIONS FOR THIS CONTEXT:
- "What's your business model? How do you make money?"
- "How many customers do you currently have?"

## YOUR TASK
The candidate just said: "${candidateResponse}"

Respond naturally as ${speakingMember.name}. Pick ONE specific thing they mentioned and ask about it.

Respond as ${speakingMember.name}:`
```

### Response Structure:
```typescript
// API returns:
{
  text: string,              // The panelist's spoken response
  isQuestion: boolean,       // true/false
  suggestedFollowUp?: string, // Not currently used
  culturalAdaptation?: string, // Not currently used
  tone: string,              // Not currently used
  useCase: UseCase,
  panelMemberId: string,
}
```

---

## 3. Panelist Architecture

### Key Finding: **Single AI Model, Simulated Multiple Panelists**

**There is NOT multiple AI agents. It's ONE GPT-4o call that generates ONE response per turn.**

### How Panelists Are Implemented:

#### A. Panelist Definition (useCaseConfigs.ts, line 19-120)
```typescript
const DEFAULT_PANELS: Record<UseCase, PanelMember[]> = {
  business_pitch: [
    {
      id: 'investor-1',
      name: 'Chief Okafor',
      role: 'Lead Investor',
      personality: 'direct',
      voiceId: NIGERIAN_VOICES.male3,  // 'tj0Lij6AHHeCO5FylYzu'
      focus: 'business_model',
      gender: 'male',
    },
    {
      id: 'investor-2',
      name: 'Mrs. Adebayo',
      role: 'CFO',
      personality: 'analytical',
      voiceId: NIGERIAN_VOICES.female1,  // 'Y4Xi1YBz9HedbrvzwylK'
      focus: 'financials',
      gender: 'female',
    },
    // ... etc
  ]
}
```

#### B. Panelist Selection (`selectNextSpeaker`, line 531)
```typescript
function selectNextSpeaker(session, context): PanelMember {
  const weights = panel.map((member, index) => {
    let weight = 1;
    
    // Lead interviewer speaks more often
    if (index === 0) weight += 2;
    
    // Don't let same person speak twice in a row
    if (member.id === lastSpeaker) weight *= 0.2;
    
    // Match personality to phase
    if (context.currentPhase === 'pressure' && member.personality === 'strict') weight += 1;
    if (context.currentPhase === 'opening' && member.personality === 'supportive') weight += 1;
    
    return { member, weight };
  });
  
  // Weighted random selection
  const random = Math.random() * totalWeight;
  // ... select based on weights
}
```

#### C. Simulation Method
1. System prompt lists ALL panel members with their personalities
2. ONE specific panelist is selected by `selectNextSpeaker()`
3. User prompt says: "You are [Selected Panelist Name], [Role]"
4. GPT-4o generates response AS that persona
5. Response tagged with that panelist's ID for voice mapping

#### D. Panelist "Independence" is Illusion
- Only ONE panelist "speaks" per turn
- No actual multi-agent conversation
- "Panel interactions" are simulated (30% chance of adding side remark from another panelist as separate API call or hardcoded)

---

## 4. Conversation Memory

### Structure:
```typescript
// SaphiraSession (types.ts, line 106-121)
interface SaphiraSession {
  id: string;
  useCase: UseCase;
  messages: SaphiraMessage[];  // <-- Full conversation history
  questionsAsked: string[];     // <-- Track asked questions
  culturalContexts: CulturalContext[];
  currentPanelIndex: number;
  questionCount: number;
  // ...
}

// SaphiraMessage (types.ts, line 126-142)
interface SaphiraMessage {
  id: string;
  sender: 'interviewer' | 'candidate' | 'panel-member';
  panelMemberId?: string;  // Which panelist spoke
  text: string;
  timestamp: Date;
  isQuestion: boolean;
  feedback?: QuestionFeedback;
  isReaction?: boolean;
  isPanelInteraction?: boolean;
  isSideRemark?: boolean;
}
```

### Memory Passing to AI:

```typescript
// buildConversationContext() in immersiveEngine.ts (line 323-359)

function buildConversationContext(session, lastCandidateResponse) {
  // ONLY LAST 8 MESSAGES
  const recentMessages = session.messages.slice(-8);
  
  let context = `CONVERSATION HISTORY (last ${recentMessages.length} exchanges):\n\n`;
  
  recentMessages.forEach((msg) => {
    if (msg.sender === 'panel-member') {
      const member = session.panel.find(m => m.id === msg.panelMemberId);
      context += `${member?.name || 'Panelist'}: "${msg.text}"\n`;
    } else if (msg.sender === 'candidate') {
      context += `Candidate: "${msg.text}"\n`;
    }
  });
  
  // Plus the latest candidate response
  context += `\n=== CANDIDATE JUST SAID ===\n"${lastCandidateResponse}"\n`;
}
```

### Key Limitations:
- **Truncated Memory**: Only last 8 messages sent to AI (not full conversation)
- **No Persistent Storage**: Session exists only in React state (lost on refresh)
- **No Long-term Context**: Earlier conversation details forgotten by AI

---

## 5. Question Generation

### Method: **Dynamic Generation (NOT from dataset)**

```typescript
// generateImmersiveResponse() in immersiveEngine.ts (line 365-413)

const response = await fetch('/api/saphira/generate', {
  body: JSON.stringify({
    systemPrompt,  // <-- Rich context
    userPrompt,    // <-- Conversation history + instructions
    useCase,
    panelMemberId,
  }),
});
```

### How Questions Are Generated:

1. **AI Generates Dynamically**: GPT-4o creates questions based on:
   - System prompt instructions
   - Conversation context
   - Use case configuration
   - Response analysis (vague → ask for specifics)

2. **No Dataset Selection**: Questions are NOT selected from the Nigeria/Kenya/SA datasets
   - The datasets provide cultural context/tone only
   - Actual questions are LLM-generated

3. **Follow-up Logic** (intended but weak):
   ```typescript
   // Response analysis guides follow-up
   const analysis = analyzeResponse(candidateResponse, country);
   // - If vague → "Ask for specific example"
   // - If no numbers → "Ask for metrics"
   ```

4. **Validation Layer** (line 422-431):
   ```typescript
   const validation = validateResponse(generatedText, candidateResponse, useCase);
   if (!validation.isValid) {
     // Replace with fallback question
     generatedText = await generateContextualFallback(...);
   }
   ```

---

## 6. Panel Interaction Logic

### Speaker Selection (`selectNextSpeaker`, line 531-570):

```typescript
function selectNextSpeaker(session, context): PanelMember {
  const panel = session.panel;
  const lastMessages = session.messages.slice(-3);
  const lastSpeaker = lastMessages
    .reverse()
    .find(m => m.sender === 'panel-member')?.panelMemberId;
  
  // Weighted random selection
  const weights = panel.map((member, index) => {
    let weight = 1;
    
    // Lead interviewer speaks more often
    if (index === 0) weight += 2;
    
    // Penalize same speaker
    if (member.id === lastSpeaker) weight *= 0.2;
    
    // Phase-based personality matching
    if (context.currentPhase === 'pressure' && member.personality === 'strict') weight += 1;
    if (context.currentPhase === 'opening' && member.personality === 'supportive') weight += 1;
    
    return { member, weight };
  });
  
  // Weighted random choice
  // ...
}
```

### Turn System:
- **NOT Round-Robin**: Not everyone speaks in order
- **Weighted Random**: Lead speaks more, others less
- **One Speaker Per Turn**: Only ONE panelist generates a response per user answer
- **Side Remarks** (simulated):
  ```typescript
  // 30% chance of side remark
  if (Math.random() < 0.3 && session.panel.length > 1) {
    const sideRemark = await generateSideRemark(...);
    messages.push(sideRemark);
  }
  ```

---

## 7. Voice System

### Architecture:

#### A. Voice Mapping (hardcoded in panel configs):
```typescript
// useCaseConfigs.ts
const NIGERIAN_VOICES = {
  male1: 'U7wWSnxIJwCjioxt86mk',   // Olaniyi Victor
  male2: '77aEIu0qStu8Jwv1EdhX',   // Ayinde
  male3: 'tj0Lij6AHHeCO5FylYzu',   // Chief Okafor
  female1: 'Y4Xi1YBz9HedbrvzwylK', // Nigerian Female
};

// Each panelist has voiceId assigned
{
  name: 'Chief Okafor',
  voiceId: NIGERIAN_VOICES.male3,
}
```

#### B. Text-to-Speech Flow (page.tsx, line 322-356):
```typescript
const speakWithElevenLabs = async (text: string, voiceId: string, onEnd?: () => void) => {
  const response = await fetch('/api/voice', {
    method: 'POST',
    body: JSON.stringify({ text, voiceId }),
  });
  
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  audioRef.current.src = audioUrl;
  await audioRef.current.play();
};
```

#### C. API Route (app/api/voice/route.ts):
```typescript
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
  },
  body: JSON.stringify({
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  }),
});
```

#### D. Sequential Playback:
```typescript
// Messages spoken ONE AT A TIME
for (const message of result.messages) {
  await new Promise<void>(resolve => speakText(message.text, member, resolve));
  await delay(300-500ms);  // Pause between speakers
}
```

#### E. Browser Fallback:
```typescript
const speakWithBrowserVoice = (text: string, onEnd?: () => void) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};
```

---

## 8. Country Dataset Integration

### Dataset Structure:
```typescript
// verifiedDataset.ts

const DATASETS: Record<Country, CountryDataset> = {
  nigeria: nigeriaData,
  kenya: kenyaData,
  south_africa: saData,
};

interface CountryDataset {
  cultural_context: {
    communication_style: string;
    key_values: string[];
    language_markers: Record<string, string>;
    conversational_fillers: string[];
  };
  company_specific: Record<string, CompanyData>;
  question_bank?: { categories: Record<string, any[]> };
}
```

### How Country Influences Interview:

#### A. Cultural Context in System Prompt (line 258-261):
```typescript
const culturalContext = getCulturalContext(country);
const toneGuide = getToneGuide(country);

return `...
## CULTURAL CONTEXT
${culturalContext}

## COMMUNICATION STYLE
${toneGuide}
...`
```

#### B. Example - Nigeria Cultural Context:
```typescript
// From nigeria_real_verified.json
{
  "cultural_context": {
    "communication_style": "Respectful but direct...",
    "key_values": ["respect", "hierarchy", "community"],
    "language_markers": {
      "honorifics": ["Sir", "Ma", "Chief"],
      "respectful_phrases": ["With respect", "If I may"],
      "fillers": ["You see", "Actually", "The thing is"]
    },
    "conversational_fillers": ["You see", "Actually", "The thing is", "Look"]
  }
}
```

#### C. Actual Usage - Questions NOT from Dataset:
- ❌ Questions are **NOT** selected from country datasets
- ✅ Country data provides **tone/phrasing guidance** to AI
- ✅ Questions are dynamically generated by GPT-4o with cultural "flavor"

#### D. Company-Specific Questions (partially implemented):
```typescript
// Company questions ARE loaded from dataset
const companyData = getCompanyData(company, country);
// But used only for context, not directly asked
```

---

## 9. Weaknesses in the Current Architecture

### 🔴 MAJOR WEAKNESSES:

#### 1. **Single AI Agent (Not True Multi-Agent)**
- One GPT-4o call per turn
- Panelists don't actually "converse" with each other
- No independent agent memory per panelist
- "Panel interactions" are fake (just added as separate messages)

#### 2. **Truncated Conversation Memory**
- Only last 8 messages passed to AI
- Early conversation context lost
- AI forgets what was discussed 10 turns ago

#### 3. **Weak Follow-up Logic**
- Validation exists but is regex-based (fragile)
- AI frequently ignores instructions
- "Contextual" questions often generic
- No true understanding of candidate's business

#### 4. **No Role-Based Questioning**
- CFO should ask financial questions
- CTO should ask technical questions
- Currently: Random panelist asks random question
- `focus` field exists but NOT used in prompting

#### 5. **Static Question Flow**
- No branching logic based on answers
- Same flow regardless of response quality
- No depth drilling (e.g., "You said X, elaborate")

#### 6. **Dataset Underutilization**
- Real interview questions exist in datasets
- NOT used for question selection
- Only used for cultural "flavor"
- Wasted verified question bank

#### 7. **No Persistent Session Storage**
- Refresh = lose interview
- No analytics/tracking
- Can't review past interviews

#### 8. **Feedback is Generic**
- Generated separately from conversation
- Not integrated into panelist responses
- Panelists don't reference feedback

### 🟡 MINOR WEAKNESSES:

#### 9. **Hardcoded Voice Mapping**
- Only 4 Nigerian voices
- No Kenya/SA specific voices
- Gender mapping simplistic

#### 10. **No Difficulty Progression**
- Questions don't get harder
- No adaptation to candidate skill level

---

## 10. Current User Experience

### What User Actually Experiences:

#### Setup Phase:
1. Select interview type (Business Pitch)
2. Enter details (Startup name: Runcorp, Industry: Computing)
3. Click "Start Interview"

#### Opening Phase:
4. Chief Okafor introduces: "Good morning. You have 10 minutes..."
5. Mrs. Adebayo introduces: "I'm Mrs. Adebayo, CFO"
6. Engr. Nnamdi introduces: "I'm Engr. Nnamdi, Technical Advisor"
7. Chief Okafor: "Please start by telling us about yourself..."

#### User Response:
8. User clicks "Start Speaking"
9. Browser mic activates
10. User speaks: "Hello, I'm Ridwan, founder of Runcorp..."
11. User clicks "Stop Speaking"

#### Behind the Scenes:
12. Transcript sent to `handleCandidateResponse()`
13. `generateImmersiveResponse()` called
14. System prompt built (with useCase, cultural context)
15. GPT-4o API called
16. Response received: "Walk me through your experience"
17. **Validation check**: ❌ FAILS (too generic)
18. **Fallback triggered**: "You mentioned Runcorp. How do you make money?"
19. Response sent to ElevenLabs API
20. Audio generated and played

#### UI Updates:
21. VoiceOrb animates for speaking panelist
22. Transcript appears in conversation panel
23. Feedback popup appears (score: 5/10)
24. "Start Speaking" button reappears

#### User Experience:
25. User hears question
26. User clicks "Start Speaking"
27. **Repeat loop** (steps 9-26)

#### End:
28. After ~10 questions, AI signals `isComplete`
29. Summary screen appears with score, strengths, improvements

### What's Actually Happening (Behind the Curtain):
- ❌ Panelists are NOT real agents discussing candidate
- ❌ Questions are NOT from real interview datasets
- ✅ GPT-4o generates questions on-the-fly
- ✅ Single AI pretending to be multiple people
- ✅ Cultural context added as "flavor text"
- ✅ Voices are ElevenLabs Nigerian voices
- ✅ Conversation truncated to last 8 exchanges

---

## Summary

This architecture is a **sophisticated simulation** rather than true multi-agent AI. The "panel" is theatrical - one AI wearing different masks. The country datasets provide cultural seasoning but don't drive the core question selection.

### Key Files:
- `frontend/lib/saphira/immersiveEngine.ts` - Core AI generation logic
- `frontend/lib/saphira/useCaseConfigs.ts` - Panel definitions
- `frontend/lib/saphira/verifiedDataset.ts` - Country cultural data
- `frontend/app/(dashboard)/saphira-interview/page.tsx` - UI and orchestration
- `frontend/app/api/saphira/generate/route.ts` - OpenAI API route
- `frontend/app/api/voice/route.ts` - ElevenLabs voice API
