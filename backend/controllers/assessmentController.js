const { errorResponse, successResponse } = require('../utils/responseHelpers');
const assessmentRepo = require('../repositories/assessmentRepo');
const courseRepo = require('../repositories/courseEavRepoNew'); // EAV course repo

// ===================================================================
// @desc    Get all assessments for a course
// @route   GET /api/curriculum/assessments/course/:courseId
// @access  Private
// ===================================================================
const getAssessmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { isPublished } = req.query;
    
    // Check if course exists (using EAV repo)
    const course = await courseRepo.getCourseById(courseId);
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }
    
    const assessments = await assessmentRepo.getAssessmentsByCourse(courseId, {
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      userId: req.user.id,
      userRole: req.user.role
    });
    
    successResponse(res, 200, 'Assessments retrieved successfully', { assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    errorResponse(res, 500, 'Server error while retrieving assessments');
  }
};

// ===================================================================
// @desc    Get single assessment by ID
// @route   GET /api/curriculum/assessments/:id
// @access  Private
// ===================================================================
const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const assessment = await assessmentRepo.getAssessmentById(id);
    if (!assessment) {
      return errorResponse(res, 404, 'Assessment not found');
    }
    
    // Students can only see published assessments
    if (req.user.role === 'student' && !assessment.isPublished) {
      return errorResponse(res, 403, 'This assessment is not available yet');
    }
    
    // Get questions if faculty or if student and assessment is published
    let questions = [];
    if (['professor', 'ta', 'admin'].includes(req.user.role) || assessment.isPublished) {
      questions = await assessmentRepo.getAssessmentQuestions(id);
      
      // Hide correct answers from students unless allowed
      if (req.user.role === 'student' && !assessment.showCorrectAnswers) {
        questions = questions.map(q => {
          const { correctAnswer, ...rest } = q;
          return rest;
        });
      }
    }
    
    successResponse(res, 200, 'Assessment retrieved successfully', {
      assessment,
      questions
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    errorResponse(res, 500, 'Server error while retrieving assessment');
  }
};

// ===================================================================
// @desc    Create new assessment
// @route   POST /api/curriculum/assessments
// @access  Private (Faculty only)
// ===================================================================
const createAssessment = async (req, res) => {
  try {
    const {
      courseId,
      title,
      description,
      assessmentType,
      totalPoints,
      dueDate,
      availableFrom,
      availableUntil,
      durationMinutes,
      allowLateSubmission,
      latePenaltyPercent,
      maxAttempts,
      showCorrectAnswers,
      shuffleQuestions,
      isPublished,
      instructions,
      questions
    } = req.body;
    
    // Debug logging
    console.log('Creating assessment with data:', {
      courseId,
      title,
      assessmentType,
      dueDate,
      availableFrom,
      availableUntil,
      userId: req.user.id,
      userRole: req.user.role
    });
    
    // Validate required fields
    if (!courseId) {
      return errorResponse(res, 400, 'Course ID is required');
    }
    if (!title || !title.trim()) {
      return errorResponse(res, 400, 'Assessment title is required');
    }
    if (!assessmentType) {
      return errorResponse(res, 400, 'Assessment type is required');
    }
    if (!dueDate) {
      return errorResponse(res, 400, 'Due date is required');
    }
    
    // Validate due date is in the future (with 1 minute buffer)
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    const oneMinuteFromNow = new Date(now.getTime() + 60000);
    
    if (dueDateObj < oneMinuteFromNow) {
      return errorResponse(res, 400, 'Due date must be at least 1 minute in the future');
    }
    
    // Validate available dates
    if (availableFrom) {
      const availableFromObj = new Date(availableFrom);
      if (availableFromObj >= dueDateObj) {
        return errorResponse(res, 400, 'Available from date must be before due date');
      }
    }
    
    if (availableUntil) {
      const availableUntilObj = new Date(availableUntil);
      if (availableUntilObj <= dueDateObj) {
        return errorResponse(res, 400, 'Available until date must be after due date');
      }
    }
    
    // Check if course exists (using EAV repo)
    const course = await courseRepo.getCourseById(courseId);
    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }
    
    console.log('Course found:', { 
      courseId, 
      instructorId: course.instructorId, 
      userId: req.user.id,
      userRole: req.user.role 
    });
    
    // Verify user is instructor of the course or admin/ta
    if (req.user.role !== 'admin' && 
        req.user.role !== 'ta' &&
        course.instructorId !== req.user.id) {
      return errorResponse(res, 403, 'You are not authorized to create assessments for this course');
    }

    // Create assessment (traditional table)
    const assessment = await assessmentRepo.createAssessment({
      courseId: parseInt(courseId),
      title: title.trim(),
      description,
      assessmentType,
      totalPoints: totalPoints || 100,
      dueDate: dueDateObj,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableUntil: availableUntil ? new Date(availableUntil) : null,
      durationMinutes,
      allowLateSubmission: !!allowLateSubmission,
      latePenaltyPercent,
      maxAttempts: maxAttempts || 1,
      showCorrectAnswers: !!showCorrectAnswers,
      shuffleQuestions: !!shuffleQuestions,
      isPublished: !!isPublished,
      instructions,
      createdBy: req.user.id
    });
    
    console.log('Assessment created:', assessment);
    
    // Add questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        await assessmentRepo.addQuestion(assessment.id, {
          ...question,
          orderNumber: i + 1
        });
      }
      console.log(`Added ${questions.length} questions`);
    }
    
    successResponse(res, 201, 'Assessment created successfully', { assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    console.error('Error stack:', error.stack);
    errorResponse(res, 500, error.message || 'Server error while creating assessment');
  }
};

