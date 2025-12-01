#!/bin/bash

# Script untuk push otomatis ke GitHub
# Usage: ./git-push.sh "pesan commit"

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Auto Push ke GitHub${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Cek apakah ada perubahan
if [[ -z $(git status -s) ]]; then
    echo -e "${RED}✗ Tidak ada perubahan untuk di-commit${NC}"
    exit 0
fi

# Tampilkan file yang berubah
echo -e "${BLUE}File yang berubah:${NC}"
git status -s
echo ""

# Ambil pesan commit dari argument atau gunakan default
if [ -z "$1" ]; then
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

echo -e "${BLUE}Pesan commit: ${NC}$COMMIT_MSG"
echo ""

# Add semua perubahan
echo -e "${BLUE}→ Menambahkan file...${NC}"
git add -A

# Commit
echo -e "${BLUE}→ Melakukan commit...${NC}"
git commit -m "$COMMIT_MSG"

# Push ke GitHub
echo -e "${BLUE}→ Push ke GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Berhasil push ke GitHub!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}Repository: ${NC}https://github.com/DedhyPraditya/po"
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ Gagal push ke GitHub${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
