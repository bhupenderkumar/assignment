-- Create sample assignments for the gallery
-- This script inserts sample assignments for Nursery, LKG, UKG, and Class 1

-- Get the current authenticated user ID (replace with your user ID if running directly in SQL editor)
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID (you may need to replace this with your actual user ID)
    SELECT auth.uid() INTO current_user_id;
    
    -- Insert sample assignments
    
    -- Nursery (2-3 years)
    INSERT INTO interactive_assignment 
    (title, description, type, status, due_date, created_by, difficulty_level, estimated_time_minutes, age_group, category, topic, featured, view_count)
    VALUES
    ('Identify Basic Shapes', 'A fun matching exercise to help children identify and match basic shapes like circles, squares, and triangles.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'beginner', 10, 'Nursery', 'Mathematics', 'Shapes', TRUE, 87),
    
    ('Colors All Around', 'Help children identify and match colors with everyday objects.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'beginner', 8, 'Nursery', 'General Knowledge', 'Colors', FALSE, 65),
    
    ('Animal Sounds', 'Match animals with the sounds they make.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'beginner', 10, 'Nursery', 'Science', 'Animals', FALSE, 72),
    
    ('Big and Small', 'Identify objects that are big or small.', 
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'beginner', 8, 'Nursery', 'General Knowledge', 'Size Comparison', TRUE, 58);

    -- LKG (3-4 years)
    INSERT INTO interactive_assignment 
    (title, description, type, status, due_date, created_by, difficulty_level, estimated_time_minutes, age_group, category, topic, featured, view_count)
    VALUES
    ('Alphabet Adventure', 'Learn to recognize uppercase and lowercase letters of the alphabet.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'beginner', 15, 'LKG', 'Language', 'Alphabet', TRUE, 93),
    
    ('Counting Fun 1-10', 'Learn to count objects from 1 to 10 with this interactive exercise.', 
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'beginner', 12, 'LKG', 'Mathematics', 'Numbers', FALSE, 78),
    
    ('My Body Parts', 'Learn to identify different parts of the body.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'beginner', 10, 'LKG', 'Science', 'Human Body', FALSE, 62),
    
    ('Fruits and Vegetables', 'Identify common fruits and vegetables.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'beginner', 12, 'LKG', 'Science', 'Food', TRUE, 85);

    -- UKG (4-5 years)
    INSERT INTO interactive_assignment 
    (title, description, type, status, due_date, created_by, difficulty_level, estimated_time_minutes, age_group, category, topic, featured, view_count)
    VALUES
    ('Simple Words', 'Learn to read and recognize simple three-letter words.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'intermediate', 15, 'UKG', 'Language', 'Reading', TRUE, 91),
    
    ('Addition Up to 10', 'Practice basic addition with numbers up to 10.', 
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'intermediate', 20, 'UKG', 'Mathematics', 'Addition', FALSE, 76),
    
    ('Opposites', 'Learn about opposite words and concepts.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'intermediate', 15, 'UKG', 'Language', 'Vocabulary', FALSE, 68),
    
    ('Seasons and Weather', 'Learn about different seasons and weather conditions.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'intermediate', 18, 'UKG', 'Science', 'Weather', TRUE, 82);

    -- Class 1 (5-6 years)
    INSERT INTO interactive_assignment 
    (title, description, type, status, due_date, created_by, difficulty_level, estimated_time_minutes, age_group, category, topic, featured, view_count)
    VALUES
    ('Reading Comprehension', 'Read a short story and answer questions to improve reading comprehension skills.', 
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'intermediate', 25, 'Class 1', 'Language', 'Reading', TRUE, 95),
    
    ('Subtraction Up to 20', 'Practice basic subtraction with numbers up to 20.', 
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'intermediate', 20, 'Class 1', 'Mathematics', 'Subtraction', FALSE, 79),
    
    ('Telling Time', 'Learn to tell time on an analog clock.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'advanced', 25, 'Class 1', 'Mathematics', 'Time', FALSE, 73),
    
    ('Animals and Their Homes', 'Learn about different animals and where they live.', 
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '30 days', current_user_id, 'intermediate', 15, 'Class 1', 'Science', 'Animals', TRUE, 88);

    -- Now insert questions for each assignment
    
    -- Get the IDs of the assignments we just created
    DECLARE
        shapes_id UUID;
        colors_id UUID;
        animal_sounds_id UUID;
        big_small_id UUID;
        alphabet_id UUID;
        counting_id UUID;
        body_parts_id UUID;
        fruits_veggies_id UUID;
        simple_words_id UUID;
        addition_id UUID;
        opposites_id UUID;
        seasons_id UUID;
        reading_id UUID;
        subtraction_id UUID;
        time_id UUID;
        animal_homes_id UUID;
    BEGIN
        -- Get assignment IDs
        SELECT id INTO shapes_id FROM interactive_assignment WHERE title = 'Identify Basic Shapes' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO colors_id FROM interactive_assignment WHERE title = 'Colors All Around' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO animal_sounds_id FROM interactive_assignment WHERE title = 'Animal Sounds' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO big_small_id FROM interactive_assignment WHERE title = 'Big and Small' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO alphabet_id FROM interactive_assignment WHERE title = 'Alphabet Adventure' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO counting_id FROM interactive_assignment WHERE title = 'Counting Fun 1-10' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO body_parts_id FROM interactive_assignment WHERE title = 'My Body Parts' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO fruits_veggies_id FROM interactive_assignment WHERE title = 'Fruits and Vegetables' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO simple_words_id FROM interactive_assignment WHERE title = 'Simple Words' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO addition_id FROM interactive_assignment WHERE title = 'Addition Up to 10' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO opposites_id FROM interactive_assignment WHERE title = 'Opposites' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO seasons_id FROM interactive_assignment WHERE title = 'Seasons and Weather' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO reading_id FROM interactive_assignment WHERE title = 'Reading Comprehension' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO subtraction_id FROM interactive_assignment WHERE title = 'Subtraction Up to 20' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO time_id FROM interactive_assignment WHERE title = 'Telling Time' ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO animal_homes_id FROM interactive_assignment WHERE title = 'Animals and Their Homes' ORDER BY created_at DESC LIMIT 1;

        -- Insert questions for each assignment
        
        -- Shapes
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            shapes_id, 
            'MATCHING', 
            'Match the shapes with their names', 
            '{"pairs": [{"id": "1", "left": "🔴", "right": "Circle", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🔶", "right": "Triangle", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "⬜", "right": "Square", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "🔷", "right": "Rectangle", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Colors
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            colors_id, 
            'MATCHING', 
            'Match the colors with objects', 
            '{"pairs": [{"id": "1", "left": "Red", "right": "Apple", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Yellow", "right": "Banana", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "Green", "right": "Leaf", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "Blue", "right": "Sky", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Animal Sounds
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            animal_sounds_id, 
            'MATCHING', 
            'Match the animals with their sounds', 
            '{"pairs": [{"id": "1", "left": "Dog", "right": "Woof", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Cat", "right": "Meow", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "Cow", "right": "Moo", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "Duck", "right": "Quack", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Big and Small
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            big_small_id, 
            'MULTIPLE_CHOICE', 
            'Which of these is BIG?', 
            '{"options": [{"id": "1", "text": "Elephant", "isCorrect": true}, {"id": "2", "text": "Ant", "isCorrect": false}, {"id": "3", "text": "Mouse", "isCorrect": false}], "allowMultiple": false}',
            1
        ),
        (
            big_small_id, 
            'MULTIPLE_CHOICE', 
            'Which of these is SMALL?', 
            '{"options": [{"id": "1", "text": "House", "isCorrect": false}, {"id": "2", "text": "Butterfly", "isCorrect": true}, {"id": "3", "text": "Car", "isCorrect": false}], "allowMultiple": false}',
            2
        );

        -- Alphabet
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            alphabet_id, 
            'MATCHING', 
            'Match uppercase letters with lowercase letters', 
            '{"pairs": [{"id": "1", "left": "A", "right": "a", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "B", "right": "b", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "C", "right": "c", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "D", "right": "d", "leftType": "text", "rightType": "text"}, {"id": "5", "left": "E", "right": "e", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Counting
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            counting_id, 
            'MULTIPLE_CHOICE', 
            'How many apples do you see? 🍎🍎🍎', 
            '{"options": [{"id": "1", "text": "3", "isCorrect": true}, {"id": "2", "text": "4", "isCorrect": false}, {"id": "3", "text": "5", "isCorrect": false}], "allowMultiple": false}',
            1
        ),
        (
            counting_id, 
            'MULTIPLE_CHOICE', 
            'How many stars do you see? ⭐⭐⭐⭐⭐⭐', 
            '{"options": [{"id": "1", "text": "5", "isCorrect": false}, {"id": "2", "text": "6", "isCorrect": true}, {"id": "3", "text": "7", "isCorrect": false}], "allowMultiple": false}',
            2
        );

        -- Body Parts
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            body_parts_id, 
            'MATCHING', 
            'Match the body parts with their functions', 
            '{"pairs": [{"id": "1", "left": "Eyes", "right": "See", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Ears", "right": "Hear", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "Nose", "right": "Smell", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "Hands", "right": "Touch", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Fruits and Vegetables
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            fruits_veggies_id, 
            'MATCHING', 
            'Match the items with their category', 
            '{"pairs": [{"id": "1", "left": "Apple", "right": "Fruit", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Carrot", "right": "Vegetable", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "Banana", "right": "Fruit", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "Broccoli", "right": "Vegetable", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Simple Words
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            simple_words_id, 
            'MATCHING', 
            'Match the words with their pictures', 
            '{"pairs": [{"id": "1", "left": "Cat", "right": "🐱", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Dog", "right": "🐶", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "Sun", "right": "☀️", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "Bus", "right": "🚌", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Addition
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            addition_id, 
            'MULTIPLE_CHOICE', 
            'What is 2 + 3?', 
            '{"options": [{"id": "1", "text": "4", "isCorrect": false}, {"id": "2", "text": "5", "isCorrect": true}, {"id": "3", "text": "6", "isCorrect": false}], "allowMultiple": false}',
            1
        ),
        (
            addition_id, 
            'MULTIPLE_CHOICE', 
            'What is 4 + 4?', 
            '{"options": [{"id": "1", "text": "7", "isCorrect": false}, {"id": "2", "text": "8", "isCorrect": true}, {"id": "3", "text": "9", "isCorrect": false}], "allowMultiple": false}',
            2
        );

        -- Opposites
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            opposites_id, 
            'MATCHING', 
            'Match the words with their opposites', 
            '{"pairs": [{"id": "1", "left": "Hot", "right": "Cold", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Big", "right": "Small", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "Up", "right": "Down", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "Fast", "right": "Slow", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Seasons
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            seasons_id, 
            'MATCHING', 
            'Match the seasons with their characteristics', 
            '{"pairs": [{"id": "1", "left": "Summer", "right": "Hot", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Winter", "right": "Cold", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "Spring", "right": "Flowers", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "Fall", "right": "Leaves", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Reading
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            reading_id, 
            'MULTIPLE_CHOICE', 
            'The cat sat on the mat. The cat is _____.',
            '{"options": [{"id": "1", "text": "standing", "isCorrect": false}, {"id": "2", "text": "sitting", "isCorrect": true}, {"id": "3", "text": "running", "isCorrect": false}], "allowMultiple": false}',
            1
        ),
        (
            reading_id, 
            'MULTIPLE_CHOICE', 
            'The cat sat on the _____.',
            '{"options": [{"id": "1", "text": "chair", "isCorrect": false}, {"id": "2", "text": "table", "isCorrect": false}, {"id": "3", "text": "mat", "isCorrect": true}], "allowMultiple": false}',
            2
        );

        -- Subtraction
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            subtraction_id, 
            'MULTIPLE_CHOICE', 
            'What is 10 - 4?',
            '{"options": [{"id": "1", "text": "5", "isCorrect": false}, {"id": "2", "text": "6", "isCorrect": true}, {"id": "3", "text": "7", "isCorrect": false}], "allowMultiple": false}',
            1
        ),
        (
            subtraction_id, 
            'MULTIPLE_CHOICE', 
            'What is 15 - 7?',
            '{"options": [{"id": "1", "text": "7", "isCorrect": false}, {"id": "2", "text": "8", "isCorrect": true}, {"id": "3", "text": "9", "isCorrect": false}], "allowMultiple": false}',
            2
        );

        -- Time
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            time_id, 
            'MATCHING', 
            'Match the clock with the correct time',
            '{"pairs": [{"id": "1", "left": "🕓", "right": "3:00", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "🕙", "right": "6:00", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "🕛", "right": "12:00", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "🕘", "right": "9:00", "leftType": "text", "rightType": "text"}]}',
            1
        );

        -- Animal Homes
        INSERT INTO interactive_question (assignment_id, question_type, question_text, question_data, "order")
        VALUES (
            animal_homes_id, 
            'MATCHING', 
            'Match the animals with their homes',
            '{"pairs": [{"id": "1", "left": "Bird", "right": "Nest", "leftType": "text", "rightType": "text"}, {"id": "2", "left": "Dog", "right": "Kennel", "leftType": "text", "rightType": "text"}, {"id": "3", "left": "Bee", "right": "Hive", "leftType": "text", "rightType": "text"}, {"id": "4", "left": "Fish", "right": "Aquarium", "leftType": "text", "rightType": "text"}]}',
            1
        );
    END;
END $$;
