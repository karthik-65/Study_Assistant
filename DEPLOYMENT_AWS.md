# AWS EC2 + Docker + AWS RDS MySQL Deployment Guide

This guide walks you through deploying the **AI Study Assistant** using the following architecture:

```
                         USERS
                           │
                           │ HTTPS (443)
                           ▼
                    ┌─────────────┐
                    │   AWS EC2   │
                    │   Ubuntu    │
                    └──────┬──────┘
                           │
                         Docker
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
            React + Nginx       FastAPI
              Container        Container
              (Port 80)        (Port 8000)
                                    │
                                    │ MySQL (Port 3306)
                                    ▼
                              ┌───────────┐
                              │ AWS RDS   │
                              │   MySQL   │
                              └───────────┘
```

---

## 📋 Prerequisites

1. An **AWS Account** with access to EC2 and RDS.
2. An SSH Key Pair (`.pem` file) for EC2 access.
3. A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey).
4. (Optional) A Domain name pointing to your EC2 Elastic IP for HTTPS.

---

## 🗄️ Step 1: Set Up AWS RDS (MySQL Database)

1. Open the **AWS RDS Console** and click **Create database**.
2. **Engine type**: Select **MySQL**.
3. **Template**: Choose **Free tier** (or Production/Dev according to your budget).
4. **Settings**:
   - **DB instance identifier**: `study-assistant-db`
   - **Master username**: `admin` (or your preferred username)
   - **Master password**: Choose a strong password and save it securely.
5. **Instance configuration**: `db.t3.micro` or `db.t4g.micro`.
6. **Connectivity**:
   - **VPC**: Choose your default VPC (must match your EC2 VPC).
   - **Public access**: Choose **No** (best security practice—only your EC2 instance will access it).
   - **VPC security group**: Choose or create a new Security Group named `rds-study-assistant-sg`.
7. **Additional configuration**:
   - **Initial database name**: `study_assistant`
8. Click **Create database**.
9. Once the database status changes to **Available**, copy the **Endpoint** (e.g. `study-assistant-db.c123456789.us-east-1.rds.amazonaws.com`).

---

## 🖥️ Step 2: Launch AWS EC2 Instance (Ubuntu)

1. Open the **AWS EC2 Console** and click **Launch Instance**.
2. **Name**: `study-assistant-server`.
3. **AMI**: **Ubuntu Server 24.04 LTS** (or 22.04 LTS).
4. **Instance type**: `t3.small` (recommended for LangChain RAG embedding processing) or `t2.micro` (Free Tier).
5. **Key pair**: Select your existing key pair or create a new one (download the `.pem` file).
6. **Network settings (Security Group)**:
   Create a Security Group `ec2-study-assistant-sg` and allow:
   - **SSH** (Port 22) - From `My IP` (or `0.0.0.0/0` if dynamic IP).
   - **HTTP** (Port 80) - From `0.0.0.0/0` (Anywhere).
   - **HTTPS** (Port 443) - From `0.0.0.0/0` (Anywhere).
7. **Storage**: At least **20 GB gp3 SSD**.
8. Click **Launch Instance**.

### Connect RDS Security Group to EC2 Security Group:
1. Go to **AWS RDS** > Databases > `study-assistant-db` > Connectivity & security.
2. Click the Security Group link under **VPC security groups** (`rds-study-assistant-sg`).
3. Click **Edit inbound rules** and add:
   - **Type**: `MySQL/Aurora` (Port `3306`)
   - **Source**: Select **Custom** and enter the Security Group ID of your EC2 instance (e.g., `sg-0123456789abcdef0` - `ec2-study-assistant-sg`).
4. Click **Save rules**. Now your EC2 instance can securely query RDS!

---

## 🌐 Step 3: Allocate Elastic IP (Static IP)

1. In EC2 Console, go to **Network & Security** > **Elastic IPs**.
2. Click **Allocate Elastic IP address** > **Allocate**.
3. Select the allocated IP, click **Actions** > **Associate Elastic IP address**.
4. Choose your running EC2 instance and click **Associate**.

