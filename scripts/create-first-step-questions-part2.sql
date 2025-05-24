-- Create questions for KG II and Class 1st assignments
-- This script should be run after create-first-step-questions.sql

DO $$
DECLARE
    -- Assignment IDs for KG II and Class 1st
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
    -- KG II QUESTIONS (Age 5-6)
    -- ========================================
    
    -- KG II English: Complete Alphabet A-Z
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (kg2_english_id, 'MATCHING', 'Match uppercase with lowercase letters (K-O)', 
     '{"pairs": [{"id": "1", "left": "K", "right": "k", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "L", "right": "l", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "M", "right": "m", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "N", "right": "n", "leftType": "text", "rightType": "text"}, {"id": "5", "left": "O", "right": "o", "leftType": "text", "rightType": "text"}]}', 1),
    
    (kg2_english_id, 'MATCHING', 'Match letters with words (P-T)', 
     '{"pairs": [{"id": "1", "left": "P", "right": "🍕 Pizza", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Q", "right": "👸 Queen", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "R", "right": "🌹 Rose", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "S", "right": "☀️ Sun", "leftType": "text", "rightType": "text"}, {"id": "5", "left": "T", "right": "🐅 Tiger", "leftType": "text", "rightType": "text"}]}', 2),
    
    (kg2_english_id, 'MATCHING', 'Match letters with words (U-Z)', 
     '{"pairs": [{"id": "1", "left": "U", "right": "☂️ Umbrella", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "V", "right": "🌋 Volcano", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "W", "right": "🍉 Watermelon", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "X", "right": "🎄 Xmas tree", "leftType": "text", "rightType": "text"}, {"id": "5", "left": "Y", "right": "🧶 Yarn", "leftType": "text", "rightType": "text"}, {"id": "6", "left": "Z", "right": "🦓 Zebra", "leftType": "text", "rightType": "text"}]}', 3);
    
    -- KG II Hindi: मात्रा (Vowel Signs)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (kg2_hindi_id, 'COMPLETION', 'Complete the word with correct मात्रा: क_मल (कमल)', 
     '{"text": "Complete the word: क_मल", "blanks": [{"id": "1", "answer": "", "position": 2}]}', 1),
    
    (kg2_hindi_id, 'COMPLETION', 'Complete the word with correct मात्रा: क_ला (काला)', 
     '{"text": "Complete the word: क_ला", "blanks": [{"id": "1", "answer": "ा", "position": 2}]}', 2),
    
    (kg2_hindi_id, 'COMPLETION', 'Complete the word with correct मात्रा: क_ताब (किताब)', 
     '{"text": "Complete the word: क_ताब", "blanks": [{"id": "1", "answer": "ि", "position": 2}]}', 3);
    
    -- KG II Math: Count 1 to 20 & Simple Addition
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (kg2_math_id, 'MULTIPLE_CHOICE', 'What comes after 15?', 
     '{"options": [{"id": "1", "text": "14", "isCorrect": false}, {"id": "2", "text": "16", "isCorrect": true}, {"id": "3", "text": "17", "isCorrect": false}], "allowMultiple": false}', 1),
    
    (kg2_math_id, 'MULTIPLE_CHOICE', 'What is 2 + 3?', 
     '{"options": [{"id": "1", "text": "4", "isCorrect": false}, {"id": "2", "text": "5", "isCorrect": true}, {"id": "3", "text": "6", "isCorrect": false}], "allowMultiple": false}', 2),
    
    (kg2_math_id, 'MULTIPLE_CHOICE', 'What is 4 + 1?', 
     '{"options": [{"id": "1", "text": "3", "isCorrect": false}, {"id": "2", "text": "5", "isCorrect": true}, {"id": "3", "text": "6", "isCorrect": false}], "allowMultiple": false}', 3);
    
    -- KG II GK: Community Helpers
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (kg2_gk_id, 'MATCHING', 'Match community helpers with their tools', 
     '{"pairs": [{"id": "1", "left": "👨‍⚕️ Doctor", "right": "🩺 Stethoscope", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "👨‍🚒 Firefighter", "right": "🚒 Fire truck", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "👮‍♂️ Police", "right": "🚔 Police car", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "👨‍🏫 Teacher", "right": "📚 Books", "leftType": "text", "rightType": "text"}]}', 1);
    
    -- KG II Life Skills: Emotions & Feelings
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (kg2_life_id, 'MULTIPLE_CHOICE', 'How do you feel when you get a gift?', 
     '{"options": [{"id": "1", "text": "😊 Happy", "isCorrect": true}, {"id": "2", "text": "😢 Sad", "isCorrect": false}, {"id": "3", "text": "😠 Angry", "isCorrect": false}], "allowMultiple": false}', 1),
    
    (kg2_life_id, 'MULTIPLE_CHOICE', 'How do you feel when you lose your toy?', 
     '{"options": [{"id": "1", "text": "😊 Happy", "isCorrect": false}, {"id": "2", "text": "😢 Sad", "isCorrect": true}, {"id": "3", "text": "😴 Sleepy", "isCorrect": false}], "allowMultiple": false}', 2),
    
    (kg2_life_id, 'MULTIPLE_CHOICE', 'What should you do when you feel scared?', 
     '{"options": [{"id": "1", "text": "Hide alone", "isCorrect": false}, {"id": "2", "text": "Tell a grown-up", "isCorrect": true}, {"id": "3", "text": "Run away", "isCorrect": false}], "allowMultiple": false}', 3);
    
    -- ========================================
    -- CLASS 1ST QUESTIONS (Age 6-7)
    -- ========================================
    
    -- Class 1st English: Simple Words & Reading
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (class1_english_id, 'COMPLETION', 'Complete the word: c_t (cat)', 
     '{"text": "Complete the word: c_t", "blanks": [{"id": "1", "answer": "a", "position": 2}]}', 1),
    
    (class1_english_id, 'COMPLETION', 'Complete the word: b_t (bat)', 
     '{"text": "Complete the word: b_t", "blanks": [{"id": "1", "answer": "a", "position": 2}]}', 2),
    
    (class1_english_id, 'COMPLETION', 'Complete the word: h_t (hat)', 
     '{"text": "Complete the word: h_t", "blanks": [{"id": "1", "answer": "a", "position": 2}]}', 3),
    
    (class1_english_id, 'COMPLETION', 'Complete the word: r_t (rat)', 
     '{"text": "Complete the word: r_t", "blanks": [{"id": "1", "answer": "a", "position": 2}]}', 4);
    
    -- Class 1st Hindi: Simple Hindi Words
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (class1_hindi_id, 'COMPLETION', 'Complete the word: क_ल (कमल)', 
     '{"text": "Complete the word: क_ल", "blanks": [{"id": "1", "answer": "म", "position": 2}]}', 1),
    
    (class1_hindi_id, 'COMPLETION', 'Complete the word: न_क (नमक)', 
     '{"text": "Complete the word: न_क", "blanks": [{"id": "1", "answer": "म", "position": 2}]}', 2),
    
    (class1_hindi_id, 'COMPLETION', 'Complete the word: ज_ (जल)', 
     '{"text": "Complete the word: ज_", "blanks": [{"id": "1", "answer": "ल", "position": 2}]}', 3);
    
    -- Class 1st Math: Addition & Subtraction
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (class1_math_id, 'MULTIPLE_CHOICE', 'What is 3 + 4?', 
     '{"options": [{"id": "1", "text": "6", "isCorrect": false}, {"id": "2", "text": "7", "isCorrect": true}, {"id": "3", "text": "8", "isCorrect": false}], "allowMultiple": false}', 1),
    
    (class1_math_id, 'MULTIPLE_CHOICE', 'What is 8 - 3?', 
     '{"options": [{"id": "1", "text": "4", "isCorrect": false}, {"id": "2", "text": "5", "isCorrect": true}, {"id": "3", "text": "6", "isCorrect": false}], "allowMultiple": false}', 2),
    
    (class1_math_id, 'MULTIPLE_CHOICE', 'What is 6 + 2?', 
     '{"options": [{"id": "1", "text": "7", "isCorrect": false}, {"id": "2", "text": "8", "isCorrect": true}, {"id": "3", "text": "9", "isCorrect": false}], "allowMultiple": false}', 3),
    
    (class1_math_id, 'MULTIPLE_CHOICE', 'What is 10 - 4?', 
     '{"options": [{"id": "1", "text": "5", "isCorrect": false}, {"id": "2", "text": "6", "isCorrect": true}, {"id": "3", "text": "7", "isCorrect": false}], "allowMultiple": false}', 4);
    
    -- Class 1st GK: Seasons & Weather
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (class1_gk_id, 'MATCHING', 'Match seasons with their characteristics', 
     '{"pairs": [{"id": "1", "left": "🌸 Spring", "right": "Flowers bloom", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "☀️ Summer", "right": "Very hot", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🍂 Autumn", "right": "Leaves fall", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "❄️ Winter", "right": "Very cold", "leftType": "text", "rightType": "text"}]}', 1);
    
    -- Class 1st Life Skills: Time & Days
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES 
    (class1_life_id, 'ORDERING', 'Arrange the days of the week in order', 
     '{"items": [{"id": "1", "text": "Monday", "correctPosition": 1}, {"id": "2", "text": "Tuesday", "correctPosition": 2}, {"id": "3", "text": "Wednesday", "correctPosition": 3}, {"id": "4", "text": "Thursday", "correctPosition": 4}, {"id": "5", "text": "Friday", "correctPosition": 5}, {"id": "6", "text": "Saturday", "correctPosition": 6}, {"id": "7", "text": "Sunday", "correctPosition": 7}]}', 1),
    
    (class1_life_id, 'MULTIPLE_CHOICE', 'What time of day do we eat breakfast?', 
     '{"options": [{"id": "1", "text": "Morning", "isCorrect": true}, {"id": "2", "text": "Afternoon", "isCorrect": false}, {"id": "3", "text": "Evening", "isCorrect": false}], "allowMultiple": false}', 2),
    
    (class1_life_id, 'MULTIPLE_CHOICE', 'What time of day do we go to sleep?', 
     '{"options": [{"id": "1", "text": "Morning", "isCorrect": false}, {"id": "2", "text": "Afternoon", "isCorrect": false}, {"id": "3", "text": "Night", "isCorrect": true}], "allowMultiple": false}', 3);
    
END $$;
