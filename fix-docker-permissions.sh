#!/bin/bash

echo "Docker Permission Fix Script"
echo "============================"
echo

# Check if docker group exists
if getent group docker > /dev/null; then
    echo "✓ Docker group exists"
else
    echo "✗ Docker group does not exist"
    echo "  Docker Desktop may not be properly installed"
    exit 1
fi

# Check if user is in docker group
if groups | grep -q docker; then
    echo "✓ User is in docker group"
else
    echo "✗ User is NOT in docker group"
    echo
    echo "To fix this, run:"
    echo "  sudo usermod -aG docker \$USER"
    echo
    echo "Then either:"
    echo "  1. Log out and log back in to WSL, or"
    echo "  2. Run: newgrp docker"
    echo
    echo "Would you like to add yourself to the docker group now? (requires sudo)"
    read -p "Add to docker group? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo usermod -aG docker $USER
        echo "✓ Added to docker group"
        echo
        echo "Now run: newgrp docker"
        echo "Or log out and log back in to WSL"
    fi
fi

# Check Docker daemon
echo
echo "Checking Docker daemon..."
if docker version &>/dev/null; then
    echo "✓ Docker daemon is accessible"
    docker version --format 'Docker version: {{.Server.Version}}'
else
    echo "✗ Cannot connect to Docker daemon"
    echo "  Make sure Docker Desktop is running and WSL integration is enabled"
fi

echo
echo "Docker Desktop WSL Integration:"
echo "1. Open Docker Desktop"
echo "2. Go to Settings → Resources → WSL Integration"
echo "3. Enable 'Use the WSL 2 based engine'"
echo "4. Toggle on your Ubuntu distribution"
echo "5. Click 'Apply & Restart'"