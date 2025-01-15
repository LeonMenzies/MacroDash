#!/bin/bash

# Variables
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
SERVER_USER="leon"
SERVER_IP="172.234.196.74"
SERVER_WEB_DIR="/var/www/html/macro-dash"
SERVER_BACKEND_DIR="/var/www/MacroDash/backend"
NGINX_SERVICE="nginx"
GUNICORN_SERVICE="gunicorn-macro-dash"

# Build the frontend
echo "Building the frontend..."
cd $FRONTEND_DIR
npm install
npm run build -- --env.production
cd ..

# Copy build files to the server
echo "Copying build files to the server..."
scp -r $FRONTEND_DIR/build/* $SERVER_USER@$SERVER_IP:$SERVER_WEB_DIR

# Restart the web server
echo "Restarting Nginx..."
ssh $SERVER_USER@$SERVER_IP "sudo systemctl restart $NGINX_SERVICE"

# Deploy the backend
echo "Deploying the backend..."
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_BACKEND_DIR
    git pull origin master
    source venv/bin/activate
    pip install -r requirements.txt
    sudo systemctl daemon-reload
    sudo systemctl restart $GUNICORN_SERVICE
EOF

echo "Deployment completed successfully."