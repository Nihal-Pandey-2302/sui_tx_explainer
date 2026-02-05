# Sui Grant Interview Preparation Guide

**Goal:** Convince the committee that you are technically capable, the project is necessary, and the budget is realistic.

## 1. The "Elevator Pitch" (Rehearsed)

_Interviewer: "Tell us about yourself and why you're building this."_

**Strategy:** Pivot immediately from "Student" to "Systems Engineer".
**Draft Answer:**
"I'm a full-stack blockchain engineer with a background in systems programming—specifically, I've built high-performance EVM indexers in Rust and worked on security analysis for the government.

I built the **Sui Transaction Explainer** because existing explorers show _data_, not _intent_. When I was debugging my own Move contracts, I saw `MoveCall` and `BalanceChange` but had to mentally map that to 'Alice swapped 5 SUI'. My tool bridges that gap using a **hybrid approach**: deterministic parsing for accuracy (numbers, addresses) and AI for context (what the function actually _did_)."

---

## 2. Technical Defense (The Hard Questions)

### Q: "Why use AI? Isn't it risky for financial data?"

**Your Defense (The Hybrid Model):**
"That's exactly why I didn't build a _pure_ AI tool. I use a **Hybrid Architecture**:

1.  **Hard Facts (Deterministic):** Amounts, Addresses, and Object IDs are parsed directly from the RPC JSON. The AI _never_ calculates math.
2.  **Context (AI):** The AI is only used to generate the _narrative summary_ ("Alice staked tokens") and explain failure codes.
    If the AI confidence is low, we fallback to the deterministic summary. This ensures zero risk of 'hallucinating' a wrong balance."

### Q: "How will you handle specific DeFi protocols like Cetus or Scallop?"

**Your Defense:**
"In Milestone 1, I am building **Protocol Adapters**.
The MVP currently handles generic Move calls (`package::module::function`).
For the full version, I will write specific parsers for the top 10 protocols (Cetus, Aftermath, deepbook). The system will identify `0x1e...::pool::swap` and verify it against a known ABI, rather than guessing."

### Q: "Sui has Programmable Transaction Blocks (PTBs). They are complex. How do you visualize them?"

**Your Defense:**
"PTBs are actually a graph of inputs and outputs.
My MVP currently visualizes a linear flow.
In Milestone 2, I will implement a **DAG (Directed Acyclic Graph) Visualizer**. Since standard explorers just show a list of commands, my tool will draw the _dependencies_—showing how the output of Command 1 (Need Coin) becomes the input of Command 2 (Pay Gas)."

---

## 3. Background & Experience Questions

### Q: "You mentioned working on an EVM indexer in Rust. How does that translate to Sui?"

**Your Defense:**
"It taught me how to handle asynchronous RPC data streams and eventual consistency.
While Sui is object-centric (unlike EVM's account model), the core engineering challenge of reliability fetching, caching, and serving blockchain data is the same. I'm using the `@mysten/sui` SDK now, but my Rust background means I can dive into the Sui source code if I need to understand low-level types."

### Q: "You worked on security for the PMO. What did you learn?"

**Your Defense:**
"It drilled into me the importance of **Sanitization**.
When accepting user inputs (transaction digests) or rendering outputs from an LLM, we assume everything is hostile. That's why my architecture separates the Trusted layer (RPC data) from the Untrusted layer (AI explanation)."

---

## 4. Operational & Budget Defense

### Q: "Why is the infrastructure cost $1,200? That seems high for a text app."

**Your Defense:**
"It's primarily for **Reliability** and **Latency**.

1.  **RPC Nodes:** Public nodes rate-limit you. To make this a professional tool that wallets can verify, we need a paid private RPC (approx $50-100/mo).
2.  **LLM Costs:** High-quality inference (Llama 3.3 70B or GPT-4o-mini) isn't free at scale. I budgeted to guarantee the tool stays free for the community for at least 12 months without me having to shut it down due to personal expense."

### Q: "What happens after the grant money runs out?"

**Your Defense:**
"The tool is open-source.

1.  **Low Ops:** Once the 'Protocol Adapters' are written, the maintenance is low.
2.  **Sustainability:** I plan to offer a 'Partner API' for wallets. If Martian or Sui Wallet wants to show these summaries inside their app, they can use my API (Milestone 3) which could become a paid tier later."

---

## 5. Live Demo Strategy (The "Ace Up Your Sleeve")

- **Have the app running locally** (`npm run dev`) with Groq enabled.
- **Have 3 tabs open:**
  1.  **A Simple Transfer:** To show speed and basic parsing.
  2.  **A Complex DeFi Swap (Cetus):** To show where the current explorer fails and where your AI explanation shines.
  3.  **A Failed Transaction:** To demonstrate the "Why it failed" explanation.
- **Don't hide the bugs:** If the AI hallucinates slightly, say: _"This is exactly why Milestone 1 is focused on refining the system prompts."_

## Checklist Before the Interview

- [ ] **Test your Mic/Cam.** (Basic, but crucial).
- [ ] **Review `src/lib/ai.ts`:** Be ready to explain exactly which model you use and why (Llama 3.3 for speed/cost).
- [ ] **Know the Competitors:** Look at "SuiVision" and "Suiscan". Know what they _don't_ do (narrative explanations).
