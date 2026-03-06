# Real Estate CRM - MERN Stack Application

A comprehensive Real Estate Customer Relationship Management system built with MongoDB, Express, React, and Node.js. Features include lead management, property listings, deal tracking, agent performance monitoring, and activity scheduling.

## 🏠 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Agent)
- Secure password hashing with bcryptjs

### Lead Management
- CRUD operations for leads
- Kanban board view with drag-and-drop
- Lead pipeline stages (New, Contacted, Visit, Negotiation, Closed, Lost)
- Lead assignment to agents
- Advanced filtering and search

### Property Management
- Add/Edit/Delete properties
- Image upload functionality
- Property status tracking (Available, Sold, Rented, Under Contract)
- Property categorization (Apartment, House, Villa, Commercial, Land)
- Search and filter capabilities

### Deal Pipeline
- Track commission and deal value
- Deal pipeline visualization
- Closing date management
- Deal stages tracking
- Revenue analytics

### Agent Management
- Add and manage agents
- Performance tracking
- Commission calculation
- Deal and revenue statistics

### Activity Management
- Task scheduling and tracking
- Activity types (Call, Email, Meeting, Site Visit, Note, Task, Reminder)
- Priority levels
- Activity completion tracking

### Dashboard & Analytics
- Real-time statistics
- Revenue charts
- Deal pipeline visualization
- Recent activities and leads
- Performance metrics

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Heroicons** - Icon library
- **Recharts** - Data visualization
- **React Hook Form** - Form handling
- **React Beautiful DND** - Drag and drop
- **Axios** - HTTP client

## 📁 Project Structure

```
CRM/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Configuration files
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Server entry point
│   ├── uploads/            # File upload directory
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   ├── assets/         # Static assets
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CRM
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env file with your MongoDB URI and JWT secret
```

Environment Variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/real-estate-crm
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/agent),
  phone: String,
  avatar: String,
  isActive: Boolean,
  commission: Number,
  totalDeals: Number,
  totalRevenue: Number
}
```

### Leads Collection
```javascript
{
  name: String,
  email: String,
  phone: String,
  source: String,
  status: String,
  priority: String,
  budget: { min: Number, max: Number },
  preferredPropertyType: String,
  preferredLocation: String,
  assignedAgent: ObjectId (ref: User),
  notes: String,
  tags: [String],
  lastContactDate: Date,
  nextFollowUp: Date
}
```

### Properties Collection
```javascript
{
  title: String,
  description: String,
  type: String,
  status: String,
  price: Number,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  features: {
    bedrooms: Number,
    bathrooms: Number,
    area: Number,
    parking: Number,
    yearBuilt: Number
  },
  amenities: [String],
  images: [{
    url: String,
    publicId: String,
    isMain: Boolean
  }],
  listedBy: ObjectId (ref: User),
  views: Number,
  isFeatured: Boolean
}
```

### Deals Collection
```javascript
{
  title: String,
  lead: ObjectId (ref: Lead),
  property: ObjectId (ref: Property),
  agent: ObjectId (ref: User),
  status: String,
  dealValue: Number,
  commissionRate: Number,
  commissionAmount: Number,
  closingDate: Date,
  expectedClosingDate: Date,
  contractDate: Date,
  notes: String,
  documents: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  pipelineStage: String
}
```

### Activities Collection
```javascript
{
  type: String,
  title: String,
  description: String,
  lead: ObjectId (ref: Lead),
  deal: ObjectId (ref: Deal),
  property: ObjectId (ref: Property),
  assignedTo: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  status: String,
  priority: String,
  dueDate: Date,
  completedAt: Date,
  duration: Number,
  outcome: String,
  tags: [String]
}
```

## 🔐 Default Login Credentials

For demonstration purposes, you can use these credentials:

**Admin Account:**
- Email: admin@estatecrm.com
- Password: admin123

## 🎨 UI Features

- **Modern SaaS Design**: Clean, professional interface with gold and black luxury theme
- **Glassmorphism Login**: Beautiful login page with real estate building background
- **Dark Sidebar**: Navigation with active state indicators
- **Responsive Design**: Fully responsive layout for all screen sizes
- **Interactive Charts**: Revenue and deal pipeline visualizations
- **Kanban Boards**: Drag-and-drop lead and deal management
- **Real-time Updates**: Live statistics and activity tracking

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/kanban` - Get leads for Kanban board
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create property (with image upload)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Deals
- `GET /api/deals` - Get all deals
- `GET /api/deals/pipeline/data` - Get pipeline data
- `GET /api/deals/:id` - Get deal by ID
- `POST /api/deals` - Create deal
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Activities
- `GET /api/activities` - Get all activities
- `GET /api/activities/today/list` - Get today's activities
- `GET /api/activities/:id` - Get activity by ID
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

## 🔧 Development

### Adding New Features
1. Create new Mongoose model in `backend/src/models/`
2. Create controller functions in `backend/src/controllers/`
3. Define API routes in `backend/src/routes/`
4. Create React components in `frontend/src/components/` or `frontend/src/pages/`
5. Add routing in `frontend/src/App.js`

### Code Style
- Backend: ES6+ with async/await
- Frontend: Functional components with hooks
- Styling: Tailwind CSS utility classes
- Error handling: Try-catch blocks with user-friendly messages

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.
#   R e a l - e s t a t e - C r m  
 