# TAREUS - Project and Task Management System

TAREUS is a complete web application for project and task management with a Kanban board, developed with Node.js, Express, Sequelize, and Vue.js.

## How to run the project

### Prerequisites
- Node.js
- Docker and Docker Compose

### Installation and configuration

1. **Clone the repositories**
   ```bash
   # Clone the backend
   git clone https://github.com/samuelpastor31/tareus_back.git
   cd tareus_back
   
   # In another location, clone the frontend
   git clone https://github.com/samuelpastor31/tareus_front.git
   ```

2. **Configure the database**
   ```bash
   # From the tareus_back directory
   docker-compose up -d
   ```

3. **Install backend dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   - Make sure the `.env` file is configured with the database credentials (copy it from .env.example)

5. **Run migrations and seeders (optional)**
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

6. **Run the backend server**
   ```bash
   node index.js
   ```

7. **Install frontend dependencies** (in another terminal)
   ```bash
   # From the tareus_front directory
   cd ../tareus_front  # or the path where you cloned the frontend
   npm install
   ```

8. **Run the frontend development server**
   ```bash
   npm run dev
   ```

### Access URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api-docs

### Run tests
```bash
# From the tareus_back directory
npm test
# or
npx vitest
```

## 🔗 Repositories

This project is divided into two separate repositories:

- **Backend (REST API)**: [https://github.com/samuelpastor31/tareus_back](https://github.com/samuelpastor31/tareus_back)
- **Frontend (Vue.js)**: [https://github.com/samuelpastor31/tareus_front](https://github.com/samuelpastor31/tareus_front)

For the complete functionality of the application, you need to clone and run both repositories.

## 📋 Main Features

### 1. Authentication and users

- Users can register with email and password
- They can log in and obtain an authentication token
- Each user can create projects (becoming the owner) and can also be assigned to other users' projects

### 2. Projects
- Each project has an owner (user who creates it)
- The owner can assign other users to the project and assign permissions: view, create, edit tasks
- To delete tasks they must have create permission
- The owner has all permissions by default

### 3. Cards
- Cards belong to a project (one-to-many relationship)
- They represent columns in the Kanban board (for example: "To Do", "In Progress", "Completed")
- Each card has a name, optional description and a position that determines its order on the board
- The position is automatically assigned as the number of existing cards in the project + 1
- Cards can contain multiple tasks

### 4. Tasks
- Tasks belong to a project (one-to-many relationship)
- Tasks can be assigned to specific cards (one-to-many relationship)
- Fields: priority (high, medium, low), status (pending, in progress, completed), creator, last updater, assigned user (optional)
- They can be sorted by priority
- Users with "create" or "edit" permission can assign tasks to themselves or assign tasks to other users in the project who also have permissions

### 5. Comments
- Users can add comments to tasks
- Each comment includes the user who created it and the creation date
- Only users with view permissions can see comments


## 📁 Project structure

### Backend (separate repository)
```
tareus_back/
├── config/           # Database configuration
├── middlewares/      # Custom middlewares
├── migrations/       # Sequelize migrations
├── models/           # Sequelize models
├── routes/           # API routes
├── schemes/          # AJV validation schemas
├── seeders/          # Initial data seeders
├── tests/            # Automated tests
├── utils/            # Utilities and helpers
├── swaggers/         # Swagger documentation configuration
├── docker-compose.yml # Docker configuration
└── index.js          # Application entry point
```

### Frontend (this repository)
```
tareus_front/
├── src/
│   ├── components/   # Vue components
│   ├── views/        # Views/pages
│   ├── stores/       # Pinia stores
│   ├── services/     # API services
│   └── router/       # Route configuration
├── public/           # Static files
└── vite.config.js    # Vite configuration
```

## 📝 Additional notes

- The application uses JWT token-based authentication
- Tests include automatic database configuration
- Complete API documentation is available through Swagger UI at `/api-docs`
- The project includes seeders for test data
- The database runs in Docker to facilitate development
- For production, configure the appropriate environment variables