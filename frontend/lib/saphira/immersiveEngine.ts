/**
 * Saphira Immersive Panel Engine
 * Creates a truly realistic interview experience with:
 * - All panelists actively participating
 * - Dynamic contextual follow-ups
 * - Natural reactions and side remarks
 * - Panelist-to-panelist interactions
 * - Real-time conversation adaptation
 */

import { 
  SaphiraSession, 
  SaphiraMessage, 
  PanelMember,
  UseCase,
  CulturalContext,
  ResponseAnalysis 
} from './types';
import { getToneGuide, getCulturalContext, Country } from './verifiedDataset';
import { analyzeResponse } from './culturalDetector';
import { generatePanelInteraction, selectSpeakingMember } from './panelInteraction';

interface ConversationContext {
  topic: string;
  sector?: string;
  seniority: 'entry' | 'mid' | 'senior';
  tone: 'formal' | 'warm' | 'challenging';
  currentPhase: 'opening' | 'exploration' | 'pressure' | 'closing';
}

interface PanelDynamic {
  lastSpeaker: PanelMember | null;
  speakingOrder: PanelMember[];
  reactionsPending: Array<{
    member: PanelMember;
    type: 'agreement' | 'concern' | 'surprise' | 'skepticism';
    targetText: string;
  }>;
}

/**
 * Build rich system prompt for GPT that includes dataset context
 */
function buildImmersiveSystemPrompt(
  session: SaphiraSession,
  context: ConversationContext
): string {
  const country = session.country || 'nigeria';
  const toneGuide = getToneGuide(country);
  const culturalContext = getCulturalContext(country);
  
  return `You are an AI panel of ${session.panel.length} interviewers conducting a ${context.seniority}-level ${session.useCase.replace('_', ' ')} in ${country === 'nigeria' ? 'Nigeria' : country === 'kenya' ? 'Kenya' : 'South Africa'}.

## YOUR PANEL MEMBERS
${session.panel.map((m, i) => `${i + 1}. ${m.name} - ${m.role} (${m.personality})
   Voice: ${m.voiceId ? 'Has assigned voice' : 'Default'}
   Role in panel: ${i === 0 ? 'Lead interviewer' : 'Panel member'}`).join('\n')}

## CULTURAL CONTEXT
${culturalContext}

## COMMUNICATION STYLE
${toneGuide}

## INTERVIEW PHASE: ${context.currentPhase.toUpperCase()}
- Opening: Build rapport, warm welcome, initial introductions
- Exploration: Deep dive into experience, probing questions
- Pressure: Challenge weak answers, test under stress
- Closing: Final questions, next steps, thank you

## SECTOR CONTEXT
${context.sector ? `This is for the ${context.sector} sector. Use appropriate terminology and concerns.` : 'General professional interview'}

## CONVERSATION DYNAMICS
You are NOT a single interviewer. You are a PANEL:
- Multiple perspectives: technical, HR, cultural fit
- Panelists react to EACH OTHER'S questions and reactions
- Side comments between panelists happen naturally
- Sometimes one panelist picks up where another left off
- Disagreements or differing perspectives are natural
- Non-verbal reactions: nods, raised eyebrows, note-taking

## RESPONSE TYPES (mix naturally)
1. **Direct Questions** - "Tell me about..."
2. **Follow-ups** - "You mentioned X, elaborate on that"
3. **Probes** - "Why is that?" / "How do you mean?"
4. **Challenges** - "That seems unlikely..." / "Are you sure?"
5. **Reactions** - "Interesting..." / "I see..." / Brief pause
6. **Panel Interactions** - "Chief, you wanted to ask about..." / "Building on what ${session.panel[0]?.name} said..."
7. **Side Remarks** - Brief comments to other panelists (candidate hears these)

## AUTHENTIC PATTERNS
- Use fillers naturally: "You see", "Actually", "The thing is"
- Show thoughtfulness with pauses
- Code-switch when appropriate (e.g., Pidgin for rapport in Nigeria)
- Reference local context: traffic, infrastructure, cultural norms
- Ask about: CGPA (Nigeria), BEE (SA), Harambee (Kenya)

## RULES
1. Generate ONE response at a time from ONE panelist
2. Include natural reaction time indicators: [pause], [shuffles papers], [nods]
3. Panelists can address each other by name
4. Sometimes panelist asks follow-up to their own question
5. Vary response length: sometimes brief (1 sentence), sometimes detailed
6. React to candidate's energy: match their professionalism level`;
}

/**
 * Build conversation context for GPT
 */
