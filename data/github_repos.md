# GitHub Repository Knowledge Base
# github.com/shipra1611

---

## Repository: adversarial-xai-stress-tester

### Purpose
Systematic faithfulness audit of Grad-CAM and SHAP explanations on a chest X-ray classifier. The core question: do the saliency maps actually reflect what the model learned, or are they misleading artifacts that could cause a clinician to trust the wrong thing?

### Tech Stack
- **Model**: DenseNet121 (via torchxrayvision, pretrained weights)
- **Dataset**: NIH CXR14 (chest X-ray 14 pathology labels)
- **Explainability**: PyTorch + Captum (Grad-CAM), SHAP (GradientExplainer)
- **Metrics**: AOPC (Area Over Perturbation Curve), Clever Hans detection, spurious heatmap rate
- **Deployment**: Streamlit dashboard — upload a CXR, get Grad-CAM/SHAP overlay + faithfulness scores
- **Stack**: PyTorch · Captum · torchxrayvision · NIH CXR14 · Streamlit

### Key Results
| Metric | Result |
|---|---|
| Spurious Grad-CAM heatmaps | 35.9% |
| Clever Hans artifact rate | 65.94% |
| SHAP AOPC advantage over Grad-CAM | 92% |

### What "Clever Hans" means here
The model was attending to pacemaker wires and medical device artifacts in the image corners when predicting Cardiomegaly — not the actual cardiac silhouette. 65.94% of "Cardiomegaly" predictions showed this pattern. This is a classic Clever Hans effect: the model learned a spurious correlation (pacemaker → cardiomegaly) present in the training distribution rather than the actual pathology.

### Architecture
```
NIH CXR14 → DenseNet121 (torchxrayvision)
                    ↓
         grad_cam.py  |  shap_explainer.py
                    ↓
         metrics/
           aopc.py          ← perturbation-based faithfulness
           clever_hans.py   ← heatmap-to-ROI overlap analysis
                    ↓
         streamlit dashboard/app.py
```

### Design Decisions & Tradeoffs
- **AOPC over deletion alone**: AOPC averages across perturbation steps, making it less sensitive to baseline choice. Single-step deletion is noisier.
- **torchxrayvision DenseNet121**: Chosen for reproducibility and existing NIH CXR14 benchmark baseline — not for novelty. The point of this project is the eval methodology, not a new model.
- **Streamlit over Flask**: Right call for a research tool. Wrong call for production. Acceptable tradeoff for a faithfulness audit framework.
- **Grad-CAM vs SHAP**: Grad-CAM is one forward+backward pass (~10ms). SHAP GradientExplainer requires multiple samples (~100x slower). Both exposed so users can compare the faithfulness-speed tradeoff directly.

### What I'd do differently
- Add LIME as a third explainer for triangulation — two explainers isn't enough for a faithfulness claim
- Implement concept-based explanations (TCAV) to identify *which concepts* trigger the Clever Hans, not just where
- Replace Streamlit with FastAPI + React for production (Streamlit blocks on heavy computation)
- Add a human-in-the-loop relabeling interface to correct mislabeled training examples that caused the Clever Hans

### Live Demo
Streamlit app: https://huggingface.co/spaces/shipr1611/xray-explainer

---

## Repository: AI-Health-Triage (Chest X-ray Classification)

### Purpose
AI-powered chest X-ray classification system for detecting respiratory diseases. Explores whether self-supervised pretraining (SimCLR) improves feature extraction for medical image classification when labeled data is limited.

### Task
4-class classification: COVID-19 · Viral Pneumonia · Lung Opacity · Normal

### Dataset
COVID-19 Radiography Database (Kaggle) — thousands of labeled chest X-ray images across the four classes.

### Tech Stack
- **Backbone**: DenseNet121
- **Pretraining**: SimCLR (self-supervised contrastive learning)
- **Fine-tuning**: Supervised classification on top of SimCLR encoder
- **Explainability**: Grad-CAM visualization
- **Framework**: PyTorch

