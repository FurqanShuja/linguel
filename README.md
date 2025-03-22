# linguel

To run the backend:

# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

uvicorn main:app --reload

for frontend

# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Create .env file for frontend
echo "VITE_API_URL=http://127.0.0.1:8000" > .env

npm run dev