function buildConversationContext(
  session: SaphiraSession,
  lastCandidateResponse: string
): string {
  const recentMessages = session.messages.slice(-8);
  
  let context = `CONVERSATION HISTORY (last ${recentMessages.length} exchanges):\n\n`;
  
  recentMessages.forEach((msg, idx) => {
    if (msg.sender === 'panel-member') {
      const member = session.panel.find(m => m.id === msg.panelMemberId);
      context += `${member?.name || 'Panelist'}: "${msg.text}"\n`;
    } else if (msg.sender === 'candidate') {
      context += `Candidate: "${msg.text}"\n`;
    }
  });
  
  context += `\nCANDIDATE JUST SAID:\n"${lastCandidateResponse}"\n`;
  
  // Add analysis context
  const analysis = analyzeResponse(lastCandidateResponse, session.country || 'nigeria');
  context += `\nRESPONSE ANALYSIS:
- Confidence: ${analysis.confidenceLevel}/10
- ${analysis.hasSpecificExample ? '✓ Has specific example' : '✗ Lacks specific example'}
- ${analysis.hasNumbers ? '✓ Uses numbers/metrics' : '✗ No quantified achievements'}
- ${analysis.answeredDirectly ? '✓ Answered directly' : '⚠ May be evasive'}
- Word count: ${analysis.wordCount}
${analysis.usesPidgin ? '- Uses local dialect/pidgin' : ''}
${analysis.religiousReferences.length > 0 ? `- Religious references: ${analysis.religiousReferences.join(', ')}` : ''}`;

  return context;
}

/**
 * Generate immersive panel response with full panel dynamics
 */
export async function generateImmersiveResponse(
  session: SaphiraSession,
  candidateResponse: string,
  context: ConversationContext
): Promise<{
  messages: SaphiraMessage[];
  speakingMember: PanelMember;
  isComplete: boolean;
}> {
  const systemPrompt = buildImmersiveSystemPrompt(session, context);
  const conversationContext = buildConversationContext(session, candidateResponse);
  
  // Select which panelist speaks (not always the same person)
  const speakingMember = selectNextSpeaker(session, context);
  
  const prompt = `${systemPrompt}

${conversationContext}

INSTRUCTIONS FOR NEXT RESPONSE:
You are ${speakingMember.name}, ${speakingMember.role}.
Your personality: ${speakingMember.personality}

Generate ONE of these (choose naturally based on conversation flow):
1. A direct question or follow-up
2. A reaction with brief comment  
3. A challenge to something the candidate said
4. A comment to another panelist about the candidate's answer
5. A request for clarification/elaboration

Guidelines:
- Keep it conversational and natural
- React to what was ACTUALLY said (don't ignore content)
- If candidate was vague, press for specifics
- If candidate was strong, acknowledge it then ask deeper question
- If another panelist should chime in, reference them
- Include [pause] or [action] markers for natural pacing
- Length: 1-3 sentences typically, occasionally longer

Respond as ${speakingMember.name}:`;

  try {
    const response = await fetch('/api/saphira/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        userPrompt: prompt,
        useCase: session.useCase,
        panelMemberId: speakingMember.id,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate response');
    
    const data = await response.json();
    const generatedText = data.text;
    
    // Check if this signals interview completion
    const isComplete = checkForCompletion(generatedText);
    
    // Create the main message
    const mainMessage: SaphiraMessage = {
      id: generateMessageId(),
      sender: 'panel-member',
      panelMemberId: speakingMember.id,
      text: generatedText,
      timestamp: new Date(),
      isQuestion: isQuestion(generatedText),
    };
    
    const messages: SaphiraMessage[] = [mainMessage];
    
    // 30% chance: Add a side remark from another panelist
    if (Math.random() < 0.3 && session.panel.length > 1) {
      const sideRemark = await generateSideRemark(session, speakingMember, generatedText);
      if (sideRemark) {
        messages.push(sideRemark);
      }
    }
    
    // 20% chance: Add brief panel interaction
    if (Math.random() < 0.2 && session.panel.length > 1) {
      const interaction = await generateBriefInteraction(session, speakingMember);
      if (interaction) {
        messages.push(interaction);
      }
    }
    
    return {
      messages,
      speakingMember,
      isComplete,
    };
    
  } catch (error) {
    console.error('[ImmersiveEngine] Error:', error);
    return generateFallbackResponse(session, speakingMember, context);
  }
}

/**
 * Select which panelist speaks next based on conversation flow
 */
function selectNextSpeaker(
  session: SaphiraSession,
  context: ConversationContext
): PanelMember {
  const panel = session.panel;
  const lastMessages = session.messages.slice(-3);
  const lastSpeaker = lastMessages
    .reverse()
    .find(m => m.sender === 'panel-member')?.panelMemberId;
  
  // Lead interviewer speaks more often
  const weights = panel.map((member, index) => {
    let weight = 1;
    
    // Lead interviewer has higher chance
    if (index === 0) weight += 2;
    
    // Don't let same person speak twice in a row usually
    if (member.id === lastSpeaker) weight *= 0.2;
    
    // Match personality to phase
    if (context.currentPhase === 'pressure' && member.personality === 'strict') weight += 1;
    if (context.currentPhase === 'opening' && member.personality === 'supportive') weight += 1;
    
    return { member, weight };
  });
  
  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { member, weight } of weights) {
    random -= weight;
    if (random <= 0) return member;
  }
  
  return panel[0];
}

/**
 * Generate a side remark from another panelist
 */
