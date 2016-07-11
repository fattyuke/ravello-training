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
			if ($scope.buckets.length === 1) {
				return $scope.buckets[0];
			}
			if (currentClass.bucketId) {
				return  _.find($scope.buckets, { id: currentClass.bucketId});
			}
			return {};
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

			$scope.bpIdToClouds = {};
			$scope.bpIdToRegions = {};
			fetchBpsCloudsAndRegions();
		};


		function fetchBpsCloudsAndRegions() {
			var bpPublishDetailsList = $scope.currentClass.bpPublishDetailsList;
			_.forEach(bpPublishDetailsList, function(bpPublishDetails) {
				var bpId = bpPublishDetails.bpId;
				BlueprintsService.getPublishLocations(bpId).then(function (locations) {
					var clouds = [];
					var regions = {};
					_.forEach(locations, function(location) {
						var cloud = {
							name: location.cloudDisplayName,
							value: location.cloudName
						};
						if (!_.find(clouds, { value: location.cloudName })) {
							clouds.push(cloud);
						}
						var region = {
							name: location.regionName,
							value: location.regionName
						};
						if (!regions[cloud.value]) {
							regions[cloud.value] = [];
						}
						regions[cloud.value].push(region);
					});
					$scope.bpIdToClouds[bpId] = clouds;
					$scope.bpIdToRegions[bpId] = regions;
				});
			});
		}

		$scope.isCloudVisible = function(bpPublishDetails) {
			return bpPublishDetails && bpPublishDetails.method !== 'COST_OPTIMIZED';
		};

		$scope.isRegionVisible = function(bpPublishDetails) {
			return bpPublishDetails && bpPublishDetails.method !== 'COST_OPTIMIZED';
		};

		$scope.cloudChanged = function(bpPublishDetails) {
			bpPublishDetails.region = $scope.bpIdToRegions[bpPublishDetails.bpId][bpPublishDetails.cloud][0].value;
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

