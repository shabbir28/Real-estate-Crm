# 🏠 Real Estate CRM - Premium MERN Stack Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/Version-1.0.0-gold)
![Status](https://img.shields.io/badge/Status-Development-blue)

A professional, high-end Customer Relationship Management system tailored for the real estate industry. Built with the **MERN** stack (MongoDB, Express, React, Node.js), this platform offers a sleek, luxury-themed interface for managing leads, properties, and sales pipelines.

---

## ✨ Key Features

- 💎 **Premium UI/UX**: Clean, luxury design with a gold and black aesthetic.
- 📋 **Lead Management**: Complete CRM lifecycle from discovery to closing.
- 🏗️ **Property Catalog**: Manage listings with image uploads and rich details.
- 📈 **Sales Pipeline**: Visualize deals with interactive Kanban boards and analytics.
- 🎭 **Role-Based Access**: Secure environments for both Admins and Agents.
- ⚡ **Real-time Metrics**: Live-updating dashboards with Recharts visualization.

---

## 🛠 Tech Stack

| Frontend | Backend | Infrastructure |
| :--- | :--- | :--- |
| React 18+ (Vite) | Node.js (Express) | MongoDB (Atlas) |
| Tailwind CSS | Mongoose ODM | Cloudinary / Multer |
| Recharts | JWT Auth | bcryptjs |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 2. Setup
```bash
# Clone the repository
git clone <repository-url>
cd CRM

# Install dependencies for both ends
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Config
Create a `.env` file in the `backend/` directory:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 4. Run Application
Run the backend and frontend in separate terminals:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start
```

---

## 📚 Documentation

Detailed documentation is available in the following guides:

- 🏗️ **[Architecture Overview](ARCHITECTURE.md)**: Deep dive into the system design and data flow.
- 🔌 **[API Reference](docs/API_REFERENCE.md)**: Documentation of all REST endpoints and schemas.
- 🤝 **[Contributing Guide](CONTRIBUTING.md)**: How to set up development, code standards, and PR process.
- 📜 **[License](LICENSE)**: MIT License details.

---

## 👤 Default Credentials (Demo)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@estatecrm.com` | `admin123` |

---

## 📞 Support & Community

- 🐛 **Bugs**: Open an issue in the repository.
- 💡 **Feedback**: We'd love to hear your suggestions!

---

*Built with ❤️ for the Modern Real Estate Professional.*