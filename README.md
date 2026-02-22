# ThreatLens: AI-Powered Spatial Surveillance

**Overview**
ThreatLens is a local-first, spatial surveillance dashboard that maps live camera feeds directly onto physical blueprints. Powered by Vision-Language Models (VLMs), it monitors custom, natural-language rules and filters out the noise—alerting you only when true security violations occur.

Built entirely offline with Ollama and PostgreSQL, ThreatLens ensures zero data leakage by processing all video feeds strictly on-device.

### Core Features

* **100% Local & Privacy-First:** Your sensitive camera streams, blueprints, and incident logs never leave the machine.
* **Multi-Blueprint Mapping:** Upload multiple floor plans to manage complex environments. Drag, drop, and rotate USB or HTTPS cameras onto the canvas for accurate spatial tracking.
* **Blindspot Simulation:** Visually overlay the calculated field-of-view for all active cameras to instantly identify unmonitored security gaps.
* **Custom AI Logic:** Write natural-language rules for specific cameras (e.g., *"Alert if someone walks behind the counter"*). The local VLM continuously watches and flags broken rules instantly.
* **Dynamic Severity Classification:** Detected events are auto-categorized into Low, Medium, or High-risk tiers based on user-defined rule weights or AI-driven contextual evaluation.
* **Rich Event Timelines & Filtering:** Every violation generates a color-coded incident report with a frame snapshot, timestamp, and AI explanation. Users can pinpoint specific incidents instantly using robust **date and time filtering**.
* **Conversational AI & SMS Alerts:** Ask the global chat assistant to summarize active threats or dismiss incidents. Attach a phone number to receive real-time text breakdowns of critical events.

---

### The Dashboard Flow

**1. Global Command Center (Main Screen)**

* **The Canvas:** Seamlessly toggle between floor plans (e.g., Floor 1, Parking Garage). View all mapped cameras and their live streams overlaid in their actual physical locations.
* **Global Activity Panel:** A unified sidebar feed allowing users to triage High, Medium, and Low severity events system-wide at a single glance.

**2. Investigation View (`/stream/[camera_id]`)**

* **Scoped Context:** Click any camera to isolate its live feed and sync the blueprint view.
* **Rule Configuration:** Manage specific AI rules and assign custom severity weights for that exact location.
* **Local Activity Panel:** Automatically scopes the threat feed to show only the violations captured by this specific camera.