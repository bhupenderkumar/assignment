// scripts/create-sample-assignments.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Make sure your .env file is set up correctly.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample assignments data
const sampleAssignments = [
  // Nursery (2-3 years)
  {
    title: "Identify Basic Shapes",
    description: "A fun matching exercise to help children identify and match basic shapes like circles, squares, and triangles.",
    type: "MATCHING",
    status: "PUBLISHED",
    difficultyLevel: "beginner",
    estimatedTimeMinutes: 10,
    ageGroup: "Nursery",
    category: "Mathematics",
    topic: "Shapes",
    featured: true,
    questions: [
      {
        questionType: "MATCHING",
        questionText: "Match the shapes with their names",
        order: 1,
        questionData: {
          pairs: [
            { id: "1", left: "🔴", right: "Circle", leftType: "text", rightType: "text" },
            { id: "2", left: "🔶", right: "Triangle", leftType: "text", rightType: "text" },
            { id: "3", left: "⬜", right: "Square", leftType: "text", rightType: "text" },
            { id: "4", left: "🔷", right: "Rectangle", leftType: "text", rightType: "text" }
          ]
        }
      }
    ]
  },
  {
    title: "Colors All Around",
    description: "Help children identify and match colors with everyday objects.",
    type: "MATCHING",
    status: "PUBLISHED",
    difficultyLevel: "beginner",
    estimatedTimeMinutes: 8,
    ageGroup: "Nursery",
    category: "General Knowledge",
    topic: "Colors",
    questions: [
      {
        questionType: "MATCHING",
        questionText: "Match the colors with objects",
        order: 1,
        questionData: {
          pairs: [
            { id: "1", left: "Red", right: "Apple", leftType: "text", rightType: "text" },
            { id: "2", left: "Yellow", right: "Banana", leftType: "text", rightType: "text" },
            { id: "3", left: "Green", right: "Leaf", leftType: "text", rightType: "text" },
            { id: "4", left: "Blue", right: "Sky", leftType: "text", rightType: "text" }
          ]
        }
      }
    ]
  },

  // LKG (3-4 years)
  {
    title: "Alphabet Adventure",
    description: "Learn to recognize uppercase and lowercase letters of the alphabet.",
    type: "MATCHING",
    status: "PUBLISHED",
    difficultyLevel: "beginner",
    estimatedTimeMinutes: 15,
    ageGroup: "LKG",
    category: "Language",
    topic: "Alphabet",
    featured: true,
    questions: [
      {
        questionType: "MATCHING",
        questionText: "Match uppercase letters with lowercase letters",
        order: 1,
        questionData: {
          pairs: [
            { id: "1", left: "A", right: "a", leftType: "text", rightType: "text" },
            { id: "2", left: "B", right: "b", leftType: "text", rightType: "text" },
            { id: "3", left: "C", right: "c", leftType: "text", rightType: "text" },
            { id: "4", left: "D", right: "d", leftType: "text", rightType: "text" },
            { id: "5", left: "E", right: "e", leftType: "text", rightType: "text" }
          ]
        }
      }
    ]
  },
  {
    title: "Counting Fun 1-10",
    description: "Learn to count objects from 1 to 10 with this interactive exercise.",
    type: "MULTIPLE_CHOICE",
    status: "PUBLISHED",
    difficultyLevel: "beginner",
    estimatedTimeMinutes: 12,
    ageGroup: "LKG",
    category: "Mathematics",
    topic: "Numbers",
    questions: [
      {
        questionType: "MULTIPLE_CHOICE",
        questionText: "How many apples do you see?",
        order: 1,
        questionData: {
          options: [
            { id: "1", text: "3", isCorrect: true },
            { id: "2", text: "4", isCorrect: false },
            { id: "3", text: "5", isCorrect: false }
          ],
          allowMultiple: false
        }
      },
      {
        questionType: "MULTIPLE_CHOICE",
        questionText: "How many stars do you see?",
        order: 2,
        questionData: {
          options: [
            { id: "1", text: "5", isCorrect: false },
            { id: "2", text: "6", isCorrect: true },
            { id: "3", text: "7", isCorrect: false }
          ],
          allowMultiple: false
        }
      }
    ]
  },

  // UKG (4-5 years)
  {
    title: "Simple Words",
    description: "Learn to read and recognize simple three-letter words.",
    type: "MATCHING",
    status: "PUBLISHED",
    difficultyLevel: "intermediate",
    estimatedTimeMinutes: 15,
    ageGroup: "UKG",
    category: "Language",
    topic: "Reading",
    featured: true,
    questions: [
      {
        questionType: "MATCHING",
        questionText: "Match the words with their pictures",
        order: 1,
        questionData: {
          pairs: [
            { id: "1", left: "Cat", right: "🐱", leftType: "text", rightType: "text" },
            { id: "2", left: "Dog", right: "🐶", leftType: "text", rightType: "text" },
            { id: "3", left: "Sun", right: "☀️", leftType: "text", rightType: "text" },
            { id: "4", left: "Bus", right: "🚌", leftType: "text", rightType: "text" }
          ]
        }
      }
    ]
  },
  {
    title: "Addition Up to 10",
    description: "Practice basic addition with numbers up to 10.",
    type: "MULTIPLE_CHOICE",
    status: "PUBLISHED",
    difficultyLevel: "intermediate",
    estimatedTimeMinutes: 20,
    ageGroup: "UKG",
    category: "Mathematics",
    topic: "Addition",
    questions: [
      {
        questionType: "MULTIPLE_CHOICE",
        questionText: "What is 2 + 3?",
        order: 1,
        questionData: {
          options: [
            { id: "1", text: "4", isCorrect: false },
            { id: "2", text: "5", isCorrect: true },
            { id: "3", text: "6", isCorrect: false }
          ],
          allowMultiple: false
        }
      },
      {
        questionType: "MULTIPLE_CHOICE",
        questionText: "What is 4 + 4?",
        order: 2,
        questionData: {
          options: [
            { id: "1", text: "7", isCorrect: false },
            { id: "2", text: "8", isCorrect: true },
            { id: "3", text: "9", isCorrect: false }
          ],
          allowMultiple: false
        }
      }
    ]
  },

  // Class 1 (5-6 years)
  {
    title: "Reading Comprehension",
    description: "Read a short story and answer questions to improve reading comprehension skills.",
    type: "MULTIPLE_CHOICE",
    status: "PUBLISHED",
    difficultyLevel: "intermediate",
    estimatedTimeMinutes: 25,
    ageGroup: "Class 1",
    category: "Language",
    topic: "Reading",
    featured: true,
    questions: [
      {
        questionType: "MULTIPLE_CHOICE",
        questionText: "The cat sat on the mat. The cat is _____.",
        order: 1,
        questionData: {
          options: [
            { id: "1", text: "standing", isCorrect: false },
            { id: "2", text: "sitting", isCorrect: true },
            { id: "3", text: "running", isCorrect: false }
          ],
          allowMultiple: false
        }
      },
      {
        questionType: "MULTIPLE_CHOICE",
        questionText: "The cat sat on the _____.",
        order: 2,
        questionData: {
          options: [
            { id: "1", text: "chair", isCorrect: false },
            { id: "2", text: "table", isCorrect: false },
            { id: "3", text: "mat", isCorrect: true }
          ],
          allowMultiple: false
        }
      }
    ]
  },
  {
    title: "Subtraction Up to 20",
    description: "Practice basic subtraction with numbers up to 20.",
    type: "MULTIPLE_CHOICE",
    status: "PUBLISHED",
    difficultyLevel: "intermediate",
    estimatedTimeMinutes: 20,
    ageGroup: "Class 1",
    category: "Mathematics",
    topic: "Subtraction",
    questions: [
      {
        questionType: "MULTIPLE_CHOICE",
        questionText: "What is 10 - 4?",
        order: 1,
        questionData: {
          options: [
            { id: "1", text: "5", isCorrect: false },
            { id: "2", text: "6", isCorrect: true },
            { id: "3", text: "7", isCorrect: false }
          ],
          allowMultiple: false
        }
      },
      {
        questionType: "MULTIPLE_CHOICE",
        questionText: "What is 15 - 7?",
        order: 2,
        questionData: {
          options: [
            { id: "1", text: "7", isCorrect: false },
            { id: "2", text: "8", isCorrect: true },
            { id: "3", text: "9", isCorrect: false }
          ],
          allowMultiple: false
        }
      }
    ]
  },
  {
    title: "Telling Time",
    description: "Learn to tell time on an analog clock.",
    type: "MATCHING",
    status: "PUBLISHED",
    difficultyLevel: "advanced",
    estimatedTimeMinutes: 25,
    ageGroup: "Class 1",
    category: "Mathematics",
    topic: "Time",
    questions: [
      {
        questionType: "MATCHING",
        questionText: "Match the clock with the correct time",
        order: 1,
        questionData: {
          pairs: [
            { id: "1", left: "🕓", right: "3:00", leftType: "text", rightType: "text" },
            { id: "2", left: "🕙", right: "6:00", leftType: "text", rightType: "text" },
            { id: "3", left: "🕛", right: "12:00", leftType: "text", rightType: "text" },
            { id: "4", left: "🕘", right: "9:00", leftType: "text", rightType: "text" }
          ]
        }
      }
    ]
  },
  {
    title: "Animals and Their Homes",
    description: "Learn about different animals and where they live.",
    type: "MATCHING",
    status: "PUBLISHED",
    difficultyLevel: "intermediate",
    estimatedTimeMinutes: 15,
    ageGroup: "Class 1",
    category: "Science",
    topic: "Animals",
    questions: [
      {
        questionType: "MATCHING",
        questionText: "Match the animals with their homes",
        order: 1,
        questionData: {
          pairs: [
            { id: "1", left: "Bird", right: "Nest", leftType: "text", rightType: "text" },
            { id: "2", left: "Dog", right: "Kennel", leftType: "text", rightType: "text" },
            { id: "3", left: "Bee", right: "Hive", leftType: "text", rightType: "text" },
            { id: "4", left: "Fish", right: "Aquarium", leftType: "text", rightType: "text" }
          ]
        }
      }
    ]
  }
];

