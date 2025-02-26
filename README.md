# Container-Shipment-Tracking-System
# 📦 Container Shipment Tracking System

## 🚀 Overview
This project is a **backend system for container shipment tracking**, designed with two user roles:
- **Logistic Service Providers (LSPs)** can **add, update, delete, and manage** container availability.
- **Traders** can **view available containers and book them** for shipments.
- **AI-powered container recommendation system** helps traders select the best container.

---

## 🎯 Features
### **1️⃣ User Management**
✅ User registration & login with **JWT authentication**  
✅ Role-based access (**Trader & LSP**)  
✅ LSPs must **approve Traders** before they can book containers  
✅ Password hashing for security  

### **2️⃣ Container Management (LSP Only)**
✅ **Add, update, delete, and manage containers**  
✅ Containers start as **available** and change status when booked  
✅ Prevent **duplicate container names** per LSP  

### **3️⃣ Booking System (Trader Only)**
✅ **Only verified Traders can book containers**  
✅ Booking status: `pending`, `confirmed`, `canceled`  
✅ **Auto-cancel bookings** after 24 hours if not confirmed  
✅ Prevent **double booking** of the same container  
✅ Booking history tracking  

### **4️⃣ AI-Powered Container Suggestions**
✅ AI recommends **best available containers** based on cargo type & destination  
✅ Ensures optimal shipping choices for traders  

### **5️⃣ LSP Analytics Dashboard**
✅ Track **total containers, pending & confirmed bookings**  
✅ Monitor **availability & booking trends**  

### **6️⃣ Security & Optimization**
✅ **JWT-based authentication & authorization**  
✅ **Redis caching** for optimized container search  
✅ **Rate limiting** to prevent abuse  
✅ Fully **RESTful API** with **PostgreSQL** (via Supabase)  

---

## 🛠 Tech Stack
- **Backend:** Node.js, Express.js, Supabase (PostgreSQL)
- **Authentication:** JWT, Bcrypt
- **Caching:** Redis
- **AI Model:** Integrated for **container recommendation**
- **Deployment:** Docker, AWS (Optional)

---

## 🛠 Installation & Setup
### **1️⃣ Clone the repository**
```sh
git clone https://github.com/yourusername/container-tracking-system.git
cd container-tracking-system
```

### **2️⃣ Install dependencies**
```sh
npm install
```

### **3️⃣ Configure environment variables (`.env`)**
```env
PORT=5000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret
```

### **4️⃣ Start the server**
```sh
npm start
```

---

## 📡 API Endpoints
### **🛠 Authentication**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/auth/register` | Register user (Trader/LSP) |
| `POST` | `/api/auth/login` | Login user |

### **📦 Containers (LSP Only)**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/containers/add` | Add a new container |
| `PUT` | `/api/containers/:id` | Update a container |
| `DELETE` | `/api/containers/:id` | Delete a container |
| `GET` | `/api/containers` | Get all containers |

### **🚢 Booking System (Trader Only)**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/containers/book` | Book a container |
| `POST` | `/api/containers/cancel` | Cancel a booking |
| `POST` | `/api/containers/auto-cancel` | Auto-cancel unconfirmed bookings |

### **🤖 AI Model**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/ai/suggest-container` | Get AI-based container recommendations |

### **📊 Analytics (LSP Only)**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/lsp/analytics` | Get LSP analytics overview |

---

## 🛠 Testing in Postman
1️⃣ **Register a Trader**
```json
{
    "email": "trader@example.com",
    "password": "123456",
    "role": "Trader"
}
```
2️⃣ **Register an LSP**
```json
{
    "email": "lsp@example.com",
    "password": "password",
    "role": "LSP"
}
```
3️⃣ **LSP Approves Trader**
```http
POST /api/users/approve/:trader_id
```
4️⃣ **LSP Adds Containers**
```json
{
    "name": "Container 1",
    "capacity": "20ft"
}
```
5️⃣ **Trader Books a Container**
```json
{
    "container_id": "your-container-id"
}
```

---

## 🤝 Contributing
1️⃣ Fork the repository  
2️⃣ Create a new branch (`git checkout -b feature-name`)  
3️⃣ Commit your changes (`git commit -m 'Add new feature'`)  
4️⃣ Push to your branch (`git push origin feature-name`)  
5️⃣ Open a **Pull Request**  

---

## 📄 License
This project is **MIT Licensed**.

---

## 🌟 Show Your Support
Give a ⭐️ if you like this project! 🚀

