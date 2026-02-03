#!/bin/bash

# ============================================
# mycms.space Interactive Setup Script
# Based on flowwink's approach - project selection, caching, and comprehensive setup
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check for flags
ENV_ONLY=false
if [[ "$1" == "--env" ]]; then
    ENV_ONLY=true
fi

if [[ "$1" == "--fresh" ]]; then
    echo -e "${YELLOW}Fresh start requested - clearing all cached data...${NC}"
    echo ""
    
    # Logout from Supabase CLI (auto-confirm with 'y')
    if command -v supabase &> /dev/null; then
        echo "y" | supabase logout 2>/dev/null || true
        echo -e "${GREEN}✓ Logged out from Supabase CLI${NC}"
    fi
    
    # Clear cached project link
    if [ -d "supabase/.temp" ]; then
        rm -rf supabase/.temp
        echo -e "${GREEN}✓ Cleared cached project link${NC}"
    fi
    
    echo ""
fi

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

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    print_success "Node.js installed"

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm installed"

    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git installed"
}

# Welcome message
show_welcome() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           mycms.space - Interactive Setup                      ║
║                                                                ║
║  This script will guide you through setting up your          ║
║  personal CMS with Supabase and EasyPanel deployment.       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Step 1: Supabase Setup
setup_supabase() {
    print_header "Step 1: Supabase Setup"

    # Check if supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed"
        print_info "Installing Supabase CLI..."
        npm install -g supabase
    fi
    print_success "Supabase CLI installed"

    # Check if logged in
    echo -e "${YELLOW}Checking Supabase login status...${NC}"
    if ! supabase projects list &> /dev/null; then
        echo -e "${YELLOW}Not logged in to Supabase CLI${NC}"
        echo ""
        read -p "Would you like to login now? [Y/n]: " do_login
        if [[ ! "$do_login" =~ ^[Nn]$ ]]; then
            echo ""
            supabase login
            echo ""
            # Verify login worked
            if ! supabase projects list &> /dev/null; then
                echo -e "${RED}Login failed. Please try again.${NC}"
                exit 1
            fi
        else
            echo -e "${RED}Login required to continue.${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✓ Logged in to Supabase${NC}"

    # Get list of projects and let user choose by number
    echo ""
    echo -e "${BLUE}Your Supabase projects:${NC}"
    echo ""

    # Get projects and display with numbers
    PROJECTS=$(supabase projects list --output json 2>/dev/null || echo "[]")
    if [ "$PROJECTS" == "[]" ] || [ -z "$PROJECTS" ]; then
        echo -e "${RED}No projects found. Create one at supabase.com first.${NC}"
        exit 1
    fi

    # Parse and display projects with numbers
    echo "$PROJECTS" | jq -r 'to_entries | .[] | "\(.key + 1)) \(.value.name) (\(.value.id)) - \(.value.region)"'
    echo ""

    # Check if already linked and if the project still exists
    CURRENT_REF=""
    PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')

    if [ -f "supabase/.temp/project-ref" ]; then
        CURRENT_REF=$(cat supabase/.temp/project-ref)
        CURRENT_NAME=$(echo "$PROJECTS" | jq -r --arg ref "$CURRENT_REF" '.[] | select(.id == $ref) | .name' 2>/dev/null || echo "")
        
        if [ -n "$CURRENT_NAME" ] && [ "$CURRENT_NAME" != "null" ]; then
            # Project exists - ask if user wants to use it
            echo -e "${YELLOW}Currently linked to: ${CURRENT_NAME} (${CURRENT_REF})${NC}"
            echo ""
            read -p "Use this project? [Y/n] or enter number to switch: " use_current
            
            # Check if user entered a number (wants to switch)
            if [[ "$use_current" =~ ^[0-9]+$ ]]; then
                rm -rf supabase/.temp
                CURRENT_REF=""
                selection="$use_current"
            elif [[ "$use_current" =~ ^[Nn]$ ]]; then
                rm -rf supabase/.temp
                CURRENT_REF=""
                selection=""
            fi
        else
            # Project was deleted - force re-selection
            echo -e "${YELLOW}Previously linked project no longer exists.${NC}"
            rm -rf supabase/.temp
            CURRENT_REF=""
            selection=""
        fi
    fi

    # If no current project or user wants to switch
    if [ -z "$CURRENT_REF" ]; then
        # If selection wasn't already set by entering a number above
        if [ -z "$selection" ]; then
            read -p "Select project number (1-${PROJECT_COUNT}): " selection
        fi
        
        # Validate selection
        if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "$PROJECT_COUNT" ]; then
            echo -e "${RED}Invalid selection${NC}"
            exit 1
        fi
        
        # Get project ref by index (0-based)
        PROJECT_REF=$(echo "$PROJECTS" | jq -r ".[$((selection - 1))].id")
        PROJECT_NAME=$(echo "$PROJECTS" | jq -r ".[$((selection - 1))].name")
        
        echo ""
        echo -e "${YELLOW}Linking to ${PROJECT_NAME} (${PROJECT_REF})...${NC}"
        supabase link --project-ref "$PROJECT_REF"
    else
        PROJECT_REF="$CURRENT_REF"
    fi

    echo -e "${GREEN}✓ Project linked: ${PROJECT_REF}${NC}"

    # If --env flag, skip to environment variables
    if [ "$ENV_ONLY" = true ]; then
        echo ""
        echo -e "${YELLOW}Skipping setup steps (--env flag)${NC}"
    else
        # Deploy edge functions
        print_info "Deploying edge functions..."
        FUNCTIONS_DIR="supabase/functions"
        if [ -d "$FUNCTIONS_DIR" ]; then
            FUNCTIONS=$(find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;)
            TOTAL=$(echo "$FUNCTIONS" | wc -l | tr -d ' ')
            
            echo "Found $TOTAL edge functions to deploy..."
            echo ""
            
            COUNT=0
            FAILED=0
            for func in $FUNCTIONS; do
                COUNT=$((COUNT + 1))
                echo -ne "[$COUNT/$TOTAL] Deploying $func... "
                if supabase functions deploy "$func" --no-verify-jwt 2>/dev/null; then
                    echo -e "${GREEN}✓${NC}"
                else
                    echo -e "${RED}✗${NC}"
                    FAILED=$((FAILED + 1))
                fi
            done
            
            echo ""
            if [ $FAILED -eq 0 ]; then
                echo -e "${GREEN}✓ All $TOTAL edge functions deployed successfully${NC}"
            else
                echo -e "${YELLOW}⚠ Deployed $((TOTAL - FAILED))/$TOTAL functions ($FAILED failed)${NC}"
            fi
        else
            echo -e "${RED}Error: No functions directory found${NC}"
            exit 1
        fi

        # Run database migrations
        print_info "Applying database migrations..."
        if supabase db push; then
            echo -e "${GREEN}✓ Database migrations applied${NC}"
        else
            echo -e "${RED}✗ Database migration failed${NC}"
            echo "You may need to run migrations manually via Supabase Dashboard"
        fi
    fi  # End of ENV_ONLY check

    # Fetch and display environment variables
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Environment Variables${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Fetch project API keys
    echo -e "${YELLOW}Fetching API keys...${NC}"

    # Get the anon key from project API settings
    API_KEYS=$(supabase projects api-keys --project-ref "$PROJECT_REF" --output json 2>/dev/null || echo "[]")
    ANON_KEY=$(echo "$API_KEYS" | jq -r '.[] | select(.name == "anon") | .api_key' 2>/dev/null || echo "")

    if [ -z "$ANON_KEY" ] || [ "$ANON_KEY" == "null" ]; then
        echo -e "${YELLOW}Could not fetch keys automatically. Get them from Supabase Dashboard.${NC}"
        echo ""
        echo "Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api"
        echo ""
        echo "Then set these environment variables:"
        echo ""
        echo -e "${BLUE}┌────────────────────────────────────────────────────────────┐${NC}"
        echo "VITE_SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
        echo "VITE_SUPABASE_ANON_KEY=<your-anon-key>"
        echo "VITE_SUPABASE_PROJECT_ID=${PROJECT_REF}"
        echo -e "${BLUE}└────────────────────────────────────────────────────────────┘${NC}"
    else
        echo ""
        echo -e "${GREEN}Copy these environment variables to your hosting platform (e.g., Easypanel):${NC}"
        echo ""
        echo -e "${BLUE}┌────────────────────────────────────────────────────────────┐${NC}"
        echo "VITE_SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
        echo "VITE_SUPABASE_ANON_KEY=${ANON_KEY}"
        echo "VITE_SUPABASE_PROJECT_ID=${PROJECT_REF}"
        echo -e "${BLUE}└────────────────────────────────────────────────────────────┘${NC}"
        
        # Save to .env
        cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://${PROJECT_REF}.supabase.co
VITE_SUPABASE_ANON_KEY=${ANON_KEY}
VITE_SUPABASE_PROJECT_ID=${PROJECT_REF}
EOF
        
        echo ""
        echo -e "${GREEN}✓ Environment variables saved to .env${NC}"
    fi
}

