describe('Projects', function() {

  var expect = chai.expect;
  var $rootScope,
    $controller,
    $httpBackend,
    $state,
    $stateParams,
    $scope,
    controller, 
    project,
    spies,
    api;
 
  describe('Controllers:', function() {
      
    beforeEach(
      module(
        'ui.router',
        'app.resources',
        'ngResource',
        'security.services',
        'notifications.services',
        'app.projects',
        'app.projects.controllers'
      ));

    beforeEach(inject(function (_$rootScope_, _$httpBackend_, _$controller_, _$state_, _$stateParams_){
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
      $controller = _$controller_;
      $state = _$state_;
      $stateParams = _$stateParams_;
    }));

    beforeEach(inject(function ($injector) {
      var notifications = $injector.get('notifications');

      api = $injector.get('api');

      spies = {
        error: sinon.spy(notifications, 'error'),
        success: sinon.spy(notifications, 'success'),
        state: sinon.stub($state)
      };

      project = {
        "_id": "abcdefghijklmnop",
        "name": "Project2", 
        "description": "This is your second project"
      };
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('ProjectCtrl', function() {

      beforeEach(function() {
        $scope = $rootScope.$new();
        controller = $controller("ProjectCtrl", { 
          $scope: $scope,
          $state: spies.state,
          $stateParams: $stateParams 
        });

        $httpBackend.when('GET', '/projects?page=1&sort=%7B%22name%22:1%7D').respond(200);
        $httpBackend.when('GET', '/projects?page=2&sort=%7B%22name%22:1%7D').respond(200, {name: 'pageConfig2'});
      });

      describe('during setup', function () {
        it('should be able to instantiate the controller and request a page of projects', function () { 
          expect(controller).to.be.ok; 
          // $scope.requestProjects is called upon controller creation
          $httpBackend.expect('GET', '/projects?page=1&sort=%7B%22name%22:1%7D');
          $httpBackend.flush();
        });
      }); 

      describe('requesting projects', function () {
        it('should set the result to the pageConfig object', function () {
          $httpBackend.expect('GET', '/projects?page=2&sort=%7B%22name%22:1%7D');
          $scope.requestProjects(2);
          $httpBackend.flush();
          expect($scope.pageConfig.name).to.equal("pageConfig2");
        }); 
      });

      describe('showing project detail', function () {
        it('should notify the user if the project is deleted', function () {
          project.deleted = true;
          $httpBackend.flush();
          $scope.showDetail(project);
          expect(spies.error).to.have.been.calledWith('You cannot edit a deleted project.');
        });
        it('should transition to the project detail state', function () {
          $httpBackend.flush();
          $scope.showDetail(project);
          expect(spies.state.go).to.have.been.calledWith('app.projects.detail', project);
        });
      });

      describe('creating a new project', function () {
        it('should transition to the create project state', function () {
          $httpBackend.flush();
          $scope.createNew();
          expect(spies.state.go).to.have.been.calledWith('app.projects.create');
        });
      });

      describe('removing a project', function () {

        it('should send a remove request for the specified project', function () {
          $httpBackend.flush();
          $httpBackend.expect('PUT', '/projects/' + project._id).respond(200);
          $scope.remove(project);
          $httpBackend.flush();
        });

        describe('successfully', function () {
          beforeEach(function () {
            $httpBackend.flush();
            $httpBackend.when('PUT', '/projects/' + project._id).respond(200);
          });

          it('should set the project to deleted for the ui', function () {
            $scope.remove(project);
            $httpBackend.flush();
            expect(project.deleted).to.be.true;
          });
          it('should notify the user of the deletion', function () {
            $scope.remove(project);
            $httpBackend.flush();
            expect(spies.success).to.have.been.called;
            expect(spies.error).to.not.have.been.called;
          });
        });

        describe('in error', function () {
          beforeEach(function () {
            $httpBackend.flush();
            $httpBackend.when('PUT', '/projects/' + project._id).respond(500);
          });

          it('should set deleted to false for the project in the ui', function () {
            $scope.remove(project);
            $httpBackend.flush();
            expect(project.deleted).to.be.false;
          });
          it('should notify the user of the error', function () {
            $scope.remove(project);
            $httpBackend.flush();
            expect(spies.error).to.have.been.called;
            expect(spies.success).to.not.have.been.called;
          });
        });

      });

      describe('restore', function () {
        beforeEach(function () {
          project.deleted = true;
        });

        it('should send a restore request for the specified project', function () {
          $httpBackend.flush();
          $httpBackend.expect('PUT', '/projects/' + project._id).respond(200);
          $scope.restore(project);
          $httpBackend.flush();
        });

        describe('successfully', function () {
          beforeEach(function () {
            $httpBackend.flush();
            $httpBackend.when('PUT', '/projects/' + project._id).respond(200);
          });

          it('should set the project to not deleted for the ui', function () {
            $scope.restore(project);
            $httpBackend.flush();
            expect(project.deleted).to.be.false;
          });
          it('should notify the user of the deletion', function () {
            $scope.restore(project);
            $httpBackend.flush();
            expect(spies.success).to.have.been.called;
            expect(spies.error).to.not.have.been.called;
          });
        });

        describe('in error', function () {
          beforeEach(function () {
            $httpBackend.flush();
            $httpBackend.when('PUT', '/projects/' + project._id).respond(500);
          });

          it('should set deleted to true for the project in the ui', function () {
            $scope.restore(project);
            $httpBackend.flush();
            expect(project.deleted).to.be.true;
          });
          it('should notify the user of the error', function () {
            $scope.restore(project);
            $httpBackend.flush();
            expect(spies.error).to.have.been.called;
            expect(spies.success).to.not.have.been.called;
          });
        });
      });

      describe('cancel', function () {
        it('should return back to the project list', function () {
          $httpBackend.flush();
          $scope.cancel();
          expect(spies.state.go).to.have.been.calledWith('app.projects');
        });
      });

    });

    describe('ProjectDetailCtrl', function() {
      
      beforeEach(function() {
        $state.current = {data: {saveText: 'update'}};

        $scope = $rootScope.$new();
        controller = $controller("ProjectDetailCtrl", {
          $scope: $scope,
          project: new api.projects(project),
          $state: spies.state,
          $stateParams: $stateParams
        });
      });

      describe('setup', function () {
        it('should be able to instantiate the controller', function () {
          expect(controller).to.be.ok;
        });

        it('should set saveText to the current state saveText', function () {
          expect($scope.saveText).to.equal('update');
        });

        it('should set the project on scope to the resolved project', function () {
          expect($scope.project._id).to.equal(project._id);
          expect($scope.project.name).to.equal(project.name);
        });
      });

      describe('Saving an edited project', function () {
        var updatedProject;

        beforeEach(function () {
          updatedProject = angular.extend(project, {name: 'updated project'});
          $httpBackend.expect('PUT', '/projects/' + project._id);
        });

        describe('with success', function () {

          beforeEach(function () {
            $httpBackend.when('PUT', '/projects/' + project._id).respond(200, updatedProject);
          });

          it('should set the project on scope to be the updated project', function () {
            $scope.save();
            $httpBackend.flush();
            expect($scope.project.name).to.equal(updatedProject.name);
          });

          it('should notify the user of the successful update', function () {
            $scope.save();
            $httpBackend.flush();
            expect(spies.success).to.have.been.called;
            expect(spies.error).to.not.have.been.called;
          });
        });

        describe('in error', function () {
          it('should notify the user of the error', function () {
            $httpBackend.when('PUT', '/projects/' + project._id).respond(500);
            $scope.save();
            $httpBackend.flush();
            expect(spies.error).to.have.been.called;
            expect(spies.success).to.not.have.been.called;
          });
        });

      });
    });

    describe('ProjectCreateCtrl', function() {

      beforeEach(function() {
        $state.current = {data: {saveText: 'create'}};

        $scope = $rootScope.$new();
        controller = $controller("ProjectCreateCtrl", {
          $scope: $scope,
          $state: spies.state,
          $stateParams: $stateParams
        });
      });

      describe('setup', function () {
        it('should be able to instantiate the controller', function () {
          expect(controller).to.be.ok;
        });

        it('should set saveText to the current state saveText', function () {
          expect($scope.saveText).to.equal('create');
        });
        
        it('should set the project on scope to an empy object', function () {
          expect($scope.project).to.be.empty;
        });
      }); 

      describe('saving a new project', function () {

        beforeEach(function () {
          $httpBackend.expect('POST', '/projects');
        });

        describe('with success', function () {

          beforeEach(function () {
            $httpBackend.when('POST', '/projects').respond(200, project);
          });

          it('should transition to the detail page of the created project', function () {
            $scope.save();
            $httpBackend.flush();
            expect(spies.state.go).to.have.been.calledWith('app.projects.detail', {_id: project._id});
          });

          it('should notify the user of the successful create', function () {
            $scope.save();
            $httpBackend.flush();
            expect(spies.success).to.have.been.called;
            expect(spies.error).to.not.have.been.called;
          });
        });

        describe('in error', function () {
          it('should notify the user of the error', function () {
            $httpBackend.when('POST', '/projects').respond(500);
            $scope.save();
            $httpBackend.flush();
            expect(spies.error).to.have.been.called;
            expect(spies.success).to.not.have.been.called;
          });
        });
      });

    });

  });
});