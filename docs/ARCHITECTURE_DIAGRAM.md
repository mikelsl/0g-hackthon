# Architecture Diagram

```mermaid
flowchart TD
    A[Human / Telegram / Demo CLI] --> B[WerewolfEngine]
    B --> C[AI Players + Judge Adapter]
    C --> D[ComputeAdapter]
    D --> D1[0G Compute backend]
    D --> D2[LLM fallback / mock backend]

    B --> E[Artifact Pipeline]
    E --> E1[Raw transcript]
    E --> E2[Public replay transcript]
    E --> E3[Private audit transcript]
    E --> E4[Summary]

    E --> F[StorageAdapter]
    F --> G[0G Storage]

    E1 --> H[GameRegistry.sol]
    E4 --> H
    H --> I[0G Galileo]

    G --> J[Replay Verification Dashboard]
    I --> J
    J --> K[Judge / Reviewer verification]
```

## Reading guide

- **WerewolfEngine** is the source of truth for room state, speeches, votes, night actions, and outcome.
- **ComputeAdapter** keeps reasoning backend-pluggable, so the MVP can use mock or LLM fallbacks while staying ready for deeper 0G Compute integration.
- **Artifact Pipeline** intentionally separates:
  - raw transcript
  - judge-safe public replay
  - private audit transcript
  - final summary
- **0G Storage + GameRegistry** together create the verification path used by the dashboard and CLI verifier.
