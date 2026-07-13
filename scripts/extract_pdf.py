"""Extract text from the user's uploaded resume PDF."""
import pdfplumber

PDF_PATH = "/home/z/my-project/upload/Profile.pdf"

with pdfplumber.open(PDF_PATH) as pdf:
    print(f"=== PDF has {len(pdf.pages)} page(s) ===\n")
    for i, page in enumerate(pdf.pages, start=1):
        text = page.extract_text() or ""
        print(f"\n========== PAGE {i} ==========\n")
        print(text)
        print()