// ===================================================================
// @desc    Update assessment
// @route   PUT /api/curriculum/assessments/:id
// @access  Private (Faculty only)
// ===================================================================
const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { questions } = req.body; // Extract questions from request body
    
    // Check if assessment exists
    const existingAssessment = await assessmentRepo.getAssessmentById(id);
    if (!existingAssessment) {
      return errorResponse(res, 404, 'Assessment not found');
    }
    
    // Get course to verify authorization (using EAV repo)
    const course = await courseRepo.getCourseById(existingAssessment.courseId);
    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return errorResponse(res, 403, 'You are not authorized to update this assessment');
    }
    
    // Validate due date if being updated
    if (updateData.dueDate) {
      const dueDateObj = new Date(updateData.dueDate);
      const oneMinuteFromNow = new Date(Date.now() + 60000);
      if (dueDateObj < oneMinuteFromNow) {
        return errorResponse(res, 400, 'Due date must be at least 1 minute in the future');
      }
      updateData.dueDate = dueDateObj;
    }
    
    // Validate available dates
    if (updateData.availableFrom) {
      const availableFromObj = new Date(updateData.availableFrom);
      const dueDate = updateData.dueDate || existingAssessment.dueDate;
      if (availableFromObj >= new Date(dueDate)) {
        return errorResponse(res, 400, 'Available from date must be before due date');
      }
      updateData.availableFrom = availableFromObj;
    }
    
    // Update assessment metadata
    const assessment = await assessmentRepo.updateAssessment(id, updateData);
    
    // Handle questions update if questions are provided
    if (questions !== undefined) {
      await assessmentRepo.replaceAssessmentQuestions(id, questions);
      // Refresh assessment data to include updated question count
      const updatedAssessment = await assessmentRepo.getAssessmentById(id);
      successResponse(res, 200, 'Assessment updated successfully', { assessment: updatedAssessment });
    } else {
      successResponse(res, 200, 'Assessment updated successfully', { assessment });
    }
  } catch (error) {
    console.error('Error updating assessment:', error);
    errorResponse(res, 500, 'Server error while updating assessment');
  }
};

