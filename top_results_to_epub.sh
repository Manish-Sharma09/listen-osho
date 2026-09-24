#!/usr/bin/env bash
set -eo pipefail

# ============================================================
# CONFIGURATION
# ============================================================

export LANG="C.UTF-8"
export LC_ALL="C.UTF-8"

# When running locally, use the known transcript location.
# In GitHub Actions, use the checked-out repository.
if [ -n "${GITHUB_ACTIONS:-}" ]; then
    LOCAL_BASE="${GITHUB_WORKSPACE}/static/rajneesh/transcripts"
else
    LOCAL_BASE="$(cd "$(dirname "$0")" && pwd)/static/rajneesh/transcripts"
fi

TOP_K=100
MIN_OCCURRENCES=3

# ============================================================
# TERMINAL COLORS
# ============================================================

RESET="\033[0m"
BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
DIM="\033[2m"

log_info()    { echo -e "${CYAN}[INFO]${RESET} $1"; }
log_debug()   { echo -e "${DIM}[DEBUG]${RESET} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${RESET} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${RESET} $1"; }
log_error()   { echo -e "${RED}[ERROR]${RESET} $1"; }

# ============================================================
# START
# ============================================================

log_info "Starting Transcript Search Utility"
log_debug "TOP_K=${TOP_K}"
log_debug "MIN_OCCURRENCES=${MIN_OCCURRENCES}"
log_debug "Transcript directory: ${LOCAL_BASE}"

# ============================================================
# 1. DIRECTORY CHECK
# ============================================================

if [ ! -d "$LOCAL_BASE" ]; then
    log_error "Target directory does not exist:"
    log_error "$LOCAL_BASE"
    exit 1
fi

TOTAL_LOCAL_FILES=$(find "$LOCAL_BASE" -type f | wc -l | xargs)

log_debug "Found ${TOTAL_LOCAL_FILES} total files."

# ============================================================
# 2. SEARCH TERM
#
# Usage:
#   ./top_results.sh "search term"
#
# Or:
#   QUERY="search term" ./top_results.sh
#
# If no query is supplied locally, prompt for one.
# In GitHub Actions, fail instead of blocking on stdin.
# ============================================================

# Prefer the first argument when supplied. Fall back to QUERY.
# Do not use xargs here: it can behave unexpectedly with Unicode input
# under some CI locale configurations.
if [ "$#" -ge 1 ]; then
    RAW_WORD="$1"
else
    RAW_WORD="${QUERY:-}"
fi

if [ -z "$RAW_WORD" ]; then
    if [ -t 0 ] && [ -z "${GITHUB_ACTIONS:-}" ]; then
        read -r -p "Enter search word: " RAW_WORD
    else
        log_error "No search query supplied."
        log_error "Usage: $0 \"search term\""
        log_error "Or set QUERY=\"search term\"."
        exit 1
    fi
fi

