-- Create comprehensive educational assignments for First Step School
-- Organization ID: 47bf7bd8-8ee8-4af4-8534-e34f72ba734e

DO $$
DECLARE
    org_id UUID := '47bf7bd8-8ee8-4af4-8534-e34f72ba734e';
    current_user_id UUID;

    -- Assignment IDs for each class level
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
    -- Get the first user ID to use as creator
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in the database';
    END IF;

    -- ========================================
    -- PRE-CLASS ASSIGNMENTS (Age 2-3)
    -- ========================================

    -- Pre-Class English: Basic Recognition
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Basic Recognition - Colors & Shapes', 'Learn to recognize basic colors and simple shapes through fun activities.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 10, 'Pre-Class (2-3 years)', 'English', 'Recognition', TRUE)
    RETURNING id INTO pre_class_english_id;

    -- Pre-Class Hindi: Simple Sounds
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Simple Sounds - अ आ इ', 'Introduction to basic Hindi vowel sounds through visual and audio learning.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 8, 'Pre-Class (2-3 years)', 'Hindi', 'Vowels', FALSE)
    RETURNING id INTO pre_class_hindi_id;

    -- Pre-Class Math: Count to 3
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Count to 3 - Numbers & Objects', 'Learn to count objects from 1 to 3 with colorful pictures and fun activities.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 12, 'Pre-Class (2-3 years)', 'Mathematics', 'Counting', FALSE)
    RETURNING id INTO pre_class_math_id;

    -- Pre-Class GK: Body Parts
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('My Body Parts', 'Learn to identify basic body parts like eyes, nose, mouth, and hands.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 10, 'Pre-Class (2-3 years)', 'General Knowledge', 'Body Parts', FALSE)
    RETURNING id INTO pre_class_gk_id;

    -- Pre-Class Life Skills: Daily Activities
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Daily Activities', 'Learn about daily activities like eating, sleeping, and playing.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 8, 'Pre-Class (2-3 years)', 'Life Skills', 'Daily Life', FALSE)
    RETURNING id INTO pre_class_life_id;

    -- ========================================
    -- NURSERY ASSIGNMENTS (Age 3-4)
    -- ========================================

    -- Nursery English: A to E
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Alphabet A to E', 'Learn the first five letters of the alphabet with pictures and sounds.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 15, 'Nursery (3-4 years)', 'English', 'Alphabet', TRUE)
    RETURNING id INTO nursery_english_id;

    -- Nursery Hindi: अ से अनार
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('अ से अनार - Hindi Letters', 'Match Hindi letters with objects: अ से अनार, आ से आम, इ से इमली.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 15, 'Nursery (3-4 years)', 'Hindi', 'Letters', TRUE)
    RETURNING id INTO nursery_hindi_id;

    -- Nursery Math: Count 1-5
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Count 1 to 5', 'Learn to count objects from 1 to 5 and recognize number symbols.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 12, 'Nursery (3-4 years)', 'Mathematics', 'Numbers', FALSE)
    RETURNING id INTO nursery_math_id;

    -- Nursery GK: Animals & Sounds
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Animals & Their Sounds', 'Match animals with the sounds they make: cow says moo, cat says meow.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 12, 'Nursery (3-4 years)', 'General Knowledge', 'Animals', FALSE)
    RETURNING id INTO nursery_gk_id;

    -- Nursery Life Skills: Good Habits
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Good Habits', 'Learn about good habits like brushing teeth, washing hands, and saying please.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 10, 'Nursery (3-4 years)', 'Life Skills', 'Habits', FALSE)
    RETURNING id INTO nursery_life_id;

    -- ========================================
    -- KG ASSIGNMENTS (Age 4-5)
    -- ========================================

    -- KG English: A to J
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Alphabet A to J', 'Learn letters A through J with phonics and word examples.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 18, 'KG (4-5 years)', 'English', 'Alphabet', TRUE)
    RETURNING id INTO kg_english_id;

    -- KG Hindi: क से कमल
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('क से कमल - Consonants', 'Learn Hindi consonants: क से कमल, ख से खरगोश, ग से गाय.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 18, 'KG (4-5 years)', 'Hindi', 'Consonants', TRUE)
    RETURNING id INTO kg_hindi_id;

    -- KG Math: Count 1-10
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Count 1 to 10', 'Master counting from 1 to 10 and fill in missing numbers.',
     'COMPLETION', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 15, 'KG (4-5 years)', 'Mathematics', 'Numbers', FALSE)
    RETURNING id INTO kg_math_id;

    -- KG GK: Fruits & Vegetables
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Fruits & Vegetables', 'Identify and categorize different fruits and vegetables.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 12, 'KG (4-5 years)', 'General Knowledge', 'Food', FALSE)
    RETURNING id INTO kg_gk_id;

    -- KG Life Skills: Safety Rules
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Safety Rules', 'Learn important safety rules for home, school, and road.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'beginner', 12, 'KG (4-5 years)', 'Life Skills', 'Safety', FALSE)
    RETURNING id INTO kg_life_id;

    -- ========================================
    -- KG II ASSIGNMENTS (Age 5-6)
    -- ========================================

    -- KG II English: Complete Alphabet
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Complete Alphabet A-Z', 'Master the complete English alphabet with uppercase and lowercase letters.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 20, 'KG II (5-6 years)', 'English', 'Alphabet', TRUE)
    RETURNING id INTO kg2_english_id;

    -- KG II Hindi: मात्रा (Vowel Signs)
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('मात्रा - Vowel Signs', 'Learn Hindi vowel signs (मात्रा): का, कि, की, कु, कू, के, कै, को, कौ.',
     'COMPLETION', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 20, 'KG II (5-6 years)', 'Hindi', 'Matra', TRUE)
    RETURNING id INTO kg2_hindi_id;

    -- KG II Math: Count 1-20
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Count 1 to 20 & Simple Addition', 'Count up to 20 and solve simple addition problems (1+1, 2+1, etc.).',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 18, 'KG II (5-6 years)', 'Mathematics', 'Addition', FALSE)
    RETURNING id INTO kg2_math_id;

    -- KG II GK: Community Helpers
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Community Helpers', 'Learn about different community helpers: doctor, teacher, police, firefighter.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 15, 'KG II (5-6 years)', 'General Knowledge', 'Community', FALSE)
    RETURNING id INTO kg2_gk_id;

    -- KG II Life Skills: Emotions & Feelings
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Emotions & Feelings', 'Identify and express different emotions: happy, sad, angry, excited, scared.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 12, 'KG II (5-6 years)', 'Life Skills', 'Emotions', FALSE)
    RETURNING id INTO kg2_life_id;

    -- ========================================
    -- CLASS 1ST ASSIGNMENTS (Age 6-7)
    -- ========================================

    -- Class 1st English: Simple Words
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Simple Words & Reading', 'Read and understand simple 3-letter words: cat, bat, hat, mat, rat.',
     'COMPLETION', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 25, 'Class 1st (6-7 years)', 'English', 'Reading', TRUE)
    RETURNING id INTO class1_english_id;

    -- Class 1st Hindi: Simple Words
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('सरल शब्द - Simple Hindi Words', 'Read simple Hindi words: कमल, नमक, जल, फल, बल.',
     'COMPLETION', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 25, 'Class 1st (6-7 years)', 'Hindi', 'Words', TRUE)
    RETURNING id INTO class1_hindi_id;

    -- Class 1st Math: Addition & Subtraction
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Addition & Subtraction (1-10)', 'Solve simple addition and subtraction problems within 10.',
     'MULTIPLE_CHOICE', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 20, 'Class 1st (6-7 years)', 'Mathematics', 'Operations', FALSE)
    RETURNING id INTO class1_math_id;

    -- Class 1st GK: Seasons & Weather
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Seasons & Weather', 'Learn about four seasons and different weather conditions.',
     'MATCHING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 15, 'Class 1st (6-7 years)', 'General Knowledge', 'Nature', FALSE)
    RETURNING id INTO class1_gk_id;

    -- Class 1st Life Skills: Time & Days
    INSERT INTO interactive_assignment
    (title, description, type, status, due_date, created_by, organization_id, difficulty_level, estimated_time_minutes, age_group, category, topic, featured)
    VALUES
    ('Time & Days of Week', 'Learn about days of the week and basic time concepts (morning, afternoon, evening).',
     'ORDERING', 'PUBLISHED', CURRENT_DATE + INTERVAL '365 days', current_user_id, org_id, 'intermediate', 18, 'Class 1st (6-7 years)', 'Life Skills', 'Time', FALSE)
    RETURNING id INTO class1_life_id;

END $$;
