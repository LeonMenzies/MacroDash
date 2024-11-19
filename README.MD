## Deployment

### Frontend Deployment

1. **Build the frontend**:

    ```sh
    cd frontend
    npm install
    npm run build
    ```

2. **Copy build files to the server and restart the web server**:
    ```sh
    scp -r build/* leon@172.234.196.74:/var/www/html/
    ssh leon@172.234.196.74
    sudo systemctl restart nginx
    ```

### Backend Deployment

1. **SSH into the server, navigate to the backend directory, and pull the latest code**:

    ```sh
    ssh leon@172.234.196.74
    cd /var/www/MacroDash/backend
    git pull origin master
    ```

2. **Activate virtual environment, install dependencies, reload systemd daemon, and restart Gunicorn**:
    ```sh
    source venv/bin/activate
    pip install -r requirements.txt
    sudo systemctl daemon-reload
    sudo systemctl restart gunicorn
    ```
