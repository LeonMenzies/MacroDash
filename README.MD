### Backend

# Setup Instructions

## Backend

### Activate virtual environment
```sh
source venv/bin/activate
```

### Install dependencies
```sh
pip install -r requirements.txt
```

### Verify installation
```sh
pip list
```

### Run the backend server
```sh
python manage.py runserver
```

### Deactivate virtual environment
```sh
deactivate
```

## Frontend

### Navigate to the frontend directory
```sh
cd frontend
```

### Install dependencies
```sh
npm install
```

### Start the frontend server
```sh
npm start
```

### Build the frontend for production (optional)
```sh
npm run build
```

## Additional Information

- Ensure you have Python, Node.js, and npm installed on your machine.
- For backend, you might need to set environment variables. You can create a `.env` file in the backend directory with the necessary variables.
- For frontend, you can customize the npm scripts in the `package.json` file as needed.

