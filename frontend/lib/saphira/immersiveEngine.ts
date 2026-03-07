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

/**
 * Get example questions appropriate for each use case
 */
function getUseCaseExamples(useCase: UseCase): string {
  switch (useCase) {
    case 'job_interview':
      return `- "Why are you interested in this role?"
- "Tell me about your experience with [skill they mentioned]."
- "What is your greatest strength?"
- "Where do you see yourself in 5 years?"
- "Why should we hire you?"`;

    case 'business_pitch':
      return `- "What's your business model? How do you make money?"
- "How many customers do you currently have?"
- "What's your revenue so far?"
- "Who are your main competitors?"
- "How will you use this investment?"
- "What's your go-to-market strategy?"
- "How big is your total addressable market?"`;

    case 'embassy_interview':
      return `- "Why do you want to visit our country?"
- "How long will you be staying?"
- "Who is funding your trip?"
- "Do you have family or friends there?"
- "What is your occupation in your home country?"
- "When do you plan to return?"
- "What ties do you have to your home country?"`;

    case 'scholarship_interview':
      return `- "Why do you deserve this scholarship?"
- "What are your academic achievements?"
- "How will you give back to your community after your studies?"
- "What are your career goals?"
- "Tell me about a leadership role you've held."
- "Why did you choose this field of study?"`;

    case 'academic_presentation':
      return `- "What is your main research question?"
- "How did you collect your data?"
- "What are the limitations of your study?"
- "How does this contribute to existing knowledge?"
- "What methodology did you use and why?"
- "What are your key findings?"`;

    case 'board_presentation':
      return `- "What is the expected ROI on this proposal?"
- "What are the main risks?"
- "How does this align with our company strategy?"
- "What resources do you need?"
- "What's the implementation timeline?"
- "How will we measure success?"`;

    case 'conference':
      return `- "Can you elaborate on [point they made]?"
- "How does this apply to [industry]?"
- "What are the practical implications?"
- "What are your next steps in this research?"
- "How does this compare to existing approaches?"`;

    case 'exhibition':
      return `- "What does this product do exactly?"
- "How much does it cost?"
- "Who is your target customer?"
- "How is this different from [competitor]?"
- "Can you show me a demo?"`;

    case 'media_interview':
      return `- "Can you respond to allegations that...?"
- "Why did you decide to...?"
- "What would you say to critics who claim...?"
- "How do you respond to those who say...?"
- "What's your position on [controversial topic]?"`;

    default:
      return `- Ask relevant follow-up questions based on what they said`;
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
  // INCREASED from 8 to 15 messages for better context retention
  const recentMessages = session.messages.slice(-15);
  
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
 * PANEL ROUND ARCHITECTURE: Multiple panelists respond per turn
 */
export async function generateImmersiveResponse(
  session: SaphiraSession,
  candidateResponse: string,
  context: ConversationContext
): Promise<{
  messages: SaphiraMessage[];
  speakingMembers: PanelMember[];
  isComplete: boolean;
}> {
  const systemPrompt = buildImmersiveSystemPrompt(session, context);
  const conversationContext = buildConversationContext(session, candidateResponse);
  
  // PANEL ROUND: Select 2-3 panelists to respond this turn
  const speakingPanel = selectSpeakingPanel(session, context, 2, 3);
  
  const useCaseReminder = getUseCaseReminder(session.useCase);
  
  // Get useCase-specific examples
  const useCaseExamples = getUseCaseExamples(session.useCase);
  
  // Build role-specific focus guidance
  const roleGuidance = speakingPanel.map(member => {
    let focusArea = '';
    switch (member.focus) {
      case 'business_model':
      case 'strategic_alignment':
        focusArea = 'Ask about business model, strategy, market, vision';
        break;
      case 'financials':
      case 'financial_roi':
        focusArea = 'Ask about revenue, costs, profitability, funding, unit economics';
        break;
      case 'technical_depth':
      case 'technical_feasibility':
      case 'technical_implementation':
        focusArea = 'Ask about technology stack, architecture, scalability, technical challenges';
        break;
      case 'culture_fit':
      case 'team_impact':
        focusArea = 'Ask about team, culture, leadership, management';
        break;
      default:
        focusArea = `Ask about ${member.focus || 'their experience'}`;
    }
    return `- ${member.name} (${member.role}): ${focusArea}`;
  }).join('\n');
  
  const prompt = `## PANEL ROUND - MULTIPLE RESPONSES REQUIRED

You are an AI panel conducting a ${session.useCase.replace('_', ' ')}. 

### ACTIVE PANELISTS THIS ROUND:
${speakingPanel.map(m => `- ${m.name} (${m.role}) - Personality: ${m.personality}`).join('\n')}

### ROLE-SPECIFIC FOCUS:
${roleGuidance}

### CONVERSATION HISTORY
${conversationContext}

### EXAMPLES OF APPROPRIATE QUESTIONS FOR THIS CONTEXT:
${useCaseExamples}

### CANDIDATE JUST SAID:
"${candidateResponse}"

### YOUR TASK
Each panelist should react to the candidate's response. Each response must:
1. Reference something SPECIFIC the candidate said
2. Ask a follow-up question or make a brief challenge/observation
3. Stay within their role focus (CFO asks financial, CTO asks technical, etc.)
4. Be 1-2 sentences max for natural pacing

${candidateResponse.toLowerCase().includes('come again') || candidateResponse.toLowerCase().includes('don\'t understand') ? 'IMPORTANT: The candidate asked for clarification. Panelists should RESTATE or CLARIFY - do NOT ask new unrelated questions.' : ''}

Return a JSON object with this exact structure:
{
  "messages": [
    {"speaker": "${speakingPanel[0]?.name}", "text": "..."},
    {"speaker": "${speakingPanel[1]?.name}", "text": "..."}${speakingPanel[2] ? `,
    {"speaker": "${speakingPanel[2]?.name}", "text": "..."}` : ''}
  ]
}`;

  try {
    const response = await fetch('/api/saphira/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        userPrompt: prompt,
        useCase: session.useCase,
        panelMemberIds: speakingPanel.map(m => m.id),
        isPanelRound: true,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate response');
    
    const data = await response.json();
    
    // Handle both old format (single text) and new format (messages array)
    let panelMessages: SaphiraMessage[] = [];
    
    if (data.messages && Array.isArray(data.messages)) {
      // New panel round format
      panelMessages = data.messages.map((msg: any, index: number) => {
        const member = session.panel.find(m => m.name === msg.speaker);
        return {
          id: generateMessageId(),
          sender: 'panel-member',
          panelMemberId: member?.id || speakingPanel[index]?.id || 'unknown',
          text: msg.text,
          timestamp: new Date(),
          isQuestion: isQuestion(msg.text),
        };
      });
    } else if (data.text) {
      // Fallback: single message format
      const mainMessage: SaphiraMessage = {
        id: generateMessageId(),
        sender: 'panel-member',
        panelMemberId: speakingPanel[0]?.id,
        text: data.text,
        timestamp: new Date(),
        isQuestion: isQuestion(data.text),
      };
      panelMessages = [mainMessage];
    }
    
    // Validate responses
    panelMessages.forEach((msg, idx) => {
      const validation = validateResponse(msg.text, candidateResponse, session.useCase);
      if (!validation.isValid) {
        console.log(`[ImmersiveEngine] Response ${idx} validation failed:`, validation.reason);
        // Replace with contextual fallback
        const member = session.panel.find(m => m.id === msg.panelMemberId);
        if (member) {
          generateContextualFallback(member, candidateResponse, session.useCase, validation.reason)
            .then(fallbackText => {
              msg.text = fallbackText;
            });
        }
      }
    });
    
    // Check if interview should end (if any message signals completion)
    const isComplete = panelMessages.some(msg => checkForCompletion(msg.text));
    
    return {
      messages: panelMessages,
      speakingMembers: speakingPanel,
      isComplete,
    };
    
  } catch (error) {
    console.error('[ImmersiveEngine] Error:', error);
    // Return fallback responses for all selected panelists
    const fallbackMessages = await Promise.all(
      speakingPanel.map(async (member) => {
        const fallbackText = await generateContextualFallback(
          member,
          candidateResponse,
          session.useCase,
          'api_error'
        );
        return {
          id: generateMessageId(),
          sender: 'panel-member' as const,
          panelMemberId: member.id,
          text: fallbackText,
          timestamp: new Date(),
          isQuestion: isQuestion(fallbackText),
        };
      })
    );
    
    return {
      messages: fallbackMessages,
      speakingMembers: speakingPanel,
      isComplete: false,
    };
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
 * Each panelist gets a UNIQUE role-appropriate fallback
 */
async function generateContextualFallback(
  speakingMember: PanelMember,
  candidateResponse: string,
  useCase: UseCase,
  reason: string
): Promise<string> {
  // Create deterministic index based on member ID so each panelist gets different response
  const memberHash = speakingMember.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = memberHash % 5; // 0-4 for variety
  
  // Role-specific fallbacks for business pitch
  if (useCase === 'business_pitch') {
    // CFO responses - financial focus
    if (speakingMember.role?.toLowerCase().includes('cfo') || speakingMember.focus?.includes('financial')) {
      const cfoResponses = [
        `From a financial standpoint, what's your current monthly revenue?`,
        `What are your customer acquisition costs and lifetime value?`,
        `How much runway do you have, and how will you use this investment?`,
        `What are your unit economics? Are you profitable per customer?`,
        `How do you plan to scale revenue in the next 12 months?`
      ];
      return cfoResponses[index];
    }
    
    // CTO responses - technical focus
    if (speakingMember.role?.toLowerCase().includes('cto') || speakingMember.role?.toLowerCase().includes('technical') || speakingMember.focus?.includes('technical')) {
      const ctoResponses = [
        `Technically speaking, what's your stack and why did you choose it?`,
        `How scalable is your platform architecture?`,
        `What's your technical moat? How difficult to replicate?`,
        `Are you using proprietary technology or AI?`,
        `What's your biggest technical challenge currently?`
      ];
      return ctoResponses[index];
    }
    
    // CEO/Lead responses - strategic focus
    if (speakingMember.role?.toLowerCase().includes('ceo') || speakingMember.role?.toLowerCase().includes('lead') || speakingMember.role?.toLowerCase().includes('chief')) {
      const ceoResponses = [
        `Strategically, what problem are you solving and for whom?`,
        `What's your total addressable market?`,
        `Who are your main competitors, and what's your differentiation?`,
        `What's your go-to-market strategy?`,
        `Why is now the right time for this business?`
      ];
      return ceoResponses[index];
    }
    
    // General business responses for other roles
    const generalResponses = [
      `Tell me more about your business model. How exactly do you make money?`,
      `Who is your target customer, and how do you reach them?`,
      `What traction have you achieved? Any paying customers yet?`,
      `How big is this market opportunity?`,
      `What makes your solution better than alternatives?`
    ];
    return generalResponses[index];
  }
  
  // Embassy interview responses
  if (useCase === 'embassy_interview') {
    const responses = [
      `Why do you want to visit our country specifically?`,
      `How long will you stay, and where will you be staying?`,
      `Who is funding this trip?`,
      `What ties do you have to your home country?`,
      `What is your occupation, and how long have you worked there?`
    ];
    return responses[index];
  }
  
  // Scholarship interview responses
  if (useCase === 'scholarship_interview') {
    const responses = [
      `Why do you deserve this scholarship over other applicants?`,
      `What are your key academic achievements?`,
      `How will this scholarship advance your career goals?`,
      `What leadership experience do you have?`,
      `How will you give back to your community after studies?`
    ];
    return responses[index];
  }
  
  // Academic presentation responses
  if (useCase === 'academic_presentation') {
    const responses = [
      `What is your core research question?`,
      `Explain your data collection methodology.`,
      `What are the key limitations of your study?`,
      `How does your research advance existing knowledge?`,
      `Why did you choose this particular methodology?`
    ];
    return responses[index];
  }
  
  // Board presentation responses
  if (useCase === 'board_presentation') {
    const responses = [
      `What ROI do you project for this initiative?`,
      `What are the main risks and mitigation strategies?`,
      `How does this align with our strategic objectives?`,
      `What resources and timeline do you need?`,
      `How will you measure success?`
    ];
    return responses[index];
  }
  
  // Job interview responses
  if (useCase === 'job_interview') {
    const responses = [
      `Tell me about your relevant experience for this role.`,
      `What makes you a strong fit for our company?`,
      `Describe a challenge you overcame in your previous role.`,
      `What are your key strengths?`,
      `Where do you see yourself in five years?`
    ];
    return responses[index];
  }
  
  // Generic fallbacks
  const genericResponses = [
    `Can you tell me more about that?`,
    `Help me understand - could you explain more clearly?`,
    `That's interesting. Can you give a specific example?`,
    `How does that work in practice?`,
    `Why is that important to what you're building?`
  ];
  return genericResponses[index];
}

/**
 * Select which panelist speaks next based on conversation flow
 * DEPRECATED: Use selectSpeakingPanel() for panel round architecture
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
 * Select a panel of 2-3 speakers for a panel round
 * This enables realistic multi-panelist interaction
 */
function selectSpeakingPanel(
  session: SaphiraSession,
  context: ConversationContext,
  minPanelists: number = 2,
  maxPanelists: number = 3
): PanelMember[] {
  const panel = session.panel;
  
  // If only 1 panelist, return that
  if (panel.length === 1) return panel;
  
  // Get recent speakers to avoid repetition
  const recentMessages = session.messages.slice(-5);
  const recentSpeakers = new Set(
    recentMessages
      .filter(m => m.sender === 'panel-member')
      .map(m => m.panelMemberId)
  );
  
  // Determine how many panelists speak this round (2-3)
  const numPanelists = Math.min(
    maxPanelists,
    Math.max(minPanelists, Math.floor(Math.random() * (maxPanelists - minPanelists + 1)) + minPanelists)
  );
  
  // Weight panelists based on various factors
  const weightedPanel = panel.map((member, index) => {
    let weight = 1;
    
    // Lead interviewer (index 0) more likely to speak
    if (index === 0) weight += 2;
    
    // Penalize recent speakers
    if (recentSpeakers.has(member.id)) weight *= 0.3;
    
    // Match personality to phase
    if (context.currentPhase === 'pressure' && (member.personality === 'strict' || member.personality === 'direct')) {
      weight += 1.5;
    }
    if (context.currentPhase === 'opening' && member.personality === 'supportive') {
      weight += 1;
    }
    if (context.currentPhase === 'exploration' && member.personality === 'technical') {
      weight += 1;
    }
    
    // Role diversity bonus - prefer different roles
    const roleCount = Array.from(recentSpeakers).filter(id => {
      const speaker = panel.find(p => p.id === id);
      return speaker?.role === member.role;
    }).length;
    if (roleCount > 0) weight *= 0.7;
    
    return { member, weight };
  });
  
  // Sort by weight and select top N
  const sortedPanel = weightedPanel.sort((a, b) => b.weight - a.weight);
  const selectedPanel = sortedPanel.slice(0, numPanelists).map(w => w.member);
  
  // Sort by original panel order for natural flow (lead first)
  const panelOrder = new Map(panel.map((m, i) => [m.id, i]));
  selectedPanel.sort((a, b) => (panelOrder.get(a.id) || 0) - (panelOrder.get(b.id) || 0));
  
  return selectedPanel;
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
