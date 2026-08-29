import urllib.request
import json
import sqlite3

BASE_URL = "http://127.0.0.1:8000/api"
SESSION = "full_loop_student_01"
CONCEPT_ID = 3  # Regularization

def run_loop():
    print("=" * 80)
    print("STEP 11: FULL RETEST LEARNING RECOVERY LOOP")
    print("=" * 80)

    # 1. Answer a question wrong (Question 5, Option 0: 'force weights to zero')
    print("\n[1] Submitting initial incorrect answer to Question 5...")
    payload = json.dumps({
        "session_id": SESSION,
        "question_id": 5,
        "selected_answer_index": 0
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/answer", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        ans_res = json.loads(res.read().decode("utf-8"))
        print(f"    Correct: {ans_res['is_correct']}, Initial Mastery: {ans_res['current_mastery']}%")

    # 2. Get Misconception & Targeted Intervention
    print("\n[2] Fetching targeted intervention...")
    req = urllib.request.Request(f"{BASE_URL}/intervention/{CONCEPT_ID}?session_id={SESSION}")
    with urllib.request.urlopen(req) as res:
        interv_res = json.loads(res.read().decode("utf-8"))
        print(f"    Misconception Diagnosed: {interv_res['misconception']['likely_misconception']}")
        print(f"    Explanation Provided:   {interv_res['explanation'][:120]}...")

    # 3. Fetch Dynamic Retest Question
    print("\n[3] Generating dynamic retest question via Gemini...")
    req = urllib.request.Request(f"{BASE_URL}/retest/{CONCEPT_ID}?session_id={SESSION}")
    with urllib.request.urlopen(req) as res:
        retest_q = json.loads(res.read().decode("utf-8"))
        token = retest_q["question_token"]
        print(f"    Token Received:   {token}")
        print(f"    Retest Question:  {retest_q['question_text']}")
        for i, opt in enumerate(retest_q["options"]):
            print(f"      [{i}] {opt}")

    # 4. Lookup correct answer server-side from DB to simulate the student learning and answering correctly
    conn = sqlite3.connect("cogniscope.db")
    cursor = conn.cursor()
    cursor.execute("SELECT correct_answer_index FROM retest_questions WHERE token = ?", (token,))
    correct_idx = cursor.fetchone()[0]
    conn.close()

    print(f"\n[4] Submitting correct answer (Option Index {correct_idx}) to Retest...")
    retest_payload = json.dumps({
        "session_id": SESSION,
        "question_token": token,
        "selected_answer_index": correct_idx
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/retest/{CONCEPT_ID}/answer", data=retest_payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        final_res = json.loads(res.read().decode("utf-8"))
        print("\n" + "=" * 80)
        print("RECOVERY RESULTS:")
        print(f"  Previous Mastery: {final_res['previous_mastery']}%")
        print(f"  New Mastery:      {final_res['new_mastery']}%")
        print(f"  Improved:         {final_res['improved']}")
        print("=" * 80)

if __name__ == "__main__":
    run_loop()