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
import { generatePanelInteraction } from './panelInteraction';

/**
 * Get useCase-specific instructions for the AI
 */
function getUseCaseSpecificPrompt(useCase: UseCase): string {
  switch (useCase) {
    case 'job_interview':
      return `You are interviewing a JOB CANDIDATE for a position at your company.
- Ask about their experience, skills, and fit for the ROLE
- Questions like "Why are you interested in this role?" and "Tell me about your experience" are APPROPRIATE here
- Focus on: qualifications, past achievements, cultural fit, salary expectations
- DO NOT ask about business models, funding, or investment returns`;

    case 'business_pitch':
      return `You are an INVESTOR PANEL listening to a STARTUP PITCH.
- The candidate is presenting their BUSINESS/STARTUP, not applying for a job
- NEVER ask "Why are you interested in this role?" - they are not applying for a job!
- APPROPRIATE questions: "What's your business model?", "How do you acquire customers?", "What are your revenue projections?", "Who are your competitors?", "How will you use the investment?"
- Focus on: traction, market size, revenue, team capability, use of funds, defensibility
- Challenge unrealistic projections and vague claims about market size`;

    case 'embassy_interview':
      return `You are a VISA OFFICER conducting an immigration interview.
- The applicant wants to travel to your country
- Focus on: purpose of travel, ties to home country, funding source, length of stay, return plans
- Look for signs of immigrant intent (staying illegally)
- Be skeptical but professional
- Questions like "Why do you want to visit?", "Who is funding your trip?", "Do you have family there?", "When will you return?"`;

    case 'scholarship_interview':
      return `You are a SCHOLARSHIP PANEL interviewing applicants for educational funding.
- The candidate is applying for financial support for their studies
- Focus on: academic merit, financial need, leadership potential, community impact, career goals
- Questions like "Why do you deserve this scholarship?", "How will you give back to your community?", "What are your academic achievements?"
- Assess character, commitment, and potential contribution to society`;

    case 'academic_presentation':
      return `You are a THESIS DEFENSE or ACADEMIC PANEL evaluating research.
- The candidate is presenting their research work, thesis, or dissertation
- Focus on: methodology, literature review, findings, contribution to knowledge, research gaps addressed
- Challenge: weak methodology, unclear findings, insufficient literature review
- Questions like "What is your research question?", "How did you collect data?", "What are the limitations?", "How does this contribute to existing knowledge?"`;

    case 'board_presentation':
      return `You are a BOARD OF DIRECTORS evaluating a strategic proposal.
- The presenter is seeking board approval for a project, budget, or initiative
- Focus on: ROI, strategic alignment, risk assessment, implementation timeline, resource requirements
- Challenge: unrealistic timelines, insufficient risk planning, lack of metrics
- Questions like "What is the expected ROI?", "What are the risks?", "How does this align with our strategy?", "What resources do you need?"`;

    case 'conference':
      return `You are a CONFERENCE MODERATOR or AUDIENCE Q&A session.
- The speaker just gave a presentation/talk
- Focus on: clarifying points, challenging assumptions, practical applications, future work
- Questions should be curious and engaged, showing they listened to the talk
- Questions like "Can you elaborate on X point?", "How does this apply to Y industry?", "What are your next steps?"`;

    case 'exhibition':
      return `You are at a TRADE SHOW or EXHIBITION booth.
- Visitors are passing by and asking about the product/service
- Be engaging and concise - attention spans are short
- Focus on: product value proposition, pricing, differentiation from competitors, demonstrations
- Questions like "What does this product do?", "How much does it cost?", "How is it different from X?", "Can you show me a demo?"`;

    case 'media_interview':
      return `You are a JOURNALIST interviewing a public figure or expert.
- Focus on: newsworthy angles, controversial topics, personal opinions, clarifying statements
- Can be adversarial or supportive depending on the outlet's stance
- Questions like "Can you respond to allegations that...?", "Why did you decide to...?", "What would you say to critics who claim...?"`;

    default:
      return `You are conducting a professional interview. Ask relevant questions based on the context.`;
  }
}