---

## ⚡ Step 4: Configure EC2 & Install Docker

1. Connect to your EC2 instance from your terminal:
   ```bash
   chmod 400 your-key.pem
   ssh -i your-key.pem ubuntu@<YOUR_EC2_ELASTIC_IP>
   ```

2. Update system packages and install Docker + Docker Compose plugin:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y ca-certificates curl gnupg lsb-release

   # Add Docker GPG key & repository
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg

   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

   # Allow running docker without sudo
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. Verify Docker installation:
   ```bash
   docker --version
   docker compose version
   ```

---

## 📦 Step 5: Clone Project & Configure Environment

1. Clone your GitHub repository on EC2:
   ```bash
   git clone https://github.com/karthik-65/Study_Assistant.git
   cd Study_Assistant
   ```

2. Create and configure `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   nano backend/.env
   ```

3. Set your production values in `backend/.env`:
   ```env
   # Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash

   # AWS RDS MySQL Configuration
   MYSQL_HOST=your-rds-endpoint.c123456789.us-east-1.rds.amazonaws.com
   MYSQL_PORT=3306
   MYSQL_USER=admin
   MYSQL_PASSWORD=your_secure_rds_password
   MYSQL_DATABASE=study_assistant

   # JWT Secret Key
   JWT_SECRET=generate_a_long_random_secret_string_here_2026
   ```
   *(Press `Ctrl + O`, then `Enter` to save, and `Ctrl + X` to exit `nano`).*

---

## 🚀 Step 6: Build & Start Containers

Run Docker Compose to build and start both the **React + Nginx** frontend and **FastAPI** backend:

```bash
docker compose up -d --build
```

### Check Container Status:
```bash
docker compose ps
```

You should see:
```
NAME                       IMAGE                        STATUS         PORTS
study_assistant_backend    study_assistant-backend     Up (healthy)   8000/tcp
study_assistant_frontend   study_assistant-frontend    Up             0.0.0.0:80->80/tcp
```

### View Live Logs:
```bash
docker compose logs -f
```

Your app is now live at: `http://<YOUR_EC2_ELASTIC_IP>` !

---

## 🔒 Step 7: Configure HTTPS with Free SSL (Let's Encrypt / Certbot)

To secure your site with HTTPS (`https://yourdomain.com`):

### Option A: Using Certbot Directly on Host (Recommended & Simplest)

1. Point your domain's **DNS A Record** to your EC2 Elastic IP.
2. Install Certbot on the Ubuntu host:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
3. Stop the Docker frontend temporarily to bind port 80 for SSL certification:
   ```bash
   docker compose stop frontend
   ```
4. Obtain the SSL Certificate:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```
5. Mount the certificates into your Nginx container or use host Nginx as an SSL reverse proxy to port 80.

---

### Option B: Using AWS Application Load Balancer (ALB)
If you prefer AWS to handle SSL certificates:
1. In **AWS Certificate Manager (ACM)**, request a public certificate for your domain.
2. Create an **Application Load Balancer (ALB)**:
   - **Listener**: HTTPS (Port 443) -> Forward to Target Group (Port 80 of your EC2 instance).
   - **Certificate**: Select the ACM certificate.
   - **HTTP (Port 80) Listener**: Redirect to HTTPS (Port 443).
3. Point your Domain Route 53 / DNS to the ALB DNS name.
4. The ALB terminates SSL automatically and routes traffic to the React + Nginx container!

---

## 🔄 Useful Management Commands

- **Update code after git push**:
  ```bash
  cd ~/Study_Assistant
  git pull origin main
  docker compose up -d --build
  ```

- **Restart containers**:
  ```bash
  docker compose restart
  ```

- **Stop containers**:
  ```bash
  docker compose down
  ```

- **View backend logs specifically**:
  ```bash
  docker compose logs -f backend
  ```