async function generateSideRemark(
  session: SaphiraSession,
  mainSpeaker: PanelMember,
  mainText: string
): Promise<SaphiraMessage | null> {
  const otherPanelists = session.panel.filter(m => m.id !== mainSpeaker.id);
  if (otherPanelists.length === 0) return null;
  
  const speaker = otherPanelists[Math.floor(Math.random() * otherPanelists.length)];
  
  const remarks = [
    `[nods thoughtfully]`,
    `[makes a note]`,
    `[exchanges glance with ${mainSpeaker.name.split(' ')[0]}]`,
    `Mmm...`,
    `Interesting...`,
    `[leans forward slightly]`,
    session.country === 'nigeria' ? `Okay, that's good.` : '',
    session.country === 'kenya' ? `I see...` : '',
    session.country === 'south_africa' ? `Right...` : '',
  ].filter(Boolean);
  
  const remark = remarks[Math.floor(Math.random() * remarks.length)];
  
  return {
    id: generateMessageId(),
    sender: 'panel-member',
    panelMemberId: speaker.id,
    text: remark,
    timestamp: newDate(),
    isQuestion: false,
    isSideRemark: true,
  };
}

/**
 * Generate brief panel-to-panel interaction
 */
async function generateBriefInteraction(
  session: SaphiraSession,
  currentSpeaker: PanelMember
): Promise<SaphiraMessage | null> {
  const otherPanelists = session.panel.filter(m => m.id !== currentSpeaker.id);
  if (otherPanelists.length === 0) return null;
  
  const responder = otherPanelists[Math.floor(Math.random() * otherPanelists.length)];
  
  const interactions = [
    `${responder.name.split(' ')[0]}: "I was about to ask that same thing."`,
    `${responder.name.split(' ')[0]}: "Building on that point..."`,
    `${currentSpeaker.name.split(' ')[0]}: "${responder.name.split(' ')[0]}, did you want to add something?"`,
    `${responder.name.split(' ')[0]}: [nods] "Go on, please."`,
  ];
  
  return {
    id: generateMessageId(),
    sender: 'panel-member',
    panelMemberId: responder.id,
    text: interactions[Math.floor(Math.random() * interactions.length)],
    timestamp: new Date(),
    isQuestion: false,
    isPanelInteraction: true,
  };
}

/**
 * Check if response signals interview completion
 */
function checkForCompletion(text: string): boolean {
  const completionPhrases = [
    'thank you for your time',
    'we\'ll be in touch',
    'that concludes',
    'we\'re done here',
    'final question',
    'any questions for us',
  ];
  
  const lowerText = text.toLowerCase();
  return completionPhrases.some(phrase => lowerText.includes(phrase));
}

/**
 * Check if text is a question
 */
function isQuestion(text: string): boolean {
  return text.includes('?') || 
    /^(tell|explain|describe|elaborate|why|how|what|when|where)/i.test(text.trim());
}

/**
 * Generate fallback response if GPT fails
 */
function generateFallbackResponse(
  session: SaphiraSession,
  speaker: PanelMember,
  context: ConversationContext
): { messages: SaphiraMessage[]; speakingMember: PanelMember; isComplete: boolean } {
  const fallbacks: Record<ConversationContext['currentPhase'], string[]> = {
    opening: [
      "Tell me about your background.",
      "Walk me through your experience.",
      "Why are you interested in this role?",
    ],
    exploration: [
      "Can you give me a specific example?",
      "How did you handle that situation?",
      "What was the outcome?",
    ],
    pressure: [
      "Are you sure about that?",
      "That seems unlikely. Can you elaborate?",
      "What would you do differently?",
    ],
    closing: [
      "Do you have any questions for us?",
      "What are your salary expectations?",
      "Thank you for your time today.",
    ],
  };
  
  const options = fallbacks[context.currentPhase];
  const text = options[Math.floor(Math.random() * options.length)];
  
  return {
    messages: [{
      id: generateMessageId(),
      sender: 'panel-member',
      panelMemberId: speaker.id,
      text,
      timestamp: new Date(),
      isQuestion: true,
    }],
    speakingMember: speaker,
    isComplete: context.currentPhase === 'closing',
  };
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine interview phase based on progress
 */
export function determinePhase(session: SaphiraSession): ConversationContext['currentPhase'] {
  const questionCount = session.messages.filter(m => 
    m.sender === 'panel-member' && m.isQuestion
  ).length;
  
  if (questionCount < 2) return 'opening';
  if (questionCount < 6) return 'exploration';
  if (questionCount < 9) return 'pressure';
  return 'closing';
}

/**
 * Determine sector from topic/company
 */
export function determineSector(topic?: string, company?: string): string | undefined {
  const text = `${topic || ''} ${company || ''}`.toLowerCase();
  
  if (text.includes('bank') || text.includes('fintech') || text.includes('pay')) return 'Banking/Finance';
  if (text.includes('tech') || text.includes('software') || text.includes('developer')) return 'Technology';
  if (text.includes('tel') || text.includes('mtn') || text.includes('safaricom')) return 'Telecommunications';
  if (text.includes('energy') || text.includes('oil') || text.includes('power')) return 'Energy';
  if (text.includes('health') || text.includes('medical')) return 'Healthcare';
  
  return undefined;
}

export default {
  generateImmersiveResponse,
  determinePhase,
  determineSector,
};
