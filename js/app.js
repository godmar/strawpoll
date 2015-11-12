'use strict';

(function () {

var navtargets = {
    topbar : [
        { path: '/', label: "Home", templateUrl: 'partials/home.html' },
        { path: '/createpoll', label: "Create a Poll", templateUrl: 'partials/createpoll.html' },
        { path: '/poll', label: "Participate in a Poll", templateUrl: 'partials/participate.html' },
    ],
    rightbar : [
        { path: '/mypolls', label: "My Polls", templateUrl: 'partials/mypolls.html' },
        { path: '/login', label: "Login", templateUrl: 'partials/login.html' },
    ],
};

angular.module('StrawPollApp', [ 
    'ngRoute'   // so that $routeProvider can be injected
])
.config(['$routeProvider', function($routeProvider) {
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
.controller('NavController', 
    ['$scope', function (scope) {
        scope.navtargets = navtargets;
    }])
;

})();
