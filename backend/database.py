import sqlite3
import json

DB_FILE = "cogniscope.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Concepts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        prerequisite_concept_id INTEGER,
        FOREIGN KEY (prerequisite_concept_id) REFERENCES concepts(id)
    )
    """)

    # 2. Questions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        concept_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer_index INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        FOREIGN KEY (concept_id) REFERENCES concepts(id)
    )
    """)

    # 3. Student answers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        selected_answer_index INTEGER NOT NULL,
        is_correct BOOLEAN NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id)
    )
    """)

    # 4. Concept mastery table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS concept_mastery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        concept_id INTEGER NOT NULL,
        mastery_percent REAL DEFAULT 0,
        confidence_percent REAL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (concept_id) REFERENCES concepts(id)
    )
    """)

    # 5. Dynamic Retest Questions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS retest_questions (
        token TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        concept_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (concept_id) REFERENCES concepts(id)
    )
    """)

    # Seed initial concepts and questions if empty
    cursor.execute("SELECT COUNT(*) as count FROM concepts")
    if cursor.fetchone()["count"] == 0:
        seed_concepts = [
            ("Training vs. Testing", "Splitting datasets to evaluate generalization performance.", None),
            ("Overfitting", "When a model memorizes noise in training data and fails on unseen data.", 1),
            ("Regularization", "Techniques like L1/L2 penalties added to loss functions to penalize complexity.", 2),
            ("Bias vs. Variance", "The trade-off between underfitting assumptions and sensitivity to fluctuations.", 3),
            ("Gradient Descent", "Optimization algorithm updating parameters in the direction of steepest descent.", 4),
        ]
        cursor.executemany(
            "INSERT INTO concepts (name, description, prerequisite_concept_id) VALUES (?, ?, ?)",
            seed_concepts
        )

        seed_questions = [
            (1, "Why do we evaluate a machine learning model on a separate test set rather than the training set?",
             json.dumps([
                 "To verify if the model can generalize to unseen real-world data",
                 "To make the training run faster by using less data",
                 "To calculate the model's training loss accurately",
                 "Because modern algorithms cannot calculate accuracy on training data"
             ]), 0, "easy"),
            (1, "If a model achieves 99% accuracy on the training set but 52% on the test set, what is the most direct conclusion?",
             json.dumps([
                 "The model is underfitting the data",
                 "The model failed to generalize and has learned training noise",
                 "The learning rate was set too low",
                 "The test dataset is fundamentally broken"
             ]), 1, "medium"),

            (2, "Which scenario is a classic symptom of model overfitting?",
             json.dumps([
                 "High training loss and high test loss",
                 "Low training loss and high test loss",
                 "High training loss and low test loss",
                 "Low training loss and low test loss"
             ]), 1, "easy"),
            (2, "How does increasing model complexity (e.g., adding many polynomial features) typically affect overfitting risk?",
             json.dumps([
                 "It decreases overfitting risk by capturing only essential patterns",
                 "It has zero impact on variance or generalization",
                 "It increases overfitting risk by giving the model capacity to memorize noise",
                 "It automatically regularizes the decision boundary"
             ]), 2, "medium"),

            (3, "What is the primary purpose of applying L2 regularization (Ridge) during model training?",
             json.dumps([
                 "To force all feature weights exactly to absolute zero",
                 "To penalize large weights and prevent any single feature from dominating",
                 "To increase the learning rate dynamically during gradient updates",
                 "To replace gradient descent with closed-form matrix inversion"
             ]), 1, "medium"),
            (3, "If we increase the regularization parameter (lambda / alpha) to an excessively large value, what will happen?",
             json.dumps([
                 "The model will severely overfit the training data",
                 "The model will become too simple and underfit (high bias)",
                 "The model will converge to 100% test accuracy",
                 "The loss function will become non-convex"
             ]), 1, "hard"),

            (4, "A model with 'High Bias' typically suffers from which problem?",
             json.dumps([
                 "It is overly sensitive to small fluctuations in the training dataset",
                 "It makes simplistic assumptions and fails to capture underlying patterns (Underfitting)",
                 "It has zero training error but infinite validation error",
                 "It has too many tunable parameters"
             ]), 1, "medium"),
            (4, "How does the Bias-Variance trade-off behave as model complexity increases?",
             json.dumps([
                 "Bias increases and Variance increases",
                 "Bias decreases and Variance decreases",
                 "Bias decreases while Variance increases",
                 "Bias increases while Variance decreases"
             ]), 2, "hard"),

            (5, "In Gradient Descent, what does the gradient vector represent?",
             json.dumps([
                 "The direction of steepest ascent of the loss function",
                 "The global minimum coordinates directly",
                 "The optimal learning rate step size",
                 "The total variance of the feature weights"
             ]), 0, "easy"),
            (5, "What is the most likely consequence of setting the learning rate too high in Gradient Descent?",
             json.dumps([
                 "Training will get stuck immediately at the initial point",
                 "The loss may oscillate wildly or diverge entirely away from the minimum",
                 "The model will strictly overfit the validation set",
                 "Gradient computation will become constant time"
             ]), 1, "hard"),
        ]

        cursor.executemany(
            "INSERT INTO questions (concept_id, question_text, options, correct_answer_index, difficulty) VALUES (?, ?, ?, ?, ?)",
            seed_questions
        )

    conn.commit()
    conn.close()