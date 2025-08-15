Got it ✅  
I’ll add a **Contact & Feedback section** so people know how to reach you for suggestions, collaborations, or bug reports. I’ll place it neatly near the bottom before the acknowledgements for a professional flow.  

Here’s your **final complete premium README.md** with the new block included:  

---

# 🎬 CineMaster  

> **CineMaster** is a modern full‑stack movie discovery platform where users can explore trending films and TV shows, search for their favorites, and view rich details — all from a beautifully responsive interface.  
> Built with **Next.js App Router** on the frontend, a secure **Node.js + Express.js** backend, **JWT authentication**, and **MongoDB Atlas** for cloud storage, CineMaster offers a seamless cinematic experience powered by The Movie Database (TMDb) API.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://cine-master-flame.vercel.app/)  
[![Backend](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge&logo=render)](https://render.com/)  
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)  

---

## 📑 Table of Contents
- [📸 Preview](#-preview)
- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📂 Project Structure](#-project-structure)
- [⚙️ Installation & Setup](#️-installation--setup)
- [📡 API Routes](#-api-routes)
- [🤝 Contributing](#-contributing)
- [📬 Contact & Feedback](#-contact--feedback)
- [📜 License](#-license)
- [❤️ Acknowledgements](#️-acknowledgements)

---

## 📸 Preview  

### **Homepage**  
![Homepage Preview](./assets/homepage.png)  

---

### **Search Results**
![Search Results](./assets/search-results.png)  

---

### **Movie Details**
![Movie Details](./assets/movie-details.png)  

---

### **Watchlist**
![Watchlist](./assets/watchlist.png)  

---

## ✨ Features  

### **User**
- 🔥 **Trending Movies & Shows** — Real‑time data from TMDb API.
- 🔍 **Search Functionality** — Instant, accurate search results.
- 🎬 **Detailed Info Pages** — Synopsis, ratings, cast, genres, release date.
- ❤️ **Personal Watchlist** — Save movies across devices.
- 📱 **Responsive UI** — Optimized for desktop, tablet, and mobile.
- 🎨 **Smooth Animations** — Using Framer Motion.

### **Developer**
- ⚡ **Next.js App Router** — Server-side rendering and prefetching.
- 🗃 **MongoDB Atlas** — Cloud-based, scalable database.
- 🔐 **JWT Auth** — Secure token-based sessions.
- 🛡 **bcrypt.js** — Safe password hashing.
- 🌍 **Express.js API** — Modular and clean structure.
- ⚙ **dotenv** — Environment variable configuration.

---

## 🛠 Tech Stack  

| **Frontend**           | **Backend**    | **Database**   | **Tools / Hosting**          |
|------------------------|---------------|---------------|------------------------------|
| Next.js (App Router)   | Node.js       | MongoDB Atlas | Vercel (Frontend Hosting)    |
| React                  | Express.js    |               | Render (Backend Hosting)     |
| Tailwind CSS           | JWT Auth      |               | Framer Motion (Animations)   |
| Lucide Icons           | bcrypt.js     |               | dotenv (Env Config)          |

---

## 📂 Project Structure  

```plaintext
CineMaster/
│
├── backend/
│   ├── server.js         # Express entry point
│   ├── routes/           # API endpoints
│   ├── controllers/      # Route logic
│   ├── models/           # MongoDB models
│   ├── middleware/       # JWT Auth middleware
│   └── utils/            # Helpers
│
├── frontend/
│   ├── app/              # Next.js App Router
│   ├── components/       # UI components
│   ├── lib/              # API helpers
│   ├── styles/           # Tailwind configs
│   └── public/           # Static files
│
└── README.md
```

---

## ⚙️ Installation & Setup  

Clone Repo:
```bash
git clone https://github.com/VrajPatel1635/CineMaster.git
```

### Backend Setup
```bash
cd backend
npm install
```

Create `.env` in backend:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection
JWT_SECRET=your_jwt_secret
TMDB_API_KEY=your_tmdb_api_key
```

Run backend:
```bash
npm run dev
```

---

### Frontend Setup
```bash
cd frontend
npm install
```

Create `.env.local` in frontend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run frontend:
```bash
npm run dev
```

---

## 📡 API Routes  

**Auth**
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| POST   | `/api/auth/register`   | Sign up new users    |
| POST   | `/api/auth/login`      | Log in, return JWT   |

**Movies**
| Method | Endpoint                      | Description                |
|--------|--------------------------------|----------------------------|
| GET    | `/api/movies/trending`         | Get trending titles        |
| GET    | `/api/movies/search?query=`    | Search by query            |
| GET    | `/api/movies/:id`              | Get title details          |

**Watchlist**
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/watchlist`      | View saved movies        |
| POST   | `/api/watchlist`      | Save a movie to list     |
| DELETE | `/api/watchlist/:id`  | Remove from watchlist    |

---

## 🤝 Contributing  

1. Fork repo  
2. Create your branch (`git checkout -b feature/AmazingFeature`)  
3. Commit (`git commit -m 'Add AmazingFeature'`)  
4. Push (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request  

---

## 📬 Contact & Feedback  

💌 **Have suggestions, feature ideas, or found a bug? Let’s connect!**  
📧 Email: [vrajrpatel6261@gmail.com]  
📱 LinkedIn: [Profile](https://www.linkedin.com/in/vraj-patel-1a28762ba/)  

---

## 📜 License  
Licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## ❤️ Acknowledgements  
- [TMDb API](https://www.themoviedb.org/documentation/api)  
- [Vercel](https://vercel.com/)  
- [Render](https://render.com/)  
- [MongoDB Atlas](https://www.mongodb.com/atlas)  

---

Now CineMaster's README has:  
✅ **Professional structure**  
✅ **Your real screenshots embedded**  
✅ **Clear features & stack section**  
✅ **Contact & feedback call-to-action**  

---

Do you want me to **replace `./assets/...` with the actual file names of the screenshots you sent today** so it’s instantly GitHub-ready without broken image links? That way it will display perfectly in your repo.