# Trim leading/trailing ASCII whitespace without passing the query
# through xargs, preserving Unicode characters exactly.
SEARCH_WORD="$RAW_WORD"
SEARCH_WORD="${SEARCH_WORD#"${SEARCH_WORD%%[![:space:]]*}"}"
SEARCH_WORD="${SEARCH_WORD%"${SEARCH_WORD##*[![:space:]]}"}"

if [ -z "$SEARCH_WORD" ]; then
    log_warn "Search word cannot be empty."
    exit 1
fi

log_info "Search query: '${SEARCH_WORD}'"
log_info "Scanning transcripts..."

# ============================================================
# 3. FIND ALL MATCHES
# ============================================================

set +e

ALL_RESULTS=$(
    grep -r -i -a -F -o "$SEARCH_WORD" "$LOCAL_BASE" 2>/dev/null |
        cut -d: -f1 |
        sort |
        uniq -c |
        sort -nr
)

GREP_EXIT_CODE=$?

set -e

log_debug "grep exit code: ${GREP_EXIT_CODE}"

if [ -z "$ALL_RESULTS" ]; then
    log_warn "No matching files found."
    exit 0
fi

TOTAL_MATCHING_FILES=$(
    echo "$ALL_RESULTS" | wc -l | xargs
)

TOTAL_MATCHING_WORDS=$(
    echo "$ALL_RESULTS" |
        awk '{sum += $1} END {print sum + 0}'
)

log_debug "Matching files : ${TOTAL_MATCHING_FILES}"
log_debug "All matches    : ${TOTAL_MATCHING_WORDS}"

# ============================================================
# 4. FILTER FILES WITH FEWER THAN 3 OCCURRENCES
# ============================================================

log_debug "Filtering files with fewer than ${MIN_OCCURRENCES} occurrences..."

ELIGIBLE_RESULTS=$(
    echo "$ALL_RESULTS" |
        awk -v minimum="$MIN_OCCURRENCES" '$1 >= minimum'
)

if [ -z "$ELIGIBLE_RESULTS" ]; then
    log_warn "No files have ${MIN_OCCURRENCES} or more occurrences."
    exit 0
fi

ELIGIBLE_FILES=$(
    echo "$ELIGIBLE_RESULTS" | wc -l | xargs
)

ELIGIBLE_WORDS=$(
    echo "$ELIGIBLE_RESULTS" |
        awk '{sum += $1} END {print sum + 0}'
)

log_debug "Eligible files : ${ELIGIBLE_FILES}"
log_debug "Eligible words : ${ELIGIBLE_WORDS}"

# ============================================================
# 5. TOP K
# ============================================================

TOP_RESULTS=$(
    echo "$ELIGIBLE_RESULTS" |
        head -n "$TOP_K"
)

SELECTED_FILES=$(echo "$TOP_RESULTS" | wc -l | xargs)

SELECTED_WORDS=$(
    echo "$TOP_RESULTS" |
        awk '{sum += $1} END {print sum + 0}'
)

log_debug "Selected files : ${SELECTED_FILES}"
log_debug "Selected words : ${SELECTED_WORDS}"

# ============================================================
# 6. STATS
# ============================================================

FILE_PCT=0
WORD_PCT=0

[ "$ELIGIBLE_FILES" -gt 0 ] &&
    FILE_PCT=$((SELECTED_FILES * 100 / ELIGIBLE_FILES))

[ "$ELIGIBLE_WORDS" -gt 0 ] &&
    WORD_PCT=$((SELECTED_WORDS * 100 / ELIGIBLE_WORDS))

TOP_COUNT=$(echo "$TOP_RESULTS" | awk 'NR==1 {print $1}')
CUTOFF_COUNT=$(echo "$TOP_RESULTS" | tail -n 1 | awk '{print $1}')
BOTTOM_COUNT=$(echo "$ELIGIBLE_RESULTS" | tail -n 1 | awk '{print $1}')

# ============================================================
# 7. SUMMARY
# ============================================================

echo ""
echo -e "${CYAN}==================================================${RESET}"
echo -e "${BOLD} 📊 SEARCH SUMMARY & INSIGHTS${RESET}"
echo -e "${CYAN}==================================================${RESET}"

echo -e "Query              : ${BOLD}'${SEARCH_WORD}'${RESET}"

echo ""
echo -e "${DIM}File Funnel${RESET}"
echo -e "Matching Files     : ${TOTAL_MATCHING_FILES}"
echo -e "≥${MIN_OCCURRENCES} Occurrences   : ${GREEN}${ELIGIBLE_FILES}${RESET}"
echo -e "Top ${TOP_K} Selected    : ${GREEN}${SELECTED_FILES}${RESET}"

echo ""
echo -e "${DIM}Occurrence Funnel${RESET}"
echo -e "All Matches        : ${TOTAL_MATCHING_WORDS}"
echo -e "Eligible Matches   : ${ELIGIBLE_WORDS}"
echo -e "Selected Matches   : ${GREEN}${SELECTED_WORDS}${RESET}"

echo ""
echo -e "${DIM}Selection Coverage${RESET}"
echo -e "Files              : ${YELLOW}${FILE_PCT}%${RESET}"
echo -e "Occurrences        : ${YELLOW}${WORD_PCT}%${RESET}"

echo ""
echo -e "${DIM}Occurrence Distribution${RESET}"
echo -e "Top File           : ${GREEN}${TOP_COUNT}${RESET} occurrences"
echo -e "Selection Cutoff   : ${YELLOW}${CUTOFF_COUNT}${RESET} occurrences"
echo -e "Lowest Eligible    : ${DIM}${BOTTOM_COUNT}${RESET} occurrences"

echo ""
echo -e "${DIM}Selection Rule${RESET}"
echo -e "Top ${TOP_K} files with at least ${MIN_OCCURRENCES} occurrences."

echo -e "${CYAN}==================================================${RESET}"
echo ""

# ============================================================
# 8. OUTPUT FILENAME + CONFIRMATION
#
# Optional second argument:
#   ./top_results.sh "search term" "my_results.epub"
#
# Or:
#   OUTPUT_EPUB="my_results.epub" ./top_results.sh "search term"
#
# Locally, missing filename/confirmation is interactive.
# In GitHub Actions, defaults are used and execution is automatic.
# ============================================================

SANID_WORD=$(echo "$SEARCH_WORD" | tr -d '[:punct:]' | xargs)

[ -z "$SANID_WORD" ] && SANID_WORD="search_result"

DEFAULT_FILENAME="${SANID_WORD}_search_results.epub"

echo -e "${BOLD}📖 UPCOMING OPERATION DETAILS${RESET}"
echo -e " - Highlighting term : ${CYAN}\"${SEARCH_WORD}\"${RESET}"
echo -e " - Files to compile  : ${GREEN}${SELECTED_FILES}${RESET}"
echo -e " - Total matches     : ${GREEN}${SELECTED_WORDS}${RESET}"
echo -e " - Minimum/file      : ${YELLOW}${MIN_OCCURRENCES}${RESET}"
echo ""

if [ -n "${2:-}" ]; then
    OUTPUT_EPUB="$2"
elif [ -n "${OUTPUT_EPUB:-}" ]; then
    :
elif [ -n "${GITHUB_ACTIONS:-}" ]; then
    OUTPUT_EPUB="$DEFAULT_FILENAME"
else
    read -r -p "Output EPUB filename [${DEFAULT_FILENAME}]: " CUSTOM_EPUB
    OUTPUT_EPUB=$(echo "$CUSTOM_EPUB" | xargs)

    if [ -z "$OUTPUT_EPUB" ]; then
        OUTPUT_EPUB="$DEFAULT_FILENAME"
    fi
fi

if [[ "$OUTPUT_EPUB" != *.epub ]]; then
    OUTPUT_EPUB="${OUTPUT_EPUB}.epub"
fi

echo -e " - Output file       : ${GREEN}${OUTPUT_EPUB}${RESET}"
echo ""

if [ -n "${GITHUB_ACTIONS:-}" ]; then
    CONFIRMATION="Y"
else
    read -r -p "Proceed with EPUB creation? (Y/n): " CONFIRMATION
    CONFIRMATION=${CONFIRMATION:-Y}
fi

if [[ ! "$CONFIRMATION" =~ ^[Yy]$ ]]; then
    log_warn "Operation cancelled."
    exit 0
fi

# ============================================================
# 9. TEMP MARKDOWN
# ============================================================

TMP_MARKDOWN=$(mktemp)

log_debug "Temporary Markdown: ${TMP_MARKDOWN}"

trap 'rm -f "$TMP_MARKDOWN"' EXIT

cat > "$TMP_MARKDOWN" <<EOF
---
title: "Search Results: ${SEARCH_WORD}"
author: "Transcript Search"
date: "$(date +'%Y-%m-%d')"
---

# Search Results: ${SEARCH_WORD}

**${SELECTED_FILES} files** · **${SELECTED_WORDS} occurrences**

Minimum ${MIN_OCCURRENCES} occurrences per file.

---

EOF

# ============================================================
# 10. PROCESS FILES
# ============================================================

PROCESSED_COUNT=0

while read -r line; do

    [ -z "$line" ] && continue

    COUNT=$(echo "$line" | awk '{print $1}')

    FILE_PATH=$(
        echo "$line" |
            sed -E 's/^[[:space:]]*[0-9]+[[:space:]]+//'
    )

    FILE_NAME=$(basename "$FILE_PATH")

    PROCESSED_COUNT=$((PROCESSED_COUNT + 1))

    log_debug "[$PROCESSED_COUNT/$SELECTED_FILES] ${FILE_NAME} — ${COUNT} matches"

    echo "# ${FILE_NAME} (${COUNT} matches)" >> "$TMP_MARKDOWN"
    echo "" >> "$TMP_MARKDOWN"

    # ========================================================
    # UNICODE HIGHLIGHTING
    #
    # Python uses case-insensitive Unicode matching so the
    # highlighting behavior matches the grep search behavior.
    # ========================================================

    SEARCH_WORD="$SEARCH_WORD" python3 - "$FILE_PATH" >> "$TMP_MARKDOWN" <<'PYTHON'
import os
import re
import sys

file_path = sys.argv[1]
search_word = os.environ["SEARCH_WORD"]

with open(file_path, "r", encoding="utf-8") as file:
    text = file.read()

pattern = re.compile(re.escape(search_word), re.IGNORECASE)

highlighted = pattern.sub(
    lambda match: (
        "<span style='background-color: #90caf9; color: #000000;'>"
        + match.group(0)
        + "</span>"
    ),
    text,
)

sys.stdout.write(highlighted)
PYTHON

    echo "" >> "$TMP_MARKDOWN"
    echo "" >> "$TMP_MARKDOWN"
    echo "---" >> "$TMP_MARKDOWN"
    echo "" >> "$TMP_MARKDOWN"

done < <(echo "$TOP_RESULTS")

# ============================================================
# 11. DEBUG HIGHLIGHTS
# ============================================================

echo ""
log_debug "Generated Markdown inspection"
log_debug "--------------------------------"

SPAN_COUNT=$(
    grep -o \
        "<span style='background-color: #90caf9; color: #000000;'>" \
        "$TMP_MARKDOWN" 2>/dev/null |
        wc -l |
        xargs
) || SPAN_COUNT=0

log_debug "Highlight spans found: ${SPAN_COUNT}"
log_debug "Expected occurrences: ${SELECTED_WORDS}"

if [ "$SPAN_COUNT" -eq 0 ]; then

    log_error "ZERO highlight spans were generated."

    echo ""
    log_debug "Searching generated Markdown for the search term..."

    grep -n -i -F "$SEARCH_WORD" "$TMP_MARKDOWN" 2>/dev/null |
        head -n 5 ||
        true

    echo ""
    log_error "Temporary Markdown preserved for inspection:"
    log_error "$TMP_MARKDOWN"

    trap - EXIT

    exit 1
fi

echo ""
log_debug "First highlight found in generated Markdown:"

grep -o \
    ".\{0,80\}<span style='background-color: #90caf9; color: #000000;'>.\{0,120\}" \
    "$TMP_MARKDOWN" 2>/dev/null |
    head -n 1 ||
    true

log_debug "Highlight generation successful."

# ============================================================
# 12. COMPILE EPUB
# ============================================================

log_info "Compiling EPUB with Pandoc..."

if ! command -v pandoc >/dev/null 2>&1; then
    log_error "Pandoc not found."
    exit 1
fi

log_debug "Pandoc: $(pandoc --version | head -n 1)"
log_debug "Output: $(pwd)/${OUTPUT_EPUB}"

pandoc \
    "$TMP_MARKDOWN" \
    -f markdown+raw_html \
    -t epub \
    -o "$OUTPUT_EPUB"

# ============================================================
# 13. VERIFY EPUB
# ============================================================

if [ ! -f "$OUTPUT_EPUB" ]; then
    log_error "Pandoc completed but EPUB was not created."
    exit 1
fi

OUTPUT_SIZE=$(du -h "$OUTPUT_EPUB" | cut -f1)

log_success "EPUB created successfully."
log_debug "File: $(pwd)/${OUTPUT_EPUB}"
log_debug "Size: ${OUTPUT_SIZE}"

if command -v unzip >/dev/null 2>&1; then

    EPUB_SPANS=$(
        unzip -p "$OUTPUT_EPUB" '*.xhtml' 2>/dev/null |
            grep -o "background-color: #90caf9" 2>/dev/null |
            wc -l |
            xargs
    ) || EPUB_SPANS=0

    log_debug "Highlight CSS occurrences inside EPUB: ${EPUB_SPANS}"

    if [ "$EPUB_SPANS" -gt 0 ]; then
        log_success "Verified highlight CSS inside EPUB."
    else
        log_warn "No highlight CSS found inside EPUB XHTML."
    fi
fi

# ============================================================
# 14. OPEN LOCALLY
# ============================================================

if [ -z "${GITHUB_ACTIONS:-}" ] && command -v open >/dev/null 2>&1; then
    log_info "Opening EPUB..."
    open "$OUTPUT_EPUB"
else
    log_info "Skipping automatic EPUB opening in CI."
fi
