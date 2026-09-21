import io
import re
from typing import List
import pypdf
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

class DocumentProcessor:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def process_pdf(self, file_bytes: bytes, filename: str, subject: str = "General") -> List[Document]:
        """Extracts text page by page and uses LangChain RecursiveCharacterTextSplitter to produce Document objects."""
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        page_docs = []

        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            clean_text = self._clean_text(text)
            if not clean_text.strip():
                continue

            page_docs.append(
                Document(
                    page_content=clean_text,
                    metadata={
                        "filename": filename,
                        "title": filename,
                        "subject": subject,
                        "page": page_num,
                        "doc_id": filename
                    }
                )
            )

        if not page_docs:
            return []

        # Split using LangChain RecursiveCharacterTextSplitter
        split_docs = self.text_splitter.split_documents(page_docs)
        for idx, doc in enumerate(split_docs):
            doc.metadata["chunk_id"] = f"{filename}_c{idx}"
            doc.metadata["word_count"] = len(doc.page_content.split())

        return split_docs

    def process_raw_text(self, text: str, filename: str, subject: str = "General") -> List[Document]:
        """Processes plain text string into LangChain Document chunks."""
        clean = self._clean_text(text)
        doc = Document(
            page_content=clean,
            metadata={
                "filename": filename,
                "title": filename,
                "subject": subject,
                "page": 1,
                "doc_id": filename
            }
        )
        split_docs = self.text_splitter.split_documents([doc])
        for idx, d in enumerate(split_docs):
            d.metadata["chunk_id"] = f"{filename}_c{idx}"
            d.metadata["word_count"] = len(d.page_content.split())
        return split_docs

    def _clean_text(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
