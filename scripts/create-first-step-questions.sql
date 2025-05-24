-- Create questions for First Step School assignments
-- This script should be run after create-first-step-school-assignments.sql

DO $$
DECLARE
    -- Assignment IDs (we'll fetch these from the database)
    pre_class_english_id UUID;
    pre_class_hindi_id UUID;
    pre_class_math_id UUID;
    pre_class_gk_id UUID;
    pre_class_life_id UUID;

    nursery_english_id UUID;
    nursery_hindi_id UUID;
    nursery_math_id UUID;
    nursery_gk_id UUID;
    nursery_life_id UUID;

    kg_english_id UUID;
    kg_hindi_id UUID;
    kg_math_id UUID;
    kg_gk_id UUID;
    kg_life_id UUID;

    kg2_english_id UUID;
    kg2_hindi_id UUID;
    kg2_math_id UUID;
    kg2_gk_id UUID;
    kg2_life_id UUID;

    class1_english_id UUID;
    class1_hindi_id UUID;
    class1_math_id UUID;
    class1_gk_id UUID;
    class1_life_id UUID;

BEGIN
    -- Fetch assignment IDs by title
    SELECT id INTO pre_class_english_id FROM interactive_assignment WHERE title = 'Basic Recognition - Colors & Shapes';
    SELECT id INTO pre_class_hindi_id FROM interactive_assignment WHERE title = 'Simple Sounds - अ आ इ';
    SELECT id INTO pre_class_math_id FROM interactive_assignment WHERE title = 'Count to 3 - Numbers & Objects';
    SELECT id INTO pre_class_gk_id FROM interactive_assignment WHERE title = 'My Body Parts';
    SELECT id INTO pre_class_life_id FROM interactive_assignment WHERE title = 'Daily Activities';

    SELECT id INTO nursery_english_id FROM interactive_assignment WHERE title = 'Alphabet A to E';
    SELECT id INTO nursery_hindi_id FROM interactive_assignment WHERE title = 'अ से अनार - Hindi Letters';
    SELECT id INTO nursery_math_id FROM interactive_assignment WHERE title = 'Count 1 to 5';
    SELECT id INTO nursery_gk_id FROM interactive_assignment WHERE title = 'Animals & Their Sounds';
    SELECT id INTO nursery_life_id FROM interactive_assignment WHERE title = 'Good Habits';

    SELECT id INTO kg_english_id FROM interactive_assignment WHERE title = 'Alphabet A to J';
    SELECT id INTO kg_hindi_id FROM interactive_assignment WHERE title = 'क से कमल - Consonants';
    SELECT id INTO kg_math_id FROM interactive_assignment WHERE title = 'Count 1 to 10';
    SELECT id INTO kg_gk_id FROM interactive_assignment WHERE title = 'Fruits & Vegetables';
    SELECT id INTO kg_life_id FROM interactive_assignment WHERE title = 'Safety Rules';

    SELECT id INTO kg2_english_id FROM interactive_assignment WHERE title = 'Complete Alphabet A-Z';
    SELECT id INTO kg2_hindi_id FROM interactive_assignment WHERE title = 'मात्रा - Vowel Signs';
    SELECT id INTO kg2_math_id FROM interactive_assignment WHERE title = 'Count 1 to 20 & Simple Addition';
    SELECT id INTO kg2_gk_id FROM interactive_assignment WHERE title = 'Community Helpers';
    SELECT id INTO kg2_life_id FROM interactive_assignment WHERE title = 'Emotions & Feelings';

    SELECT id INTO class1_english_id FROM interactive_assignment WHERE title = 'Simple Words & Reading';
    SELECT id INTO class1_hindi_id FROM interactive_assignment WHERE title = 'सरल शब्द - Simple Hindi Words';
    SELECT id INTO class1_math_id FROM interactive_assignment WHERE title = 'Addition & Subtraction (1-10)';
    SELECT id INTO class1_gk_id FROM interactive_assignment WHERE title = 'Seasons & Weather';
    SELECT id INTO class1_life_id FROM interactive_assignment WHERE title = 'Time & Days of Week';

    -- ========================================
    -- PRE-CLASS QUESTIONS (Age 2-3)
    -- ========================================

    -- Pre-Class English: Basic Recognition - Colors & Shapes
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_english_id, 'MATCHING', 'Match the colors',
     '{"pairs": [{"id": "1", "left": "🔴", "right": "Red", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🔵", "right": "Blue", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🟡", "right": "Yellow", "leftType": "text", "rightType": "text"}]}', 1),

    (pre_class_english_id, 'MATCHING', 'Match the shapes',
     '{"pairs": [{"id": "1", "left": "⭕", "right": "Circle", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "⬜", "right": "Square", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🔺", "right": "Triangle", "leftType": "text", "rightType": "text"}]}', 2);

    -- Pre-Class Hindi: Simple Sounds
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_hindi_id, 'MULTIPLE_CHOICE', 'Which sound does this letter make: अ',
     '{"options": [{"id": "1", "text": "अ", "isCorrect": true}, {"id": "2", "text": "आ", "isCorrect": false}, {"id": "3", "text": "इ", "isCorrect": false}], "allowMultiple": false}', 1),

    (pre_class_hindi_id, 'MULTIPLE_CHOICE', 'Which sound does this letter make: आ',
     '{"options": [{"id": "1", "text": "अ", "isCorrect": false}, {"id": "2", "text": "आ", "isCorrect": true}, {"id": "3", "text": "इ", "isCorrect": false}], "allowMultiple": false}', 2);

    -- Pre-Class Math: Count to 3
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_math_id, 'MULTIPLE_CHOICE', 'How many apples? 🍎',
     '{"options": [{"id": "1", "text": "1", "isCorrect": true}, {"id": "2", "text": "2", "isCorrect": false}, {"id": "3", "text": "3", "isCorrect": false}], "allowMultiple": false}', 1),

    (pre_class_math_id, 'MULTIPLE_CHOICE', 'How many balls? ⚽⚽',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "2", "isCorrect": true}, {"id": "3", "text": "3", "isCorrect": false}], "allowMultiple": false}', 2),

    (pre_class_math_id, 'MULTIPLE_CHOICE', 'How many stars? ⭐⭐⭐',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "2", "isCorrect": false}, {"id": "3", "text": "3", "isCorrect": true}], "allowMultiple": false}', 3);

    -- Pre-Class GK: Body Parts
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_gk_id, 'MATCHING', 'Match the body parts',
     '{"pairs": [{"id": "1", "left": "👁️", "right": "Eyes", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "👃", "right": "Nose", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "👄", "right": "Mouth", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "👂", "right": "Ear", "leftType": "text", "rightType": "text"}]}', 1);

    -- Pre-Class Life Skills: Daily Activities
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_life_id, 'MULTIPLE_CHOICE', 'What do we do when we are hungry?',
     '{"options": [{"id": "1", "text": "Eat food", "isCorrect": true}, {"id": "2", "text": "Sleep", "isCorrect": false}, {"id": "3", "text": "Play", "isCorrect": false}], "allowMultiple": false}', 1),

    (pre_class_life_id, 'MULTIPLE_CHOICE', 'What do we do when we are tired?',
     '{"options": [{"id": "1", "text": "Eat", "isCorrect": false}, {"id": "2", "text": "Sleep", "isCorrect": true}, {"id": "3", "text": "Run", "isCorrect": false}], "allowMultiple": false}', 2);

    -- ========================================
    -- NURSERY QUESTIONS (Age 3-4)
    -- ========================================

    -- Nursery English: Alphabet A to E
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_english_id, 'MATCHING', 'Match letters with pictures',
     '{"pairs": [{"id": "1", "left": "A", "right": "🍎 Apple", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "B", "right": "🏀 Ball", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "C", "right": "🐱 Cat", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "D", "right": "🐕 Dog", "leftType": "text", "rightType": "text"}, {"id": "5", "left": "E", "right": "🥚 Egg", "leftType": "text", "rightType": "text"}]}', 1);

    -- Nursery Hindi: अ से अनार
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_hindi_id, 'MATCHING', 'अ से अनार - Match letters with objects',
     '{"pairs": [{"id": "1", "left": "अ", "right": "अनार", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "आ", "right": "आम", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "इ", "right": "इमली", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "ई", "right": "ईख", "leftType": "text", "rightType": "text"}]}', 1);

    -- Nursery Math: Count 1 to 5
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_math_id, 'MULTIPLE_CHOICE', 'Count the flowers: 🌸🌸🌸🌸',
     '{"options": [{"id": "1", "text": "3", "isCorrect": false}, {"id": "2", "text": "4", "isCorrect": true}, {"id": "3", "text": "5", "isCorrect": false}], "allowMultiple": false}', 1),

    (nursery_math_id, 'MULTIPLE_CHOICE', 'Count the cars: 🚗🚗🚗🚗🚗',
     '{"options": [{"id": "1", "text": "4", "isCorrect": false}, {"id": "2", "text": "5", "isCorrect": true}, {"id": "3", "text": "6", "isCorrect": false}], "allowMultiple": false}', 2);

    -- Nursery GK: Animals & Their Sounds
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_gk_id, 'MATCHING', 'Match animals with their sounds',
     '{"pairs": [{"id": "1", "left": "🐄 Cow", "right": "Moo", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🐱 Cat", "right": "Meow", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🐕 Dog", "right": "Woof", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "🐓 Rooster", "right": "Cock-a-doodle-doo", "leftType": "text", "rightType": "text"}]}', 1);

    -- Nursery Life Skills: Good Habits
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_life_id, 'MULTIPLE_CHOICE', 'What should we do before eating?',
     '{"options": [{"id": "1", "text": "Wash hands", "isCorrect": true}, {"id": "2", "text": "Watch TV", "isCorrect": false}, {"id": "3", "text": "Play games", "isCorrect": false}], "allowMultiple": false}', 1),

    (nursery_life_id, 'MULTIPLE_CHOICE', 'What should we say when someone helps us?',
     '{"options": [{"id": "1", "text": "Nothing", "isCorrect": false}, {"id": "2", "text": "Thank you", "isCorrect": true}, {"id": "3", "text": "Go away", "isCorrect": false}], "allowMultiple": false}', 2);

    -- ========================================
    -- KG QUESTIONS (Age 4-5)
    -- ========================================

    -- KG English: Alphabet A to J
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_english_id, 'MATCHING', 'Match uppercase and lowercase letters',
     '{"pairs": [{"id": "1", "left": "A", "right": "a", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "B", "right": "b", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "C", "right": "c", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "D", "right": "d", "leftType": "text", "rightType": "text"}, {"id": "5", "left": "E", "right": "e", "leftType": "text", "rightType": "text"}]}', 1),

    (kg_english_id, 'MATCHING', 'Match letters F-J with pictures',
     '{"pairs": [{"id": "1", "left": "F", "right": "🐸 Frog", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "G", "right": "🍇 Grapes", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "H", "right": "🏠 House", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "I", "right": "🍦 Ice cream", "leftType": "text", "rightType": "text"}, {"id": "5", "left": "J", "right": "🧃 Juice", "leftType": "text", "rightType": "text"}]}', 2);

    -- KG Hindi: क से कमल
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_hindi_id, 'MATCHING', 'क से कमल - Match consonants with objects',
     '{"pairs": [{"id": "1", "left": "क", "right": "कमल", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "ख", "right": "खरगोश", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "ग", "right": "गाय", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "घ", "right": "घर", "leftType": "text", "rightType": "text"}]}', 1);

    -- KG Math: Count 1 to 10
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_math_id, 'COMPLETION', 'Fill in the missing numbers: 1, 2, _, 4, 5',
     '{"text": "Fill in the missing numbers: 1, 2, _, 4, 5", "blanks": [{"id": "1", "answer": "3", "position": 3}]}', 1),

    (kg_math_id, 'COMPLETION', 'Fill in the missing numbers: 6, 7, _, 9, _',
     '{"text": "Fill in the missing numbers: 6, 7, _, 9, _", "blanks": [{"id": "1", "answer": "8", "position": 3}, {"id": "2", "answer": "10", "position": 5}]}', 2);

    -- KG GK: Fruits & Vegetables
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_gk_id, 'MULTIPLE_CHOICE', 'Which of these is a fruit?',
     '{"options": [{"id": "1", "text": "🍎 Apple", "isCorrect": true}, {"id": "2", "text": "🥕 Carrot", "isCorrect": false}, {"id": "3", "text": "🥔 Potato", "isCorrect": false}], "allowMultiple": false}', 1),

    (kg_gk_id, 'MULTIPLE_CHOICE', 'Which of these is a vegetable?',
     '{"options": [{"id": "1", "text": "🍌 Banana", "isCorrect": false}, {"id": "2", "text": "🥬 Cabbage", "isCorrect": true}, {"id": "3", "text": "🍊 Orange", "isCorrect": false}], "allowMultiple": false}', 2);

    -- KG Life Skills: Safety Rules
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_life_id, 'MULTIPLE_CHOICE', 'What should you do before crossing the road?',
     '{"options": [{"id": "1", "text": "Run quickly", "isCorrect": false}, {"id": "2", "text": "Look both ways", "isCorrect": true}, {"id": "3", "text": "Close your eyes", "isCorrect": false}], "allowMultiple": false}', 1),

    (kg_life_id, 'MULTIPLE_CHOICE', 'What should you do if you see fire?',
     '{"options": [{"id": "1", "text": "Touch it", "isCorrect": false}, {"id": "2", "text": "Tell an adult", "isCorrect": true}, {"id": "3", "text": "Hide", "isCorrect": false}], "allowMultiple": false}', 2);

END $$;
