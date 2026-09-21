import os
import re
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
try:
    from langchain.chains.combine_documents import create_stuff_documents_chain
except ImportError:
    from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from app.pdf_processor import DocumentProcessor

load_dotenv()

class LangChainRAGStore:
    """LangChain Vector Store & RAG Chain Manager."""
    def __init__(self):
        self.documents: List[Document] = []
        self.documents_meta: Dict[str, Dict[str, Any]] = {}
        self.processor = DocumentProcessor()
        self.load_from_db()

    def load_from_db(self):
        try:
            from app.db import get_all_documents_db
            db_docs = get_all_documents_db()
            for doc_item in db_docs:
                filename = doc_item["title"]
                subject = doc_item["subject"]
                total_pages = doc_item["totalPages"]
                chunks = doc_item.get("chunks", [])

                langchain_docs = []
                for c in chunks:
                    langchain_docs.append(
                        Document(
                            page_content=c["text"],
                            metadata={
                                "filename": filename,
                                "title": filename,
                                "subject": subject,
                                "page": c.get("page", 1),
                                "doc_id": filename,
                                "word_count": c.get("word_count", len(c["text"].split()))
                            }
                        )
                    )
                if langchain_docs:
                    self.documents_meta[filename] = {
                        "doc_id": filename,
                        "title": filename,
                        "subject": subject,
                        "totalPages": total_pages,
                        "chunks_count": len(langchain_docs)
                    }
                    self.documents.extend(langchain_docs)
        except Exception as e:
            print("Error loading docs from DB:", e)

    def add_documents(self, filename: str, subject: str, total_pages: int, docs: List[Document]):
        self.documents_meta[filename] = {
            "doc_id": filename,
            "title": filename,
            "subject": subject,
            "totalPages": total_pages,
            "chunks_count": len(docs)
        }
        self.documents.extend(docs)

    def delete_document(self, filename: str):
        if filename in self.documents_meta:
            del self.documents_meta[filename]
        self.documents = [d for d in self.documents if d.metadata.get("filename") != filename]

    def search_relevant_documents_with_scores(
        self,
        query: str,
        top_k: int = 4,
        subject_filter: Optional[str] = None,
        filename_filter: Optional[str] = None,
        min_threshold: float = 0.25
    ) -> List[tuple]:
        stopwords = {
            'what', 'is', 'are', 'was', 'were', 'a', 'an', 'the', 'how', 'why', 'who', 'where', 'when', 'which',
            'can', 'you', 'tell', 'me', 'about', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'and',
            'or', 'do', 'does', 'did', 'be', 'explain', 'describe', 'define', 'summarize', 'find', 'give', 'list',
            'please', 'show', 'write', 'detail', 'details', 'meaning', 'concept', 'formula', 'notes'
        }

        query_words = [w.lower() for w in re.findall(r'\b\w+\b', query) if len(w) > 1]
        meaningful_words = [w for w in query_words if w not in stopwords]
        if not meaningful_words:
            meaningful_words = query_words

        matched = []
        clean_query = query.lower().strip()

        for doc in self.documents:
            if filename_filter and filename_filter != "all" and doc.metadata.get("filename") != filename_filter:
                continue

            if subject_filter and subject_filter.lower() != "all" and doc.metadata.get("subject", "").lower() != subject_filter.lower():
                continue

            content_lower = doc.page_content.lower()

            # Sparse Keyword overlap score
            word_matches = sum(1 for w in meaningful_words if w in content_lower)
            word_score = (word_matches / len(meaningful_words)) if len(meaningful_words) > 0 else 0

            # Phrase match boost
            phrase_boost = 1.0 if clean_query in content_lower else 0.0

            # Combined hybrid confidence score (0.0 to 1.0)
            confidence_score = min(1.0, (word_score * 0.65) + (phrase_boost * 0.35))

            # Only consider document a valid ground source if confidence score >= min_threshold or phrase match
            if confidence_score >= min_threshold or phrase_boost > 0:
                matched.append((confidence_score, doc))

        # Sort descending by confidence score
        matched.sort(key=lambda x: x[0], reverse=True)
        return matched[:top_k]

    def search_relevant_documents(self, query: str, top_k: int = 4, subject_filter: Optional[str] = None, filename_filter: Optional[str] = None) -> List[Document]:
        scored = self.search_relevant_documents_with_scores(query, top_k, subject_filter, filename_filter)
        return [doc for score, doc in scored]

    def _is_gk_or_greeting(self, query: str) -> bool:
        clean = re.sub(r'[^\w\s]', '', query.lower()).strip()
        words = clean.split()
        if not words:
            return True

        # 1. Greetings & Basic Conversational Phrases
        greetings = {
            'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
            'howdy', 'hola', 'sup', 'yo', 'thanks', 'thank you', 'thx', 'bye', 'goodbye',
            'who are you', 'what is your name', 'how are you', 'what can you do', 'help', 'test',
            'nice to meet you', 'ok', 'okay', 'great', 'awesome'
        }

        if clean in greetings or (len(words) <= 3 and any(w in greetings for w in words)):
            return True

        # 2. Broad General Knowledge (GK) patterns
        gk_patterns = [
            r'\bcapital of\b',
            r'\bprime minister of\b',
            r'\bpresident of\b',
            r'\bwho wrote\b',
            r'\bwho discovered\b',
            r'\bwho invented\b',
            r'\bwho painted\b',
            r'\bwho created\b',
            r'\blargest (country|ocean|planet|river|city|animal|continent)\b',
            r'\bsmallest (country|planet|ocean|animal|continent)\b',
            r'\btallest (mountain|building|structure)\b',
            r'\bcurrency of\b',
            r'\bnational (animal|bird|flower|anthem|flag) of\b',
            r'\bwhere is (paris|london|tokyo|new york|eiffel tower|statue of liberty)\b',
            r'\bhow many (days|months|continents|oceans|states|countries)\b',
            r'\bwhen did (ww1|ww2|world war|apollo 11) (start|end|happen)\b',
            r'\bwhat is (a|an|the)?\s*(meaning|definition|formula|capital|currency|president|prime minister)\b'
        ]

        for pattern in gk_patterns:
            if re.search(pattern, clean):
                return True

        return False

    def _contextualize_query(
        self,
        query: str,
        chat_history: List[Dict[str, Any]],
        llm: ChatGoogleGenerativeAI
    ) -> str:
        if not chat_history:
            return query

        formatted_history = []
        for msg in chat_history[-6:]:
            role = "User" if msg.get("sender") == "user" else "Assistant"
            text = str(msg.get("text", "")).strip()
            if text and not text.startswith("❌") and not text.startswith("⚠️"):
                if role == "Assistant" and len(text) > 250:
                    text = text[:250] + "..."
                formatted_history.append(f"{role}: {text}")

        if not formatted_history:
            return query

        pronouns = [
            r'\bit\b', r'\bthis\b', r'\bthat\b', r'\bthey\b', r'\bthem\b', r'\bthese\b',
            r'\bthose\b', r'\bits\b', r'\bwhy\b', r'\bhow\b', r'\bwhat about\b', r'\bmore\b',
            r'\bexplain\b', r'\badvantage\b', r'\bdisadvantage\b', r'\bbenefit\b'
        ]
        needs_context = any(re.search(p, query.lower()) for p in pronouns) or len(query.split()) <= 4

        if not needs_context:
            return query

        history_str = "\n".join(formatted_history)
        prompt_text = (
            "Given the following conversation history and a follow-up question, rephrase the follow-up question into a clear standalone search query that can be understood without the conversation history. "
            "Do NOT answer the question. Only output the reformulated standalone search query.\n\n"
            f"Conversation History:\n{history_str}\n\n"
            f"Follow-Up Question: {query}\n\n"
            "Standalone Query:"
        )

        try:
            res = llm.invoke(prompt_text)
            rephrased = res.content.strip() if hasattr(res, 'content') else str(res).strip()
            if rephrased and len(rephrased) > 2:
                rephrased = rephrased.strip('"\'')
                print(f"[Follow-Up] Original query: '{query}' -> Standalone search query: '{rephrased}'")
                return rephrased
        except Exception as e:
            print("Query contextualization error:", e)

        return query

    def _is_greeting(self, query: str) -> bool:
        clean = re.sub(r'[^\w\s]', '', query.lower()).strip()
        words = clean.split()
        if not words:
            return True

        greetings = {
            'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
            'howdy', 'hola', 'sup', 'yo', 'thanks', 'thank you', 'thx', 'bye', 'goodbye',
            'who are you', 'what is your name', 'how are you', 'what can you do', 'help', 'test',
            'nice to meet you', 'ok', 'okay', 'great', 'awesome', 'thank u', 'thnk u'
        }

        if clean in greetings or (len(words) <= 3 and any(w in greetings for w in words)):
            return True

        return False

    def run_langchain_rag_chain(
        self,
        query: str,
        subject_filter: Optional[str] = "all",
        filename_filter: Optional[str] = None,
        allow_general: bool = False,
        chat_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        api_key = (
            os.getenv("GEMINI_API_KEY", "").strip() or
            os.getenv("GOOGLE_API_KEY", "").strip() or
            os.getenv("OPENAI_API_KEY", "").strip()
        )
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

        if not api_key or api_key in ["your_gemini_api_key_here", "your_openai_api_key_here"]:
            return {
                "answerText": (
                    "⚠️ **Google Gemini API Key Missing in Backend `.env`**\n\n"
                    "Please set your Gemini API Key in `backend\\.env`:\n\n"
                    "```env\nGEMINI_API_KEY=AIzaSy...\n```\n\n"
                    "💡 **Get a Free Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)\n\n"
                    "Then restart the backend server (`python run.py`)!"
                ),
                "sources": [],
                "consentRequired": False
            }

        llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key, temperature=0.2)
        is_doc_specific = bool(filename_filter and filename_filter != "all")

        # Format recent conversation history for prompt inclusion
        formatted_history_text = ""
        if chat_history:
            history_lines = []
            for msg in (chat_history or [])[-6:]:
                role = "Human" if msg.get("sender") == "user" else "Assistant"
                text = str(msg.get("text", "")).strip()
                if text and not text.startswith("❌") and not text.startswith("⚠️"):
                    if role == "Assistant" and len(text) > 300:
                        text = text[:300] + "..."
                    history_lines.append(f"{role}: {text}")
            if history_lines:
                formatted_history_text = "=== RECENT CONVERSATION HISTORY ===\n" + "\n".join(history_lines) + "\n\n"

        # 0. Check if query is a greeting or basic casual interaction
        if self._is_greeting(query):
            doc_ctx = f" for active document **`{filename_filter}`**" if is_doc_specific else ""
            system_instruction = (
                f"You are a warm, polite, and helpful AI Study Assistant{doc_ctx}. "
                "Respond warmly, politely, and concisely to the user's greeting or casual statement, and offer to help them with their questions or study material."
            )
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_instruction + ("\n\n" + formatted_history_text if formatted_history_text else "")),
                ("human", "{input}")
            ])
            chain = prompt | llm
            try:
                res = chain.invoke({"input": query})
                answer_text = res.content if hasattr(res, 'content') else str(res)
            except Exception:
                answer_text = f"Hello! 👋 I'm your AI Study Assistant{doc_ctx}. How can I help you with your studies today?"

            return {
                "answerText": answer_text,
                "sources": [],
                "consentRequired": False,
                "retrieved_docs_count": 0
            }

        # Contextualize query if this is a follow-up question
        search_query = self._contextualize_query(query, chat_history or [], llm)

        # 1. Check if search query is a general knowledge question or greeting
        is_gk_query = self._is_gk_or_greeting(search_query)

        # 2. Retrieve raw scored documents using the contextualized search query
        raw_scored_docs = self.search_relevant_documents_with_scores(
            search_query, top_k=4, subject_filter=subject_filter, filename_filter=filename_filter, min_threshold=0.0
        )
        best_raw_score = raw_scored_docs[0][0] if raw_scored_docs else 0.0

        # Retrieve documents meeting the minimum confidence threshold (0.25)
        scored_docs = [item for item in raw_scored_docs if item[0] >= 0.25]

        # If general query and score is below 0.50, ignore low/medium doc matches
        if is_gk_query and scored_docs and scored_docs[0][0] < 0.50:
            scored_docs = []

        if scored_docs and scored_docs[0][0] >= 0.25:
            # Filter to top matching confidence source(s)
            best_score = scored_docs[0][0]
            best_scored_docs = [item for item in scored_docs if item[0] >= (best_score - 0.05)]
            relevant_docs = [doc for score, doc in best_scored_docs]

            system_instruction = (
                "You are an AI Study Assistant. Answer the student's question accurately and concisely based on the provided study material context and recent conversation history. "
                "Maintain full continuity with the recent conversation when answering follow-up questions. "
                "Carefully verify whether the provided study material context contains the answer to the question. "
                "If the provided study material context DOES NOT contain the answer, or if the question is entirely unrelated to the document content, "
                "you MUST start your response with '[NOT_IN_DOC]' on the very first line before writing any other text."
            )

            prompt = ChatPromptTemplate.from_messages([
                ("system", system_instruction + "\n\n" + formatted_history_text + "=== RETRIEVED STUDY MATERIAL CONTEXT (BEST CONFIDENCE SOURCE) ===\n{context}"),
                ("human", "{input}")
            ])

            combine_docs_chain = create_stuff_documents_chain(llm, prompt)

            try:
                res_answer = combine_docs_chain.invoke({
                    "context": relevant_docs,
                    "input": query
                })
                answer_text = res_answer.content if hasattr(res_answer, 'content') else str(res_answer)
            except Exception as e:
                answer_text = f"❌ **LangChain Execution Error**: {str(e)}"

            if answer_text.startswith("[NOT_IN_DOC]"):
                if is_doc_specific and not allow_general:
                    if best_raw_score > 0.05:
                        answer_notice = (
                            f"⚠️ **Information Not Found in Document**\n\n"
                            f"The requested answer was not found in active document **`{filename_filter}`**.\n\n"
                            f"Would you like me to answer using general AI knowledge?"
                        )
                        return {
                            "answerText": answer_notice,
                            "sources": [],
                            "consentRequired": True,
                            "retrieved_docs_count": 0
                        }
                    else:
                        answer_notice = (
                            f"⚠️ **Cannot Answer Question**\n\n"
                            f"Cannot answer for this question as it doesn't belong to the context in document **`{filename_filter}`**."
                        )
                        return {
                            "answerText": answer_notice,
                            "sources": [],
                            "consentRequired": False,
                            "retrieved_docs_count": 0
                        }
                else:
                    clean_answer = answer_text.replace("[NOT_IN_DOC]", "").strip()
                    return {
                        "answerText": clean_answer,
                        "sources": [],
                        "consentRequired": False,
                        "retrieved_docs_count": 0
                    }

            def get_rel_label(s: float) -> str:
                if s >= 0.65:
                    return "High Relevance"
                elif s >= 0.35:
                    return "Medium Relevance"
                else:
                    return "Low Relevance"

            sources = [
                {
                    "docId": d.metadata.get("filename"),
                    "title": d.metadata.get("filename"),
                    "page": d.metadata.get("page", 1),
                    "subject": d.metadata.get("subject", "General"),
                    "confidenceScore": round(score, 2),
                    "relevanceScore": round(score, 2),
                    "relevanceLabel": get_rel_label(score),
                    "snippet": d.page_content[:160] + "...",
                    "fullText": d.page_content
                }
                for score, d in best_scored_docs
            ]

            return {
                "answerText": answer_text,
                "sources": sources,
                "consentRequired": False,
                "retrieved_docs_count": len(sources)
            }
        else:
            # NO relevant high-confidence source found in document store for this question
            if is_doc_specific and not allow_general:
                if best_raw_score > 0.05:
                    answer_text = (
                        f"⚠️ **Information Not Found in Document**\n\n"
                        f"The requested answer was not found in active document **`{filename_filter}`**.\n\n"
                        f"Would you like me to answer using general AI knowledge?"
                    )
                    return {
                        "answerText": answer_text,
                        "sources": [],
                        "consentRequired": True,
                        "retrieved_docs_count": 0
                    }
                else:
                    answer_text = (
                        f"⚠️ **Cannot Answer Question**\n\n"
                        f"Cannot answer for this question as it doesn't belong to the context in document **`{filename_filter}`**."
                    )
                    return {
                        "answerText": answer_text,
                        "sources": [],
                        "consentRequired": False,
                        "retrieved_docs_count": 0
                    }

            # Normal chat OR consent granted via allow_general=True:
            system_instruction = (
                "You are an AI Study Assistant. Answer the student's question accurately, clearly, and comprehensively using recent conversation history and your general knowledge. "
                "Maintain full continuity with previous questions and answers when answering follow-up questions. "
                "Use LaTeX math formatting ($...$ or $$...$$) where relevant."
            )
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_instruction + ("\n\n" + formatted_history_text if formatted_history_text else "")),
                ("human", "{input}")
            ])

            chain = prompt | llm
            try:
                res = chain.invoke({"input": query})
                answer_text = res.content if hasattr(res, 'content') else str(res)
            except Exception as e:
                answer_text = f"❌ **LLM Execution Error**: {str(e)}"

            return {
                "answerText": answer_text,
                "sources": [],
                "consentRequired": False,
                "retrieved_docs_count": 0
            }

    def get_documents(self) -> List[Dict[str, Any]]:
        return list(self.documents_meta.values())

    def get_chunks_for_document(self, filename: str) -> List[Dict[str, Any]]:
        return [
            {
                "text": d.page_content,
                "page": d.metadata.get("page", 1),
                "word_count": d.metadata.get("word_count", len(d.page_content.split()))
            }
            for d in self.documents if d.metadata.get("filename") == filename
        ]

    def generate_quiz(self, filename: str, num_questions: int = 10, difficulty: str = "Medium") -> Dict[str, Any]:
        api_key = (
            os.getenv("GEMINI_API_KEY", "").strip() or
            os.getenv("GOOGLE_API_KEY", "").strip() or
            os.getenv("OPENAI_API_KEY", "").strip()
        )
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

        if not api_key:
            return {"status": "error", "message": "Gemini API key is missing in backend `.env` file."}

        matching_chunks = [d.page_content for d in self.documents if d.metadata.get("filename") == filename]
        if not matching_chunks:
            try:
                from app.db import get_all_documents_db
                db_docs = get_all_documents_db()
                for doc_item in db_docs:
                    if doc_item["title"] == filename:
                        matching_chunks = [c["text"] for c in doc_item.get("chunks", [])]
                        break
            except Exception as e:
                print("Error fetching DB chunks for quiz:", e)

        if not matching_chunks:
            return {"status": "error", "message": f"No content found for document '{filename}'"}

        combined_text = "\n\n".join(matching_chunks)
        words = combined_text.split()
        if len(words) > 10000:
            combined_text = " ".join(words[:10000]) + "\n...[truncated for quiz generation]"

        system_prompt = (
            f"You are an expert AI quiz author and educator. Generate a high-quality, comprehensive multiple-choice quiz (MCQ) "
            f"based STRICTLY on the provided study document content.\n\n"
            f"Requirements:\n"
            f"- Number of Questions: EXACTLY {num_questions}\n"
            f"- Difficulty Level: {difficulty}\n"
            f"- Output MUST be valid JSON only. Do not include markdown codeblocks or raw text outside the JSON object.\n"
            f"- Structure:\n"
            "{\n"
            f'  "title": "Quiz on {filename}",\n'
            '  "questions": [\n'
            '    {\n'
            '      "id": 1,\n'
            '      "question": "Question text here...",\n'
            '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '      "correct_answer": "Option A",\n'
            '      "explanation": "Detailed explanation based on the document text."\n'
            '    }\n'
            '  ]\n'
            "}\n\n"
            f"Make sure every question has 4 distinct options, and correct_answer EXACTLY matches one of the 4 strings in options."
        )

        llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key, temperature=0.3)
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"STUDY DOCUMENT CONTENT:\n\n{combined_text}")
        ]

        try:
            res = llm.invoke(messages)
            raw_response = res.content if hasattr(res, 'content') else str(res)
            
            clean_json = raw_response.strip()
            if "```" in clean_json:
                match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', clean_json)
                if match:
                    clean_json = match.group(1).strip()
                else:
                    clean_json = re.sub(r'^```(?:json)?\s*', '', clean_json, flags=re.MULTILINE)
                    clean_json = re.sub(r'\s*```$', '', clean_json, flags=re.MULTILINE)

            quiz_data = json.loads(clean_json)
            raw_qs = quiz_data.get("questions", [])
            
            sanitized_questions = []
            for idx, q in enumerate(raw_qs):
                opts = q.get("options", [])
                if not isinstance(opts, list) or len(opts) < 2:
                    continue
                correct = q.get("correct_answer")
                if correct not in opts:
                    correct = opts[0]
                sanitized_questions.append({
                    "id": q.get("id", idx + 1),
                    "question": q.get("question", f"Question {idx + 1}"),
                    "options": opts,
                    "correct_answer": correct,
                    "explanation": q.get("explanation", "Based on the study document.")
                })

            if not sanitized_questions:
                return {"status": "error", "message": "Failed to parse questions from AI output."}

            return {
                "status": "success",
                "filename": filename,
                "num_questions": len(sanitized_questions),
                "title": quiz_data.get("title", f"Quiz on {filename}"),
                "questions": sanitized_questions
            }
        except Exception as e:
            print("Quiz generation parsing error:", e)
            return {"status": "error", "message": f"Quiz generation failed: {str(e)}"}
