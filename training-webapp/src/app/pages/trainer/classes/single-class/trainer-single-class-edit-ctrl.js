'use strict';


angular.module('trng.trainer.training.classes').controller('trainerSingleClassEditController', [
    '$scope',
    '$rootScope',
    '$state',
    '$stateParams',
    '$log',
    '$window',
    '$dialogs',
    'StatesNames',
    'ClassesService',
	'BlueprintsService',
	'LoginModel',
	'DateUtil',
    'currentClass',
    'courses',
	'buckets',
	function ($scope, $rootScope, $state, $stateParams, $log, $window, $dialogs, StatesNames, ClassesService,
			  BlueprintsService,  LoginModel, DateUtil, currentClass, courses, buckets) {

		$scope.init = function () {
			$scope.apps = [];
			$scope.courses = courses;
			$scope.buckets = buckets;
			$scope.initAbstract();
			$scope.initClass();
			$scope.initDates();
			$scope.initStudentsDataGrid();
			$scope.initPublishDetailsOptions();
			initCostBuckets();
		};

		function initCostBuckets() {
			$scope.viewModel = {
				selectedCostBucket: getInitalSelectedCostBucket()
			};
			$scope.isCostBucketsOpen = isCostBucketsOpen();
		}

		function getInitalSelectedCostBucket() {
			if (currentClass.bucketId) {
				return  _.find($scope.buckets, { id: currentClass.bucketId});
			}
			if ($scope.buckets.length === 1) {
				return $scope.buckets[0];
			}
			return null;
		}

		function isCostBucketsOpen() {
			if ($scope.currentClass.bucketId) {
				return false;
			}
			return $scope.buckets.length > 1;
		}

		$scope.initAbstract = function() {
			$scope.abstract = {};
		};

		$scope.initPublishDetailsOptions = function() {
			$scope.publishMethods = [
				{
					name: 'Cost',
					value: 'COST_OPTIMIZED'
				},
				{
					name: 'Performance',
					value: 'PERFORMANCE_OPTIMIZED'
				}
			];

			fetchBpsCloudsAndRegions();
		};


		function fetchBpsCloudsAndRegions() {
			if (!$scope.currentClass.course) {
				return;
			}
			$scope.bpIdToLocations = {};
			_.forEach($scope.currentClass.course.blueprints, function(blueprint) {
				var bpId = blueprint.id;
				BlueprintsService.getPublishLocations(bpId).then(function (locations) {
					var bpLocations = [];
					_.forEach(locations, function(location) {
						var bpLocation = {
							region: location.regionName,
							locationDisplayName: location.regionDisplayName
						};
						bpLocations.push(bpLocation);
					});
					$scope.bpIdToLocations[bpId] = bpLocations;
					setSelectedLocations(bpId, bpLocations);
				});
			});
		}

		$scope.getLocations = function(bpId) {
			return $scope.bpIdToLocations[bpId];
		};

		function setSelectedLocations(bpId, bpLocations) {
			var bpPublishDetailsList = $scope.currentClass.bpPublishDetailsList;
			var bpPublishDetails = _.find(bpPublishDetailsList, { bpId: bpId });
			if (bpPublishDetails) {
				if (bpPublishDetails.region) {
					bpPublishDetails.location = _.find(bpLocations, { region: bpPublishDetails.region });
				} else {
					bpPublishDetails.location = bpLocations[0];
				}
			}
		}

		$scope.isLocationVisible = function(bpPublishDetails) {
			return bpPublishDetails && bpPublishDetails.method !== 'COST_OPTIMIZED';
		};

		$scope.locationChanged = function(bpPublishDetails) {
			bpPublishDetails.region = bpPublishDetails.location.region;
		};

		$scope.initClass = function() {
			$scope.currentClass = currentClass;
			if ($scope.courses && $scope.courses.length) {
				if (!$scope.currentClass.courseId) {
					$scope.currentClass.course = $scope.courses[0];
					$scope.currentClass.courseId = $scope.courses[0].id;
				} else {
					$scope.currentClass.course = _.find($scope.courses, function(course) {
						return course.id === currentClass.courseId;
					});
				}
			} else {
				$scope.currentClass.course = null;
			}

			$scope.isRavelloCredentials = false;

			$scope.$watch('currentClass.ravelloCredentials.overrideTrainerCredentials', function(newVal, oldVal) {
				if (newVal !== oldVal) {
					if (!newVal) {
						$scope.currentClass.ravelloCredentials.username = LoginModel.user.ravelloCredentials.username;
						$scope.currentClass.ravelloCredentials.password = LoginModel.user.ravelloCredentials.password;
					}
				}
			});

			$scope.$watch('viewModel.selectedCostBucket', function(newVal, oldVal) {
				if (newVal !== oldVal) {
					$scope.currentClass.bucketId = newVal.id;
				}
			});

			$scope.$watch('currentClass.bpPublishDetailsList', function(newVal, oldVal) {
				if (newVal !== oldVal) {
					fetchBpsCloudsAndRegions();
				}
			});
		};

		$scope.initDates = function() {
			$scope.dateFormat = DateUtil.angular.dateFormat;
			$scope.timeFormat = DateUtil.angular.timeFormat;
			$scope.dateTimeFormat = DateUtil.angular.dateTimeFormat;
		};

		$scope.initStudentsColumns = function () {
			$scope.studentsColumns = [
				{
					field: 'user.fullName',
					displayName: 'Full name'
				},
				{
					field: 'user.username',
					displayName: 'Username'
				},
				{
					displayName: 'Actions',
					width: '180px',
					resizable: false,
					cellTemplate:
					'<a href="" class="btn btn-small btn-link" ng-click="editStudent(row)">' +
					'<i class="fa fa-pencil" /> Edit' +
					'</a>' +
					'<a href="" class="btn btn-small btn-link" ng-click="deleteStudent(row)">' +
					'<i class="fa fa-trash-o" /> Delete' +
					'</a>'
				}
			];
		};

		$scope.initStudentsDataGrid = function () {
			$scope.selectedStudents = [];

			$scope.initStudentsColumns();
			$scope.studentsDataGrid = {
				data: 'currentClass.students',
				columnDefs: $scope.studentsColumns,
				selectedItems: $scope.selectedStudents,
				showSelectionCheckbox: false,
				selectWithCheckboxOnly: true,
				enableColumnResize: true,
				enableHighlighting: true,
				enableRowSelection: false
			};
		};

		$scope.addStudent = function() {
			$state.go(StatesNames.trainer.training.singleClass.singleStudent.name, {classId: $scope.currentClass.id});
		};

		$scope.editStudent = function(studentToEdit) {
			var studentId = studentToEdit.getProperty('id');
			$state.go(StatesNames.trainer.training.singleClass.singleStudent.name, {classId: $scope.currentClass.id, studentId: studentId});
		};

		$scope.deleteStudent = function(studentToDelete) {
			var dialog = $dialogs.confirm("Delete student", "Are you sure you want to delete the student?");
			dialog.result.then(function(result) {
				var studentId = studentToDelete.getProperty('id');
				_.remove($scope.currentClass.students, {id: studentId});
			});
		};

		$scope.saveClass = function() {
			return ClassesService.saveOrUpdate($scope.currentClass).then(
				function(result) {
					$state.go(StatesNames.trainer.training.classes.name);
				}
			);
		};

		$scope.back = function() {
			$window.history.back();
		};

		$scope.addToEdit = function() {
			currentClass = ClassesService.createEmptyClass(currentClass.course);
			$scope.currentClass = currentClass;
			fetchBpsCloudsAndRegions();

			$state.go(StatesNames.trainer.training.singleClass.editClass.name);
		};

		$scope.showActive = function() {
			return $state.is(StatesNames.trainer.training.singleClass.editClass.name) ||
				$state.is(StatesNames.trainer.training.singleClass.singleStudent.name);
		};

		$scope.toggleActive = function() {
			$scope.currentClass.active = !$scope.currentClass.active;
		};

		$scope.addToEditDisabled = function() {
			return !$scope.currentClass.course;
		};

		$scope.getTitle = function() {
			var title = $scope.currentClass.name || 'New class';
			title += $scope.abstract.getStudentName ? ' > ' + $scope.abstract.getStudentName() : '';
			return title;
		};

		$scope.init();
	}
]);