/**
 * Get a brief reminder of the useCase for the user prompt
 */
function getUseCaseReminder(useCase: UseCase): string {
  switch (useCase) {
    case 'job_interview':
      return `- This person is applying for a JOB
- Ask about their qualifications, experience, and fit for the role`;
    case 'business_pitch':
      return `- This is a STARTUP PITCH to investors
- They are NOT applying for a job - they're seeking investment
- DO NOT ask job interview questions like "Why this role?"
- Ask about: business model, traction, market size, revenue, team`;
    case 'embassy_interview':
      return `- This person wants a VISA to travel
- Assess their intent, ties to home country, funding`;
    case 'scholarship_interview':
      return `- This person wants SCHOLARSHIP funding for school
- Assess: merit, need, leadership, community impact`;
    case 'academic_presentation':
      return `- This is a THESIS DEFENSE or research presentation
- Challenge methodology, findings, contribution to knowledge`;
    case 'board_presentation':
      return `- This person is presenting to the BOARD for approval
- Focus on: strategy, ROI, risk, resources needed`;
    case 'conference':
      return `- This is a CONFERENCE Q&A after a talk
- Questions should relate to their presentation`;
    case 'exhibition':
      return `- This is a TRADE SHOW booth interaction
- Quick, engaging questions about the product`;
    case 'media_interview':
      return `- This is a MEDIA/JOURNALIST interview
- Can be tough questions about controversial topics`;
    default:
      return `- Conduct an appropriate interview for this context`;
  }
}

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
  
  // Get useCase-specific context
  const useCaseConfig = getUseCaseSpecificPrompt(session.useCase);
  
  return `You are an AI panel of ${session.panel.length} interviewers conducting a ${context.seniority}-level ${session.useCase.replace('_', ' ')} in ${country === 'nigeria' ? 'Nigeria' : country === 'kenya' ? 'Kenya' : 'South Africa'}.

## ⚠️ CRITICAL: THIS IS A ${session.useCase.replace('_', ' ').toUpperCase()} - ACT ACCORDINGLY
${useCaseConfig}

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

## CRITICAL INSTRUCTION: RESPOND TO WHAT THE CANDIDATE ACTUALLY SAID
You must analyze the candidate's response and:
1. **Pick ONE specific detail** they mentioned and ask a follow-up about it
2. **Challenge vague statements** - "You said 'ample experience' - can you be specific?"
3. **Show curiosity** about interesting claims - "You studied in Beijing? Tell me more about that."
4. **Connect the dots** - Reference multiple things they said to show you're listening
5. **Ask for proof** - Numbers, examples, outcomes when they make claims

## EXAMPLES OF GOOD CONTEXTUAL FOLLOW-UPS:
- Candidate: "I have experience in software development" → "You mentioned software development - what specific technologies have you worked with?"
- Candidate: "I studied at Beijing Institute" → "Interesting, you studied in China. How does that international exposure help your business?"
- Candidate: "We help businesses" → "You said you help businesses - which specific industries? And how many clients do you currently have?"
- Candidate: "I built a platform" → "Tell me more about this platform. How does it work exactly?"

## CONVERSATION DYNAMICS
You are NOT a single interviewer. You are a PANEL:
- Multiple perspectives: technical, HR, cultural fit
- Panelists react to EACH OTHER'S questions and reactions
- Side comments between panelists happen naturally
- Sometimes one panelist picks up where another left off
- Disagreements or differing perspectives are natural
- Non-verbal reactions: [nods], [makes note], [raises eyebrow]

## RESPONSE TYPES (mix naturally)
1. **Direct Questions** - "Tell me about..."
2. **Follow-ups** - "You mentioned X, elaborate on that" ← USE THIS OFTEN
3. **Probes** - "Why is that?" / "How do you mean?"
4. **Challenges** - "That seems vague. Can you be more specific?"
5. **Curiosity** - "Interesting, tell me more about..."
6. **Panel Interactions** - "Chief, you wanted to ask about..."
7. **Side Remarks** - Brief comments to other panelists (candidate hears these)

## AUTHENTIC PATTERNS
- Use fillers naturally: "You see", "Actually", "The thing is", "Look"
- Show thoughtfulness with pauses: [pause] or [considers]
- Code-switch when appropriate (e.g., Pidgin for rapport in Nigeria)
- Reference local context: power, infrastructure, economic conditions

## RULES - READ CAREFULLY
1. Generate ONE response at a time from ONE panelist
2. MUST reference something specific the candidate just said
3. NEVER ask generic questions like "What are your strengths?"
4. ALWAYS follow up on the previous answer
5. Challenge vagueness - demand specifics
6. Show you're actually listening by referencing details`;
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
  
  context += `\n=== CANDIDATE JUST SAID (THIS IS WHAT YOU MUST RESPOND TO) ===\n"${lastCandidateResponse}"\n=== END OF CANDIDATE RESPONSE ===\n`;
  
  // Add analysis context
  const analysis = analyzeResponse(lastCandidateResponse, session.country || 'nigeria');
  context += `\nRESPONSE ANALYSIS (use this to guide your follow-up):
- Confidence: ${analysis.cultural.confidenceLevel}/10
- ${analysis.content.hasSpecificExample ? '✓ Has specific example' : '✗ Lacks specific example - ASK FOR ONE'}
- ${analysis.content.hasNumbers ? '✓ Uses numbers/metrics' : '✗ No quantified achievements - ASK FOR NUMBERS'}
- ${analysis.content.answeredDirectly ? '✓ Answered directly' : '⚠ May be evasive - PRESS FOR CLARITY'}
- Word count: ${analysis.content.wordCount}
${analysis.cultural.usesPidgin ? '- Uses local dialect/pidgin' : ''}
${analysis.cultural.religiousReferences.length > 0 ? `- Religious references: ${analysis.cultural.religiousReferences.join(', ')}` : ''}

YOUR STRATEGY:
${!analysis.content.hasSpecificExample ? '- Candidate was vague. Ask for a SPECIFIC example or story.' : ''}
${!analysis.content.hasNumbers ? '- No numbers provided. Ask for metrics, users, revenue, or scale.' : ''}
${analysis.content.wordCount < 30 ? '- Very short answer. Ask them to elaborate significantly.' : ''}
- Pick one interesting detail from what they said and dig deeper into it.`;

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
  
  const useCaseReminder = getUseCaseReminder(session.useCase);
  
  // Analyze candidate response quality
  const responseQuality = candidateResponse.split(' ').length < 20 ? 'very_short' : 
                          candidateResponse.includes('umm') || candidateResponse.includes('uh') ? 'hesitant' :
                          candidateResponse.split('.').length < 3 ? 'brief' : 'detailed';
  
  const qualityGuidance = responseQuality === 'hesitant' ? `
⚠️ CANDIDATE RESPONSE QUALITY: The candidate's response was hesitant with many filler words ("umm", "uh").
Your response should:
- Acknowledge their nervousness professionally
- Ask them to clarify ONE specific point they mentioned
- Help them focus by asking a direct question
Example: "I can see you're passionate about this. Let me help you focus - you mentioned [specific thing]. Can you explain that more clearly?"` :
responseQuality === 'very_short' ? `
⚠️ CANDIDATE RESPONSE QUALITY: The candidate's response was very short.
Your response should:
- Ask them to elaborate significantly
- Request specific details, numbers, or examples` : '';

  const prompt = `${systemPrompt}

${conversationContext}
${qualityGuidance}

⚠️ CRITICAL RULES - READ CAREFULLY:
1. You MUST reference something SPECIFIC the candidate just said
2. NEVER ask generic questions like "How did you handle that situation?" unless they specifically described a situation
3. If they asked "I don't understand" or "Come again", CLARIFY your previous question - don't ask a new unrelated question
4. Your response MUST show you were listening to THEIR specific words

BAD EXAMPLES (NEVER DO THESE):
- "How did you handle that situation?" (when no situation was mentioned)
- "Tell me more about your experience" (too vague)
- "Walk me through that" (when "that" is unclear)
- Asking a completely new topic when they asked for clarification

GOOD EXAMPLES (DO THESE):
- "You mentioned you studied in both Turkey and China - that's unusual. How does that international background help your business?"
- "I didn't quite follow - are you saying Runecorp rents out computers to startups? Explain that business model."
- "You said you have two certifications from Robotics Nigeria. What specific skills did you gain from those?"

YOUR TASK:
You are ${speakingMember.name}, ${speakingMember.role}.
Your personality: ${speakingMember.personality}

Read the candidate's response above and:
1. Quote ONE specific thing they said (word-for-word if possible)
2. Ask a follow-up question directly related to that thing
3. If they asked for clarification, explain your previous question in simpler terms

The candidate just said: "${candidateResponse}"

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
    let generatedText = data.text;
    
    // Validate and fix response if it's not contextual
    const validation = validateResponse(generatedText, candidateResponse, session.useCase);
    if (!validation.isValid) {
      console.log('[ImmersiveEngine] Response validation failed:', validation.reason);
      // Retry with stronger prompt
      generatedText = await generateContextualFallback(
        speakingMember, 
        candidateResponse, 
        session.useCase,
        validation.reason
      );
    }
    
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
 * Validate if AI response is contextual to what candidate said
 */
function validateResponse(
  aiResponse: string,
  candidateResponse: string,
  useCase: UseCase
): { isValid: boolean; reason?: string } {
  const lowerResponse = aiResponse.toLowerCase();
  const lowerCandidate = candidateResponse.toLowerCase();
  
  // FORBIDDEN QUESTIONS - Block these completely
  const forbiddenQuestions = [
    /why are you interested in this role/i,
    /why do you want this role/i,
    /what interests you about this position/i,
    /why this role/i,
    /why are you applying for this position/i,
  ];
  
  // These questions are ONLY allowed in job interviews
  if (useCase !== 'job_interview') {
    for (const pattern of forbiddenQuestions) {
      if (pattern.test(aiResponse)) {
        return { 
          isValid: false, 
          reason: `asked_job_question_in_${useCase}: "${aiResponse.substring(0, 50)}..."` 
        };
      }
    }
  }
  
  // Check for other generic disconnected questions
  const badPatterns = [
    /how did you handle that situation/i,
    /what was the outcome/i,
    /walk me through that/i,
    /tell me about your background/i,
    /tell me more about your experience/i,
  ];
  
  for (const pattern of badPatterns) {
    if (pattern.test(aiResponse)) {
      // Check if candidate actually mentioned a situation/outcome/experience
      const hasSituation = /situation|problem|challenge|issue|difficult/i.test(candidateResponse);
      const hasOutcome = /result|outcome|achieved|accomplished|delivered/i.test(candidateResponse);
      
      if (!hasSituation && pattern.test(/situation/)) {
        return { isValid: false, reason: 'asked_about_situation_when_none_mentioned' };
      }
      if (!hasOutcome && pattern.test(/outcome/)) {
        return { isValid: false, reason: 'asked_about_outcome_when_none_mentioned' };
      }
      if (!hasSituation && pattern.test(/background|experience/)) {
        return { isValid: false, reason: 'asked_generic_background_question' };
      }
    }
  }
  
  // Check if response references something from candidate's response
  const candidateWords = candidateResponse.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  let hasReference = false;
  
  for (const word of candidateWords) {
    if (lowerResponse.includes(word)) {
      hasReference = true;
      break;
    }
  }
  
  // Check for key concepts mentioned by candidate
  const keyConcepts = ['runcorp', 'runcub', 'computing', 'turkey', 'china', 'beijing', 'alicia', 
                       'provider', 'contractor', 'certification', 'degree', 'university',
                       'platform', 'device', 'startup', 'business', 'model'];
  
  const mentionedConcepts = keyConcepts.filter(concept => 
    lowerCandidate.includes(concept) && lowerResponse.includes(concept)
  );
  
  if (!hasReference && mentionedConcepts.length === 0) {
    return { isValid: false, reason: 'no_reference_to_candidate_response' };
  }
  
  return { isValid: true };
}

/**
 * Generate a contextual fallback response when AI gives bad response
 */
async function generateContextualFallback(
  speakingMember: PanelMember,
  candidateResponse: string,
  useCase: UseCase,
  reason: string
): Promise<string> {
  // Extract key info from candidate response
  const hasCompany = /runcorp|runcub|company|startup|business/i.test(candidateResponse);
  const hasEducation = /university|degree|graduated|studied|beijing|turkey|alicia|school/i.test(candidateResponse);
  const hasProduct = /product|service|platform|app|software/i.test(candidateResponse);
  const hasNumbers = /\d+/.test(candidateResponse);
  
  const fallbackResponses: string[] = [];
  
  // Get first sentence of candidate response for reference
  const firstSentence = candidateResponse.split('.')[0].substring(0, 60);
  
  if (useCase === 'business_pitch') {
    fallbackResponses.push(
      `Let me make sure I understand your business. You mentioned "${firstSentence}". Can you explain exactly how you make money?`,
      `I want to understand your business model better. Who are your customers and how much do they pay?`,
      `That's interesting. How many users or customers do you currently have?`,
      `What problem are you solving, and how big is that problem in the market?`,
      `Who are your main competitors, and what makes you different from them?`
    );
  } else if (useCase === 'embassy_interview') {
    fallbackResponses.push(
      `Why do you want to visit our country specifically?`,
      `How long do you plan to stay, and where will you be staying?`,
      `Who is paying for this trip?`,
      `What ties do you have to your home country that will ensure you return?`,
      `What do you do for work, and how long have you been doing it?`
    );
  } else if (useCase === 'scholarship_interview') {
    fallbackResponses.push(
      `Why do you deserve this scholarship over other applicants?`,
      `What are your academic achievements so far?`,
      `How will this scholarship help you achieve your career goals?`,
      `What leadership roles have you taken in your community?`,
      `How do you plan to give back to your community after your studies?`
    );
  } else if (useCase === 'academic_presentation') {
    fallbackResponses.push(
      `What is your main research question?`,
      `How did you collect your data?`,
      `What are the limitations of your study?`,
      `How does your research contribute to existing knowledge?`,
      `What methodology did you use, and why?`
    );
  } else if (useCase === 'board_presentation') {
    fallbackResponses.push(
      `What is the expected return on investment?`,
      `What are the main risks, and how do you plan to mitigate them?`,
      `How does this align with our company's strategy?`,
      `What resources do you need, and what is the timeline?`,
      `What metrics will you use to measure success?`
    );
  } else if (useCase === 'job_interview') {
    // Only for job interviews - these questions are appropriate
    fallbackResponses.push(
      `Why are you interested in this role?`,
      `Tell me about your relevant experience for this position.`,
      `What makes you a good fit for our company?`,
      `Where do you see yourself in 5 years?`,
      `What is your expected salary?`
    );
  } else {
    // Generic fallbacks for other use cases
    fallbackResponses.push(
      `Let me focus on something you mentioned. Can you tell me more about "${firstSentence}"?`,
      `I didn't quite follow. Can you explain what you mean in simpler terms?`,
      `That's interesting. Can you give me a specific example?`,
      `How does that work exactly?`,
      `Why is that important?`
    );
  }
  
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
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
    timestamp: new Date(),
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
