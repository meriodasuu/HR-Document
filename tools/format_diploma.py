from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "diplom_shumov_hr_docs_final.docx"
OUT = ROOT / "diplom_shumov_hr_docs_formatted.docx"


START_PARAGRAPH = 32


def set_run_font(paragraph, *, bold: bool = False) -> None:
    for run in paragraph.runs:
        run.font.name = "Times New Roman"
        run.font.size = Pt(12)
        run.font.bold = bold
        run.font.italic = False
        run.font.underline = False


def format_paragraph(paragraph) -> None:
    text = paragraph.text.strip()
    style = paragraph.style.name if paragraph.style else ""
    fmt = paragraph.paragraph_format

    fmt.line_spacing = 1.5
    fmt.space_before = Pt(0)
    fmt.space_after = Pt(0)

    if style == "Heading 1" or text in {"Введение", "Заключение", "Приложение 1"} or text.startswith("РАЗДЕЛ "):
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        fmt.first_line_indent = Cm(1.25)
        set_run_font(paragraph, bold=False)
        return

    if style == "Heading 2" or text[:3].replace(".", "").isdigit():
        paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        fmt.first_line_indent = None
        fmt.space_before = Pt(8)
        fmt.space_after = Pt(8)
        set_run_font(paragraph, bold=False)
        return

    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    fmt.first_line_indent = Cm(1.25)

    if style == "List Paragraph":
        fmt.left_indent = Cm(0)

    set_run_font(paragraph, bold=False)


def main() -> None:
    doc = Document(SOURCE)

    for paragraph in doc.paragraphs[START_PARAGRAPH:]:
        if paragraph.text.strip():
            format_paragraph(paragraph)

    doc.save(OUT)


if __name__ == "__main__":
    main()
