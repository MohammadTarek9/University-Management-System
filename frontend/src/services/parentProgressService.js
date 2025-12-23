// src/services/parentProgressService.js
import api from './api';

const parentProgressService = {
  getChildren() {
    return api.get('/parent/progress/children').then((res) => res.data);
  },

  getChildCourses(childId, params = {}) {
    return api
      .get(`/parent/progress/children/${childId}/courses`, { params })
      .then((res) => res.data);
  },

  getChildCourseDetails(childId, courseId) {
    return api
      .get(`/parent/progress/children/${childId}/courses/${courseId}`)
      .then((res) => res.data);
  },
};

export default parentProgressService;
