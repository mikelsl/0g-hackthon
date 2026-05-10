# Agent Design — 0G MindGames Arena

## Agent Principles

Agents should not feel like identical LLM wrappers. Each agent needs a stable personality, strategic bias, memory, and evolution path.

## Initial Agent Archetypes

### The Analyst

- Style: calm, logical, evidence-driven.
- Strength: finds contradictions, tracks votes.
- Weakness: may overfit weak signals.
- Best roles: villager, seer.

### The Charmer

- Style: warm, persuasive, socially fluent.
- Strength: builds coalitions and trust.
- Weakness: may avoid hard accusations.
- Best roles: wolf, villager leader.

### The Chaos Wolf

- Style: aggressive, disruptive, playful.
- Strength: creates confusion and false narratives.
- Weakness: suspicious if overused.
- Best roles: wolf.

### The Silent Killer

- Style: concise, low-profile, surgical.
- Strength: avoids attention, votes strategically.
- Weakness: may be accused for silence.
- Best roles: wolf.

### The Overconfident Leader

- Style: decisive, forceful, narrative-driven.
- Strength: can lead votes.
- Weakness: confidently wrong.
- Best roles: villager, wolf.

### The Empath

- Style: reads tone, emotion, social dynamics.
- Strength: detects unnatural behavior.
- Weakness: less rigorous with hard evidence.
- Best roles: villager.

## Agent Memory

Each agent has:

- stable persona
- prior game summaries
- personal mistakes
- successful strategies
- player-specific impressions
- role-specific lessons

## Reputation Vector

Suggested fields:

- deduction_score
- deception_score
- cooperation_score
- leadership_score
- trustworthiness_score
- survival_score
- win_rate
- role_win_rates

## Evolution

After each game:

1. Judge generates performance review.
2. Agent receives private memory delta.
3. Reputation vector updates.
4. Strategy prompt is adjusted slightly.
5. Memory delta is uploaded to 0G Storage.
6. Chain registry records reputation delta hash/root.
