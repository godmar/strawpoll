'use strict';

(function () {

var firebase = new Firebase("https://strawpoll-1127.firebaseio.com");

var navtargets = {
    always : [
        { path: '/home', label: "Home", templateUrl: 'partials/home.html' },
    ],
    topbar : [
        { path: '/createpoll', label: "Create a Poll", templateUrl: 'partials/createpoll.html' },
        { path: '/poll', label: "Participate in a Poll", templateUrl: 'partials/participate.html' },
    ],
    rightbar : [
        { path: '/mypolls', label: "My Polls", templateUrl: 'partials/mypolls.html' },
    ],
    invisible : [
        { path: '/login', label: "Login", templateUrl: 'partials/login.html' },
    ]
};

angular.module('StrawPollApp', [ 
    'ngRoute',   // so that $routeProvider can be injected
    'firebase'
])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    // $locationProvider.html5Mode({ enable: true, requireBase: false });

    // wire links to partials in ng-view
    for (var menuname in navtargets) {
        var menugroup = navtargets[menuname];
        for (var i = 0; i < menugroup.length; i++) {
            var item = menugroup[i];
            $routeProvider.when(item.path, { templateUrl: item.templateUrl });
        }
    }
    $routeProvider.otherwise({redirectTo: '/'});
}])
.controller('MainController', 
    ['$scope', '$firebaseAuth', '$location', '$timeout', function (scope, fbAuth, $location, $timeout) {
        // to hold auth information
        scope.user = { }

        scope.logout = function () {
            delete scope.user['auth'];
            fbAuth(firebase).$unauth();

            /* Ah, the joys of AngularJS.  Calling $location.path() here should work,
             * but it does not.  We are inside an AngularJS digest cycle already.
             */
            $timeout(function () {
                $location.path("/home");
            }, 1000);
        }
    }])
.controller('LoginController', 
    ['$scope', '$firebaseAuth', '$location', function (scope, fbAuth, $location) {
        var auth = fbAuth(firebase);

        // to support login 
        scope.authAnonymously = function () {
            auth.$authAnonymously().then(function(authData) {
                console.log("Authenticated successfully with payload:");
                console.dir(authData);
                scope.user.auth = authData;
                scope.user.name = "Anonymous";
            }).catch(function (error) {
                console.log("Login Failed!", error);
            });
        }

        scope.authViaGoogle = function () {
            auth.$authWithOAuthPopup("google").then(function (authData) {
                console.log("Authenticated successfully with payload:");
                console.dir(authData);
                scope.user.auth = authData;
                scope.user.name = authData.google.displayName;
                /* authData.google = {displayName: "Godmar Back", id: ..., profileImageURL: "") } */
            }).catch(function (error) {
                console.log("Login Failed!", error);
            });
        }
    }])
.controller('NavController', 
    ['$scope', function (scope) {
        scope.navtargets = navtargets;
    }])
.controller('CreatePollController',
    ['$scope', function (scope) {
        scope.question = {
            text: "What is your favorite JavaScript MVC Framework?",
            options: [ ]
        }
        scope.addOption = function () {
            var options = this.question.options;
            var lastLabel = options.length > 0 ? options[options.length-1].label : "@";
            var newLabel = String.fromCharCode(lastLabel.charCodeAt(0) + 1);
            this.question.options.push({
                label: newLabel,
                text: "Enter option here"
            });
        }
        scope.removeOption = function (label) {
            var options = this.question.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i].label == label) {
                    options.splice(i, 1);
                    break;
                }
            }
        }
        scope.saveQuestion = function () {
            alert("Save not implemented");
        }
    }])
;

})();
