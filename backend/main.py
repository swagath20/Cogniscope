import os
import json
import re
import uuid
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

from database import init_db, get_db

load_dotenv()

# Initialize schema and seed database
init_db()

app = FastAPI(title="Cogniscope Multi-Engine Diagnostic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DIFFICULTY_WEIGHTS = {
    "easy": 1,
    "medium": 2,
    "hard": 3
}

# --- MULTI-LLM CASCADE ENGINE (100% PURE LIVE AI - NO LOCAL FALLBACKS) ---

def clean_json_response(raw_text: str) -> str:
    cleaned = raw_text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        cleaned = match.group(1).strip()
    json_match = re.search(r"\{[\s\S]*\}", cleaned)
    if json_match:
        cleaned = json_match.group(0).strip()
    return cleaned

def call_gemini(prompt: str) -> str:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY not configured")
    from google import genai
    client = genai.Client(api_key=gemini_key.strip().strip("'").strip('"'))
    
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )
    if response.text:
        return response.text.strip()
    raise ValueError("Empty response from Gemini")

def call_groq(prompt: str) -> str:
    key = os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY")
    if not key:
        raise ValueError("No secondary key found in .env")

    clean_key = key.strip().strip("'").strip('"')
    client = Groq(api_key=clean_key)
    
    # Active, supported Groq production models
    active_models = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.3-70b-versatile"
    ]
    
    last_err = None
    for model_name in active_models:
        try:
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model_name,
                temperature=0.2,
            )
            print(f"[LLM Engine] Groq inference completed via {model_name}")
            return chat_completion.choices[0].message.content.strip()
        except Exception as e:
            last_err = e
            continue

    raise last_err

def query_llm_cascade(prompt: str) -> str:
    # 1. Primary: Gemini 2.5 Flash
    try:
        text = call_gemini(prompt)
        print("[LLM Engine] Live inference successful via Gemini (2.5 Flash).")
        return text
    except Exception as e:
        print(f"[LLM Engine] Gemini rate-limited/unavailable ({e}). Escalating to Groq LPU...")

    # 2. Secondary: Groq LPU
    try:
        text = call_groq(prompt)
        print("[LLM Engine] Live inference successful via Groq LPU.")
        return text
    except Exception as e:
        print(f"[LLM Engine] Groq inference error: {e}")

    raise HTTPException(status_code=502, detail="Both Gemini and Groq live inference providers failed.")

# --- MASTERY COMPUTATION ---

