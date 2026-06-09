# 📸 SnapVault

### AI-Powered Event Media Management & Face Recognition Platform

SnapVault is a full-stack MERN application that enables users to discover, organize, and retrieve event photos using facial recognition, AI-powered tagging, and real-time social interactions. The platform simplifies media management for events by automatically identifying users in uploaded photos and providing personalized photo collections.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Secure user registration and login
- Protected routes
- Role-based access control

### 📷 Event Media Management
- Create and manage events
- Upload photos and videos
- Cloudinary-based media storage
- Event-wise media organization

### 🤖 Face Recognition
- User face registration via selfie upload
- Face embedding generation
- Automatic face matching in uploaded media
- Personalized photo retrieval

### 🔍 Smart Search & AI Tagging
- AI-generated image tags
- Search media using tags
- Event-based filtering
- Personalized media discovery

### ❤️ Social Features
- Like photos
- Comment on media
- Real-time notifications
- Activity tracking

### ⚡ Real-Time Communication
- Socket.IO integration
- Instant notifications
- Live updates for likes and comments

### 📥 Download Management
- Secure media downloads
- Access-controlled media retrieval

### 🛠️ Admin Dashboard
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
- AI-Based Image Tagging

---

# 🔄 Application Workflow

## User Authentication

```text
User → Register/Login
      ↓
JWT Generated
      ↓
Protected Access Granted
```

## Face Registration

```text
Upload Selfie
      ↓
Face Detection
      ↓
Embedding Generation
      ↓
Store Face Vector
```

## Media Upload

```text
Organizer Uploads Media
        ↓
Cloudinary Storage
        ↓
Metadata Stored in MongoDB
        ↓
Face Matching Triggered
```

## Personalized Photo Discovery

```text
User Opens Dashboard
          ↓
Face Matching Performed
          ↓
Relevant Photos Retrieved
          ↓
Displayed to User
```

---

# 🔌 API Modules

| Module | Description |
|----------|-------------|
| Auth API | User Authentication |
| Events API | Event Management |
| Media API | Media Upload & Retrieval |
| Face API | Face Registration & Recognition |
| Search API | Smart Search |
| Tags API | AI Tag Management |
| Social API | Likes, Comments & Notifications |
| Download API | Secure Downloads |
| Admin API | Administrative Controls |

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

---

# ⚙️ Environment Variables

## Frontend

```env
VITE_API_URL=https://your-backend-url/api
VITE_SOCKET_URL=https://your-backend-url
```

## Backend

```env
PORT=8000

MONGO_URI=

JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

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

# 📊 Key Highlights

- AI-Powered Face Recognition
- Event-Based Media Management
- Real-Time Notifications
- JWT Authentication
- Cloudinary Media Storage
- Smart Search & Tagging
- Socket.IO Integration
- MERN Stack Architecture
- Scalable Deployment on Render & Vercel

---

# 📈 Future Enhancements

- Multi-face detection support
- Face clustering for event albums
- AI-powered photo recommendations
- Advanced analytics dashboard
- Bulk download support
- Mobile application support

---

# 👨‍💻 Author

**Sanvi Jain**

Built to simplify event photo discovery through AI-powered facial recognition, intelligent media organization, and seamless real-time user interactions.
