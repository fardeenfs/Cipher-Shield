# ThreatLens: AI Powered Spatial Surveillance

**Overview**
ThreatLens is an intelligent, spatial surveillance dashboard that moves beyond traditional security monitoring. By mapping live camera feeds directly onto physical blueprints and allowing users to define custom, natural language monitoring rules, ThreatLens filters out the noise and only alerts users when true logical contradictions or security violations occur.

Built entirely as a local first application, ThreatLens ensures zero data leakage by processing all video feeds on device.

### Core Features

* **100% Local & Privacy First:** Powered by **Ollama**, ThreatLens runs Vision Language Models (VLMs) directly on your local machine. Combined with a local PostgreSQL database for state and event storage, your sensitive camera streams, blueprints, and incident logs never leave the device.
* **Interactive Blueprint Mapping:** Users can upload floor plans and integrate any USB or HTTPS enabled camera. Using a drag and drop interface, cameras can be placed on the blueprint, rotated to match their real world orientation, and locked into place for accurate spatial tracking.
* **Blindspot Simulation Mode:** A built in visualization tool that overlays the calculated field of view for all active cameras onto the blueprint, instantly highlighting unmonitored areas and security blind spots.
* **Custom AI Logic Rules:** Users can define specific, natural language prompts for what a camera should watch for (e.g., "Alert if someone walks behind the counter"). If a custom rule is broken, the local VLM immediately flags it.
* **Rich Event Timelines:** When a violation is detected, the event stream generates a comprehensive incident report containing the exact date and time, a snapshot of the violated frame, a generated title, and an AI description explaining exactly how the frame violates the rule.
* **Conversational AI Assistant:** A globally accessible chat interface anchored at the bottom of the screen. Users can converse with the AI to get rapid summaries of all active threats across the building or command the AI to resolve and dismiss incidents from the sidebar.
* **Real Time SMS Alerts:** Users can attach a phone number to the system to receive immediate, realtime text message breakdowns of incidents as they are caught by the event stream.

---

### The User Experience (UI/UX Flow)

**1. The Global Command Center (Main Screen)**

* **The Canvas:** Displays the active blueprint with all mapped cameras and their live streams overlaid in their physical locations. Selecting a camera dynamically syncs the view to its associated floor plan.
* **Global Activity Panel (Right Sidebar):** A continuous feed of all violations and suspicious activities detected across the entire network of cameras.

**2. The Investigation View (`/stream/[camera_id]`)**

* **Scoped Context:** Clicking a specific camera stream isolates the view.
* **Rule Configuration:** Users can manage and assign the specific AI rules that this individual camera should monitor.
* **Local Activity Panel (Right Sidebar):** The threat feed automatically filters to show only the events, violations, and broken rules captured by this specific camera.