# Step 2: Build Application
build_app() {
    print_header "Step 2: Building Application"

    print_info "Installing dependencies..."
    npm install

    print_info "Building application..."
    npm run build

    print_success "Application built successfully"
}

# Step 3: Docker Build
build_docker() {
    print_header "Step 3: Building Docker Image"

    print_info "Building Docker image..."
    docker build -t mycms-space:latest .

    print_success "Docker image built"
}

# Step 4: EasyPanel Setup
setup_easypanel() {
    print_header "Step 4: EasyPanel Deployment"

    print_info "EasyPanel Deployment Options:"
    echo ""
    echo "1. VCS (Version Control System) - Recommended"
    echo "   • Connects to your Git repository"
    echo "   • Auto-deploys on push"
    echo "   • Always uses latest version"
    echo ""
    echo "2. Manual Docker Image"
    echo "   • Upload pre-built image"
    echo "   • Manual updates"
    echo ""

    read -p "Choose option [1/2]: " easypanel_choice

    if [ "$easypanel_choice" = "1" ]; then
        setup_easypanel_vcs
    elif [ "$easypanel_choice" = "2" ]; then
        setup_easypanel_manual
    else
        print_error "Invalid option"
        setup_easypanel
    fi
}

setup_easypanel_vcs() {
    print_header "Setting up EasyPanel with VCS"

    print_info "Step 1: Access your EasyPanel instance"
    echo ""
    read -p "Enter your EasyPanel URL (e.g., https://your-server.com): " easypanel_url

    print_info "Step 2: Create application from Git repository"
    echo ""
    echo "In EasyPanel:"
    echo "1. Click 'Applications' → 'Create'"
    echo "2. Choose 'Git Repository'"
    echo "3. Enter your repository URL:"
    echo "   https://github.com/yourusername/mycms-space.git"
    echo "4. Choose branch: main"
    echo "5. Click 'Create'"
    echo ""
    read -p "Press Enter after creating application"

    print_info "Step 3: Configure environment variables"
    echo ""
    echo "In EasyPanel application settings:"
    echo "1. Go to 'Environment Variables'"
    echo "2. Add the following variables:"
    echo ""
    echo "   VITE_SUPABASE_URL = $VITE_SUPABASE_URL"
    echo "   VITE_SUPABASE_ANON_KEY = $VITE_SUPABASE_ANON_KEY"
    echo ""
    read -p "Press Enter after adding variables"

    print_info "Step 4: Deploy application"
    echo ""
    echo "1. Click 'Deploy'"
    echo "2. Wait for deployment to complete"
    echo "3. Click 'Open' to access your site"
    echo ""
    read -p "Press Enter after deployment"

    print_success "EasyPanel VCS setup complete!"
    print_info "Your site will auto-update on git push"
}