### Training Strategy
Two-phase:
1. **SimCLR pretraining** (unsupervised): contrastive loss on augmented pairs. Loss trajectory: 2.23 → 1.98 → 1.93 → 1.90 → 1.90 across 5 epochs. Encoder saved as `simclr_encoder.pth`.
2. **Supervised fine-tuning**: classification head trained on frozen + then unfrozen encoder. Best val loss: 0.1055 at epoch 5.

### Results
| Model | Accuracy | F1 Score | Notes |
|---|---|---|---|
| DenseNet121 (supervised only) | 87.2% | 0.85 | baseline |
| DenseNet121 + SimCLR pretrain | 91.4% | 0.89 | better generalization |

SimCLR pretraining improved accuracy by 4.2 percentage points and F1 by 0.04. The key benefit was generalization — the SimCLR encoder learned more robust visual representations before seeing labels.

### Design Decisions
- **SimCLR over supervised-only**: hypothesis was that contrastive pretraining would help given class imbalance in medical datasets. Confirmed: 91.4% vs 87.2%.
- **DenseNet121**: dense skip connections are particularly good for medical imaging because fine-grained texture features (the kind that distinguish COVID-19 opacities from normal lung tissue) are preserved across all layers.

### What I'd do differently
- Train SimCLR for more epochs — loss hadn't fully converged at epoch 5 (still at 1.90, likely had headroom)
- Add proper confusion matrix analysis (COVID vs Pneumonia misclassification is clinically different from COVID vs Normal)
- Test MoCo v3 as alternative contrastive framework
- Add uncertainty quantification — a model that says "I'm 51% sure this is COVID" should not be treated the same as one that says "99% sure"

### Live Demo
https://huggingface.co/spaces/shipr1611/xray-explainer

---

## Repository: Brain-Age-Gap

### Purpose
Predict biological brain age from structural MRI scans using CNNs and Vision Transformers. Compute Brain Age Gap (predicted - chronological age) as a neurodegenerative biomarker. Generate GradCAM-based explainability maps and structured clinical prediction reports.

**Brain Age Gap = Predicted Age − Chronological Age**

A positive BAG indicates accelerated neurodegeneration. Negative BAG indicates healthier-than-expected aging.

### Dataset
**OASIS-3** longitudinal neuroimaging dataset — structural T1-weighted MRI scans.

### Tech Stack
- **Models**: CNN baseline (ResNet-style, 2D slices) + Vision Transformer (ViT, patch embeddings)
- **Ensemble**: Weighted combination of CNN + ViT predictions
- **Explainability**: GradCAM on axial/coronal/sagittal slices
- **Neuroimaging**: nibabel (NIfTI), nilearn
- **Output**: Structured prediction reports, GradCAM heatmaps
- **Stack**: PyTorch · ViT · nibabel · nilearn · GradCAM · Matplotlib · NumPy · Pandas

### Results
| Model | MAE (years) | Pearson r |
|---|---|---|
| CNN | 7.81 | 0.912 |
| ViT | 6.40 | 0.940 |
| Ensemble | 6.61 | 0.940 |

ViT outperformed CNN: MAE improvement of 1.41 years. The ensemble doesn't beat ViT on MAE but provides more stable predictions (lower variance on edge cases).

### Why ViT beats CNN here
ViT captures long-range spatial dependencies across the whole brain slice via self-attention — critical for aging patterns that span distributed regions (ventricular enlargement, cortical thinning). CNNs are limited by receptive field size and struggle to correlate distant anatomical regions in a single layer.

