# AI Career Roadmaps — Website Content Master Doc (v2)

Built from your team's sheet + current 2026 industry roadmaps. No salary data included per your request — pure learning paths, resources, and progression.

---

## 1. Role Differentiation (homepage table)

| Role | What they actually do | Trains models from scratch? | Core focus |
|---|---|---|---|
| **Full Stack Engineer** | Builds complete web apps, frontend + backend | No | HTML/CSS/JS, a backend language, databases |
| **ML Engineer** | Builds, trains, tunes, deploys ML models | Yes | Math, classical ML, MLOps |
| **AI Engineer** | Builds products using pre-trained models/LLM APIs | No | APIs, RAG, backend, deployment |
| **Full Stack AI Engineer** | Full web stack + AI integration end-to-end | No | Frontend + backend + LLM integration + streaming UI |
| **Agentic AI Engineer** | Builds multi-step autonomous agent systems | No | Orchestration, tool-calling, memory, multi-agent design |
| **GenAI Engineer** | Builds generative apps, fine-tunes models | Sometimes (LoRA/QLoRA) | Fine-tuning, multimodal, RAG |
| **AI/ML Engineer (Hybrid)** | Trains + deploys + integrates, full scope | Yes | Everything combined |

Great standalone SEO page: "AI Engineer vs ML Engineer vs Full Stack AI Engineer — what's the difference?"

---

## 2. Career Ladder — Junior → Senior → Architect (this is the graph/visual for your site)

Use this as a vertical progression diagram on every path page. Same shape applies to every path, only the technical depth changes.

```
JUNIOR                MID-LEVEL              SENIOR                 LEAD / STAFF            ARCHITECT
(0-1 yr)               (1-3 yr)              (3-5 yr)               (5-8 yr)                (8+ yr)
  |                       |                     |                        |                       |
Learn                  Own features          Own systems            Own multiple teams'     Own org-wide AI
fundamentals    →      end-to-end      →     design & tradeoffs →   architecture       →    strategy & platform
Follow existing         Build one              Design new            Set technical            Diagrams + decision
patterns                complete project       systems, mentor       standards, review        records over code;
                         solo                   juniors               architecture             cost/risk/scale owner
```

**What changes at each level (apply this note to every path page):**
- **Junior:** follow the roadmap exactly, complete every project listed, focus on correctness over cleverness.
- **Mid-level:** start making architecture choices on your own projects — why RAG vs fine-tuning, why this vector DB, why this framework.
- **Senior:** think in tradeoffs, not tutorials — reliability, cost, latency, security become your job, not an afterthought. Mentor others.
- **Lead/Staff:** own cross-team technical direction, write design docs before code, evaluate build-vs-buy.
- **AI System Architect:** own the end-to-end system — model/provider selection, scaling strategy, governance, cost ceilings, and how AI investment ties to business value. Works in diagrams and decision records as much as code.

For each path below, the last "stage" always points toward this same ladder — a **Senior [Path] → AI System Architect** track. Don't build 7 separate architect tracks; one architect track sits above all paths since the job becomes about system-level judgment, not language/framework specifics.

---

## 3. Shared Foundation (Stage 0 — everyone starts here)

*(Your existing Tabs 2–6, unchanged)*