setup_easypanel_manual() {
    print_header "Setting up EasyPanel with Docker Image"

    print_info "Step 1: Push Docker image to registry"
    echo ""
    echo "Choose registry:"
    echo "1. Docker Hub"
    echo "2. GitHub Container Registry"
    echo "3. Private registry"
    echo ""
    read -p "Choose [1/2/3]: " registry_choice

    case $registry_choice in
        1)
            print_info "Login to Docker Hub..."
            read -p "Enter Docker Hub username: " docker_username
            docker login
            docker tag mycms-space:latest $docker_username/mycms-space:latest
            docker push $docker_username/mycms-space:latest
            image_name="$docker_username/mycms-space:latest"
            ;;
        2)
            print_info "Using GitHub Container Registry..."
            image_name="ghcr.io/yourusername/mycms-space:latest"
            ;;
        3)
            print_warning "For private registry, configure in EasyPanel manually"
            image_name="mycms-space:latest"
            ;;
    esac

    print_success "Image pushed"

    print_info "Step 2: Create application in EasyPanel"
    echo ""
    echo "In EasyPanel:"
    echo "1. Click 'Applications' → 'Create'"
    echo "2. Choose 'Docker Image'"
    echo "3. Enter image name: $image_name"
    echo "4. Click 'Create'"
    echo ""
    read -p "Press Enter after creating application"

    print_info "Step 3: Configure environment variables"
    echo ""
    echo "Add these variables in EasyPanel:"
    echo "   VITE_SUPABASE_URL = $VITE_SUPABASE_URL"
    echo "   VITE_SUPABASE_ANON_KEY = $VITE_SUPABASE_ANON_KEY"
    echo ""
    read -p "Press Enter after adding variables"

    print_info "Step 4: Deploy and configure domain"
    echo ""
    echo "1. Click 'Deploy'"
    echo "2. Go to 'Domains'"
    echo "3. Add your domain"
    echo "4. Enable SSL (automatic)"
    echo ""
    read -p "Press Enter after configuration"

    print_success "EasyPanel manual setup complete!"
}

