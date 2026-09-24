#!/usr/bin/env bash

# --- CONFIGURATION ---
LOCAL_BASE="$(cd "$(dirname "$0")" && pwd)/static/rajneesh/transcripts"
GITHUB_BASE="https://raw.githubusercontent.com/Manish-Sharma09/listen-osho/refs/heads/main/static/rajneesh/transcripts"
TOP_K=300

# --- TERMINAL COLORS (macOS / BSD Safe) ---
RESET="\033[0m"
BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
DIM="\033[2m"

# 1. Prompt and Sanitize Input
read -p "Enter search word: " RAW_WORD
SEARCH_WORD=$(echo "$RAW_WORD" | xargs)

if [ -z "$SEARCH_WORD" ]; then
    echo -e "${YELLOW}Search word cannot be empty.${RESET}"
    exit 1
fi

echo -e "${DIM}Scanning transcripts...${RESET}"

# 2. Gather ALL results & counts
ALL_RESULTS=$(grep -r -i -o "$SEARCH_WORD" "$LOCAL_BASE" 2>/dev/null \
    | cut -d: -f1 \
    | sort \
    | uniq -c \
    | sort -nr)

TOTAL_FILES=$(echo "$ALL_RESULTS" | grep -c '[^[:space:]]' || true)

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo -e "${YELLOW}No matching text files found for '${SEARCH_WORD}'.${RESET}"
    exit 0
fi

# Sum all occurrences (Total Words)
TOTAL_WORDS=$(echo "$ALL_RESULTS" | awk 'BEGIN{sum=0} {sum += $1} END{print sum}')

# 3. Extract Top K & Calculate Selection Stats
TOP_RESULTS=$(echo "$ALL_RESULTS" | head -n "$TOP_K")
SELECTED_FILES=$(echo "$TOP_RESULTS" | grep -c '[^[:space:]]' || true)

# Sum occurrences in just the selected files (Selected Words)
SELECTED_WORDS=$(echo "$TOP_RESULTS" | awk 'BEGIN{sum=0} {sum += $1} END{print sum}')

# Clipboard Magic
RAW_URLS=$(echo "$TOP_RESULTS" | awk '{print $2}' | sed "s|${LOCAL_BASE}|${GITHUB_BASE}|g")
echo "$RAW_URLS" | pbcopy

# 4. Math for Percentages (using awk for clean division)
FILE_PCT=$(awk -v sel="$SELECTED_FILES" -v tot="$TOTAL_FILES" 'BEGIN { if(tot>0) printf "%.0f", (sel/tot)*100; else print 0 }')
WORD_PCT=$(awk -v sel="$SELECTED_WORDS" -v tot="$TOTAL_WORDS" 'BEGIN { if(tot>0) printf "%.0f", (sel/tot)*100; else print 0 }')

TOP_COUNT=$(echo "$TOP_RESULTS" | head -n 1 | awk '{print $1}')
CUTOFF_COUNT=$(echo "$TOP_RESULTS" | tail -n 1 | awk '{print $1}')
BOTTOM_COUNT=$(echo "$ALL_RESULTS" | tail -n 1 | awk '{print $1}')

# 5. Output UI
echo ""
echo -e "${CYAN}==================================================${RESET}"
echo -e "${BOLD} 📊 SEARCH SUMMARY & INSIGHTS${RESET}"
echo -e "${CYAN}==================================================${RESET}"
echo -e "Query          : ${BOLD}'${SEARCH_WORD}'${RESET}"
echo -e "Selected Files : ${GREEN}${SELECTED_FILES}${RESET} / ${TOTAL_FILES} (${YELLOW}${FILE_PCT}%${RESET})"
echo -e "Selected Words : ${GREEN}${SELECTED_WORDS}${RESET} / ${TOTAL_WORDS} (${YELLOW}${WORD_PCT}%${RESET})"
echo ""
echo -e "${DIM}Word Count${RESET}"
echo -e "Top            : ${GREEN}${TOP_COUNT}${RESET}"
echo -e "Cutoff         : ${YELLOW}${CUTOFF_COUNT}${RESET}"
echo -e "Bottom         : ${DIM}${BOTTOM_COUNT}${RESET}"
echo -e "${CYAN}==================================================${RESET}"
echo -e "✅ ${GREEN}Copied to clipboard!${RESET}"
echo ""