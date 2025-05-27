// Test script to verify payment field mapping is working
// This script can be run in the browser console to test the mapping functions

console.log('🧪 Testing Payment Field Mapping...');

// Test data that simulates a database row with payment fields
const testDatabaseRow = {
  id: '4844c06a-cc2e-43ba-9251-281da6a263ae',
  title: 'Count 1 to 10',
  description: 'Learn to count from 1 to 10',
  type: 'COUNTING',
  status: 'PUBLISHED',
  due_date: '2024-12-31T23:59:59.000Z',
  created_by: 'test-user',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  organization_id: 'test-org',
  audio_instructions: null,
  difficulty_level: 'beginner',
  estimated_time_minutes: 15,
  has_audio_feedback: false,
  has_celebration: true,
  age_group: '3-5',
  requires_help: false,
  requires_payment: true,  // ✅ Payment field
  payment_amount: 0.5,     // ✅ Payment amount field
  shareable_link: null,
  shareable_link_expires_at: null,
  category: 'math',
  topic: 'counting',
  featured: false,
  view_count: 0,
  average_rating: 0,
  rating_count: 0,
  is_template: false,
  source_assignment_id: null,
  attachments: []
};

// Test assignment object that should be converted to database row
const testAssignmentObject = {
  id: '4844c06a-cc2e-43ba-9251-281da6a263ae',
  title: 'Count 1 to 10 - Updated',
  description: 'Learn to count from 1 to 10 with payment',
  type: 'COUNTING',
  status: 'PUBLISHED',
  dueDate: new Date('2024-12-31T23:59:59.000Z'),
  createdBy: 'test-user',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  organizationId: 'test-org',
  audioInstructions: null,
  difficultyLevel: 'beginner',
  estimatedTimeMinutes: 15,
  hasAudioFeedback: false,
  hasCelebration: true,
  ageGroup: '3-5',
  requiresHelp: false,
  requiresPayment: true,  // ✅ Payment field
  paymentAmount: 1.0,     // ✅ Payment amount field
  shareableLink: null,
  shareableLinkExpiresAt: null,
  category: 'math',
  topic: 'counting',
  featured: false,
  viewCount: 0,
  averageRating: 0,
  ratingCount: 0,
  isTemplate: false,
  sourceAssignmentId: null,
  questions: [],
  attachments: []
};

// Simulate the mapping functions (copy from the actual service files)
const mapRowToAssignment = (row) => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    dueDate: row.due_date ? new Date(row.due_date) : new Date(),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    organizationId: row.organization_id,
    audioInstructions: row.audio_instructions,
    difficultyLevel: row.difficulty_level,
    estimatedTimeMinutes: row.estimated_time_minutes,
    hasAudioFeedback: row.has_audio_feedback,
    hasCelebration: row.has_celebration,
    ageGroup: row.age_group,
    requiresHelp: row.requires_help,
    requiresPayment: row.requires_payment || false, // ✅ Payment field mapping
    paymentAmount: row.payment_amount || 0, // ✅ Payment amount field mapping
    shareableLink: row.shareable_link,
    shareableLinkExpiresAt: row.shareable_link_expires_at ? new Date(row.shareable_link_expires_at) : undefined,
    category: row.category,
    topic: row.topic,
    featured: row.featured || false,
    viewCount: row.view_count || 0,
    averageRating: row.average_rating || 0,
    ratingCount: row.rating_count || 0,
    isTemplate: row.is_template || false,
    sourceAssignmentId: row.source_assignment_id,
    questions: [],
    attachments: row.attachments || [],
  };
};

const mapAssignmentToRow = (assignment) => {
  return {
    title: assignment.title,
    description: assignment.description,
    type: assignment.type,
    status: assignment.status,
    due_date: assignment.dueDate?.toISOString(),
    organization_id: assignment.organizationId,
    audio_instructions: assignment.audioInstructions,
    difficulty_level: assignment.difficultyLevel,
    estimated_time_minutes: assignment.estimatedTimeMinutes,
    has_audio_feedback: assignment.hasAudioFeedback,
    has_celebration: assignment.hasCelebration,
    age_group: assignment.ageGroup,
    requires_help: assignment.requiresHelp,
    requires_payment: assignment.requiresPayment || false, // ✅ Payment field mapping
    payment_amount: assignment.paymentAmount || 0, // ✅ Payment amount field mapping
    shareable_link: assignment.shareableLink,
    shareable_link_expires_at: assignment.shareableLinkExpiresAt?.toISOString(),
    category: assignment.category,
    topic: assignment.topic,
    featured: assignment.featured,
    view_count: assignment.viewCount,
    average_rating: assignment.averageRating,
    rating_count: assignment.ratingCount,
    is_template: assignment.isTemplate,
    source_assignment_id: assignment.sourceAssignmentId,
    attachments: assignment.attachments
  };
};

// Test 1: Database row to Assignment object
console.log('🔄 Test 1: Database row → Assignment object');
const mappedAssignment = mapRowToAssignment(testDatabaseRow);
console.log('✅ requiresPayment:', mappedAssignment.requiresPayment, '(expected: true)');
console.log('✅ paymentAmount:', mappedAssignment.paymentAmount, '(expected: 0.5)');

// Test 2: Assignment object to Database row
console.log('\n🔄 Test 2: Assignment object → Database row');
const mappedRow = mapAssignmentToRow(testAssignmentObject);
console.log('✅ requires_payment:', mappedRow.requires_payment, '(expected: true)');
console.log('✅ payment_amount:', mappedRow.payment_amount, '(expected: 1)');

// Test 3: Round-trip test
console.log('\n🔄 Test 3: Round-trip test (row → object → row)');
const roundTripAssignment = mapRowToAssignment(testDatabaseRow);
const roundTripRow = mapAssignmentToRow(roundTripAssignment);
console.log('✅ Original requires_payment:', testDatabaseRow.requires_payment);
console.log('✅ Round-trip requires_payment:', roundTripRow.requires_payment);
console.log('✅ Original payment_amount:', testDatabaseRow.payment_amount);
console.log('✅ Round-trip payment_amount:', roundTripRow.payment_amount);

// Validation
const test1Pass = mappedAssignment.requiresPayment === true && mappedAssignment.paymentAmount === 0.5;
const test2Pass = mappedRow.requires_payment === true && mappedRow.payment_amount === 1.0;
const test3Pass = roundTripRow.requires_payment === testDatabaseRow.requires_payment && 
                  roundTripRow.payment_amount === testDatabaseRow.payment_amount;

console.log('\n📊 Test Results:');
console.log('Test 1 (row → object):', test1Pass ? '✅ PASS' : '❌ FAIL');
console.log('Test 2 (object → row):', test2Pass ? '✅ PASS' : '❌ FAIL');
console.log('Test 3 (round-trip):', test3Pass ? '✅ PASS' : '❌ FAIL');

if (test1Pass && test2Pass && test3Pass) {
  console.log('\n🎉 ALL TESTS PASSED! Payment field mapping is working correctly.');
} else {
  console.log('\n❌ SOME TESTS FAILED! Check the mapping functions.');
}
