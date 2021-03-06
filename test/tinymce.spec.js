/*global describe, beforeEach, module, inject, it, spyOn, expect, $, angular, afterEach, runs, waits */
describe('uiTinymce', function () {
  'use strict';

  var scope, $compile, $timeout, element, directiveElement, id, text = '<p>Hello</p>';
  beforeEach(module('ui.tinymce'));
  beforeEach(function() {
    // throw some garbage in the tinymce cfg to be sure it's getting thru to the directive
    angular.module('ui.tinymce').value('uiTinymceConfig', {tinymce: {bar: 'baz'}});
  });
  beforeEach(inject(function(_$rootScope_, _$compile_, _$timeout_) {
    scope = _$rootScope_.$new();
    $compile = _$compile_;
    $timeout = _$timeout_;
  }));

  afterEach(function() {
    angular.module('ui.tinymce').value('uiTinymceConfig', {});
    tinymce.remove('textarea');
  });

  /**
   * Asynchronously runs the compilation.
   */
  function compile() {
    element = $compile('<form><textarea ui-tinymce="{foo: \'bar\', setup: setupFooBar }" data-ng-model="foo"></textarea></form>')(scope);
    angular.element(document.getElementsByTagName('body')[0]).append(element);
    scope.$apply();
    $timeout.flush();
    directiveElement = element.find('textarea');
    id = directiveElement.attr('id');
  }

  it('should be pristine on load', function() {
    compile();
    expect(directiveElement.controller('form').$pristine).toBe(true);
    expect(directiveElement.controller('ngModel').$pristine).toBe(true);
    expect(directiveElement.controller('ngModel').$touched).toBe(false);
  });

  describe('compiling this directive', function() {

    it('should include the passed options', function() {
      spyOn(tinymce, 'init');
      compile();
      expect(tinymce.init).toHaveBeenCalled();
      expect(tinymce.init.calls.mostRecent().args[0].foo).toBe('bar');
    });

    it('should include the default options', function() {
      spyOn(tinymce, 'init');
      compile();
      expect(tinymce.init).toHaveBeenCalled();
      expect(tinymce.init.calls.mostRecent().args[0].tinymce.bar).toBe('baz');
    });
/*
    it('should execute the passed `setup` option', function(done) {
      scope.setupFooBar = jasmine.createSpy('setupFooBar');
      compile();

      //TODO: Get rid of timeout
      setTimeout(function() {
        expect(scope.setupFooBar).toHaveBeenCalled();
        done();
      }, 100);
    }); */
  });

  it("should set touched on blur", function(){
    compile();
    expect(directiveElement.controller('ngModel').$touched).toBe(false);

    element.find("textarea").triggerHandler("blur");
    expect(directiveElement.controller('ngModel').$touched).toBe(true);
  });

  it('should remove tinymce instance on $scope destruction', function() {
    compile();
    expect(tinymce.get(element.attr('id'))).toBeDefined();

    scope.$destroy();

    expect(tinymce.get(element.attr('id'))).toBeNull();
  });

  // TODO: Figure out why such a large timeout is needed
  describe('setting a value to the model', function() {
    it('should update the editor', function(done) {
      compile();
      setTimeout(function() {
        scope.foo = text;
        scope.$apply();

        try {
          expect(tinymce.get(id).getContent()).toEqual(text);
        } catch(e) {
          expect(true).toBe(false);
          done();
        }

        done();
      }, 100);
    });
    it('shouldn\'t make the form dirty', function(done) {
      compile();
      setTimeout(function() {
        scope.foo = text;
        scope.$apply();

        expect(directiveElement.controller('form').$dirty).toBe(false);

        done();
      });
    });
    // TODO: Fix test
    /*xit('should handle undefined gracefully', function(done) {
      compile();
      setTimeout(function() {
        scope.foo = undefined;
        scope.$apply();

        try {
          expect(tinymce.get(id).getContent()).toEqual('');
        } catch(e) {
          expect(true).toBe(false);
          done();
        }

        done();
      }, 100);
    });
    xit('should handle null gracefully', function(done) {
      compile();
      setTimeout(function() {
        scope.foo = null;
        scope.$apply();

        try {
          expect(tinymce.get(id).getContent()).toEqual('');
        } catch(e) {
          expect(true).toBe(false);
          done();
        }

        done();
      }, 100);
    });*/
  });
  /*describe('using the editor', function () {
    it('should update the model', function (done) {
      compile();
      setTimeout(function () {
        tinymce.get('foo').setContent(text);

        expect(scope.foo).toEqual(text);

        done();
      });
    });
  });*/

  it('should work with the ng-if directive', function () {
    expect(function () {
      $compile('<textarea ng-if="show" ui-tinymce data-ng-model="foo"></textarea>')(scope);
    }).not.toThrow();
  });

  it('should create unique ID\'s when using multiple directives', function() {

	  element = $compile('<form><textarea ui-tinymce="{foo: \'bar\', setup: setupFooBar }" data-ng-model="foo_1"></textarea><textarea ui-tinymce="{foo: \'bar\', setup: setupFooBar }" data-ng-model="foo_2"></textarea><textarea ui-tinymce="{foo: \'bar\', setup: setupFooBar }" data-ng-model="foo_3"></textarea><textarea ui-tinymce="{foo: \'bar\', setup: setupFooBar }" data-ng-model="foo_4"></textarea></form>')(scope);
	    angular.element(document.getElementsByTagName('body')[0]).append(element);
	    scope.$apply();
	    $timeout.flush();
	    var directiveElements = element.find('textarea');
	    expect(directiveElements.length).toEqual(4);
	    var id1 = directiveElements[0].id;
	    var id2 = directiveElements[1].id;
	    var id3 = directiveElements[2].id;
	    var id4 = directiveElements[3].id;
	    expect(id1).not.toEqual(id2);
	    expect(id2).not.toEqual(id3);
	    expect(id3).not.toEqual(id4);
  });

  it('does not automatically save the dirty changes when save plugin is present', function () {
    // Given a tinymce editor is present on a page with a plugin to allow saving externally
    scope.options = {
      plugins: 'save',
      setup: function (ed) {}
    };
    spyOn(scope.options, 'setup').and.callThrough();
    element = $compile('<form><textarea ui-tinymce="options" data-ng-model="foo_1"</textarea></form>')(scope);
    angular.element(document.getElementsByTagName('body')[0]).append(element);
    scope.$apply();
    $timeout.flush();

    // When there is a change event on editor
    var editor = scope.options.setup.calls.allArgs()[0][0];
    spyOn(editor, 'isDirty').and.returnValue(true);
    spyOn(editor, 'save');
    $timeout.flush(); // This will ensure that debouncedUpdateTimer timer function is executed which was setup on 'change' event

    // Then I see that content is not automatically saved when content is dirty
    expect(editor.isDirty).toHaveBeenCalled();
    expect(editor.save).not.toHaveBeenCalled();
  });

  it('automatically saves the dirty changes when save plugin is not present', function () {
    // Given a tinymce editor is present on a page without a 'save' plugin
    scope.options = {
      plugins: '',
      setup: function (ed) {}
    };
    spyOn(scope.options, 'setup').and.callThrough();
    element = $compile('<form><textarea ui-tinymce="options" data-ng-model="foo_1"</textarea></form>')(scope);
    angular.element(document.getElementsByTagName('body')[0]).append(element);
    scope.$apply();
    $timeout.flush();

    // When there is a change event on editor
    var editor = scope.options.setup.calls.allArgs()[0][0];
    spyOn(editor, 'isDirty').and.returnValue(true);
    spyOn(editor, 'save');
    $timeout.flush(); // This will ensure that debouncedUpdateTimer timer function is executed which was setup on 'change' event

    // Then I see that content is automatically saved when content is dirty
    expect(editor.isDirty).toHaveBeenCalled();
    expect(editor.save).toHaveBeenCalled();
  });
});