// Function to insert assignments
async function insertSampleAssignments() {
  console.log('Starting to insert sample assignments...');

  try {
    // Get the current user (for created_by field)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }

    if (!user) {
      console.error('No authenticated user found. Please sign in first.');
      return;
    }

    // Insert each assignment
    for (const assignment of sampleAssignments) {
      // First, insert the assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('interactive_assignment')
        .insert({
          title: assignment.title,
          description: assignment.description,
          type: assignment.type,
          status: assignment.status,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          created_by: user.id,
          difficulty_level: assignment.difficultyLevel,
          estimated_time_minutes: assignment.estimatedTimeMinutes,
          age_group: assignment.ageGroup,
          category: assignment.category,
          topic: assignment.topic,
          featured: assignment.featured || false,
          view_count: Math.floor(Math.random() * 100) // Random view count for demo
        })
        .select()
        .single();

      if (assignmentError) {
        console.error(`Error inserting assignment "${assignment.title}":`, assignmentError);
        continue;
      }

      console.log(`Inserted assignment: ${assignment.title} (ID: ${assignmentData.id})`);

      // Then, insert the questions for this assignment
      for (const question of assignment.questions) {
        const { error: questionError } = await supabase
          .from('interactive_question')
          .insert({
            assignment_id: assignmentData.id,
            question_type: question.questionType,
            question_text: question.questionText,
            question_data: question.questionData,
            order: question.order
          });

        if (questionError) {
          console.error(`Error inserting question for assignment "${assignment.title}":`, questionError);
        } else {
          console.log(`Inserted question for assignment: ${assignment.title}`);
        }
      }
    }

    console.log('Sample assignments inserted successfully!');
  } catch (error) {
    console.error('Error inserting sample assignments:', error);
  }
}

// Run the function
insertSampleAssignments();