// ===================================================================
// @desc    Delete assessment
// @route   DELETE /api/curriculum/assessments/:id
// @access  Private (Faculty only)
// ===================================================================
const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if assessment exists
    const assessment = await assessmentRepo.getAssessmentById(id);
    if (!assessment) {
      return errorResponse(res, 404, 'Assessment not found');
    }
    
    // Get course to verify authorization (using EAV repo)
    const course = await courseRepo.getCourseById(assessment.courseId);
    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return errorResponse(res, 403, 'You are not authorized to delete this assessment');
    }
    
    // Check if there are submissions
    const submissions = await assessmentRepo.getSubmissionsByAssessment(id);
    if (submissions.length > 0) {
      return errorResponse(res, 400, 'Cannot delete assessment with existing submissions');
    }
    
    await assessmentRepo.deleteAssessment(id);
    
    successResponse(res, 200, 'Assessment deleted successfully');
  } catch (error) {
    console.error('Error deleting assessment:', error);
    errorResponse(res, 500, 'Server error while deleting assessment');
  }
};

// ===================================================================
// @desc    Submit assessment (student)
// @route   POST /api/curriculum/assessments/:id/submit
// @access  Private (Student only)
// ===================================================================
const submitAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeSpentMinutes } = req.body;
    
    // Get assessment
    const assessment = await assessmentRepo.getAssessmentById(id);
    if (!assessment) {
      return errorResponse(res, 404, 'Assessment not found');
    }
    
    // Check if published
    if (!assessment.isPublished) {
      return errorResponse(res, 403, 'This assessment is not available yet');
    }
    
    // Check if still available
    const now = new Date();
    if (assessment.availableFrom && new Date(assessment.availableFrom) > now) {
      return errorResponse(res, 403, 'This assessment is not available yet');
    }
    if (assessment.availableUntil && new Date(assessment.availableUntil) < now) {
      return errorResponse(res, 403, 'This assessment is no longer available');
    }
    
    // Check previous attempts
    const previousSubmissions = await assessmentRepo.getSubmissionsByAssessment(id);
    const userAttempts = previousSubmissions.filter(s => s.studentId === req.user.id);
    
    if (userAttempts.length >= assessment.maxAttempts) {
      return errorResponse(res, 400, 'Maximum number of attempts reached');
    }
    
    // Check if late
    const dueDate = new Date(assessment.dueDate);
    const isLate = now > dueDate;
    
    if (isLate && !assessment.allowLateSubmission) {
      return errorResponse(res, 400, 'Late submissions are not allowed for this assessment');
    }
    
    // Create submission
    const submissionId = await assessmentRepo.createSubmission({
      assessmentId: id,
      studentId: req.user.id,
      attemptNumber: userAttempts.length + 1,
      submissionDate: now,
      isLate,
      status: 'submitted',
      timeSpentMinutes
    });
    
    // Save answers
    if (answers && Array.isArray(answers)) {
      for (const answer of answers) {
        await assessmentRepo.saveAnswer(
          submissionId,
          answer.questionId,
          answer.answerText
        );
      }
    }
    
    // Auto-grade if possible (for quiz types with defined answers)
    if (assessment.assessmentType === 'quiz') {
      // This would be implemented in a separate grading function
      // For now, just mark as submitted
    }
    
    successResponse(res, 201, 'Assessment submitted successfully', {
      submissionId,
      isLate,
      attemptNumber: userAttempts.length + 1
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    errorResponse(res, 500, 'Server error while submitting assessment');
  }
};

// ===================================================================
// @desc    Get submissions for an assessment (faculty)
// @route   GET /api/curriculum/assessments/:id/submissions
// @access  Private (Faculty only)
// ===================================================================
const getAssessmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get assessment
    const assessment = await assessmentRepo.getAssessmentById(id);
    if (!assessment) {
      return errorResponse(res, 404, 'Assessment not found');
    }
    
    // Verify authorization (using EAV repo)
    const course = await courseRepo.getCourseById(assessment.courseId);
    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return errorResponse(res, 403, 'You are not authorized to view submissions');
    }
    
    const submissions = await assessmentRepo.getSubmissionsByAssessment(id);
    
    successResponse(res, 200, 'Submissions retrieved successfully', { submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    errorResponse(res, 500, 'Server error while retrieving submissions');
  }
};

