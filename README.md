# SnapVault

### AI-Powered Event Media Management & Face Recognition Platform

SnapVault is a full-stack MERN application that enables users to discover, organize, and retrieve event photos using facial recognition,  and real-time social interactions. The platform simplifies media management for events by automatically identifying users in uploaded photos and providing personalized photo collections.

---
## Deployed Application
Live Demo: https://snap-vault2-mvuz-git-main-sanvi-jains-projects.vercel.app/login

---

## Demo Video
 Demo Video: https://drive.google.com/file/d/1pV7xsEMA6BIjP9FZp1LfAlLkw4HHNjZK/view?usp=sharing

---
## Features

###  Authentication & Authorization
- Secure user registration and login
- Role-based access control (veiwer,photographers,admin,club members)

###  Event Media Management
- Create and manage events
- Upload photos and videos
- Cloudinary-based media storage
- Event-wise media organization

###  Face Recognition
- User face registration via selfie upload
- Face embedding generation
- Automatic face matching in uploaded media
- Personalized photo retrieval

###  Smart Search
- Search media using tags
- Event-based filtering
- Personalized media discovery

###  Social Features
- Like photos
- Comment on media
- Real-time notifications
- Activity tracking

###  Real-Time Communication
- Socket.IO integration
- Instant notifications
- Live updates for likes and comments

###  Download Management
- Secure media downloads
- Access-controlled media retrieval

###  Admin Dashboard
- Event moderation
- User management
- Media monitoring

---

# 🏗️ System Architecture

```text
                        ┌──────────────┐
                        │   Frontend   │
                        │ React + Vite │
                        └──────┬───────┘
                               │
                               │ REST APIs
                               ▼
                    ┌────────────────────┐
                    │ Express.js Backend │
                    │  Node.js Server    │
                    └─────────┬──────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼

 ┌────────────┐      ┌────────────────┐      ┌─────────────┐
 │ MongoDB    │      │ Cloudinary     │      │ Socket.IO   │
 │ Database   │      │ Media Storage  │      │ Real-Time   │
 └────────────┘      └────────────────┘      └─────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Face Recognition │
                    │ AI Processing    │
                    └──────────────────┘
```

---

# 📂 Project Structure

```bash
SnapVault
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── hooks/
│   │
│   └── public/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── config/
│
└── README.md
```

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Vite
- React Router
- Axios
- Context API
- Socket.IO Client

## Backend
- Node.js
- Express.js
- Socket.IO
- JWT Authentication
- Multer

## Database
- MongoDB Atlas
- Mongoose

## Cloud Services
- Cloudinary
- Render
- Vercel

## AI & Computer Vision
- Face Recognition
- Facial Embeddings

---

# 🌐 Deployment Architecture

```text
Frontend (Vercel)
        │
        ▼
Backend (Render)
        │
        ▼
MongoDB Atlas
        │
        ▼
Cloudinary
```

# 🚀 Local Setup

## Clone Repository

```bash
git clone https://github.com/your-username/snapvault.git
cd snapvault
```

## Backend Setup

```bash
cd backend

npm install

npm run dev
```

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```
---

# 👨‍💻 Author

**Sanvi Jain**