def calculate_mastery(session_id: str, concept_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, difficulty FROM questions WHERE concept_id = ?", (concept_id,))
    concept_questions = cursor.fetchall()
    total_q_count = len(concept_questions)
    if total_q_count == 0:
        conn.close()
        return 0, 0

    q_map = {q["id"]: q["difficulty"] for q in concept_questions}
    q_ids = list(q_map.keys())

    placeholders = ",".join("?" * len(q_ids))
    cursor.execute(f"""
        SELECT question_id, is_correct 
        FROM student_answers 
        WHERE session_id = ? AND question_id IN ({placeholders})
    """, [session_id] + q_ids)
    answers = cursor.fetchall()

    if not answers:
        conn.close()
        return 0, 0

    total_answered_weight = 0
    correct_weight = 0

    for ans in answers:
        diff = q_map.get(ans["question_id"], "easy")
        weight = DIFFICULTY_WEIGHTS.get(diff, 1)
        total_answered_weight += weight
        if ans["is_correct"]:
            correct_weight += weight

    mastery_percent = round((correct_weight / total_answered_weight) * 100, 1) if total_answered_weight > 0 else 0
    confidence_percent = min(round((len(answers) / total_q_count) * 100, 1), 100.0)

    cursor.execute("""
        INSERT INTO concept_mastery (session_id, concept_id, mastery_percent, confidence_percent, last_updated)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (session_id, concept_id, mastery_percent, confidence_percent))

    conn.commit()
    conn.close()

    return mastery_percent, confidence_percent

def detect_misconception(session_id: str, concept_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, description, prerequisite_concept_id FROM concepts WHERE id = ?", (concept_id,))
    concept = cursor.fetchone()
    if not concept:
        conn.close()
        raise HTTPException(status_code=404, detail="Concept not found")

    cursor.execute("""
        SELECT mastery_percent FROM concept_mastery 
        WHERE session_id = ? AND concept_id = ? 
        ORDER BY id DESC LIMIT 1
    """, (session_id, concept_id))
    mastery_row = cursor.fetchone()
    current_mastery = mastery_row["mastery_percent"] if mastery_row else 0.0

    prereq_name = None
    prereq_mastery = None
    if concept["prerequisite_concept_id"]:
        cursor.execute("SELECT id, name FROM concepts WHERE id = ?", (concept["prerequisite_concept_id"],))
        prereq_row = cursor.fetchone()
        if prereq_row:
            prereq_name = prereq_row["name"]
            cursor.execute("""
                SELECT mastery_percent FROM concept_mastery 
                WHERE session_id = ? AND concept_id = ? 
                ORDER BY id DESC LIMIT 1
            """, (session_id, prereq_row["id"]))
            p_mastery_row = cursor.fetchone()
            prereq_mastery = p_mastery_row["mastery_percent"] if p_mastery_row else 0.0

    cursor.execute("""
        SELECT q.question_text, q.options, q.correct_answer_index, sa.selected_answer_index
        FROM student_answers sa
        JOIN questions q ON sa.question_id = q.id
        WHERE sa.session_id = ? AND q.concept_id = ? AND sa.is_correct = 0
    """, (session_id, concept_id))
    wrong_answers_raw = cursor.fetchall()
    conn.close()

    wrong_answers = []
    for item in wrong_answers_raw:
        options = json.loads(item["options"])
        wrong_answers.append({
            "question": item["question_text"],
            "student_choice": options[item["selected_answer_index"]] if item["selected_answer_index"] < len(options) else "Invalid Option",
            "correct_answer": options[item["correct_answer_index"]]
        })

    prereq_gap = prereq_name if (prereq_mastery is not None and prereq_mastery < 60) else None

    prompt = f"""
You are an expert AI learning diagnostician analyzing a student's knowledge gaps.

Concept Being Tested: "{concept['name']}"
Concept Description: "{concept['description']}"
Current Concept Mastery: {current_mastery}%
Prerequisite Concept: "{prereq_name if prereq_name else 'None'}" (Prerequisite Mastery: {prereq_mastery if prereq_mastery is not None else 'N/A'}%)

Student's Incorrect Answers:
{json.dumps(wrong_answers, indent=2) if wrong_answers else "Student demonstrated proficiency or minimal gaps."}

Task:
Analyze why the student answered incorrectly or what core nuance requires attention. Return ONLY a valid JSON object matching this schema:
{{
  "concept": "{concept['name']}",
  "mastery_percent": {current_mastery},
  "likely_misconception": "one clear sentence describing what the student seems to misunderstand",
  "prerequisite_gap": {f'"{prereq_name}"' if prereq_gap else 'null'},
  "explanation_needed": "one clear sentence about what needs explaining"
}}
"""
    raw_text = query_llm_cascade(prompt)
    cleaned_json = clean_json_response(raw_text)
    data = json.loads(cleaned_json)
    
    return {
        "concept": data.get("concept", concept["name"]),
        "mastery_percent": data.get("mastery_percent", current_mastery),
        "likely_misconception": data.get("likely_misconception", f"Misunderstanding regarding core assumptions of {concept['name']}."),
        "prerequisite_gap": data.get("prerequisite_gap", prereq_gap),
        "explanation_needed": data.get("explanation_needed", f"Clarify how {concept['name']} operates in practice.")
    }

# --- SCHEMAS ---
class AnswerSubmission(BaseModel):
    session_id: str
    question_id: int
    selected_answer_index: int

class RetestAnswerSubmission(BaseModel):
    session_id: str
    question_token: str
    selected_answer_index: int

# --- API ENDPOINTS ---

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "gemini_active": bool(os.getenv("GEMINI_API_KEY")),
        "groq_active": bool(os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY"))
    }

@app.get("/api/quiz")
def get_quiz():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT q.id, q.concept_id, c.name as concept_name, q.question_text, q.options, q.difficulty
        FROM questions q
        JOIN concepts c ON q.concept_id = c.id
        WHERE q.question_text NOT LIKE 'Retest:%'
        ORDER BY c.id ASC, q.id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    questions = []
    for row in rows:
        questions.append({
            "id": row["id"],
            "concept_id": row["concept_id"],
            "concept_name": row["concept_name"],
            "question_text": row["question_text"],
            "options": json.loads(row["options"]),
            "difficulty": row["difficulty"]
        })
    return {"questions": questions}

@app.post("/api/answer")
def submit_answer(payload: AnswerSubmission):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT concept_id, correct_answer_index FROM questions WHERE id = ?", (payload.question_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Question not found")
        
    concept_id = row["concept_id"]
    is_correct = (row["correct_answer_index"] == payload.selected_answer_index)
    
    cursor.execute("""
        INSERT INTO student_answers (session_id, question_id, selected_answer_index, is_correct)
        VALUES (?, ?, ?, ?)
    """, (payload.session_id, payload.question_id, payload.selected_answer_index, is_correct))
    
    conn.commit()
    conn.close()

    mastery, confidence = calculate_mastery(payload.session_id, concept_id)
    
    return {
        "question_id": payload.question_id,
        "is_correct": is_correct,
        "concept_id": concept_id,
        "current_mastery": mastery,
        "confidence": confidence
    }

@app.get("/api/mastery")
def get_all_mastery(session_id: str = Query(..., description="Unique user session ID")):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, description, prerequisite_concept_id FROM concepts ORDER BY id ASC")
    concepts = cursor.fetchall()
    
    results = []
    for c in concepts:
        c_id = c["id"]
        cursor.execute("""
            SELECT mastery_percent, confidence_percent, last_updated 
            FROM concept_mastery 
            WHERE session_id = ? AND concept_id = ?
            ORDER BY id DESC LIMIT 1
        """, (session_id, c_id))
        mastery_row = cursor.fetchone()
        
        results.append({
            "concept_id": c_id,
            "name": c["name"],
            "description": c["description"],
            "prerequisite_concept_id": c["prerequisite_concept_id"],
            "mastery_percent": mastery_row["mastery_percent"] if mastery_row else 0,
            "confidence_percent": mastery_row["confidence_percent"] if mastery_row else 0
        })
        
    conn.close()
    return {"session_id": session_id, "mastery": results}

@app.get("/api/misconception/{concept_id}")
def get_misconception(concept_id: int, session_id: str = Query(..., description="Unique user session ID")):
    return detect_misconception(session_id, concept_id)

@app.get("/api/intervention/{concept_id}")
def get_intervention(concept_id: int, session_id: str = Query(..., description="Unique user session ID")):
    diagnosis = detect_misconception(session_id, concept_id)

    prompt = f"""
You are a top-tier machine learning mentor speaking directly to an ambitious student who made a conceptual error.

Diagnosed Gap:
- Concept: "{diagnosis['concept']}"
- Current Mastery: {diagnosis['mastery_percent']}%
- Likely Misconception: "{diagnosis['likely_misconception']}"
- Underlying Prerequisite Gap: "{diagnosis.get('prerequisite_gap') or 'None'}"
- Clarification Target: "{diagnosis['explanation_needed']}"

Instructions:
Write a short (3 to 5 sentences), clear, and encouraging explanation directly addressing this exact misconception.
- Do NOT give a generic textbook definition.
- Correct why their mental model tripped up and how to think about it correctly using an intuitive analogy.
- Keep the tone sharp, supportive, and intuitive.
- Return plain text only (no JSON, no Markdown headings).
"""
    explanation = query_llm_cascade(prompt)
    return {
        "misconception": diagnosis,
        "explanation": explanation
    }

@app.get("/api/retest/{concept_id}")
def get_retest(concept_id: int, session_id: str = Query(..., description="Unique user session ID")):
    diagnosis = detect_misconception(session_id, concept_id)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT question_text FROM questions WHERE concept_id = ?", (concept_id,))
    existing_questions = [q["question_text"] for q in cursor.fetchall()]
    conn.close()

    prompt = f"""
You are an expert exam author in Machine Learning.

Target Concept: "{diagnosis['concept']}"
Diagnosed Student Misconception: "{diagnosis['likely_misconception']}"
Explanation Target: "{diagnosis['explanation_needed']}"

Existing seeded questions on this concept (DO NOT DUPLICATE THESE):
{json.dumps(existing_questions, indent=2)}

Task:
Generate ONE brand-new, realistic, high-quality multiple-choice question designed specifically to verify if the student has overcome this exact misconception.
Provide exactly 4 distinct options and indicate the 0-indexed correct option.

Return ONLY a valid JSON object matching this schema:
{{
  "question_text": "The new question prompt",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "correct_answer_index": 0
}}
"""
    raw_text = query_llm_cascade(prompt)
    cleaned = clean_json_response(raw_text)
    retest_data = json.loads(cleaned)

    token = str(uuid.uuid4())
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO retest_questions (token, session_id, concept_id, question_text, options, correct_answer_index)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (token, session_id, concept_id, retest_data["question_text"], json.dumps(retest_data["options"]), retest_data["correct_answer_index"]))
    conn.commit()
    conn.close()

    return {
        "question_token": token,
        "concept_id": concept_id,
        "concept_name": diagnosis["concept"],
        "question_text": retest_data["question_text"],
        "options": retest_data["options"]
    }

@app.post("/api/retest/{concept_id}/answer")
def submit_retest_answer(concept_id: int, payload: RetestAnswerSubmission):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT token, concept_id, options, correct_answer_index 
        FROM retest_questions 
        WHERE token = ? AND session_id = ? AND concept_id = ?
    """, (payload.question_token, payload.session_id, concept_id))
    retest_q = cursor.fetchone()

    if not retest_q:
        conn.close()
        raise HTTPException(status_code=404, detail="Retest question not found or token expired")

    is_correct = (retest_q["correct_answer_index"] == payload.selected_answer_index)

    cursor.execute("""
        SELECT mastery_percent FROM concept_mastery 
        WHERE session_id = ? AND concept_id = ? 
        ORDER BY id DESC LIMIT 1
    """, (payload.session_id, concept_id))
    prev_row = cursor.fetchone()
    previous_mastery = prev_row["mastery_percent"] if prev_row else 0.0

    cursor.execute("""
        INSERT INTO questions (concept_id, question_text, options, correct_answer_index, difficulty)
        VALUES (?, ?, ?, ?, ?)
    """, (concept_id, "Retest: Verification Item", retest_q["options"], retest_q["correct_answer_index"], "hard"))
    new_q_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO student_answers (session_id, question_id, selected_answer_index, is_correct)
        VALUES (?, ?, ?, ?)
    """, (payload.session_id, new_q_id, payload.selected_answer_index, is_correct))

    conn.commit()
    conn.close()

    new_mastery, new_confidence = calculate_mastery(payload.session_id, concept_id)
    improved = new_mastery > previous_mastery

    return {
        "concept_id": concept_id,
        "is_correct": is_correct,
        "previous_mastery": previous_mastery,
        "new_mastery": new_mastery,
        "improved": improved
    }