// ===================================================================
// @desc    Get student's own submission
// @route   GET /api/curriculum/assessments/:id/my-submission
// @access  Private (Student only)
// ===================================================================
const getMySubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await assessmentRepo.getStudentSubmission(id, req.user.id);
    
    if (!submission) {
      return successResponse(res, 200, 'No submission found', { submission: null });
    }
    
    // Get answers
    const answers = await assessmentRepo.getSubmissionAnswers(submission.id);
    
    successResponse(res, 200, 'Submission retrieved successfully', {
      submission,
      answers
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    errorResponse(res, 500, 'Server error while retrieving submission');
  }
};

// ===================================================================
// @desc    Grade a submission
// @route   PUT /api/curriculum/assessments/:id/submissions/:submissionId/grade
// @access  Private (Faculty only)
// ===================================================================
const gradeSubmission = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { score, feedback } = req.body;
    
    // Get assessment to verify total points
    const assessment = await assessmentRepo.getAssessmentById(id);
    if (!assessment) {
      return errorResponse(res, 404, 'Assessment not found');
    }
    
    // Verify authorization
    const course = await courseRepo.getCourseById(assessment.courseId);
    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return errorResponse(res, 403, 'You are not authorized to grade this assessment');
    }
    
    // Validate score
    if (score !== undefined && score !== null) {
      const scoreNum = parseFloat(score);
      if (isNaN(scoreNum)) {
        return errorResponse(res, 400, 'Score must be a valid number');
      }
      if (scoreNum < 0) {
        return errorResponse(res, 400, 'Score cannot be negative');
      }
      if (scoreNum > assessment.totalPoints) {
        return errorResponse(res, 400, `Score cannot exceed ${assessment.totalPoints} points`);
      }
    }
    
    // Update submission with grade and feedback
    const updatedSubmission = await assessmentRepo.updateSubmission(submissionId, {
      score: score !== undefined ? parseFloat(score) : undefined,
      feedback: feedback !== undefined ? feedback : undefined,
      gradedBy: req.user.id,
      gradedAt: new Date(),
      status: score !== undefined ? 'graded' : undefined
    });
    
    if (!updatedSubmission) {
      return errorResponse(res, 404, 'Submission not found');
    }
    
    successResponse(res, 200, 'Submission graded successfully', { submission: updatedSubmission });
  } catch (error) {
    console.error('Error grading submission:', error);
    errorResponse(res, 500, 'Server error while grading submission');
  }
};

// ===================================================================
// @desc    Get submission with answers for grading (faculty)
// @route   GET /api/curriculum/assessments/:id/submissions/:submissionId
// @access  Private (Faculty only)
// ===================================================================
const getSubmissionForGrading = async (req, res) => {
  try {
    const { id, submissionId } = req.params;

    // Get assessment to verify authorization
    const assessment = await assessmentRepo.getAssessmentById(id);
    if (!assessment) {
      return errorResponse(res, 404, 'Assessment not found');
    }

    // Verify authorization (using EAV repo)
    const course = await courseRepo.getCourseById(assessment.courseId);
    if (req.user.role !== 'admin' && course.instructorId !== req.user.id) {
      return errorResponse(res, 403, 'You are not authorized to view this submission');
    }

    const submission = await assessmentRepo.getSubmissionWithAnswers(submissionId);
    if (!submission) {
      return errorResponse(res, 404, 'Submission not found');
    }

    successResponse(res, 200, 'Submission retrieved successfully', { submission });
  } catch (error) {
    console.error('Error fetching submission for grading:', error);
    errorResponse(res, 500, 'Server error while retrieving submission');
  }
};

module.exports = {
  getAssessmentsByCourse,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  submitAssessment,
  getAssessmentSubmissions,
  getMySubmission,
  gradeSubmission,
  getSubmissionForGrading
};