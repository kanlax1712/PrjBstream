# Converting Documentation to Microsoft Word Format

## Instructions for Mac Users

### Option 1: Using Microsoft Word (Recommended)

1. **Open Microsoft Word**
2. **File → Open**
3. Select any `.md` file (e.g., `DOCUMENTATION.md`)
4. Word will automatically convert Markdown to Word format
5. **File → Save As**
6. Choose format: **Word Document (.docx)**
7. Save with appropriate name

### Option 2: Using Pandoc (Command Line)

#### Install Pandoc
```bash
# Using Homebrew
brew install pandoc

# Or download from: https://pandoc.org/installing.html
```

#### Convert Each Document
```bash
cd /Users/laxmikanth/Documents/Bstream

# Convert each document
pandoc DOCUMENTATION.md -o DOCUMENTATION.docx
pandoc SETUP_GUIDE.md -o SETUP_GUIDE.docx
pandoc FEATURES_DOCUMENTATION.md -o FEATURES_DOCUMENTATION.docx
pandoc TECHNICAL_WORKFLOW.md -o TECHNICAL_WORKFLOW.docx
pandoc API_REFERENCE.md -o API_REFERENCE.docx
pandoc DEPLOYMENT_GUIDE.md -o DEPLOYMENT_GUIDE.docx
```

#### Convert All at Once
```bash
# Create a script
cat > convert_all.sh << 'EOF'
#!/bin/bash
for file in *.md; do
    if [ "$file" != "CONVERT_TO_WORD.md" ]; then
        pandoc "$file" -o "${file%.md}.docx"
        echo "Converted $file to ${file%.md}.docx"
    fi
done
EOF

chmod +x convert_all.sh
./convert_all.sh
```

### Option 3: Using Online Converters

1. Visit: https://cloudconvert.com/md-to-docx
2. Upload `.md` file
3. Convert to `.docx`
4. Download converted file

### Option 4: Using VS Code Extension

1. Install "Markdown PDF" extension in VS Code
2. Open `.md` file
3. Right-click → "Markdown PDF: Export (docx)"
4. File will be saved as `.docx`

## Document List

The following documents are available for conversion:

1. **DOCUMENTATION.md** - Complete project documentation
2. **SETUP_GUIDE.md** - Installation and setup guide
3. **FEATURES_DOCUMENTATION.md** - Features and functionality
4. **TECHNICAL_WORKFLOW.md** - Technical workflows and architecture
5. **API_REFERENCE.md** - Complete API reference
6. **DEPLOYMENT_GUIDE.md** - Production deployment guide

## Formatting Notes

After conversion, you may want to:
- Add page numbers
- Add table of contents (Word can auto-generate)
- Adjust heading styles
- Add headers/footers
- Insert page breaks between major sections
- Add cover page
- Adjust margins and spacing

## Quick Conversion Script

Save this as `convert_to_word.sh`:

```bash
#!/bin/bash

# Navigate to project directory
cd /Users/laxmikanth/Documents/Bstream

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "Pandoc is not installed. Installing via Homebrew..."
    brew install pandoc
fi

# Convert all markdown files to Word
echo "Converting documentation files to Word format..."

for file in DOCUMENTATION.md SETUP_GUIDE.md FEATURES_DOCUMENTATION.md TECHNICAL_WORKFLOW.md API_REFERENCE.md DEPLOYMENT_GUIDE.md; do
    if [ -f "$file" ]; then
        output="${file%.md}.docx"
        pandoc "$file" -o "$output" --reference-doc=reference.docx 2>/dev/null || pandoc "$file" -o "$output"
        echo "✓ Converted $file → $output"
    else
        echo "✗ File not found: $file"
    fi
done

echo ""
echo "Conversion complete! Word documents are ready."
```

Make it executable and run:
```bash
chmod +x convert_to_word.sh
./convert_to_word.sh
```

