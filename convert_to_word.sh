#!/bin/bash

# Bstream Documentation to Word Converter
# This script converts all Markdown documentation files to Microsoft Word format

echo "=========================================="
echo "Bstream Documentation Converter"
echo "=========================================="
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "⚠️  Pandoc is not installed."
    echo ""
    echo "Installing Pandoc via Homebrew..."
    echo "If you don't have Homebrew, install it from: https://brew.sh"
    echo ""
    read -p "Press Enter to continue with installation, or Ctrl+C to cancel..."
    brew install pandoc
    echo ""
fi

# Check if pandoc installation was successful
if ! command -v pandoc &> /dev/null; then
    echo "❌ Pandoc installation failed. Please install manually:"
    echo "   brew install pandoc"
    echo "   Or download from: https://pandoc.org/installing.html"
    exit 1
fi

echo "✓ Pandoc is installed"
echo ""

# Create output directory
mkdir -p word_documents
echo "📁 Output directory: word_documents/"
echo ""

# List of documents to convert
documents=(
    "DOCUMENTATION.md"
    "SETUP_GUIDE.md"
    "FEATURES_DOCUMENTATION.md"
    "TECHNICAL_WORKFLOW.md"
    "API_REFERENCE.md"
    "DEPLOYMENT_GUIDE.md"
)

# Convert each document
converted=0
failed=0

for file in "${documents[@]}"; do
    if [ -f "$file" ]; then
        output="word_documents/${file%.md}.docx"
        echo "Converting: $file → $output"
        
        # Convert with better formatting
        if pandoc "$file" \
            -o "$output" \
            --from markdown \
            --to docx \
            --standalone \
            --toc \
            --toc-depth=3 \
            --reference-doc=/System/Library/Templates/Reference.docx 2>/dev/null || \
           pandoc "$file" \
            -o "$output" \
            --from markdown \
            --to docx \
            --standalone \
            --toc \
            --toc-depth=3; then
            echo "  ✓ Success"
            ((converted++))
        else
            echo "  ✗ Failed"
            ((failed++))
        fi
        echo ""
    else
        echo "⚠️  File not found: $file"
        echo ""
        ((failed++))
    fi
done

echo "=========================================="
echo "Conversion Summary"
echo "=========================================="
echo "✓ Successfully converted: $converted"
if [ $failed -gt 0 ]; then
    echo "✗ Failed: $failed"
fi
echo ""
echo "📄 Word documents saved in: word_documents/"
echo ""
echo "You can now open the .docx files in Microsoft Word"
echo "and customize formatting, add headers/footers, etc."
echo ""

