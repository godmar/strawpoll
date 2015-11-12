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
    /* no dependencies yet */
])
.controller('NavController', 
    ['$scope', function (scope) {
        scope.navtargets = navtargets;
    }])
;

})();
