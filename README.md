<div align="center">
  <!-- <img src="https://placehold.co/120x120/0f172a/ffffff?text=A" alt="Artgez Logo" width="120" style="border-radius: 20px;" /> -->
  <br/>
  <h1>Artgez</h1>
  <p><strong>India's First Artist Supply Simulator & Pro Sketching Environment</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Status-Active-10b981?style=for-the-badge" alt="Status Active"/>
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14"/>
    <img src="https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge" alt="License MIT"/>
  </p>
</div>

<br/>

## 🚨 The Problem
Artists—both beginners and professionals—waste thousands of rupees buying the wrong art supplies. Traditional e-commerce platforms only show you a static picture of a pencil. You have no idea about its **smudge factor**, **core density**, or how it reacts to **rough vs. smooth paper** until it arrives at your door.

## ✨ The Solution
**Artgez** is a high-fidelity digital Sketch Lab. We reverse-engineered the exact physics and core profiles of real-world art supplies (Graphite, Charcoal, Ink) and paper textures. 
- You test them digitally in our simulated browser canvas.
- You find your perfect match.
- You buy exactly what works for your unique art style.

---

## 🚀 Key Features

* 🧬 **Pencil DNA Profiling:** Every tool is mathematically profiled for Darkness, Softness, Smudge-ability, and Line Weight. Inspect them in an interactive 3D viewer.
* 📝 **Physics-Based Canvas:** Powered by `perfect-freehand` and dynamic WebGL/Canvas grain shaders to simulate actual paper tooth (Fabriano, Canson, Newsprint).
* 🌗 **Immersive Slate Dark Mode:** A distraction-free, professional aesthetic using deep Slate tones for late-night sketching sessions.
* 🤖 **Style Detector AI:** Upload your previous art, and our AI analyzes your strokes to recommend the exact physical supplies you need.
* 💳 **Instant Supply Shop:** Direct Razorpay integration to purchase the exact pencil you just tested.
* 🤝 **Co-Draw Room:** Real-time collaborative canvas for artists to jam together.

---

## 🛠️ Tech Stack

**Frontend**
* ⚡ Next.js 14 (App Router, Turbopack)
* ⚛️ React 18 & TypeScript
* 💅 Tailwind CSS & Framer Motion (for buttery smooth animations)
* 🖌️ HTML5 Canvas API & Perfect-Freehand (Drawing Engine)
* 🧊 Three.js / React Three Fiber (3D Pencil Viewer)

**Backend & Infrastructure**
* 🟢 Node.js & Express.js
* 🗄️ SQLite (via better-sqlite3)
* 💳 Razorpay (Payments)
* 📊 Mixpanel (Telemetry & Analytics)

---

## 📈 Market Opportunity

The art supply market is highly fragmented with terrible D2C discovery. Artgez taps into the massive community of artists by offering a **Try-Before-You-Buy** software layer. 
* **Monetization:** Direct drop-shipping/affiliate sales of art supplies, premium subscriptions for advanced AI tools, and sponsored brand showcases (e.g., Faber-Castell running a virtual booth).
* **Community Loop:** Artists share their digital sketches along with the exact "Supply Loadout" they used, creating a highly engaging social-commerce flywheel.

---

## 💻 Installation & Open Source Contribution

We welcome contributions from the open-source community! Follow these steps to run Artgez locally.

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### 1. Clone the repository
```bash
git clone https://github.com/samay-hash/Artgez.git
cd Artgez
```

### 2. Setup the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000`.*

### 3. Setup the Backend
Open a new terminal window:
```bash
cd backend
npm install
npm run dev
```
*The backend API will run on `http://localhost:8080`.*

### 4. Environment Variables
Create a `.env` file in the root of your `frontend` and `backend` directories and add the necessary keys for Razorpay and Mixpanel (refer to `.env.example` if available).

---

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <p>Made with ❤️ for Artists everywhere.</p>
</div>