# Step 5: Verification
verify_setup() {
    print_header "Step 5: Verification"

    print_info "Let's verify your setup"
    echo ""

    # Check .env
    if [ -f .env ]; then
        print_success ".env file exists"
    else
        print_warning ".env file missing"
    fi

    # Check Docker image
    if docker images | grep -q mycms-space; then
        print_success "Docker image built"
    else
        print_warning "Docker image not found"
    fi

    # Check environment variables
    if [ -f .env ]; then
        source .env
        if [[ -n "$VITE_SUPABASE_URL" && -n "$VITE_SUPABASE_ANON_KEY" ]]; then
            print_success "Environment variables configured"
        else
            print_warning "Environment variables incomplete"
        fi
    fi

    echo ""
    print_info "Next steps:"
    echo "1. Access your EasyPanel instance"
    echo "2. Verify your site is running"
    echo "3. Test AI chat functionality"
    echo "4. Configure n8n integration (optional)"
    echo "5. Customize your content"
}

# Main menu
main() {
    check_dependencies
    show_welcome

    echo ""
    read -p "Press Enter to continue..."

    # Step 1: Supabase
    setup_supabase

    # Step 2: Build
    build_app

    # Step 3: Docker
    build_docker

    # Step 4: EasyPanel
    setup_easypanel

    # Step 5: Verify
    verify_setup

    print_header "Setup Complete!"

    echo -e "${GREEN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              🎉 mycms.space Setup Complete! 🎉                ║
║                                                                ║
║  Your personal CMS is now deployed and ready to use!          ║
║                                                                ║
║  Quick Links:                                                  ║
║  • EasyPanel: https://your-easypanel.com                       ║
║  • Supabase: https://supabase.com/dashboard                    ║
║  • Documentation: ./DEPLOYMENT.md                               ║
║                                                                ║
║  Need help? Check DEPLOYMENT.md for troubleshooting            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Run main function
main
