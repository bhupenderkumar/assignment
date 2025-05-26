-- Create additional questions for First Step School assignments (Part 3)
-- This script adds 5 more questions per class per subject
-- Run after create-first-step-questions.sql and create-first-step-questions-part2.sql

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
    -- PRE-CLASS ADDITIONAL QUESTIONS (Age 2-3)
    -- ========================================

    -- Pre-Class English: Basic Recognition - Colors & Shapes (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_english_id, 'MULTIPLE_CHOICE', 'What color is this? 🟢',
     '{"options": [{"id": "1", "text": "Red", "isCorrect": false}, {"id": "2", "text": "Green", "isCorrect": true}, {"id": "3", "text": "Blue", "isCorrect": false}], "allowMultiple": false}', 3),

    (pre_class_english_id, 'MULTIPLE_CHOICE', 'What shape is this? ⭐',
     '{"options": [{"id": "1", "text": "Circle", "isCorrect": false}, {"id": "2", "text": "Square", "isCorrect": false}, {"id": "3", "text": "Star", "isCorrect": true}], "allowMultiple": false}', 4),

    (pre_class_english_id, 'MATCHING', 'Match more colors',
     '{"pairs": [{"id": "1", "left": "🟠", "right": "Orange", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🟣", "right": "Purple", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🟤", "right": "Brown", "leftType": "text", "rightType": "text"}]}', 5),

    (pre_class_english_id, 'MULTIPLE_CHOICE', 'What color is the sun? ☀️',
     '{"options": [{"id": "1", "text": "Yellow", "isCorrect": true}, {"id": "2", "text": "Blue", "isCorrect": false}, {"id": "3", "text": "Green", "isCorrect": false}], "allowMultiple": false}', 6),

    (pre_class_english_id, 'MULTIPLE_CHOICE', 'What shape has 4 sides?',
     '{"options": [{"id": "1", "text": "Circle", "isCorrect": false}, {"id": "2", "text": "Square", "isCorrect": true}, {"id": "3", "text": "Triangle", "isCorrect": false}], "allowMultiple": false}', 7);

    -- Pre-Class Hindi: Simple Sounds (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_hindi_id, 'MULTIPLE_CHOICE', 'Which sound does this letter make: इ',
     '{"options": [{"id": "1", "text": "अ", "isCorrect": false}, {"id": "2", "text": "आ", "isCorrect": false}, {"id": "3", "text": "इ", "isCorrect": true}], "allowMultiple": false}', 3),

    (pre_class_hindi_id, 'MATCHING', 'Match Hindi letters with sounds',
     '{"pairs": [{"id": "1", "left": "उ", "right": "उ", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "ऊ", "right": "ऊ", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "ए", "right": "ए", "leftType": "text", "rightType": "text"}]}', 4),

    (pre_class_hindi_id, 'MULTIPLE_CHOICE', 'Which letter comes first?',
     '{"options": [{"id": "1", "text": "अ", "isCorrect": true}, {"id": "2", "text": "आ", "isCorrect": false}, {"id": "3", "text": "इ", "isCorrect": false}], "allowMultiple": false}', 5),

    (pre_class_hindi_id, 'MULTIPLE_CHOICE', 'Which sound does this letter make: ऐ',
     '{"options": [{"id": "1", "text": "ए", "isCorrect": false}, {"id": "2", "text": "ऐ", "isCorrect": true}, {"id": "3", "text": "ओ", "isCorrect": false}], "allowMultiple": false}', 6),

    (pre_class_hindi_id, 'MULTIPLE_CHOICE', 'Which sound does this letter make: औ',
     '{"options": [{"id": "1", "text": "ओ", "isCorrect": false}, {"id": "2", "text": "औ", "isCorrect": true}, {"id": "3", "text": "अं", "isCorrect": false}], "allowMultiple": false}', 7);

    -- Pre-Class Math: Count to 3 (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_math_id, 'MULTIPLE_CHOICE', 'How many hearts? ❤️❤️❤️',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "2", "isCorrect": false}, {"id": "3", "text": "3", "isCorrect": true}], "allowMultiple": false}', 4),

    (pre_class_math_id, 'MULTIPLE_CHOICE', 'How many cats? 🐱🐱',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "2", "isCorrect": true}, {"id": "3", "text": "3", "isCorrect": false}], "allowMultiple": false}', 5),

    (pre_class_math_id, 'MULTIPLE_CHOICE', 'How many flowers? 🌸',
     '{"options": [{"id": "1", "text": "1", "isCorrect": true}, {"id": "2", "text": "2", "isCorrect": false}, {"id": "3", "text": "3", "isCorrect": false}], "allowMultiple": false}', 6),

    (pre_class_math_id, 'MATCHING', 'Match numbers with objects',
     '{"pairs": [{"id": "1", "left": "1", "right": "🍎", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "2", "right": "🍎🍎", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "3", "right": "🍎🍎🍎", "leftType": "text", "rightType": "text"}]}', 7),

    (pre_class_math_id, 'MULTIPLE_CHOICE', 'What comes after 2?',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "3", "isCorrect": true}, {"id": "3", "text": "4", "isCorrect": false}], "allowMultiple": false}', 8);

    -- Pre-Class GK: Body Parts (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_gk_id, 'MULTIPLE_CHOICE', 'What do we use to see?',
     '{"options": [{"id": "1", "text": "👁️ Eyes", "isCorrect": true}, {"id": "2", "text": "👃 Nose", "isCorrect": false}, {"id": "3", "text": "👂 Ears", "isCorrect": false}], "allowMultiple": false}', 2),

    (pre_class_gk_id, 'MULTIPLE_CHOICE', 'What do we use to hear?',
     '{"options": [{"id": "1", "text": "👁️ Eyes", "isCorrect": false}, {"id": "2", "text": "👂 Ears", "isCorrect": true}, {"id": "3", "text": "👄 Mouth", "isCorrect": false}], "allowMultiple": false}', 3),

    (pre_class_gk_id, 'MULTIPLE_CHOICE', 'What do we use to smell?',
     '{"options": [{"id": "1", "text": "👃 Nose", "isCorrect": true}, {"id": "2", "text": "👁️ Eyes", "isCorrect": false}, {"id": "3", "text": "👄 Mouth", "isCorrect": false}], "allowMultiple": false}', 4),

    (pre_class_gk_id, 'MATCHING', 'Match more body parts',
     '{"pairs": [{"id": "1", "left": "✋", "right": "Hand", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🦶", "right": "Foot", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🦷", "right": "Teeth", "leftType": "text", "rightType": "text"}]}', 5),

    (pre_class_gk_id, 'MULTIPLE_CHOICE', 'How many hands do we have?',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "2", "isCorrect": true}, {"id": "3", "text": "3", "isCorrect": false}], "allowMultiple": false}', 6);

    -- Pre-Class Life Skills: Daily Activities (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (pre_class_life_id, 'MULTIPLE_CHOICE', 'What do we do when we wake up?',
     '{"options": [{"id": "1", "text": "Brush teeth", "isCorrect": true}, {"id": "2", "text": "Go to sleep", "isCorrect": false}, {"id": "3", "text": "Eat dinner", "isCorrect": false}], "allowMultiple": false}', 3),

    (pre_class_life_id, 'MULTIPLE_CHOICE', 'What do we do before going to bed?',
     '{"options": [{"id": "1", "text": "Play outside", "isCorrect": false}, {"id": "2", "text": "Brush teeth", "isCorrect": true}, {"id": "3", "text": "Eat breakfast", "isCorrect": false}], "allowMultiple": false}', 4),

    (pre_class_life_id, 'MULTIPLE_CHOICE', 'When do we take a bath?',
     '{"options": [{"id": "1", "text": "When dirty", "isCorrect": true}, {"id": "2", "text": "When hungry", "isCorrect": false}, {"id": "3", "text": "When sleepy", "isCorrect": false}], "allowMultiple": false}', 5),

    (pre_class_life_id, 'MATCHING', 'Match activities with time',
     '{"pairs": [{"id": "1", "left": "🌅 Morning", "right": "Wake up", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🌞 Day", "right": "Play", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🌙 Night", "right": "Sleep", "leftType": "text", "rightType": "text"}]}', 6),

    (pre_class_life_id, 'MULTIPLE_CHOICE', 'What do we wear when it rains?',
     '{"options": [{"id": "1", "text": "Raincoat", "isCorrect": true}, {"id": "2", "text": "Shorts", "isCorrect": false}, {"id": "3", "text": "Sandals", "isCorrect": false}], "allowMultiple": false}', 7);

    -- ========================================
    -- NURSERY ADDITIONAL QUESTIONS (Age 3-4)
    -- ========================================

    -- Nursery English: Alphabet A to E (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_english_id, 'MULTIPLE_CHOICE', 'Which letter comes after A?',
     '{"options": [{"id": "1", "text": "B", "isCorrect": true}, {"id": "2", "text": "C", "isCorrect": false}, {"id": "3", "text": "D", "isCorrect": false}], "allowMultiple": false}', 2),

    (nursery_english_id, 'MULTIPLE_CHOICE', 'Which letter comes before E?',
     '{"options": [{"id": "1", "text": "C", "isCorrect": false}, {"id": "2", "text": "D", "isCorrect": true}, {"id": "3", "text": "F", "isCorrect": false}], "allowMultiple": false}', 3),

    (nursery_english_id, 'MATCHING', 'Match more letters with pictures',
     '{"pairs": [{"id": "1", "left": "F", "right": "🐸 Fish", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "G", "right": "🐐 Goat", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "H", "right": "🏠 House", "leftType": "text", "rightType": "text"}]}', 4),

    (nursery_english_id, 'MULTIPLE_CHOICE', 'What sound does B make?',
     '{"options": [{"id": "1", "text": "Buh", "isCorrect": true}, {"id": "2", "text": "Cuh", "isCorrect": false}, {"id": "3", "text": "Duh", "isCorrect": false}], "allowMultiple": false}', 5),

    (nursery_english_id, 'COMPLETION', 'Complete: A for A___',
     '{"text": "A for A___", "blanks": [{"id": "1", "answer": "pple", "position": 1}]}', 6);

    -- Nursery Hindi: अ से अनार (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_hindi_id, 'MULTIPLE_CHOICE', 'उ से क्या शुरू होता है?',
     '{"options": [{"id": "1", "text": "उल्लू", "isCorrect": true}, {"id": "2", "text": "आम", "isCorrect": false}, {"id": "3", "text": "इमली", "isCorrect": false}], "allowMultiple": false}', 2),

    (nursery_hindi_id, 'MULTIPLE_CHOICE', 'ऊ से क्या शुरू होता है?',
     '{"options": [{"id": "1", "text": "अनार", "isCorrect": false}, {"id": "2", "text": "ऊंट", "isCorrect": true}, {"id": "3", "text": "इमली", "isCorrect": false}], "allowMultiple": false}', 3),

    (nursery_hindi_id, 'MATCHING', 'Match more Hindi letters',
     '{"pairs": [{"id": "1", "left": "ए", "right": "एक", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "ऐ", "right": "ऐनक", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "ओ", "right": "ओखली", "leftType": "text", "rightType": "text"}]}', 4),

    (nursery_hindi_id, 'MULTIPLE_CHOICE', 'कौन सा स्वर है?',
     '{"options": [{"id": "1", "text": "अ", "isCorrect": true}, {"id": "2", "text": "क", "isCorrect": false}, {"id": "3", "text": "ग", "isCorrect": false}], "allowMultiple": false}', 5),

    (nursery_hindi_id, 'COMPLETION', 'पूरा करें: अ से अ___',
     '{"text": "अ से अ___", "blanks": [{"id": "1", "answer": "नार", "position": 1}]}', 6);

    -- Nursery Math: Count 1 to 5 (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_math_id, 'MULTIPLE_CHOICE', 'Count the butterflies: 🦋🦋🦋',
     '{"options": [{"id": "1", "text": "2", "isCorrect": false}, {"id": "2", "text": "3", "isCorrect": true}, {"id": "3", "text": "4", "isCorrect": false}], "allowMultiple": false}', 3),

    (nursery_math_id, 'MULTIPLE_CHOICE', 'What comes after 3?',
     '{"options": [{"id": "1", "text": "2", "isCorrect": false}, {"id": "2", "text": "4", "isCorrect": true}, {"id": "3", "text": "5", "isCorrect": false}], "allowMultiple": false}', 4),

    (nursery_math_id, 'MULTIPLE_CHOICE', 'What comes before 5?',
     '{"options": [{"id": "1", "text": "3", "isCorrect": false}, {"id": "2", "text": "4", "isCorrect": true}, {"id": "3", "text": "6", "isCorrect": false}], "allowMultiple": false}', 5),

    (nursery_math_id, 'MATCHING', 'Match numbers with fingers',
     '{"pairs": [{"id": "1", "left": "1", "right": "☝️", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "2", "right": "✌️", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "5", "right": "✋", "leftType": "text", "rightType": "text"}]}', 6),

    (nursery_math_id, 'MULTIPLE_CHOICE', 'How many eyes do you have?',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "2", "isCorrect": true}, {"id": "3", "text": "3", "isCorrect": false}], "allowMultiple": false}', 7);

    -- Nursery GK: Animals & Their Sounds (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_gk_id, 'MULTIPLE_CHOICE', 'What sound does a duck make?',
     '{"options": [{"id": "1", "text": "Moo", "isCorrect": false}, {"id": "2", "text": "Quack", "isCorrect": true}, {"id": "3", "text": "Woof", "isCorrect": false}], "allowMultiple": false}', 2),

    (nursery_gk_id, 'MULTIPLE_CHOICE', 'What sound does a sheep make?',
     '{"options": [{"id": "1", "text": "Baa", "isCorrect": true}, {"id": "2", "text": "Moo", "isCorrect": false}, {"id": "3", "text": "Oink", "isCorrect": false}], "allowMultiple": false}', 3),

    (nursery_gk_id, 'MATCHING', 'Match more animals with sounds',
     '{"pairs": [{"id": "1", "left": "🐷 Pig", "right": "Oink", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🐸 Frog", "right": "Ribbit", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🐝 Bee", "right": "Buzz", "leftType": "text", "rightType": "text"}]}', 4),

    (nursery_gk_id, 'MULTIPLE_CHOICE', 'Which animal gives us milk?',
     '{"options": [{"id": "1", "text": "🐄 Cow", "isCorrect": true}, {"id": "2", "text": "🐱 Cat", "isCorrect": false}, {"id": "3", "text": "🐕 Dog", "isCorrect": false}], "allowMultiple": false}', 5),

    (nursery_gk_id, 'MULTIPLE_CHOICE', 'Which animal lays eggs?',
     '{"options": [{"id": "1", "text": "🐄 Cow", "isCorrect": false}, {"id": "2", "text": "🐓 Hen", "isCorrect": true}, {"id": "3", "text": "🐕 Dog", "isCorrect": false}], "allowMultiple": false}', 6);

    -- Nursery Life Skills: Good Habits (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (nursery_life_id, 'MULTIPLE_CHOICE', 'What should we do after using the toilet?',
     '{"options": [{"id": "1", "text": "Wash hands", "isCorrect": true}, {"id": "2", "text": "Eat food", "isCorrect": false}, {"id": "3", "text": "Watch TV", "isCorrect": false}], "allowMultiple": false}', 3),

    (nursery_life_id, 'MULTIPLE_CHOICE', 'What should we do when we meet someone?',
     '{"options": [{"id": "1", "text": "Say Hello", "isCorrect": true}, {"id": "2", "text": "Run away", "isCorrect": false}, {"id": "3", "text": "Hide", "isCorrect": false}], "allowMultiple": false}', 4),

    (nursery_life_id, 'MULTIPLE_CHOICE', 'What should we do with our toys after playing?',
     '{"options": [{"id": "1", "text": "Leave them", "isCorrect": false}, {"id": "2", "text": "Put them away", "isCorrect": true}, {"id": "3", "text": "Break them", "isCorrect": false}], "allowMultiple": false}', 5),

    (nursery_life_id, 'MATCHING', 'Match good habits',
     '{"pairs": [{"id": "1", "left": "🦷 Teeth", "right": "Brush daily", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🍎 Food", "right": "Eat healthy", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🛏️ Bed", "right": "Sleep early", "leftType": "text", "rightType": "text"}]}', 6),

    (nursery_life_id, 'MULTIPLE_CHOICE', 'What should we do when someone is talking?',
     '{"options": [{"id": "1", "text": "Listen quietly", "isCorrect": true}, {"id": "2", "text": "Make noise", "isCorrect": false}, {"id": "3", "text": "Walk away", "isCorrect": false}], "allowMultiple": false}', 7);

END $$;
