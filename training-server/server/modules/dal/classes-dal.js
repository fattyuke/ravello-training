'use strict';

var logger = require('../config/logger');
var errorHandler = require('../utils/error-handler');

var q = require('q');
var _ = require('lodash');
var mongoose = require('mongoose-q')(require('mongoose'));

var ObjectId = mongoose.Types.ObjectId;

var TrainingClass = mongoose.model('TrainingClass');

exports.getClasses = function() {
    return TrainingClass.find().populate('students.user').execQ().catch(errorHandler.handleMongoError(404, 'Could not read classes'));
};

exports.getClass = function(classId) {
    return TrainingClass.findById(classId).populate('students.user').execQ().catch(errorHandler.handleMongoError(404, 'Could not read class ' + classId));
};

exports.getClassByUserId = function(userId) {
    return TrainingClass.findOne({'students.user': new ObjectId(userId)}).populate('students.user').execQ().catch(
        errorHandler.handleMongoError(404, 'Could not read class of user ' + userId));
};

exports.getClassByUsername = function(username) {
    return exports.getClasses().then(
        function(classes) {
            var theClass = null;

            _.forEach(classes, function(currentClass) {
                if (currentClass && currentClass.students) {
                    _.forEach(currentClass.students, function(student) {
                        if (student && student.user && student.user.username === username) {
                            theClass = currentClass;
                        }
                    });
                }
            });

            return q.resolve(theClass);
        }
    );
};

exports.getClassByCourseId = function(courseId) {
    return TrainingClass.find({'courseId': new ObjectId(courseId)}).populate('students.user').execQ().catch(
        errorHandler.handleMongoError(404, 'Could not read classes that have course ' + courseId));
};

exports.createClass = function(classData) {
    var newClass = new TrainingClass(classData);

    return newClass.saveQ().then(
        function(entity) {
            return entity.populateQ('students.user');
        }
    ).catch(errorHandler.handleMongoError(400, 'Could not create class'));
};

exports.updateClass = function(classId, classData) {
    var updatedClassEntity = _.omit(classData, '_id');
    return TrainingClass.updateQ({_id: new ObjectId(classId)}, updatedClassEntity, {upsert: true}).catch(
        errorHandler.handleMongoError(404, 'Could not update class ' + classId));
};

exports.updateStudentApp = function(classId, userId, appId) {
    return TrainingClass.findById(classId).execQ().then(
        function(classEntity) {
            var student = _.find(classEntity.students, function(currentStudent) {
                return currentStudent.user == userId;
            });

            student.apps.push({ravelloId: appId});

            var classData = classEntity.toJSON();
            classData = _.omit(classData, '_id');
            return TrainingClass.updateQ({_id: new ObjectId(classEntity.id)}, classData, {upsert: true}).then(
                function(result) {
					return TrainingClass.findById(classId).execQ();
                }
            ).catch(errorHandler.handleMongoError(400, 'Could not update class ' + classId + ' for user ' + userId + ' with app ' + appId));
        }
    );
};

exports.deleteStudentsApps = function(classId, appsData) {
    return TrainingClass.findById(classId).execQ().then(
        function(classEntity) {
            _.forEach(appsData, function(appData) {
                var student = _.find(classEntity.students, function(currentStudent) {
                    return currentStudent.user == appData.userId;
                });

                _.remove(student.apps, function(app) {
                    return app.ravelloId === appData.ravelloId;
                });
            });

            var classData = classEntity.toJSON();
            classData = _.omit(classData, '_id');
            return TrainingClass.updateQ({_id: new ObjectId(classEntity.id)}, classData, {upsert: true}).then(
                function() {
                    return classEntity;
                }
            ).catch(errorHandler.handleMongoError(404, 'Could not delete apps'));
        }
    );
};

exports.deleteClass = function(classId) {
    return TrainingClass.findByIdAndRemove(classId).populate('students.user').execQ().catch(
        errorHandler.handleMongoError(404, 'Could not delete class ' + classId));;
};
