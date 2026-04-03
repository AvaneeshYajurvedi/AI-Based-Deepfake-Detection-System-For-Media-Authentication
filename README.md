# AI-Based-Deepfake-Detection-System-For-Media-Authentication

DeepShield is a media authentication system that helps detect possible deepfakes in images, audio, and video. It includes a FastAPI backend, a React frontend, report generation, and a verification flow for downloaded reports.

## Team Information

Team Name :- Team Gensis

Team Member :- Ritesh Ubale,
               Himanshu Kulkarni,
               Akhilesh Kotwal,
               Avaneesh Yajurvedi,

## What You Need Before Starting

Install these tools first:

1. Python 3.10 or newer
2. Node.js 18 or newer
3. PostgreSQL 14 or newer
4. Git, if you want to clone the project from GitHub

If you are completely new, install them in this order:

1. Python
2. Node.js
3. PostgreSQL
4. VS Code or any code editor

## Project Structure

- `app/` contains the FastAPI backend
- `frontend/` contains the React user interface
- `outputs/` stores generated reports and analysis files
- `temp/` stores temporary files

## Quick Start

The app has two parts that must run together:

1. Backend API on `http://localhost:8000`
2. Frontend app on `http://localhost:5173`

You must start the backend first, then the frontend.

## Step 1: Open the Project Folder

Open a terminal in the project root folder:

AI-Based-Deepfake-Detection-System-For-Media-Authentication

If you cloned the repository, open that folder directly in VS Code.

## Step 2: Install Python Libraries

The backend uses Python libraries listed in `requirements.txt`.

Run these commands from the project root:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

If `python` does not work on your system, use the Python installation that you already have and make sure it is added to PATH.

## Step 3: Install Frontend Libraries

Open a second terminal and go to the frontend folder:

```powershell
cd frontend
npm install
```

## Step 4: Install PostgreSQL

If PostgreSQL is not installed yet, download and install it from the official PostgreSQL website.

During installation:

1. Choose a password for the `postgres` user
2. Remember the port number, usually `5432`
3. Make sure the PostgreSQL service is running after installation

## Step 5: Create the Database

The backend expects a PostgreSQL database named `deepshield`.

The simplest option is to create it with the default PostgreSQL user:

```sql
CREATE DATABASE deepshield;
```

If you want to use a different username or password, update the `DATABASE_URL` value before starting the backend.

Default connection used by the app:

```text
postgresql+psycopg2://postgres:postgres@localhost:5432/deepshield
```

## Step 6: Optional Environment File

You can create a `.env` file in the project root if you want to override the database settings.

Example:

```env
DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/deepshield
```

If you do not create a `.env` file, the app will use the default connection above.

## Step 7: Start the Backend

From the project root, run:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

What this does:

1. Starts the FastAPI backend
2. Creates database tables automatically on startup
3. Makes the API available at `http://localhost:8000`

You can test the backend in a browser at:

```text
http://localhost:8000/health
```

## Step 8: Start the Frontend

In the `frontend` folder, run:

```powershell
npm run dev
```

Then open:

```text
http://localhost:5173
```

## How to Use the App

1. Open the frontend in your browser
2. Upload an image, audio file, or video file
3. Click Analyze File
4. Review the result shown on screen
5. Generate a verified report if needed
6. Download the verified PDF report if required

## Report Verification

The app can generate verified reports with a file hash and digital signature.

If you download a report and want to check it later, the verification page can confirm whether the report hash is valid.

## Common Problems and Fixes

If the backend does not start:

1. Check that PostgreSQL is running
2. Confirm that the `deepshield` database exists
3. Confirm that your `DATABASE_URL` is correct
4. Make sure Python dependencies were installed successfully

If the frontend does not open:

1. Confirm that you ran `npm install` inside the `frontend` folder
2. Confirm that the frontend terminal is still running
3. Open `http://localhost:5173` manually in the browser

If report generation is slow on the first run:

1. That is normal for a first launch
2. Some models and libraries may take extra time to load the first time

## Useful Commands

Backend health check:

```text
http://localhost:8000/health
```

Run backend:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Run frontend:

```powershell
cd frontend
npm run dev
```

## Notes

- The backend creates database tables automatically when it starts
- The app uses PostgreSQL for verified report storage
- The frontend uses the backend API through the local dev server proxy
- If you change the database password, update `DATABASE_URL` accordingly

## License

This project is licensed under the MIT License.

See the LICENSE file in the project root for full terms.
