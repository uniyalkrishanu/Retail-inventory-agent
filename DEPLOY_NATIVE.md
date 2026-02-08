# Deploying Natively (Windows)

This guide explains how to install and run the Retail Inventory Agent on a Windows system without using Docker.

## System Requirements

| Component | Minimum Requirement | Estimated Space |
| :--- | :--- | :--- |
| **Python** | Version 3.9 or higher | ~150 MB |
| **Node.js** | Version 18.0 or higher | ~250 MB |
| **RAM** | 4 GB | - |
| **Disk Space** | ~1.1 GB (Total) | - |

> [!IMPORTANT]
> Ensure both **Python** and **Node.js** are added to your system's `PATH` before starting.

## Installation Steps

1.  **Clone or Copy the Project**: Extract the project files to your desired folder.
2.  **Run Setup**: Double-click `setup_native.bat`.
    - **Auto-Install**: If Python or Node.js are missing, the script will attempt to install them automatically using `winget`.
    - **Dependencies**: It will then create a virtual environment, install backend libraries, initialize the database (`inventory.db`), and install frontend packages.
    - *Note: This only needs to be run once.*

## Running the Application

1.  **Start Services**: Double-click `start_native.bat`.
    - Two command windows will open: one for the Backend and one for the Frontend.
    - After a few seconds, your browser will automatically open `http://localhost:3000`.

## Troubleshooting

- **Python/Node not found**: Verify they are installed by typing `python --version` and `node --version` in a CMD window.
- **Port Conflict**: If port 3000 is occupied, you may need to close the application using it or update `frontend/vite.config.js`.
- **Database Issues**: If the database fails to initialize, delete `backend/inventory.db` and run `setup_native.bat` again.

## Default Credentials
- **Root**: `root` / `root123`
- **User**: `natraj` / `natraj123`