| Stage | Topics | Free Courses/Certs |
|---|---|---|
| Programming Fundamentals | Python syntax, OOP, file/error handling | [Python Official Tutorial](https://docs.python.org/3/tutorial/), [freeCodeCamp Python](https://www.freecodecamp.org/learn/scientific-computing-with-python/) |
| Developer Essentials | Terminal, venvs, project structure | [Python venv Docs](https://docs.python.org/3/library/venv.html) |
| Networking & Server Basics | HTTP, DNS, ports, client-server | [MDN HTTP Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) |
| APIs, Backend & Databases | REST, SQL, auth basics | [MDN HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods), [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html) |
| Developer Tools | Git, GitHub, Docker, Postman, VS Code | [Git Docs](https://git-scm.com/doc), [Docker Get Started](https://docs.docker.com/get-started/) |

---

## 4. Path A: AI Engineer

*Builds production apps using existing models*

| Stage | Level | What to Cover | Free Courses/Certs |
|---|---|---|---|
| 1. LLM Fundamentals & Prompting | Junior | Tokens, context windows, function calling | [OpenAI Prompting Guide](https://platform.openai.com/docs/guides/prompt-engineering), [Anthropic Academy — Prompt Engineering](https://www.anthropic.com/learn) |
| 2. Embeddings, Vector DBs & RAG | Junior→Mid | Chunking, retrieval, reranking | [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/), [DeepLearning.AI RAG short course](https://www.deeplearning.ai/short-courses/) |
| 3. Basic Agents & Tool-Calling | Mid | LangChain basics, function calling | [LangChain Agents Docs](https://python.langchain.com/docs/how_to/#agents), [Anthropic Academy — MCP course](https://www.anthropic.com/learn) |
| 4. Cost & Token Economics | Mid | Caching, rate limits, cost monitoring | [OpenAI Pricing & Rate Limits Docs](https://platform.openai.com/docs/guides/rate-limits) |
| 5. Deployment, MLOps & Monitoring | Mid→Senior | Docker, cloud basics, logging | [Docker Get Started](https://docs.docker.com/get-started/), [MLflow Docs](https://mlflow.org/docs/latest/index.html) |
| 6. LLMOps Tooling | Senior | Langfuse/Helicone logging, RAGAS eval | [RAGAS Docs](https://docs.ragas.io/), [Langfuse Docs](https://langfuse.com/docs) |
| 7. Certification checkpoint | Any | Vendor credential | [AWS Certified AI Practitioner](https://aws.amazon.com/certification/certified-ai-practitioner/) (free-tier learning path), [Azure AI-901 Fundamentals](https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/) |
| 8. Senior → Architect | Senior+ | System design for AI pipelines, scaling, reliability | See [Career Ladder](#2-career-ladder--junior--senior--architect) |

---

## 5. Path B: ML Engineer

*Trains and deploys models — math-heavy*

| Stage | Level | What to Cover | Free Courses/Certs |
|---|---|---|---|
| 1. Math Foundations | Junior | Linear algebra, probability, calculus basics | [3Blue1Brown Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra), [Khan Academy Statistics](https://www.khanacademy.org/math/statistics-probability) |
| 2. AI/ML Foundations | Junior | NumPy, Pandas, supervised/unsupervised | [Scikit-learn Getting Started](https://scikit-learn.org/stable/getting_started.html), [Andrew Ng ML Specialization](https://www.coursera.org/specializations/machine-learning-introduction) (audit free) |
| 3. Deep Learning | Mid | Neural nets, backprop, PyTorch | [PyTorch Tutorials](https://pytorch.org/tutorials/), [DeepLearning.AI Deep Learning Specialization](https://www.deeplearning.ai/courses/deep-learning-specialization/) (audit free) |
| 4. MLOps Deep-Dive | Mid→Senior | Experiment tracking, feature stores, pipelines | [MLflow Tracking](https://mlflow.org/docs/latest/tracking.html), [Weights & Biases free tier](https://wandb.ai/site) |
| 5. Deployment & Monitoring | Senior | Serving, scaling, drift monitoring | [FastAPI Deployment Docs](https://fastapi.tiangolo.com/deployment/) |
| 6. LLM/GenAI literacy | Senior | Baseline LLM knowledge (most MLE roles now need this) | [Hugging Face Learn](https://huggingface.co/learn) |
| 7. Certification checkpoint | Any | Vendor credential | [Google Professional ML Engineer](https://cloud.google.com/learn/certification/machine-learning-engineer), [AWS ML Specialty](https://aws.amazon.com/certification/certified-machine-learning-specialty/) |
| 8. Senior → Architect | Senior+ | ML system design, model governance | See [Career Ladder](#2-career-ladder--junior--senior--architect) |

---

## 6. Path C: Full Stack Engineer

*Complete web apps — the base for Full Stack AI Engineer below*

| Stage | Level | What to Cover | Free Courses/Certs |
|---|---|---|---|
| 1. Frontend Foundations | Junior | HTML, CSS, JS, DOM, responsive design | [freeCodeCamp Responsive Web Design](https://www.freecodecamp.org/learn/2022/responsive-web-design/), [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Learn) |
| 2. Frontend Framework | Junior | React or similar, component design | [React Official Docs](https://react.dev/learn) |
| 3. Backend Language & Framework | Junior→Mid | Node.js/Python backend, REST APIs | [Node.js Docs](https://nodejs.org/en/docs/), [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/) |
| 4. Databases | Mid | SQL + one NoSQL option | [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html), [MongoDB University](https://learn.mongodb.com/) (free) |
| 5. Auth, Deployment, DevOps basics | Mid | Sessions/JWT, CI/CD, Docker | [Docker Get Started](https://docs.docker.com/get-started/), [GitHub Actions Docs](https://docs.github.com/en/actions) |
| 6. System Design Basics | Mid→Senior | Caching, load balancing, scaling | [System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer) |
| 7. Certification checkpoint | Any | Vendor credential | [Meta Front-End Developer Certificate](https://www.coursera.org/professional-certificates/meta-front-end-developer) (audit free) |
| 8. Senior → Architect | Senior+ | Full-stack system architecture | See [Career Ladder](#2-career-ladder--junior--senior--architect) — or branch into Full Stack AI Engineer below |

---

## 7. Path D: Full Stack AI Engineer

*Full web stack + AI integration end-to-end — fastest-growing hybrid role in 2026*

Prerequisite: complete Path C (Full Stack) foundation, or at minimum frontend+backend basics.

| Stage | Level | What to Cover | Free Courses/Certs |
|---|---|---|---|
| 1. LLM API Integration | Junior→Mid | Calling LLM APIs from a backend, streaming responses | [OpenAI API Quickstart](https://platform.openai.com/docs/quickstart), [Anthropic API Docs](https://docs.claude.com/) |
| 2. Client-Side AI UX | Mid | Streaming UI, the Vercel AI SDK (TypeScript standard for AI features) | [Vercel AI SDK Docs](https://sdk.vercel.ai/docs) |
| 3. RAG Integration | Mid | Document ingestion, chunking, vector DB in a full-stack app | [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/) |
| 4. Data Ingestion Pipelines | Mid | Turning PDFs/unstructured data into usable input for LLMs | [LangChain Document Loaders](https://python.langchain.com/docs/integrations/document_loaders/) |
| 5. Agentic Workflows in-app | Mid→Senior | Multi-step reasoning triggered from your UI | [LangGraph Overview](https://langchain-ai.github.io/langgraph/) |
| 6. Deployment & Cost-aware Scaling | Senior | Full-stack deployment with AI cost controls | [Docker Get Started](https://docs.docker.com/get-started/) |
| 7. Certification checkpoint | Any | Vendor credential | [AWS Certified AI Practitioner](https://aws.amazon.com/certification/certified-ai-practitioner/) |
| 8. Senior → Architect | Senior+ | End-to-end product+AI system architecture | See [Career Ladder](#2-career-ladder--junior--senior--architect) |

---

## 8. Path E: Agentic AI Engineer *(your flagship path — production experience advantage)*

| Stage | Level | What to Cover | Free Courses/Certs |
|---|---|---|---|
| 1. LLM Fundamentals + RAG | Junior | *(shared with Path A)* | Same as Path A stages 1–2 |
| 2. Async Programming | Junior→Mid | asyncio — agents wait on tool responses constantly | [Python asyncio Docs](https://docs.python.org/3/library/asyncio.html) |
| 3. AI Agents & Frameworks | Mid | State, memory, guardrails, LangGraph, MCP | [LangGraph Overview](https://langchain-ai.github.io/langgraph/), [MCP Introduction](https://modelcontextprotocol.io/introduction), [Anthropic Academy — MCP course](https://www.anthropic.com/learn) |
| 4. Agentic RAG / RAG 2.0 | Mid | Self-correcting retrieval, query rewriting | [LangGraph Agentic RAG Tutorial](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_agentic_rag/) |
| 5. Multi-Agent Orchestration at Scale | Senior | Agent handshake/comms, queue systems, microservice vs monolith, KV cache optimization | *(this is your own production content — write it yourself, no external course covers this well)* |
| 6. Graph Theory Basics | Mid | Agents operate in loops/networks, not linear chains | [Khan Academy Graph Theory intro](https://www.khanacademy.org/computing/computer-science/algorithms) |
| 7. Human-in-the-loop & Guardrails | Senior | Approval flows, safety checks | [OpenAI Guardrails Docs](https://platform.openai.com/docs/guides/guardrails) |
| 8. Evaluation & Tracing | Senior | Tool-call inspection, failure analysis | [LangSmith Docs](https://docs.smith.langchain.com/) |
| 9. Certification checkpoint | Any | Vendor/framework credential | [LangChain Academy](https://academy.langchain.com/) (free), [Anthropic Academy](https://www.anthropic.com/learn) (free) |
| 10. Senior → Architect | Senior+ | Multi-agent system architecture at scale | See [Career Ladder](#2-career-ladder--junior--senior--architect) |

---

## 9. Path F: GenAI Engineer

| Stage | Level | What to Cover | Free Courses/Certs |
|---|---|---|---|
| 1. LLM Fundamentals + RAG | Junior | *(shared with Path A)* | Same as Path A stages 1–2 |
| 2. Fine-Tuning (LoRA/QLoRA) | Mid | When to fine-tune vs RAG, dataset curation | [Hugging Face PEFT Docs](https://huggingface.co/docs/peft/index) |
| 3. Multimodal AI | Mid→Senior | Vision models, image gen basics, audio | [Hugging Face Learn — Diffusion Course](https://huggingface.co/learn/diffusion-course) |
| 4. Evaluation for Generative Systems | Senior | RAGAS, LLM-as-judge, golden test sets | [RAGAS Docs](https://docs.ragas.io/) |
| 5. Deployment & Monitoring | Senior | *(shared with Path A stage 5)* | Same as Path A stage 5 |
| 6. Certification checkpoint | Any | Vendor credential | [IBM Generative AI Engineering Professional Certificate](https://www.coursera.org/professional-certificates/ibm-generative-ai-engineering) (audit free) |
| 7. Senior → Architect | Senior+ | Generative system architecture, cost/quality tradeoffs | See [Career Ladder](#2-career-ladder--junior--senior--architect) |

---

## 10. Path G: AI/ML Engineer (Hybrid)

Combine Path A + Path B core stages, in this order: Math Foundations → AI/ML Foundations → LLM Fundamentals → RAG → Deep Learning → MLOps → Deployment. Position as "the generalist track" — most relevant for startups/small teams where one person owns the full lifecycle.

| Certification checkpoint | [IBM AI Engineering Professional Certificate](https://www.coursera.org/professional-certificates/ai-engineering) (audit free) — broadest all-round credential |

---

## 11. Fix These From Your Sheet (unchanged from before)

- **Tab 13 "Recommended Resources"** duplicates Tab 12 — replace with the course/resource tables above.
- **"Random" tab** → becomes Path E, Stage 5 (Multi-Agent Orchestration at Scale) — your strongest original content.

---

## 12. General Free Course Library (cross-path resource page)

**Anthropic/Claude:**
- [Anthropic Academy](https://www.anthropic.com/learn) — free, ~20 courses with completion certificates: Claude, Claude Code, API, MCP

**Foundational (free, verified working as of mid-2026):**
- [freeCodeCamp Machine Learning with Python](https://www.freecodecamp.org/learn/machine-learning-with-python/) — ~300 hrs, free certificate
- [MIT 6.S191 Introduction to Deep Learning](http://introtodeeplearning.com/) — free, lectures+labs
- [CS50's Intro to AI with Python (Harvard)](https://cs50.harvard.edu/ai/) — free to audit
- [Stanford CS229 (Andrew Ng, YouTube)](https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU) — free, math-heavy
- [Elements of AI (University of Helsinki)](https://www.elementsofai.com/) — free, non-technical
- [Hugging Face Learn](https://huggingface.co/learn) — free NLP/Transformers/Diffusion courses
- [d2l.ai](https://d2l.ai/) — free interactive deep learning book

**Note on paid-gated free courses:** DeepLearning.AI videos are free to watch but certificates now require a Pro membership — flag this clearly on your resource page so users aren't surprised mid-course.

**Certifications (vendor-recognized):**
- [AWS Certified AI Practitioner](https://aws.amazon.com/certification/certified-ai-practitioner/)
- [Azure AI-901 Fundamentals](https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/) *(replacing AI-900 as of June 30, 2026 — verify current status before publishing)*
- [Google Professional Machine Learning Engineer](https://cloud.google.com/learn/certification/machine-learning-engineer)
- [IBM AI Engineering Professional Certificate](https://www.coursera.org/professional-certificates/ai-engineering)
- [LangChain Academy](https://academy.langchain.com/) — free, agent-focused

Re-verify every link before publishing — course platforms restructure pricing/access often (as seen with DeepLearning.AI above).

---

## 13. Suggested Site IA (updated)

```
/                              → Homepage: role table + career ladder graphic + path picker
/paths/full-stack-engineer     → Path C
/paths/full-stack-ai-engineer  → Path D
/paths/ai-engineer             → Path A
/paths/ml-engineer             → Path B
/paths/agentic-ai-engineer     → Path E (flagship — most detail)
/paths/genai-engineer          → Path F
/paths/ai-ml-hybrid            → Path G
/career-ladder                 → Junior → Architect progression page (shared across all paths)
/resources                     → Section 12 course library
/certifications                → Vendor cert comparison
/projects                      → Tagged by path
/blog                          → SEO content
```
