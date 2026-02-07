# Tidal Cassini - Inventory Management System

A Docker-based inventory management system for trophy retailers.

## Features

- **Inventory Tracking**: Monitor stock levels, cost prices, and selling prices.
- **Point of Sale (POS)**: Type-ahead product search, customer linking, payment tracking.
- **Customer Ledger**: Track dues and advances per customer.
- **Purchase Orders**: Import via Excel, track vendor purchases.
- **Vendor Management**: Manage supplier contacts.
- **Sales History**: Filter by date, customer, and invoice.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Python FastAPI
- **Database**: SQLite (persisted via Docker volumes)
- **Deployment**: Docker Compose

## Getting Started

### Prerequisites

- Docker Desktop

### Run the Application

```bash
docker-compose up -d --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

## Project Structure

```
tidal-cassini/
├── backend/           # FastAPI app
│   ├── routers/       # API endpoints
│   ├── models.py      # SQLAlchemy models
│   └── schemas.py     # Pydantic schemas
├── frontend/          # React app
│   └── src/pages/     # UI pages
├── docker-compose.yml
└── README.md
```

## License

MIT
