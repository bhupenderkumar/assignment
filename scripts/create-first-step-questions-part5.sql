-- Create additional questions for Class 1 assignments (Part 5)
-- This script adds 5 more questions per subject for Class 1
-- Run after create-first-step-questions-part4.sql

DO $$
DECLARE
    -- Assignment IDs for Class 1
    class1_english_id UUID;
    class1_hindi_id UUID;
    class1_math_id UUID;
    class1_gk_id UUID;
    class1_life_id UUID;

BEGIN
    -- Fetch assignment IDs by title
    SELECT id INTO class1_english_id FROM interactive_assignment WHERE title = 'Simple Words & Reading';
    SELECT id INTO class1_hindi_id FROM interactive_assignment WHERE title = 'सरल शब्द - Simple Hindi Words';
    SELECT id INTO class1_math_id FROM interactive_assignment WHERE title = 'Addition & Subtraction (1-10)';
    SELECT id INTO class1_gk_id FROM interactive_assignment WHERE title = 'Seasons & Weather';
    SELECT id INTO class1_life_id FROM interactive_assignment WHERE title = 'Time & Days of Week';

    -- ========================================
    -- CLASS 1 ADDITIONAL QUESTIONS (Age 6-7)
    -- ========================================

    -- Class 1 English: Simple Words & Reading (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (class1_english_id, 'COMPLETION', 'Complete the word: d_g (dog)',
     '{"text": "Complete the word: d_g", "blanks": [{"id": "1", "answer": "o", "position": 2}]}', 5),

    (class1_english_id, 'COMPLETION', 'Complete the word: s_n (sun)',
     '{"text": "Complete the word: s_n", "blanks": [{"id": "1", "answer": "u", "position": 2}]}', 6),

    (class1_english_id, 'MULTIPLE_CHOICE', 'Which word rhymes with "cat"?',
     '{"options": [{"id": "1", "text": "bat", "isCorrect": true}, {"id": "2", "text": "dog", "isCorrect": false}, {"id": "3", "text": "sun", "isCorrect": false}], "allowMultiple": false}', 7),

    (class1_english_id, 'MULTIPLE_CHOICE', 'How many letters are in the word "book"?',
     '{"options": [{"id": "1", "text": "3", "isCorrect": false}, {"id": "2", "text": "4", "isCorrect": true}, {"id": "3", "text": "5", "isCorrect": false}], "allowMultiple": false}', 8),

    (class1_english_id, 'MATCHING', 'Match words with pictures',
     '{"pairs": [{"id": "1", "left": "pen", "right": "🖊️", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "cup", "right": "☕", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "bag", "right": "🎒", "leftType": "text", "rightType": "text"}]}', 9);

    -- Class 1 Hindi: Simple Hindi Words (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (class1_hindi_id, 'COMPLETION', 'शब्द पूरा करें: प_नी (पानी)',
     '{"text": "शब्द पूरा करें: प_नी", "blanks": [{"id": "1", "answer": "ा", "position": 2}]}', 4),

    (class1_hindi_id, 'COMPLETION', 'शब्द पूरा करें: फ_ल (फूल)',
     '{"text": "शब्द पूरा करें: फ_ल", "blanks": [{"id": "1", "answer": "ू", "position": 2}]}', 5),

    (class1_hindi_id, 'MULTIPLE_CHOICE', 'कौन सा शब्द सही है?',
     '{"options": [{"id": "1", "text": "पानी", "isCorrect": true}, {"id": "2", "text": "पनी", "isCorrect": false}, {"id": "3", "text": "पाानी", "isCorrect": false}], "allowMultiple": false}', 6),

    (class1_hindi_id, 'MULTIPLE_CHOICE', '"माता" शब्द में कितने अक्षर हैं?',
     '{"options": [{"id": "1", "text": "2", "isCorrect": true}, {"id": "2", "text": "3", "isCorrect": false}, {"id": "3", "text": "4", "isCorrect": false}], "allowMultiple": false}', 7),

    (class1_hindi_id, 'MATCHING', 'शब्द मिलाएं',
     '{"pairs": [{"id": "1", "left": "गाय", "right": "🐄", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "फूल", "right": "🌸", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "पानी", "right": "💧", "leftType": "text", "rightType": "text"}]}', 8);

    -- Class 1 Math: Addition & Subtraction (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (class1_math_id, 'MULTIPLE_CHOICE', 'What is 5 + 5?',
     '{"options": [{"id": "1", "text": "9", "isCorrect": false}, {"id": "2", "text": "10", "isCorrect": true}, {"id": "3", "text": "11", "isCorrect": false}], "allowMultiple": false}', 5),

    (class1_math_id, 'MULTIPLE_CHOICE', 'What is 9 - 4?',
     '{"options": [{"id": "1", "text": "4", "isCorrect": false}, {"id": "2", "text": "5", "isCorrect": true}, {"id": "3", "text": "6", "isCorrect": false}], "allowMultiple": false}', 6),

    (class1_math_id, 'MULTIPLE_CHOICE', 'What is 7 + 1?',
     '{"options": [{"id": "1", "text": "7", "isCorrect": false}, {"id": "2", "text": "8", "isCorrect": true}, {"id": "3", "text": "9", "isCorrect": false}], "allowMultiple": false}', 7),

    (class1_math_id, 'MULTIPLE_CHOICE', 'What is 10 - 2?',
     '{"options": [{"id": "1", "text": "7", "isCorrect": false}, {"id": "2", "text": "8", "isCorrect": true}, {"id": "3", "text": "9", "isCorrect": false}], "allowMultiple": false}', 8),

    (class1_math_id, 'COMPLETION', 'Solve: 4 + _ = 9',
     '{"text": "Solve: 4 + _ = 9", "blanks": [{"id": "1", "answer": "5", "position": 2}]}', 9);

    -- Class 1 GK: Seasons & Weather (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (class1_gk_id, 'MULTIPLE_CHOICE', 'In which season do we wear warm clothes?',
     '{"options": [{"id": "1", "text": "Summer", "isCorrect": false}, {"id": "2", "text": "Winter", "isCorrect": true}, {"id": "3", "text": "Spring", "isCorrect": false}], "allowMultiple": false}', 2),

    (class1_gk_id, 'MULTIPLE_CHOICE', 'When do we see rainbows?',
     '{"options": [{"id": "1", "text": "After rain", "isCorrect": true}, {"id": "2", "text": "In winter", "isCorrect": false}, {"id": "3", "text": "At night", "isCorrect": false}], "allowMultiple": false}', 3),

    (class1_gk_id, 'MULTIPLE_CHOICE', 'What do we use when it rains?',
     '{"options": [{"id": "1", "text": "☂️ Umbrella", "isCorrect": true}, {"id": "2", "text": "🕶️ Sunglasses", "isCorrect": false}, {"id": "3", "text": "🧢 Cap", "isCorrect": false}], "allowMultiple": false}', 4),

    (class1_gk_id, 'MATCHING', 'Match weather with activities',
     '{"pairs": [{"id": "1", "left": "☀️ Sunny", "right": "Swimming", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🌧️ Rainy", "right": "Stay inside", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "❄️ Snowy", "right": "Make snowman", "leftType": "text", "rightType": "text"}]}', 5),

    (class1_gk_id, 'MULTIPLE_CHOICE', 'How many seasons are there in a year?',
     '{"options": [{"id": "1", "text": "3", "isCorrect": false}, {"id": "2", "text": "4", "isCorrect": true}, {"id": "3", "text": "5", "isCorrect": false}], "allowMultiple": false}', 6);

    -- Class 1 Life Skills: Time & Days (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (class1_life_id, 'MULTIPLE_CHOICE', 'How many days are in a week?',
     '{"options": [{"id": "1", "text": "6", "isCorrect": false}, {"id": "2", "text": "7", "isCorrect": true}, {"id": "3", "text": "8", "isCorrect": false}], "allowMultiple": false}', 4),

    (class1_life_id, 'MULTIPLE_CHOICE', 'What day comes after Wednesday?',
     '{"options": [{"id": "1", "text": "Tuesday", "isCorrect": false}, {"id": "2", "text": "Thursday", "isCorrect": true}, {"id": "3", "text": "Friday", "isCorrect": false}], "allowMultiple": false}', 5),

    (class1_life_id, 'MULTIPLE_CHOICE', 'What time do we usually have lunch?',
     '{"options": [{"id": "1", "text": "Morning", "isCorrect": false}, {"id": "2", "text": "Afternoon", "isCorrect": true}, {"id": "3", "text": "Night", "isCorrect": false}], "allowMultiple": false}', 6),

    (class1_life_id, 'MATCHING', 'Match time with activities',
     '{"pairs": [{"id": "1", "left": "🌅 Morning", "right": "Brush teeth", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🌞 Afternoon", "right": "Have lunch", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🌙 Night", "right": "Go to bed", "leftType": "text", "rightType": "text"}]}', 7),

    (class1_life_id, 'MULTIPLE_CHOICE', 'Which are weekend days?',
     '{"options": [{"id": "1", "text": "Monday & Tuesday", "isCorrect": false}, {"id": "2", "text": "Saturday & Sunday", "isCorrect": true}, {"id": "3", "text": "Wednesday & Thursday", "isCorrect": false}], "allowMultiple": false}', 8);

END $$;