### GradCAM Findings
Attribution maps aligned with known neuroanatomical aging markers:
- **Hippocampal regions** (memory consolidation, first to atrophy in Alzheimer's)
- **Cortical atrophy zones** (frontoparietal thinning patterns)
- **Ventricular enlargement patterns** (CSF space expansion with age)

Example output: Chronological Age 74 → Predicted Age 70.7 years → BAG = -3.3 years (younger-than-expected brain aging)

### Inference Pipeline
```
NIfTI scan → slice_extractor → preprocessing
             (tissue mask, middle 30% of z-axis)
                    ↓
              CNN / ViT inference
                    ↓
           GradCAM visualization
                    ↓
        Structured prediction report (JSON)
```

### Design Decisions
- **2D slice approach vs 3D**: 3D models (SwinUNETR) would likely yield ~1-2 year MAE improvement but require 24GB+ VRAM. 2D slice ensemble is the pragmatic Colab-compatible choice.
- **OASIS-3 over IXI**: OASIS-3 is longitudinal (same subjects over time), making it more appropriate for a biomarker study than IXI's cross-sectional design.
- **Tissue masking for slice selection**: naive uniform sampling includes too many blank slices (skull, air). Only sampling slices with >15% non-zero voxels dramatically improved training signal.

### What I'd do differently
- 3D SwinUNETR with proper GPU access — the MAE gap between 2D and 3D is clinically meaningful
- Longitudinal BAG tracking: compute BAG trajectory over time for the same subject, not just a single scan
- Validate on ADNI dataset — OASIS-3 is well-curated but ADNI has more MCI/AD subjects which is the actual clinical population of interest
- Add conformal prediction intervals — "BAG = +4.2 ± 1.8 years" is more honest than a point estimate

---

## Repository: BraTS-SwinUNETR

### Purpose
3D volumetric brain tumor segmentation on the BraTS 2020 dataset using SwinUNETR — a hybrid Swin Transformer + CNN architecture for medical image segmentation. Built with PyTorch and MONAI.

### Dataset
**BraTS 2020** — 371 patients (368 valid after filtering), 80/20 train/val split.
- 4 MRI modalities: T1, T1ce (contrast-enhanced), T2, FLAIR — stacked as 4-channel input
- 3 segmentation classes: NCR/NET (necrotic core), ED (edema), ET (enhancing tumor)
- Label 4 (ET) remapped to 3 for contiguous class indices

### Tech Stack
- **Architecture**: SwinUNETR (feature_size=24, in_channels=4, out_channels=4)
- **Framework**: PyTorch + MONAI 1.3
- **Loss**: DiceCE Loss (to_onehot_y=True, softmax=True)
- **Optimizer**: AdamW (lr=1e-4, wd=1e-5)
- **Inference**: Sliding window (roi=96³, overlap=0.5) — larger than training patches (64³) for better boundary accuracy
- **GPU**: NVIDIA Tesla T4 (Colab)
- **Stack**: torch · monai · nibabel · einops · scikit-learn

### Architecture
```
Input: (4, H, W, D) — 4 MRI channels
│
▼
Swin Transformer Encoder (4 stages, shifted-window self-attention + patch merging)
│
▼
CNN Decoder (transposed convolutions + skip connections from each encoder stage)
│
▼
Output: (4, H, W, D) — 4-class voxel logits
```

### Preprocessing Pipeline
```
LoadImaged → EnsureChannelFirstd → ConvertLabels (4→3)
→ Orientationd (RAS) → Spacingd (1.5×1.5×2.0mm)
→ ScaleIntensityd → CropForegroundd
→ SpatialPadd (64³) → RandSpatialCropd (64³) → EnsureTyped
```

### Results
| Metric | Score |
|---|---|
| Best Mean Dice | 0.4244 |
| Best Epoch | 12 / 15 |
| Final Training Loss | 0.4263 |

**Per-class Dice at best epoch:**
| Segmentation Class | Dice |
|---|---|
| NCR/NET — Necrotic Core | 0.4244 |
| Edema (ED) | 0.4338 |
| Enhancing Tumor (ET) | 0.5239 |
| Mean Dice (foreground) | 0.4607 |

ET achieved the highest Dice (0.52) because enhancing tumor has strong contrast-enhancing signal on T1ce — easier to segment. NCR/NET is hardest due to heterogeneous appearance.

### Training Progression
Validation Dice improved from 0.17 → 0.42 across 12 epochs, then plateaued. Plateau at epoch 12 indicates potential benefit from LR scheduling (cosine annealing) or longer training (50-100 epochs). This was 15 epochs as a proof of concept.

### Key Engineering Decisions
- **Sliding window inference at 96³ despite training at 64³**: larger inference ROI improves boundary accuracy and reduces checkerboard artifacts from small patches
- **AMP (torch.amp.autocast)**: mixed precision reduced GPU memory by ~40%, enabling larger batch sizes on T4
- **Label remapping (4→3)**: BraTS uses non-contiguous labels (0,1,2,4). Contiguous indices required for CrossEntropy. Missed this initially; caused silent training failures.
- **CropForegroundd before padding**: crops to brain bounding box first, then pads to target size — avoids wasting compute on skull/air voxels

### What I'd do differently
- LR scheduling (cosine annealing with warmup) — training plateaued, this would likely push Dice past 0.50
- Train 50+ epochs: 15 epochs is clearly underfit; the val curve was still improving
- SwinUNETR-L (larger feature_size=48) with proper GPU — current feature_size=24 is the smallest config
- Post-processing: connected component analysis to remove spurious small predictions (common source of false positives in tumor segmentation)

---

## Repository: Go-Issue-Agent

### Purpose
A lightweight agentic AI system that takes a GitHub issue URL, analyzes the repository, attempts an LLM-driven fix using a tool loop, validates the generated changes with the Go toolchain, and produces a git diff + PR draft. Goal: not a fully autonomous software engineer, but practical validation-aware AI coding workflows.

### Tech Stack
- **LLM**: Gemini 2.5 Flash (via Google AI API)
- **Language**: Python (agent orchestration), Go (validation target)
- **Tools available to agent**: read_file · list_directory · search_code · write_file · run_go_command · finish_fix
- **Validation**: go vet · go build · go test
- **Target repos**: gin-gonic/gin · spf13/cobra · go-playground/validator · golangci/golangci-lint

### Architecture
```
GitHub Issue URL
│
▼
Issue Fetcher (GitHub API) → Repo Cloner (shallow git clone)
│
▼
Repo Mapper (build file tree) → Context Builder (select relevant files)
│
▼
Gemini Tool Agent (iterative tool loop)
  ├── read_file
  ├── list_directory
  ├── search_code
  ├── write_file
  ├── run_go_command
  └── finish_fix
│
▼
Validator (go vet / build / test)
│
├── PASS → PR Generator (diff + PR draft)
└── FAIL → Repair Loop (one retry with error context) → Validator again
```

### Design Decisions
- **Tool loop over one-shot prompting**: one-shot generation fails on repository-scale tasks because the model can't inspect or validate incrementally. The tool loop lets the agent read files, make targeted edits, and validate before finalizing — significantly higher success rate on real issues.
- **Heuristic context selection over embeddings**: keyword-based file selection worked well for focused issues on medium Go repos while keeping the system simple and transparent. Vector databases would add infrastructure without meaningful precision gain at this scale.
- **Shallow clone**: agent only needs current file state, not commit history. Depth=1 keeps setup under 10 seconds even for large repos.
- **Single repair loop iteration**: deliberately lightweight. Deep repair loops can get stuck in oscillation. One retry with error context surfaces the validation failure without infinite loops.

### Key Lessons
- Smaller/free LLMs can understand repository structure and reason about issue semantics surprisingly well — but still occasionally produce syntactically invalid Go code. Validation-aware workflows are more valuable than aggressive model capability.
- The most common failure mode was malformed multiline Go string generation. Always caught by the validation pipeline.
- The repair loop and Go toolchain integration ended up being the most valuable parts of the system — more valuable than the LLM itself.

### What I'd do differently
- AST-aware code editing (go/ast) instead of full-file rewrites — targeted patch generation, not "rewrite the whole file"
- Semantic retrieval with code embeddings for larger repositories where keyword matching breaks down
- Diff-based patch generation (unified diff format) instead of full file replacement
- Multi-agent planning: separate "analysis" agent from "editing" agent to reduce context confusion

---

## Repository: StreamLink

### Purpose
A full-stack data source connector and pipeline monitor — built to mirror the core UX of OLake (a CDC/data integration platform). Configure Postgres/MongoDB/MySQL sources, run connection tests, start CDC replication, and watch live Iceberg ingestion logs stream in real-time via SSE.

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Tailwind CSS · Zustand · Vite |
| Backend | Node.js · Express · PostgreSQL · SSE |
| Infrastructure | Docker · docker-compose · nginx |

### Key Features
- **Connector wizard**: 3-step wizard (source type → credentials → test → save)
- **Live CDC log streaming**: SSE-based real-time log panel, rows replicated counter
- **Connection testing**: simulated table discovery and connectivity validation
- **Start/stop replication**: per-connector replication lifecycle management

### API
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/connectors | List all connectors |
| POST | /api/connectors | Create connector |
| DELETE | /api/connectors/:id | Delete connector |
| POST | /api/connectors/test | Test connection (mocked) |
| POST | /api/connectors/:id/start | Start replication |
| GET | /api/connectors/:id/stream | SSE live log stream |

### Architecture Notes
- **Zustand over Redux**: simpler state management for a focused CRUD + streaming use case. Redux overhead not justified.
- **SSE over WebSockets**: SSE is unidirectional (server → client) which is all log streaming needs. WebSockets add bidirectional complexity without benefit here.
- **PostgreSQL for connector metadata**: not just in-memory — connectors persist across restarts.

---

## Repository: LakePulse AI

### Purpose
A production-style data observability and pipeline orchestration platform simulating how modern data infrastructure teams monitor CDC ingestion, schema evolution, and Iceberg-based analytics pipelines. Combines concurrent Go services, real PostgreSQL introspection, live WebSocket streaming, DAG-based orchestration, and AI-assisted diagnostics into a unified operational dashboard.

### Tech Stack
**Backend**: Go 1.21+ · Chi Router · Gorilla WebSocket · pgx · Goroutines + Channels
**Frontend**: React 18 · TypeScript · Vite · Zustand · TailwindCSS · React Flow (DAG builder)
**Infrastructure**: PostgreSQL 16 · Docker · WebSockets · REST APIs
**AI**: Anthropic Claude API · Gemini-compatible integration support

### Core Features
- **Real-time pipeline monitoring**: live WAL/LSN progress from PostgreSQL, throughput + latency metrics via WebSocket
- **Interactive DAG pipeline builder**: drag-and-drop DAG editor with React Flow, concurrent pipeline execution via goroutines/channels
- **Schema intelligence**: automatic PostgreSQL schema introspection, schema evolution detection (column/type changes)
- **AI Operations Assistant**:
  - *AI Pipeline Architect*: generate pipeline DAGs from natural language
  - *AI Schema Whisperer*: recommend Iceberg partitioning strategies
  - *AI Anomaly Explainer*: diagnose lag spikes and ingestion failures
  - *AI Query Optimizer*: rewrite SQL for Iceberg-friendly execution

### System Architecture
```
React Frontend (Vite + TypeScript + Zustand)
  DAG Builder | Metrics Dashboard | AI Panel | Event Streaming UI
        │
        │  REST + WebSocket
        ▼
Go Backend
  Concurrent Pipeline Runner | WebSocket Event Hub
  Schema Evolution Engine    | AI Integration Layer
  PostgreSQL Introspection
        │
        ▼
PostgreSQL 16
  WAL/LSN Tracking | pg_catalog Introspection | Simulated CDC
```

### Why Go for the backend
CDC monitoring and pipeline orchestration are I/O-bound and event-heavy. Go's goroutines + channels are a natural fit: each pipeline runs in its own goroutine, the WebSocket event hub fans out to all connected clients, and the schema watcher polls pg_catalog concurrently — all without thread pool management overhead.

### Design Decisions
- **WebSockets over SSE**: bidirectional communication needed for pipeline control (start/stop commands from frontend back to backend). SSE is read-only.
- **React Flow for DAG editor**: battle-tested graph library with first-class TypeScript support. Building a custom DAG renderer from scratch would be weeks of work for no differentiation.
- **Real PostgreSQL introspection (not mocked)**: pg_catalog queries give actual schema metadata — makes schema evolution detection real, not simulated.

### What I'd do differently
- Apache Iceberg catalog integration (PyIceberg or Rust iceberg-rust) for real table format operations
- Kafka-based CDC ingestion replacing the simulated WAL producer
- OpenTelemetry tracing throughout the Go backend — currently no distributed tracing
- Persistent pipeline state management (currently in-memory, lost on restart)