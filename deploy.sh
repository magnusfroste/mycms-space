#!/bin/bash

# ============================================
# Deployment Script for mycms.space
# Supports: Docker, EasyPanel, Vercel, Netlify, Render
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_header "Checking Dependencies"

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js installed"

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm installed"

    if [ "$DEPLOYMENT_TYPE" = "docker" ] || [ "$DEPLOYMENT_TYPE" = "easypanel" ]; then
        if ! command -v docker &> /dev/null; then
            print_error "Docker is not installed"
            exit 1
        fi
        print_success "Docker installed"
    fi
}

# Setup environment variables
setup_env() {
    print_header "Setting up Environment Variables"

    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating template..."
        cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: AI Integration
# VITE_OPENROUTER_API_KEY=your-key-here
EOF
        print_warning "Please edit .env with your Supabase credentials"
        read -p "Press Enter to continue after editing .env..."
    fi

    source .env
    print_success "Environment variables loaded"
}

# Build the application
build_app() {
    print_header "Building Application"

    npm install
    npm run build

    print_success "Application built successfully"
}

# Deploy to Docker
deploy_docker() {
    print_header "Deploying to Docker"

    build_app

    # Build Docker image
    docker build -t mycms-space:latest .

    # Run container
    docker run -d \
        --name mycms-space \
        -p 80:80 \
        -e VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
        -e VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
        mycms-space:latest

    print_success "Deployed to Docker at http://localhost"
    print_success "Container name: mycms-space"
}

# Deploy to Docker Compose
deploy_docker_compose() {
    print_header "Deploying with Docker Compose"

    build_app

    docker-compose up -d

    print_success "Deployed with Docker Compose"
    print_success "Access at http://localhost:3000"
}

# Deploy to EasyPanel
deploy_easypanel() {
    print_header "Deploying to EasyPanel"

    build_app

    # Build Docker image
    docker build -t mycms-space:latest .

    print_success "Docker image built"
    print_warning "Please use EasyPanel UI to deploy using easypanel.json"
    print_warning "Or run: easypanel install easypanel.json"
}

# Deploy to Vercel
deploy_vercel() {
    print_header "Deploying to Vercel"

    if ! command -v vercel &> /dev/null; then
        print_warning "Installing Vercel CLI..."
        npm install -g vercel
    fi

    print_success "Starting Vercel deployment..."
    vercel --prod

    print_success "Deployed to Vercel"
}

# Deploy to Netlify
deploy_netlify() {
    print_header "Deploying to Netlify"

    if ! command -v netlify &> /dev/null; then
        print_warning "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi

    build_app

    print_success "Starting Netlify deployment..."
    netlify deploy --prod --dir=dist

    print_success "Deployed to Netlify"
}

# Deploy to Render
deploy_render() {
    print_header "Deploying to Render"

    print_warning "Render deployment requires manual setup"
    print_warning "1. Go to https://dashboard.render.com/"
    print_warning "2. Create a new Web Service"
    print_warning "3. Connect your GitHub repository"
    print_warning "4. Set build command: npm run build"
    print_warning "5. Set publish directory: dist"
    print_warning "6. Add environment variables:"
    print_warning "   - VITE_SUPABASE_URL"
    print_warning "   - VITE_SUPABASE_ANON_KEY"
}

# Setup Supabase
setup_supabase() {
    print_header "Setting up Supabase"

    if ! command -v supabase &> /dev/null; then
        print_warning "Installing Supabase CLI..."
        npm install -g supabase
    fi

    print_success "Supabase CLI installed"

    print_warning "Choose Supabase deployment:"
    print_warning "1. Supabase Cloud (recommended - free tier)"
    print_warning "2. Self-hosted with Docker"

    read -p "Choose option [1/2]: " supabase_choice

    if [ "$supabase_choice" = "1" ]; then
        print_success "Using Supabase Cloud"
        print_warning "1. Create account at https://supabase.com"
        print_warning "2. Create a new project"
        print_warning "3. Copy URL and anon key to .env"
        print_warning "4. Run: npx supabase db push to apply migrations"
    else
        print_success "Using Self-hosted Supabase"
        print_warning "Running Supabase with Docker Compose..."
        docker-compose -f docker-compose.yml up -d supabase
        print_success "Supabase running at http://localhost:54321"
    fi
}

# Main menu
show_menu() {
    echo -e "\n${BLUE}mycms.space Deployment Menu${NC}\n"
    echo "1. Deploy to Docker"
    echo "2. Deploy to Docker Compose"
    echo "3. Deploy to EasyPanel"
    echo "4. Deploy to Vercel"
    echo "5. Deploy to Netlify"
    echo "6. Deploy to Render"
    echo "7. Setup Supabase"
    echo "8. Full Setup (Supabase + Deploy)"
    echo "9. Exit"
    echo ""
}

# Main execution
main() {
    check_dependencies

    if [ -z "$1" ]; then
        show_menu
        read -p "Choose option [1-9]: " choice
    else
        choice="$1"
    fi

    case $choice in
        1)
            setup_env
            deploy_docker
            ;;
        2)
            setup_env
            deploy_docker_compose
            ;;
        3)
            setup_env
            deploy_easypanel
            ;;
        4)
            setup_env
            deploy_vercel
            ;;
        5)
            setup_env
            deploy_netlify
            ;;
        6)
            deploy_render
            ;;
        7)
            setup_supabase
            ;;
        8)
            setup_supabase
            setup_env
            print_warning "Choose deployment method:"
            echo "1. Docker"
            echo "2. Docker Compose"
            echo "3. EasyPanel"
            echo "4. Vercel"
            echo "5. Netlify"
            read -p "Choose [1-5]: " deploy_choice
            deploy_"deploy_$deploy_choice"
            ;;
        9)
            print_success "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
