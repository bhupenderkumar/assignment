-- Create additional questions for KG, KG2, and Class 1 assignments (Part 4)
-- This script adds 5 more questions per class per subject
-- Run after create-first-step-questions-part3.sql

DO $$
DECLARE
    -- Assignment IDs for KG, KG2, and Class 1
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
    -- KG ADDITIONAL QUESTIONS (Age 4-5)
    -- ========================================

    -- KG English: Alphabet A to J (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_english_id, 'MULTIPLE_CHOICE', 'Which letter comes between F and H?',
     '{"options": [{"id": "1", "text": "E", "isCorrect": false}, {"id": "2", "text": "G", "isCorrect": true}, {"id": "3", "text": "I", "isCorrect": false}], "allowMultiple": false}', 3),

    (kg_english_id, 'COMPLETION', 'Complete the alphabet: A, B, C, _, E',
     '{"text": "Complete the alphabet: A, B, C, _, E", "blanks": [{"id": "1", "answer": "D", "position": 4}]}', 4),

    (kg_english_id, 'MULTIPLE_CHOICE', 'What letter does "Jug" start with?',
     '{"options": [{"id": "1", "text": "I", "isCorrect": false}, {"id": "2", "text": "J", "isCorrect": true}, {"id": "3", "text": "K", "isCorrect": false}], "allowMultiple": false}', 5),

    (kg_english_id, 'MATCHING', 'Match small letters with capital letters',
     '{"pairs": [{"id": "1", "left": "f", "right": "F", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "g", "right": "G", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "h", "right": "H", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "i", "right": "I", "leftType": "text", "rightType": "text"}, {"id": "5", "left": "j", "right": "J", "leftType": "text", "rightType": "text"}]}', 6),

    (kg_english_id, 'MULTIPLE_CHOICE', 'How many letters are there from A to J?',
     '{"options": [{"id": "1", "text": "9", "isCorrect": false}, {"id": "2", "text": "10", "isCorrect": true}, {"id": "3", "text": "11", "isCorrect": false}], "allowMultiple": false}', 7);

    -- KG Hindi: क से कमल (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_hindi_id, 'MULTIPLE_CHOICE', 'च से क्या शुरू होता है?',
     '{"options": [{"id": "1", "text": "चम्मच", "isCorrect": true}, {"id": "2", "text": "कमल", "isCorrect": false}, {"id": "3", "text": "गाय", "isCorrect": false}], "allowMultiple": false}', 2),

    (kg_hindi_id, 'MULTIPLE_CHOICE', 'छ से क्या शुरू होता है?',
     '{"options": [{"id": "1", "text": "कमल", "isCorrect": false}, {"id": "2", "text": "छत", "isCorrect": true}, {"id": "3", "text": "गाय", "isCorrect": false}], "allowMultiple": false}', 3),

    (kg_hindi_id, 'MATCHING', 'Match more consonants with words',
     '{"pairs": [{"id": "1", "left": "ज", "right": "जल", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "झ", "right": "झंडा", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "ट", "right": "टमाटर", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "ठ", "right": "ठंडा", "leftType": "text", "rightType": "text"}]}', 4),

    (kg_hindi_id, 'COMPLETION', 'पूरा करें: क से क___',
     '{"text": "क से क___", "blanks": [{"id": "1", "answer": "मल", "position": 1}]}', 5),

    (kg_hindi_id, 'MULTIPLE_CHOICE', 'कौन सा व्यंजन है?',
     '{"options": [{"id": "1", "text": "क", "isCorrect": true}, {"id": "2", "text": "अ", "isCorrect": false}, {"id": "3", "text": "आ", "isCorrect": false}], "allowMultiple": false}', 6);

    -- KG Math: Count 1 to 10 (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_math_id, 'MULTIPLE_CHOICE', 'What comes between 7 and 9?',
     '{"options": [{"id": "1", "text": "6", "isCorrect": false}, {"id": "2", "text": "8", "isCorrect": true}, {"id": "3", "text": "10", "isCorrect": false}], "allowMultiple": false}', 3),

    (kg_math_id, 'COMPLETION', 'Fill the missing number: 5, 6, _, 8, 9',
     '{"text": "Fill the missing number: 5, 6, _, 8, 9", "blanks": [{"id": "1", "answer": "7", "position": 3}]}', 4),

    (kg_math_id, 'MULTIPLE_CHOICE', 'Count the stars: ⭐⭐⭐⭐⭐⭐⭐⭐',
     '{"options": [{"id": "1", "text": "7", "isCorrect": false}, {"id": "2", "text": "8", "isCorrect": true}, {"id": "3", "text": "9", "isCorrect": false}], "allowMultiple": false}', 5),

    (kg_math_id, 'MULTIPLE_CHOICE', 'What is the biggest number you can count to?',
     '{"options": [{"id": "1", "text": "5", "isCorrect": false}, {"id": "2", "text": "10", "isCorrect": true}, {"id": "3", "text": "15", "isCorrect": false}], "allowMultiple": false}', 6),

    (kg_math_id, 'MATCHING', 'Match numbers with dots',
     '{"pairs": [{"id": "1", "left": "6", "right": "••••••", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "7", "right": "•••••••", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "8", "right": "••••••••", "leftType": "text", "rightType": "text"}]}', 7);

    -- KG GK: Fruits & Vegetables (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_gk_id, 'MULTIPLE_CHOICE', 'Which grows on trees?',
     '{"options": [{"id": "1", "text": "🍎 Apple", "isCorrect": true}, {"id": "2", "text": "🥕 Carrot", "isCorrect": false}, {"id": "3", "text": "🥔 Potato", "isCorrect": false}], "allowMultiple": false}', 3),

    (kg_gk_id, 'MULTIPLE_CHOICE', 'Which grows under the ground?',
     '{"options": [{"id": "1", "text": "🍌 Banana", "isCorrect": false}, {"id": "2", "text": "🥕 Carrot", "isCorrect": true}, {"id": "3", "text": "🍎 Apple", "isCorrect": false}], "allowMultiple": false}', 4),

    (kg_gk_id, 'MATCHING', 'Match fruits with colors',
     '{"pairs": [{"id": "1", "left": "🍌 Banana", "right": "Yellow", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🍎 Apple", "right": "Red", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🍊 Orange", "right": "Orange", "leftType": "text", "rightType": "text"}]}', 5),

    (kg_gk_id, 'MULTIPLE_CHOICE', 'Which is good for your eyes?',
     '{"options": [{"id": "1", "text": "🥕 Carrot", "isCorrect": true}, {"id": "2", "text": "🍰 Cake", "isCorrect": false}, {"id": "3", "text": "🍭 Candy", "isCorrect": false}], "allowMultiple": false}', 6),

    (kg_gk_id, 'MULTIPLE_CHOICE', 'Which vegetable is green?',
     '{"options": [{"id": "1", "text": "🥕 Carrot", "isCorrect": false}, {"id": "2", "text": "🥬 Cabbage", "isCorrect": true}, {"id": "3", "text": "🍅 Tomato", "isCorrect": false}], "allowMultiple": false}', 7);

    -- KG Life Skills: Safety Rules (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg_life_id, 'MULTIPLE_CHOICE', 'What should you do if a stranger offers you candy?',
     '{"options": [{"id": "1", "text": "Take it", "isCorrect": false}, {"id": "2", "text": "Say no and tell parents", "isCorrect": true}, {"id": "3", "text": "Follow them", "isCorrect": false}], "allowMultiple": false}', 3),

    (kg_life_id, 'MULTIPLE_CHOICE', 'What should you wear when riding a bicycle?',
     '{"options": [{"id": "1", "text": "Helmet", "isCorrect": true}, {"id": "2", "text": "Hat", "isCorrect": false}, {"id": "3", "text": "Nothing", "isCorrect": false}], "allowMultiple": false}', 4),

    (kg_life_id, 'MULTIPLE_CHOICE', 'What should you do near water?',
     '{"options": [{"id": "1", "text": "Jump in alone", "isCorrect": false}, {"id": "2", "text": "Stay with adults", "isCorrect": true}, {"id": "3", "text": "Run around", "isCorrect": false}], "allowMultiple": false}', 5),

    (kg_life_id, 'MATCHING', 'Match safety items with situations',
     '{"pairs": [{"id": "1", "left": "🚗 Car", "right": "Seatbelt", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "☀️ Sun", "right": "Sunscreen", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🌧️ Rain", "right": "Umbrella", "leftType": "text", "rightType": "text"}]}', 6),

    (kg_life_id, 'MULTIPLE_CHOICE', 'What number should you call in emergency?',
     '{"options": [{"id": "1", "text": "100", "isCorrect": false}, {"id": "2", "text": "112", "isCorrect": true}, {"id": "3", "text": "123", "isCorrect": false}], "allowMultiple": false}', 7);

    -- ========================================
    -- KG2 ADDITIONAL QUESTIONS (Age 5-6)
    -- ========================================

    -- KG2 English: Complete Alphabet A-Z (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg2_english_id, 'COMPLETION', 'Complete the alphabet: ...W, X, _, Z',
     '{"text": "Complete the alphabet: W, X, _, Z", "blanks": [{"id": "1", "answer": "Y", "position": 3}]}', 4),

    (kg2_english_id, 'MULTIPLE_CHOICE', 'How many letters are in the English alphabet?',
     '{"options": [{"id": "1", "text": "24", "isCorrect": false}, {"id": "2", "text": "26", "isCorrect": true}, {"id": "3", "text": "28", "isCorrect": false}], "allowMultiple": false}', 5),

    (kg2_english_id, 'MULTIPLE_CHOICE', 'Which letter comes before M?',
     '{"options": [{"id": "1", "text": "K", "isCorrect": false}, {"id": "2", "text": "L", "isCorrect": true}, {"id": "3", "text": "N", "isCorrect": false}], "allowMultiple": false}', 6),

    (kg2_english_id, 'MATCHING', 'Match beginning sounds',
     '{"pairs": [{"id": "1", "left": "🐭 Mouse", "right": "M", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🥜 Nut", "right": "N", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🐙 Octopus", "right": "O", "leftType": "text", "rightType": "text"}]}', 7),

    (kg2_english_id, 'COMPLETION', 'Complete: The _at sat on the mat',
     '{"text": "The _at sat on the mat", "blanks": [{"id": "1", "answer": "c", "position": 1}]}', 8);

    -- KG2 Hindi: मात्रा (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg2_hindi_id, 'MULTIPLE_CHOICE', 'कौन सी मात्रा है: ी',
     '{"options": [{"id": "1", "text": "इ की मात्रा", "isCorrect": false}, {"id": "2", "text": "ई की मात्रा", "isCorrect": true}, {"id": "3", "text": "उ की मात्रा", "isCorrect": false}], "allowMultiple": false}', 4),

    (kg2_hindi_id, 'COMPLETION', 'मात्रा लगाएं: म_ला (मीला)',
     '{"text": "मात्रा लगाएं: म_ला", "blanks": [{"id": "1", "answer": "ी", "position": 2}]}', 5),

    (kg2_hindi_id, 'COMPLETION', 'मात्रा लगाएं: स_रज (सूरज)',
     '{"text": "मात्रा लगाएं: स_रज", "blanks": [{"id": "1", "answer": "ू", "position": 2}]}', 6),

    (kg2_hindi_id, 'MULTIPLE_CHOICE', 'कौन सा शब्द सही है?',
     '{"options": [{"id": "1", "text": "किताब", "isCorrect": true}, {"id": "2", "text": "कताब", "isCorrect": false}, {"id": "3", "text": "कीताब", "isCorrect": false}], "allowMultiple": false}', 7),

    (kg2_hindi_id, 'MATCHING', 'मात्रा मिलाएं',
     '{"pairs": [{"id": "1", "left": "ा", "right": "आ की मात्रा", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "ि", "right": "इ की मात्रा", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "ु", "right": "उ की मात्रा", "leftType": "text", "rightType": "text"}]}', 8);

    -- KG2 Math: Count 1 to 20 & Simple Addition (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg2_math_id, 'MULTIPLE_CHOICE', 'What comes after 18?',
     '{"options": [{"id": "1", "text": "17", "isCorrect": false}, {"id": "2", "text": "19", "isCorrect": true}, {"id": "3", "text": "20", "isCorrect": false}], "allowMultiple": false}', 4),

    (kg2_math_id, 'MULTIPLE_CHOICE', 'What is 1 + 1?',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "2", "isCorrect": true}, {"id": "3", "text": "3", "isCorrect": false}], "allowMultiple": false}', 5),

    (kg2_math_id, 'MULTIPLE_CHOICE', 'What is 3 + 2?',
     '{"options": [{"id": "1", "text": "4", "isCorrect": false}, {"id": "2", "text": "5", "isCorrect": true}, {"id": "3", "text": "6", "isCorrect": false}], "allowMultiple": false}', 6),

    (kg2_math_id, 'COMPLETION', 'Fill in: 10, 11, 12, _, 14',
     '{"text": "Fill in: 10, 11, 12, _, 14", "blanks": [{"id": "1", "answer": "13", "position": 4}]}', 7),

    (kg2_math_id, 'MULTIPLE_CHOICE', 'How many tens are in 20?',
     '{"options": [{"id": "1", "text": "1", "isCorrect": false}, {"id": "2", "text": "2", "isCorrect": true}, {"id": "3", "text": "3", "isCorrect": false}], "allowMultiple": false}', 8);

    -- KG2 GK: Community Helpers (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg2_gk_id, 'MULTIPLE_CHOICE', 'Who helps us when we are sick?',
     '{"options": [{"id": "1", "text": "👨‍⚕️ Doctor", "isCorrect": true}, {"id": "2", "text": "👨‍🚒 Firefighter", "isCorrect": false}, {"id": "3", "text": "👮‍♂️ Police", "isCorrect": false}], "allowMultiple": false}', 2),

    (kg2_gk_id, 'MULTIPLE_CHOICE', 'Who teaches us in school?',
     '{"options": [{"id": "1", "text": "👨‍⚕️ Doctor", "isCorrect": false}, {"id": "2", "text": "👨‍🏫 Teacher", "isCorrect": true}, {"id": "3", "text": "👨‍🚒 Firefighter", "isCorrect": false}], "allowMultiple": false}', 3),

    (kg2_gk_id, 'MULTIPLE_CHOICE', 'Who delivers our mail?',
     '{"options": [{"id": "1", "text": "📮 Postman", "isCorrect": true}, {"id": "2", "text": "👨‍⚕️ Doctor", "isCorrect": false}, {"id": "3", "text": "👨‍🍳 Chef", "isCorrect": false}], "allowMultiple": false}', 4),

    (kg2_gk_id, 'MATCHING', 'Match helpers with their workplace',
     '{"pairs": [{"id": "1", "left": "👨‍⚕️ Doctor", "right": "🏥 Hospital", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "👨‍🏫 Teacher", "right": "🏫 School", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "👨‍🍳 Chef", "right": "🍽️ Restaurant", "leftType": "text", "rightType": "text"}]}', 5),

    (kg2_gk_id, 'MULTIPLE_CHOICE', 'Who helps keep our city clean?',
     '{"options": [{"id": "1", "text": "🧹 Cleaner", "isCorrect": true}, {"id": "2", "text": "👨‍⚕️ Doctor", "isCorrect": false}, {"id": "3", "text": "👨‍🏫 Teacher", "isCorrect": false}], "allowMultiple": false}', 6);

    -- KG2 Life Skills: Emotions & Feelings (Additional Questions)
    INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
    VALUES
    (kg2_life_id, 'MULTIPLE_CHOICE', 'How do you feel when you help someone?',
     '{"options": [{"id": "1", "text": "😊 Happy", "isCorrect": true}, {"id": "2", "text": "😠 Angry", "isCorrect": false}, {"id": "3", "text": "😢 Sad", "isCorrect": false}], "allowMultiple": false}', 4),

    (kg2_life_id, 'MULTIPLE_CHOICE', 'What should you do when you feel angry?',
     '{"options": [{"id": "1", "text": "Hit someone", "isCorrect": false}, {"id": "2", "text": "Take deep breaths", "isCorrect": true}, {"id": "3", "text": "Scream loudly", "isCorrect": false}], "allowMultiple": false}', 5),

    (kg2_life_id, 'MULTIPLE_CHOICE', 'How do you feel when someone shares with you?',
     '{"options": [{"id": "1", "text": "😊 Happy", "isCorrect": true}, {"id": "2", "text": "😠 Angry", "isCorrect": false}, {"id": "3", "text": "😴 Sleepy", "isCorrect": false}], "allowMultiple": false}', 6),

    (kg2_life_id, 'MATCHING', 'Match feelings with situations',
     '{"pairs": [{"id": "1", "left": "🎂 Birthday", "right": "😊 Happy", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "💔 Broken toy", "right": "😢 Sad", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🌙 Bedtime", "right": "😴 Sleepy", "leftType": "text", "rightType": "text"}]}', 7),

    (kg2_life_id, 'MULTIPLE_CHOICE', 'What should you do when a friend is sad?',
     '{"options": [{"id": "1", "text": "Ignore them", "isCorrect": false}, {"id": "2", "text": "Comfort them", "isCorrect": true}, {"id": "3", "text": "Laugh at them", "isCorrect": false}], "allowMultiple": false}', 8);

END $$;
