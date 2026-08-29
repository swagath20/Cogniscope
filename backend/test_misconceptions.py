import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"

def submit(session_id, question_id, choice_idx):
    payload = json.dumps({
        "session_id": session_id,
        "question_id": question_id,
        "selected_answer_index": choice_idx
    }).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/answer", data=payload, headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req)

def get_diagnosis(session_id, concept_id):
    req = urllib.request.Request(f"{BASE_URL}/misconception/{concept_id}?session_id={session_id}")
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def run_tests():
    print("=" * 80)
    print("RUNNING STEP 9 MISCONCEPTION COMPARISON TEST")
    print("=" * 80 + "\n")

    # Simulation 1: Student A on Regularization (Concept 3, Question 5, Option 0)
    s_a = "student_regularization_gap"
    submit(s_a, 5, 0)
    res_a = get_diagnosis(s_a, 3)

    # Simulation 2: Student B on Bias vs Variance (Concept 4, Question 7, Option 0)
    s_b = "student_bias_variance_gap"
    submit(s_b, 7, 0)
    res_b = get_diagnosis(s_b, 4)

    # Simulation 3: Student C on Gradient Descent (Concept 5, Question 10, Option 0)
    s_c = "student_gradient_gap"
    submit(s_c, 10, 0)
    res_c = get_diagnosis(s_c, 5)

    cases = [
        ("Student A (Regularization Gap)", res_a),
        ("Student B (Bias vs Variance Gap)", res_b),
        ("Student C (Gradient Descent Gap)", res_c),
    ]

    for title, result in cases:
        print(f"--- {title} ---")
        print(f"Concept:             {result.get('concept')}")
        print(f"Likely Misconception: {result.get('likely_misconception')}")
        print(f"Prerequisite Gap:     {result.get('prerequisite_gap')}")
        print(f"Explanation Needed:   {result.get('explanation_needed')}\n")

if __name__ == "__main__":
    run_tests()